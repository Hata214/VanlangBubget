import cron from 'node-cron';
import Investment from '../models/investmentModel.js';
import { emit } from '../socket.js';
import logger from '../utils/logger.js';
import axios from 'axios'; // Import axios

// TODO: Lấy URL của stock-api từ biến môi trường hoặc config
const STOCK_API_URL = process.env.STOCK_API_URL || 'http://localhost:8000/api/price'; // URL của stock-api

// Circuit breaker state
let circuitBreakerState = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: null,
    maxFailures: 5,
    resetTimeout: 60000 // 1 minute
};

/**
 * Circuit breaker logic
 */
function checkCircuitBreaker() {
    const now = Date.now();

    // Nếu circuit breaker đang mở và đã qua thời gian reset
    if (circuitBreakerState.isOpen &&
        (now - circuitBreakerState.lastFailureTime) > circuitBreakerState.resetTimeout) {
        logger.info('[Scheduler] Circuit breaker reset - attempting to reconnect to Stock API');
        circuitBreakerState.isOpen = false;
        circuitBreakerState.failureCount = 0;
    }

    return !circuitBreakerState.isOpen;
}

function recordFailure() {
    circuitBreakerState.failureCount++;
    circuitBreakerState.lastFailureTime = Date.now();

    if (circuitBreakerState.failureCount >= circuitBreakerState.maxFailures) {
        circuitBreakerState.isOpen = true;
        logger.error(`[Scheduler] Circuit breaker OPENED after ${circuitBreakerState.failureCount} failures. Stock API calls suspended for ${circuitBreakerState.resetTimeout / 1000} seconds.`);
    }
}

function recordSuccess() {
    if (circuitBreakerState.failureCount > 0) {
        logger.info('[Scheduler] Stock API call successful - resetting failure count');
        circuitBreakerState.failureCount = 0;
    }
}

/**
 * Kiểm tra health của Stock API bằng cách test với symbol đơn giản
 */
async function checkStockApiHealth() {
    try {
        // Thử gọi API với symbol test để kiểm tra health
        const response = await axios.get(`${STOCK_API_URL}`, {
            params: { symbol: 'VIC' }, // Symbol test đơn giản
            timeout: 5000,
            headers: {
                'User-Agent': 'VanLang-Budget-Scheduler/1.0'
            }
        });

        // Kiểm tra response có hợp lệ không
        const isHealthy = response.status === 200 &&
            response.data &&
            (response.data.price !== null && response.data.price !== undefined);

        if (isHealthy) {
            logger.debug(`[Scheduler] Stock API health check passed. Test price for VIC: ${response.data.price}`);
        } else {
            logger.warn(`[Scheduler] Stock API health check failed - invalid response format`);
        }

        return isHealthy;
    } catch (error) {
        logger.warn(`[Scheduler] Stock API health check failed: ${error.message}`);
        return false;
    }
}

/**
 * Cập nhật giá cổ phiếu định kỳ.
 * Chạy mỗi 2 phút.
 */
const updateStockPricesJob = cron.schedule('*/2 * * * *', async () => {
    logger.info('[Scheduler] Starting stock price update job...');

    // Kiểm tra circuit breaker trước
    if (!checkCircuitBreaker()) {
        logger.warn('[Scheduler] Circuit breaker is OPEN. Skipping stock price update job.');
        return;
    }

    // Kiểm tra health của Stock API trước khi bắt đầu
    const isApiHealthy = await checkStockApiHealth();
    if (!isApiHealthy) {
        logger.warn('[Scheduler] Stock API is not healthy. Skipping price update job.');
        recordFailure(); // Record failure for circuit breaker
        return;
    }

    try {
        const stockInvestments = await Investment.find({ type: 'stock', currentStatus: { $ne: 'sold' } }).populate('userId', 'id'); // Chỉ lấy ID người dùng

        if (!stockInvestments.length) {
            logger.info('[Scheduler] No active stock investments to update.');
            return;
        }

        const uniqueSymbols = [...new Set(stockInvestments.map(inv => inv.symbol))].filter(Boolean);
        logger.info(`[Scheduler] Unique stock symbols to update: ${uniqueSymbols.join(', ')}`);

        for (const symbol of uniqueSymbols) {
            try {
                // ---- PHẦN GIẢ ĐỊNH CẦN THAY THẾ BẰNG LOGIC GỌI stock-api THỰC TẾ ----
                // Giả sử stock-api có endpoint GET /price/:symbol
                // const response = await axios.get(`${STOCK_API_URL}/price/${symbol}`);
                // const newPrice = response.data.price;
                // logger.info(`[Scheduler] Fetched price for ${symbol}: ${newPrice}`);

                // ----- LOGIC MOCK CHO ĐẾN KHI CÓ stock-api -----
                // const mockPrice = Math.random() * 100000 + 10000; // Giá ngẫu nhiên từ 10k đến 110k
                // const newPrice = parseFloat(mockPrice.toFixed(2));
                // logger.info(`[Scheduler] MOCK price for ${symbol}: ${newPrice}`);
                // ----- KẾT THÚC LOGIC MOCK -----

                // ----- LOGIC GỌI stock-api VỚI RETRY VÀ ERROR HANDLING -----
                logger.info(`[Scheduler] Fetching price for symbol: ${symbol} from ${STOCK_API_URL}?symbol=${symbol}`);

                let response;
                let retryCount = 0;
                const maxRetries = 3;
                const retryDelay = 2000; // 2 seconds

                while (retryCount < maxRetries) {
                    try {
                        response = await axios.get(`${STOCK_API_URL}`, {
                            params: { symbol: symbol },
                            timeout: 10000, // 10 second timeout
                            headers: {
                                'User-Agent': 'VanLang-Budget-Scheduler/1.0'
                            }
                        });
                        recordSuccess(); // Record successful API call
                        break; // Success, exit retry loop
                    } catch (error) {
                        retryCount++;
                        logger.warn(`[Scheduler] Attempt ${retryCount}/${maxRetries} failed for ${symbol}: ${error.message}`);

                        if (retryCount >= maxRetries) {
                            logger.error(`[Scheduler] All ${maxRetries} attempts failed for ${symbol}. Skipping this symbol.`);
                            recordFailure(); // Record failure for circuit breaker
                            throw error; // Re-throw to be caught by outer try-catch
                        }

                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
                    }
                }

                if (!response.data || response.data.price === null || response.data.price === undefined) {
                    logger.warn(`[Scheduler] No price data received from API for ${symbol}. API Response:`, response.data);
                    continue;
                }
                const newPrice = parseFloat(response.data.price);
                logger.info(`[Scheduler] Successfully fetched price for ${symbol}: ${newPrice}`);
                // ----- KẾT THÚC LOGIC GỌI stock-api VỚI RETRY -----

                if (typeof newPrice !== 'number' || isNaN(newPrice) || newPrice < 0) {
                    logger.warn(`[Scheduler] Invalid price received for ${symbol}: ${newPrice}. Skipping update.`);
                    continue;
                }

                // Cập nhật tất cả các khoản đầu tư có symbol này
                const investmentsToUpdate = stockInvestments.filter(inv => inv.symbol === symbol);
                for (const investment of investmentsToUpdate) {
                    const oldCurrentPriceForCheck = investment.currentPrice; // Lưu giá hiện tại cũ để so sánh
                    // const oldProfitLoss = investment.currentValue - investment.initialInvestment; // Không còn dùng oldProfitLoss trực tiếp cho điều kiện emit

                    investment.updateCurrentPrice(newPrice); // Gọi method của model
                    await investment.save(); // Pre-save hook sẽ chạy calculateMetrics

                    // const updatedProfitLoss = investment.currentValue - investment.initialInvestment;

                    // Chỉ emit nếu giá cổ phiếu thực sự thay đổi sau khi gọi API
                    if (investment.currentPrice !== oldCurrentPriceForCheck) {
                        const formattedInvestment = { // Cần định nghĩa hàm format tương tự investmentController
                            id: investment._id.toString(),
                            userId: investment.userId.id, // userId giờ là object User đã populate
                            name: investment.name,
                            type: investment.type,
                            symbol: investment.symbol,
                            category: investment.category,
                            initialInvestment: investment.initialInvestment,
                            currentValue: investment.currentValue,
                            totalQuantity: investment.totalQuantity,
                            currentPrice: investment.currentPrice,
                            startDate: investment.startDate?.toISOString().split('T')[0],
                            notes: investment.notes,
                            createdAt: investment.createdAt,
                            updatedAt: investment.updatedAt,
                            profitLoss: (investment.currentValue - investment.initialInvestment).toFixed(2),
                            roi: investment.initialInvestment !== 0 ? (((investment.currentValue - investment.initialInvestment) / investment.initialInvestment) * 100).toFixed(2) : '0.00',
                            transactions: investment.transactions.map(t => ({
                                id: t._id.toString(),
                                type: t.type,
                                amount: t.amount,
                                price: t.price,
                                quantity: t.quantity,
                                fee: t.fee,
                                date: t.date?.toISOString().split('T')[0],
                                notes: t.notes
                            }))
                        };
                        emit(investment.userId.id, 'investment:updated', formattedInvestment);
                        logger.debug(`[Scheduler] Emitted investment:updated (price changed from ${oldCurrentPriceForCheck} to ${investment.currentPrice}) for ${investment.name} (User: ${investment.userId.id})`);
                    } else {
                        logger.debug(`[Scheduler] Price for ${investment.name} (User: ${investment.userId.id}) was the same (${newPrice}). No emit.`);
                    }
                }
            } catch (error) {
                // Phân loại lỗi để xử lý phù hợp
                if (error.code === 'ECONNREFUSED') {
                    logger.error(`[Scheduler] Connection refused for ${symbol}. Stock API may be down.`);
                } else if (error.code === 'ENOTFOUND') {
                    logger.error(`[Scheduler] DNS resolution failed for ${symbol}. Check stock API URL.`);
                } else if (error.code === 'ETIMEDOUT') {
                    logger.error(`[Scheduler] Request timeout for ${symbol}. Stock API is slow to respond.`);
                } else if (error.response) {
                    logger.error(`[Scheduler] HTTP ${error.response.status} error for ${symbol}: ${error.response.statusText}`);
                } else {
                    logger.error(`[Scheduler] Unexpected error updating price for symbol ${symbol}: ${error.message}`);
                }

                // Log chi tiết cho debugging (chỉ khi cần)
                if (process.env.NODE_ENV === 'development') {
                    logger.debug(`[Scheduler] Full error stack for ${symbol}:`, error.stack);
                }

                // Tiếp tục với symbol tiếp theo thay vì dừng toàn bộ job
                continue;
            }
        }
        logger.info('[Scheduler] Stock price update job finished.');
    } catch (error) {
        logger.error(`[Scheduler] Error in stock price update job: ${error.message}`, error.stack);
    }
});

/**
 * Cập nhật lãi suất tiết kiệm định kỳ.
 * Chạy mỗi ngày vào lúc 1 giờ sáng.
 */
const updateSavingsInterestJob = cron.schedule('0 1 * * *', async () => {
    logger.info('[Scheduler] Starting savings interest update job...');
    try {
        const savingInvestments = await Investment.find({
            type: 'savings',
            currentStatus: { $ne: 'sold' }, // Chỉ các khoản chưa đáo hạn/tất toán
            // endDate: { $gte: new Date() } // Chỉ các khoản chưa đến ngày đáo hạn (tùy nghiệp vụ)
        }).populate('userId', 'id');

        if (!savingInvestments.length) {
            logger.info('[Scheduler] No active savings investments to update interest for.');
            return;
        }

        for (const investment of savingInvestments) {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày

                // Kiểm tra xem có cần tính lãi không
                let needsInterestCalculation = false;
                let interestAmount = 0;

                // TODO: Logic tính lãi chi tiết hơn dựa trên `investment.interestPaymentType`
                // Ví dụ: 'monthly', 'quarterly', 'end_of_term'
                // Cần trường `lastInterestCalculationDate` trong model Investment

                const lastCalcDate = investment.lastInterestCalculationDate ? new Date(investment.lastInterestCalculationDate) : new Date(investment.startDate);
                lastCalcDate.setHours(0, 0, 0, 0);


                if (investment.interestPaymentType === 'monthly') {
                    const nextInterestDate = new Date(lastCalcDate);
                    nextInterestDate.setMonth(nextInterestDate.getMonth() + 1);

                    if (today >= nextInterestDate) {
                        needsInterestCalculation = true;
                        // Tính lãi đơn giản cho 1 tháng: (Vốn * Lãi suất năm / 12)
                        // Giả sử initialInvestment là vốn gốc cho tiết kiệm
                        // Hoặc currentValue nếu lãi được cộng dồn vào gốc (compound)
                        const principal = investment.interestCalculationType === 'compound' ? investment.currentValue : investment.initialInvestment;
                        if (investment.interestRate && principal > 0) {
                            interestAmount = (principal * (investment.interestRate / 100)) / 12;
                        }
                    }
                } else if (investment.interestPaymentType === 'end' && investment.endDate) { // Cuối kỳ
                    const endDate = new Date(investment.endDate);
                    endDate.setHours(0, 0, 0, 0);
                    if (today >= endDate && (!investment.lastInterestCalculationDate || new Date(investment.lastInterestCalculationDate) < endDate)) {
                        needsInterestCalculation = true;
                        // Tính tổng lãi cho cả kỳ hạn
                        // Logic này cần xem xét kỹ: đây là ví dụ đơn giản
                        const termInYears = (endDate.getTime() - new Date(investment.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                        const principal = investment.initialInvestment; // Lãi thường tính trên gốc ban đầu cho "simple"
                        if (investment.interestRate && principal > 0 && termInYears > 0) {
                            if (investment.interestCalculationType === 'simple') {
                                interestAmount = principal * (investment.interestRate / 100) * termInYears;
                                // Nếu đã từng có tính lãi trước đó (trường hợp cron chạy lại), thì chỉ tính phần chênh lệch
                                // Điều này phức tạp, cần có trường `totalInterestPaid` để trừ đi.
                                // Hiện tại, giả sử đây là lần tính duy nhất cho cuối kỳ.
                            } else { // compound (phức tạp hơn, có thể cần tính từng kỳ nhỏ)
                                // Ví dụ đơn giản cho compound hàng năm: P * (1 + r)^t - P
                                //  logger.warn("Compound interest calculation for 'end of term' is complex and not fully implemented here.");
                                interestAmount = principal * (investment.interestRate / 100) * termInYears; // Tạm tính như simple
                            }
                        }
                    }
                }
                // Thêm các trường hợp khác: quarterly, yearly, prepaid...

                if (needsInterestCalculation && interestAmount > 0) {
                    logger.info(`[Scheduler] Calculating interest for savings ${investment.name} (User: ${investment.userId.id}). Amount: ${interestAmount}`);

                    // Tạo giao dịch 'interest'
                    const interestTransaction = {
                        type: 'interest',
                        amount: parseFloat(interestAmount.toFixed(2)),
                        date: new Date(),
                        notes: `Tiền lãi tự động (${investment.interestPaymentType})`
                    };
                    investment.transactions.push(interestTransaction);

                    // Cập nhật các giá trị
                    // currentValue có thể là nơi cộng dồn lãi.
                    // Hoặc có trường riêng totalInterestEarned.
                    // investment.currentValue += parseFloat(interestAmount.toFixed(2)); // Nếu lãi cộng vào giá trị hiện tại
                    // investment.totalInterestEarned = (investment.totalInterestEarned || 0) + parseFloat(interestAmount.toFixed(2));

                    investment.lastInterestCalculationDate = new Date(); // Đánh dấu đã tính lãi

                    // Gọi calculateMetrics để cập nhật các chỉ số khác nếu cần (ví dụ profitLoss bao gồm cả lãi)
                    // Tuy nhiên, calculateMetrics hiện tại có thể chưa tính lãi vào initialInvestment hoặc profitLoss đúng cách.
                    // Cần xem lại calculateMetrics.
                    // Tạm thời, nếu currentValue đã bao gồm lãi, thì profit/loss sẽ tự đúng.
                    // Nếu không, cần điều chỉnh cách tính profit/loss cho savings.

                    // Giả sử calculateMetrics sẽ xử lý đúng, hoặc ta cập nhật thủ công currentValue
                    // Hiện tại, model.calculateMetrics() không trực tiếp cộng dồn lãi, nó dựa vào transactions.
                    // Nếu addTransaction() được gọi, nó sẽ gọi calculateMetrics().
                    // Nên có thể dùng investment.addTransaction(interestTransaction);
                    // Nhưng addTransaction hiện tại cũng không có logic đặc biệt cho 'interest' vào initialInvestment.

                    // Cách 1: Tự cập nhật currentValue và các trường liên quan
                    // investment.currentValue += parseFloat(interestAmount.toFixed(2)); // Đã cộng dồn trong calculateMetrics nếu transaction 'interest' được tính đúng.

                    // Cách 2: Đảm bảo calculateMetrics tính đúng.
                    // Giao dịch 'interest' nên được coi là làm tăng currentValue.
                    // initialInvestment của khoản tiết kiệm không nên thay đổi bởi lãi.
                    // Profit/Loss của tiết kiệm chính là tổng lãi.

                    await investment.save(); // Pre-save sẽ gọi calculateMetrics

                    const formattedInvestment = { // Cần định nghĩa hàm format tương tự investmentController
                        id: investment._id.toString(),
                        userId: investment.userId.id,
                        name: investment.name,
                        type: investment.type,
                        initialInvestment: investment.initialInvestment,
                        currentValue: investment.currentValue, // Sẽ được cập nhật bởi calculateMetrics
                        // ... các trường khác
                        profitLoss: (investment.currentValue - investment.initialInvestment).toFixed(2), // Lãi = Giá trị hiện tại - Vốn gốc
                        roi: investment.initialInvestment !== 0 ? (((investment.currentValue - investment.initialInvestment) / investment.initialInvestment) * 100).toFixed(2) : '0.00',
                    };


                    emit(investment.userId.id, 'investment:updated', formattedInvestment);
                    logger.debug(`[Scheduler] Emitted investment:updated for savings ${investment.name} (User: ${investment.userId.id}) after interest calculation.`);
                }

            } catch (error) {
                logger.error(`[Scheduler] Error updating interest for savings ${investment.name} (User: ${investment.userId.id}): ${error.message}`, error.stack);
            }
        }
        logger.info('[Scheduler] Savings interest update job finished.');
    } catch (error) {
        logger.error(`[Scheduler] Error in savings interest update job: ${error.message}`, error.stack);
    }
});

export const startSchedulers = () => {
    if (process.env.NODE_ENV !== 'test') { // Không chạy cron jobs khi test
        // Bật lại stock price update vì stock-api đã chạy
        updateStockPricesJob.start();
        logger.info('[Scheduler] Stock price update job ENABLED (stock-api running on port 8000)');

        updateSavingsInterestJob.start();
        logger.info('[Scheduler] Savings interest job started.');
        logger.info('[Scheduler] Cron jobs started (all schedulers enabled).');
    } else {
        logger.info('[Scheduler] Cron jobs NOT started in test environment.');
    }
};

// Cần thêm trường lastInterestCalculationDate vào investmentModel.js cho 'savings'
// và cập nhật logic của calculateMetrics() trong investmentModel.js
// để xử lý giao dịch 'interest' một cách phù hợp cho việc tính profit/loss của tiết kiệm.
// Profit/Loss của tiết kiệm = currentValue (bao gồm lãi) - initialInvestment (vốn gốc).
// `initialInvestment` cho savings nên giữ nguyên là vốn gốc ban đầu.
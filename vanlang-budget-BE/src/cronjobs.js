import cron from 'node-cron';
import mongoose from 'mongoose';
import Loan from './models/loanModel.js';
import Budget from './models/budgetModel.js';
import Notification from './models/Notification.js';
import Investment from './models/investmentModel.js';
import logger from './utils/logger.js';
import User from './models/userModel.js';
import Income from './models/incomeModel.js';
import Expense from './models/expenseModel.js';
import { emit } from './socket.js';

// Import service cho cập nhật giá crypto
// import cryptoService from './services/cryptoService.js'; // <<< Commented out
import { computeLoanStatuses } from './services/loanService.js';
import { createDailyLoginTracking } from './services/userActivityService.js';
import { notifyDueBudgets } from './services/budgetService.js';
// import { fetchCryptoPrices, saveCryptoPrices, updateCryptoInvestments } from './services/cryptoService.js'; // <<< Commented out
// import { saveCryptoPrice, updateLatestPrice, getLatestPriceAndCalculate } from './services/cryptoService.js'; // <<< Commented out
import { findByID } from './services/notificationService.js';
import { getUserDetailsByID } from './services/userService.js';

/**
 * Khởi tạo tất cả các cron jobs trong hệ thống
 */
export const initCronJobs = () => {
    if (process.env.RUN_CRON_JOBS !== 'true') {
        console.log('⏸️ Cron jobs bị vô hiệu hóa trong cấu hình');
        return;
    }

    try {
        console.log('🚀 Đang khởi tạo cron jobs...');

        // Kiểm tra khoản vay quá hạn hàng ngày lúc 8:00 sáng
        cron.schedule('0 8 * * *', checkOverdueLoans, {
            scheduled: true,
            timezone: 'Asia/Ho_Chi_Minh'
        });
        logger.info('Scheduled job: Check overdue loans at 8:00 AM daily');

        // Kiểm tra ngân sách vượt quá hạn mức hàng ngày lúc 8:30 sáng
        cron.schedule('30 8 * * *', checkBudgetLimits, {
            scheduled: true,
            timezone: 'Asia/Ho_Chi_Minh'
        });
        logger.info('Scheduled job: Check budget limits at 8:30 AM daily');

        // Xóa thông báo cũ sau 30 ngày, chạy hàng tuần vào Chủ Nhật lúc 1:00 sáng
        cron.schedule('0 1 * * 0', cleanupOldNotifications, {
            scheduled: true,
            timezone: 'Asia/Ho_Chi_Minh'
        });
        logger.info('Scheduled job: Clean up old notifications at 1:00 AM every Sunday');

        // Kiểm tra số dư âm hàng ngày lúc 12:00 trưa
        cron.schedule('0 12 * * *', checkNegativeBalance, {
            scheduled: true,
            timezone: 'Asia/Ho_Chi_Minh'
        });
        logger.info('Scheduled job: Check negative balance at 12:00 PM daily');

        // Cập nhật giá crypto mỗi 4 giờ - Tạm thời comment lại
        // cron.schedule('0 */4 * * *', updateCryptoPrices, {
        //     scheduled: true,
        //     timezone: 'Asia/Ho_Chi_Minh'
        // });
        // logger.info('Scheduled job: Update crypto prices every 4 hours');

        // Kiểm tra đáo hạn khoản tiết kiệm mỗi ngày lúc 9:00 sáng
        cron.schedule('0 9 * * *', checkSavingsMaturity, {
            scheduled: true,
            timezone: 'Asia/Ho_Chi_Minh'
        });
        logger.info('Scheduled job: Check savings maturity at 9:00 AM daily');

        // Cập nhật giá tiền điện tử mỗi 15 phút - Tạm thời comment lại
        // cron.schedule('*/15 * * * *', updateCryptoPricesCron);
        // console.log('⏰ Cron job cập nhật giá tiền điện tử đã được khởi tạo (mỗi 15 phút)');

        // Theo dõi đăng nhập hàng ngày của người dùng lúc 11:59 PM
        cron.schedule('59 23 * * *', trackDailyUserLogin, {
            scheduled: true,
            timezone: 'Asia/Ho_Chi_Minh'
        });
        logger.info('Scheduled job: Track daily user login at 11:59 PM');

        console.log('✅ Tất cả cron jobs đã được khởi tạo thành công');
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo cron jobs:', error);
    }
};

/**
 * Kiểm tra các khoản vay quá hạn và gửi thông báo
 */
const checkOverdueLoans = async () => {
    try {
        logger.info('Running cron job: Checking overdue loans');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tìm các khoản vay có dueDate trước ngày hôm nay và chưa được trả hết
        // Truy vấn ban đầu mà không cần populate
        const query = {
            dueDate: { $lt: today },
            status: { $ne: 'paid' },
            notifiedOverdue: { $ne: true } // Chỉ thông báo những khoản chưa được thông báo
        };

        // Tìm khoản vay sử dụng userId
        const overdueLoansWithUserId = await Loan.find({
            ...query,
            userId: { $exists: true }
        }).populate('userId', 'name email settings');

        // Tìm khoản vay sử dụng user (cho những model cũ)
        const overdueLoansWithUser = await Loan.find({
            ...query,
            user: { $exists: true },
            userId: { $exists: false }
        }).populate('user', 'name email settings');

        // Kết hợp cả hai kết quả
        const overdueLoans = [...overdueLoansWithUserId, ...overdueLoansWithUser];

        logger.info(`Found ${overdueLoans.length} overdue loans`);

        for (const loan of overdueLoans) {
            // Tạo thông báo sử dụng phương thức createLoanDueAlert
            await Notification.createLoanDueAlert(loan);

            // Đánh dấu đã thông báo để tránh gửi trùng lặp
            loan.notifiedOverdue = true;
            await loan.save();

            logger.info(`Sent overdue notification for loan: ${loan._id}`);
        }
    } catch (error) {
        logger.error('Error in overdue loans cron job:', error);
    }
};

/**
 * Kiểm tra các ngân sách vượt quá hạn mức
 */
const checkBudgetLimits = async () => {
    try {
        logger.info('Running cron job: Checking budget limits');
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Tìm các ngân sách của tháng hiện tại
        const query = {
            month: currentMonth,
            year: currentYear,
            notifiedThreshold: { $lt: 100 } // Chỉ lấy những ngân sách chưa thông báo 100%
        };

        // Tìm ngân sách sử dụng userId
        const budgetsWithUserId = await Budget.find({
            ...query,
            userId: { $exists: true }
        }).populate('userId', 'name email settings');

        // Tìm ngân sách sử dụng user (cho những model cũ)
        const budgetsWithUser = await Budget.find({
            ...query,
            user: { $exists: true },
            userId: { $exists: false }
        }).populate('user', 'name email settings');

        // Kết hợp cả hai kết quả
        const budgets = [...budgetsWithUserId, ...budgetsWithUser];

        logger.info(`Found ${budgets.length} active budgets`);

        for (const budget of budgets) {
            // Gọi phương thức createBudgetAlert từ model Notification
            await Notification.createBudgetAlert(budget);

            logger.info(`Checked budget alert for budget: ${budget._id}`);
        }
    } catch (error) {
        logger.error('Error in budget limits cron job:', error);
    }
};

/**
 * Xóa các thông báo cũ (trên 30 ngày)
 */
const cleanupOldNotifications = async () => {
    try {
        logger.info('Running cron job: Cleaning up old notifications');

        // Tính thời điểm 30 ngày trước
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Xóa tất cả thông báo đã đọc và cũ hơn 30 ngày
        const result = await Notification.deleteMany({
            createdAt: { $lt: thirtyDaysAgo },
            read: true
        });

        logger.info(`Deleted ${result.deletedCount} old notifications`);
    } catch (error) {
        logger.error('Error in cleanup notifications cron job:', error);
    }
};

/**
 * Kiểm tra số dư âm và gửi thông báo
 */
const checkNegativeBalance = async () => {
    try {
        logger.info('Running cron job: Checking negative balance');

        // Lấy danh sách tất cả người dùng
        const users = await User.find({ active: true });

        for (const user of users) {
            try {
                // Tính tổng thu nhập
                const incomeResult = await Income.aggregate([
                    {
                        $match: {
                            $or: [
                                { userId: user._id },
                                { user: user._id }
                            ]
                        }
                    },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]);
                const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;

                // Tính tổng chi tiêu
                const expenseResult = await Expense.aggregate([
                    {
                        $match: {
                            $or: [
                                { userId: user._id },
                                { user: user._id }
                            ]
                        }
                    },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]);
                const totalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;

                // Tính số dư
                const balance = totalIncome - totalExpense;

                // Nếu số dư âm, tạo thông báo
                if (balance < 0) {
                    logger.info(`User ${user._id} has negative balance: ${balance}`);
                    const notification = await Notification.createNegativeBalanceAlert(user._id, balance);

                    if (notification) {
                        logger.info(`Created negative balance notification for user ${user._id}`);

                        // Gửi thông báo qua socket nếu có socketManager
                        if (global.socketManager) {
                            global.socketManager.sendToUser(user._id.toString(), 'notification', {
                                message: 'Cảnh báo số dư âm',
                                notification
                            });
                        }
                    }
                }
            } catch (err) {
                logger.error(`Error processing user ${user._id}:`, err);
            }
        }

        logger.info('Completed checking negative balance');
    } catch (error) {
        logger.error('Error in negative balance cron job:', error);
    }
};

/**
 * Cập nhật giá tiền điện tử - Tạm thời comment lại
 */
// const updateCryptoPrices = async () => {
//     try {
//         logger.info('Running cron job: Updating crypto prices');

//         // Tìm tất cả các đầu tư loại crypto
//         const cryptoInvestments = await Investment.find({ type: 'crypto' });
//         logger.info(`Found ${cryptoInvestments.length} crypto investments to update`);

//         if (cryptoInvestments.length === 0) {
//             return;
//         }

//         // Lấy danh sách coin IDs
//         const coinSymbols = [...new Set(cryptoInvestments.map(inv => inv.symbol.toLowerCase()))];

//         // Nhóm đầu tư theo symbol
//         const investmentsBySymbol = {};
//         cryptoInvestments.forEach(inv => {
//             const symbol = inv.symbol.toLowerCase();
//             if (!investmentsBySymbol[symbol]) {
//                 investmentsBySymbol[symbol] = [];
//             }
//             investmentsBySymbol[symbol].push(inv);
//         });

//         // Lấy danh sách top coins để tìm ID tương ứng với symbol
//         const topCoins = await cryptoService.getTopCryptos(100);
//         const coinSymbolToId = {};
//         topCoins.forEach(coin => {
//             coinSymbolToId[coin.symbol.toLowerCase()] = coin.id;
//         });

//         // Lấy ID của các coin cần cập nhật
//         const coinIds = [];
//         for (const symbol of coinSymbols) {
//             if (coinSymbolToId[symbol]) {
//                 coinIds.push(coinSymbolToId[symbol]);
//             }
//         }

//         if (coinIds.length === 0) {
//             logger.info('No matching coins found in CoinGecko');
//             return;
//         }

//         // Lấy giá của các coin
//         const priceData = await cryptoService.getPrices(coinIds);

//         // Cập nhật giá cho từng đầu tư
//         for (const symbol of coinSymbols) {
//             const coinId = coinSymbolToId[symbol];
//             if (coinId && priceData[coinId] && investmentsBySymbol[symbol]) {
//                 const currentPrice = priceData[coinId].vnd || priceData[coinId].usd;

//                 // Cập nhật tất cả đầu tư có symbol này
//                 for (const investment of investmentsBySymbol[symbol]) {
//                     investment.updateCurrentPrice(currentPrice);
//                     await investment.save();

//                     // Thông báo qua socket về sự thay đổi
//                     emit(investment.userId.toString(), 'investment:updated', investment);

//                     // Tạo thông báo nếu có biến động lớn
//                     const priceChange = priceData[coinId].vnd_24h_change;
//                     if (Math.abs(priceChange) > 10) { // Biến động hơn 10%
//                         await Notification.create({
//                             userId: investment.userId,
//                             title: `Biến động giá ${investment.assetName}`,
//                             message: `Giá của ${investment.assetName} đã ${priceChange > 0 ? 'tăng' : 'giảm'} ${Math.abs(priceChange).toFixed(2)}% trong 24 giờ qua.`,
//                             type: 'investment',
//                             data: {
//                                 investmentId: investment._id,
//                                 priceChange: priceChange,
//                                 previousPrice: investment.currentPrice / (1 + priceChange / 100),
//                                 currentPrice: investment.currentPrice
//                             }
//                         });
//                     }
//                 }

//                 logger.info(`Updated price for ${symbol}: ${currentPrice} VND`);
//             }
//         }

//         logger.info('Crypto price update completed');
//     } catch (error) {
//         logger.error('Error in crypto price update cron job:', error);
//     }
// };

/**
 * Kiểm tra đáo hạn các khoản tiết kiệm
 */
const checkSavingsMaturity = async () => {
    try {
        logger.info('Running cron job: Checking savings maturity');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tìm các khoản tiết kiệm đến hạn
        const maturingSavings = await Investment.find({
            type: 'savings',
            status: 'active',
            endDate: { $lte: today },
            notifiedMaturity: { $ne: true }
        }).populate('userId', 'name email settings');

        logger.info(`Found ${maturingSavings.length} maturing savings`);

        for (const saving of maturingSavings) {
            // Cập nhật trạng thái
            saving.status = 'matured';
            saving.notifiedMaturity = true;

            // Tính toán lãi suất khi đáo hạn
            const principal = saving.initialInvestment;
            const interestRate = saving.interestRate / 100;
            const termInYears = saving.term / 12; // Giả sử term là số tháng

            let interest = 0;
            // Tính lãi kép nếu kỳ hạn > 1 năm
            if (termInYears > 1) {
                interest = principal * Math.pow(1 + interestRate, termInYears) - principal;
            } else {
                // Lãi đơn nếu ≤ 1 năm
                interest = principal * interestRate * termInYears;
            }

            saving.currentValue = principal + interest;
            saving.profitLoss = interest;
            saving.roi = (interest / principal) * 100;

            await saving.save();

            // Tạo thông báo
            await Notification.create({
                userId: saving.userId._id,
                title: 'Tiết kiệm đáo hạn',
                message: `Khoản tiết kiệm "${saving.assetName}" của bạn đã đáo hạn. Lãi suất: ${interest.toLocaleString('vi-VN')} VND`,
                type: 'investment',
                data: {
                    investmentId: saving._id,
                    interestEarned: interest,
                    totalAmount: saving.currentValue
                }
            });

            // Thông báo qua socket
            emit(saving.userId._id.toString(), 'investment:matured', saving);

            logger.info(`Processed matured saving: ${saving._id}`);
        }
    } catch (error) {
        logger.error('Error in savings maturity cron job:', error);
    }
};

// Cron để cập nhật giá tiền điện tử mỗi 15 phút - Tạm thời comment lại
// const updateCryptoPricesCron = async () => {
//     try {
//         logger.info('🪙 Running cron job: Updating crypto prices');

//         // Tìm tất cả các đầu tư loại crypto
//         const cryptoInvestments = await Investment.find({ type: 'crypto' });
//         logger.info(`Found ${cryptoInvestments.length} crypto investments to update`);

//         if (cryptoInvestments.length === 0) {
//             logger.info('No crypto investments to update.');
//             return;
//         }

//         // Lấy danh sách coin IDs
//         const coinSymbols = [...new Set(cryptoInvestments.map(inv => inv.symbol.toLowerCase()))];

//         // Nhóm đầu tư theo symbol
//         const investmentsBySymbol = {};
//         cryptoInvestments.forEach(inv => {
//             const symbol = inv.symbol.toLowerCase();
//             if (!investmentsBySymbol[symbol]) {
//                 investmentsBySymbol[symbol] = [];
//             }
//             investmentsBySymbol[symbol].push(inv);
//         });

//         // Lấy danh sách top coins để tìm ID tương ứng với symbol
//         const topCoins = await cryptoService.getTopCryptos(100); // Lấy top 100 coins
//         const coinSymbolToId = {};
//         topCoins.forEach(coin => {
//             coinSymbolToId[coin.symbol.toLowerCase()] = coin.id;
//         });

//         // Lấy ID của các coin cần cập nhật
//         const coinIds = coinSymbols.map(symbol => coinSymbolToId[symbol]).filter(id => !!id);

//         if (coinIds.length === 0) {
//             logger.info('No matching coins found in CoinGecko for existing investments');
//             return;
//         }

//         // Lấy giá của các coin
//         const priceData = await cryptoService.getPrices(coinIds);

//         let updatedCount = 0;
//         // Cập nhật giá cho từng đầu tư
//         for (const symbol of coinSymbols) {
//             const coinId = coinSymbolToId[symbol];
//             if (coinId && priceData[coinId] && investmentsBySymbol[symbol]) {
//                 const currentPrice = priceData[coinId].vnd || priceData[coinId].usd;

//                 // Cập nhật tất cả đầu tư có symbol này
//                 for (const investment of investmentsBySymbol[symbol]) {
//                     const oldPrice = investment.currentPrice;
//                     investment.updateCurrentPrice(currentPrice);
//                     await investment.save();
//                     updatedCount++;

//                     // Thông báo qua socket về sự thay đổi
//                     emit(investment.userId.toString(), 'investment:updated', investment);

//                     // Tạo thông báo nếu có biến động lớn (ví dụ: > 10% trong 24h)
//                     const priceChangePercent = priceData[coinId].vnd_24h_change || priceData[coinId].usd_24h_change;
//                     if (priceChangePercent && Math.abs(priceChangePercent) > 10) {
//                          const previousPrice = oldPrice; // Sử dụng giá cũ trước khi cập nhật
//                         await Notification.create({
//                             userId: investment.userId,
//                             title: `Biến động giá ${investment.assetName}`,
//                             message: `Giá của ${investment.assetName} đã ${priceChangePercent > 0 ? 'tăng' : 'giảm'} ${Math.abs(priceChangePercent).toFixed(2)}% trong 24 giờ qua. Giá hiện tại: ${currentPrice.toLocaleString('vi-VN')} VND`,
//                             type: 'investment',
//                             data: {
//                                 investmentId: investment._id,
//                                 priceChangePercent: priceChangePercent,
//                                 previousPrice: previousPrice,
//                                 currentPrice: currentPrice
//                             }
//                         });
//                         // Gửi thông báo socket riêng cho biến động giá
//                         emit(investment.userId.toString(), 'investment:price_alert', {
//                             investmentId: investment._id,
//                             assetName: investment.assetName,
//                             priceChangePercent: priceChangePercent,
//                             currentPrice: currentPrice
//                         });
//                     }
//                 }
//                 logger.info(`Updated price for ${symbol}: ${currentPrice} VND`);
//             }
//         }

//         logger.info(`✅ Crypto price update completed. Updated ${updatedCount} investments.`);
//     } catch (error) {
//         logger.error('❌ Error in crypto price update cron job:', error);
//     }
// };

/**
 * Theo dõi đăng nhập hàng ngày của người dùng
 */
const trackDailyUserLogin = async () => {
    try {
        logger.info('Running cron job: Tracking daily user logins');

        // Gọi service để cập nhật thông tin đăng nhập hàng ngày
        const result = await createDailyLoginTracking();

        logger.info(`Daily login tracking completed: ${result.processed} users processed, ${result.updated} users updated`);
    } catch (error) {
        logger.error('Error in daily login tracking cron job:', error);
    }
}; 
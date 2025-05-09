import mongoose from 'mongoose';
import Investment from '../models/investmentModel.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import { emit } from '../socket.js'; // Import emit nếu cần thông báo real-time

// Helper function để định dạng investment trả về
const formatInvestmentResponse = (investment) => {
    if (!investment) return null;
    // Tính toán profit/loss và roi ở đây nếu cần thiết
    const profitLoss = investment.currentValue - investment.initialInvestment;
    const roi = investment.initialInvestment !== 0 ? (profitLoss / investment.initialInvestment) * 100 : 0;

    return {
        id: investment._id.toString(),
        userId: investment.userId.toString(),
        name: investment.name,
        type: investment.type,
        symbol: investment.symbol,
        category: investment.category,
        initialInvestment: investment.initialInvestment,
        currentValue: investment.currentValue,
        totalQuantity: investment.totalQuantity,
        currentPrice: investment.currentPrice,
        startDate: investment.startDate?.toISOString().split('T')[0], // Format YYYY-MM-DD
        notes: investment.notes,
        createdAt: investment.createdAt,
        updatedAt: investment.updatedAt,
        profitLoss: profitLoss.toFixed(2), // Làm tròn 2 chữ số
        roi: roi.toFixed(2), // Làm tròn 2 chữ số
        transactions: investment.transactions.map(t => ({
            id: t._id.toString(),
            type: t.type,
            amount: t.amount,
            price: t.price,
            quantity: t.quantity,
            fee: t.fee,
            date: t.date?.toISOString().split('T')[0], // Format YYYY-MM-DD
            notes: t.notes,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt
        }))
    };
};

/**
 * @desc    Tạo khoản đầu tư mới
 * @route   POST /api/investments
 * @access  Private
 */
const createInvestment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        console.log('[InvestmentController] Creating new investment with data:', req.body);

        const {
            name,
            type,
            symbol,
            category,
            startDate,
            notes,
            initialInvestment, // Vốn ban đầu (tùy chọn)
            currentPrice // Giá hiện tại ban đầu (tùy chọn)
        } = req.body;

        const newInvestmentData = {
            userId: req.user.id,
            name,
            type,
            symbol,
            category,
            startDate: startDate || new Date(),
            notes,
            currentPrice: currentPrice || 0,
            transactions: [] // Khởi tạo mảng giao dịch rỗng
        };

        console.log('[InvestmentController] Prepared investment data:', newInvestmentData);

        // Nếu có vốn ban đầu, tạo giao dịch 'deposit' hoặc 'buy'
        if (typeof initialInvestment === 'number' && initialInvestment > 0) {
            let initialTransaction;
            if (type === 'stock' || type === 'crypto' || type === 'gold') {
                // Giả định vốn ban đầu là mua với giá hiện tại (nếu có) hoặc giá 1
                const price = currentPrice || 1;
                const quantity = initialInvestment / price;
                initialTransaction = {
                    type: 'buy',
                    price: price,
                    quantity: quantity,
                    date: newInvestmentData.startDate,
                    notes: 'Giao dịch mua ban đầu'
                };
                console.log('[InvestmentController] Created initial buy transaction:', initialTransaction);
            } else {
                initialTransaction = {
                    type: 'deposit',
                    amount: initialInvestment,
                    date: newInvestmentData.startDate,
                    notes: 'Nạp vốn ban đầu'
                };
                console.log('[InvestmentController] Created initial deposit transaction:', initialTransaction);
            }
            newInvestmentData.transactions.push(initialTransaction);
        }

        const investment = new Investment(newInvestmentData);
        // Hàm calculateMetrics sẽ được gọi tự động bởi pre-save hook
        await investment.save({ session });
        console.log('[InvestmentController] Investment saved successfully:', investment._id.toString());

        await session.commitTransaction();
        session.endSession();

        // Gửi thông báo real-time nếu cần
        emit(req.user.id, 'investment:created', formatInvestmentResponse(investment));

        return successResponse(res, 'Tạo khoản đầu tư thành công', formatInvestmentResponse(investment), 201);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('[InvestmentController] Error creating investment:', error.message, error.stack);

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return errorResponse(res, `Dữ liệu không hợp lệ: ${validationErrors.join(', ')}`, 400);
        }

        if (error.code === 11000) { // Duplicate key error
            return errorResponse(res, 'Đã tồn tại khoản đầu tư với thông tin này', 400);
        }

        return errorResponse(res, 'Lỗi máy chủ khi tạo khoản đầu tư', 500);
    }
};

/**
 * @desc    Lấy danh sách đầu tư của người dùng
 * @route   GET /api/investments
 * @access  Private
 */
const getInvestments = async (req, res) => {
    try {
        const investments = await Investment.find({ userId: req.user.id }).sort({ createdAt: -1 });
        const formattedInvestments = investments.map(formatInvestmentResponse);
        return successResponse(res, 'Lấy danh sách đầu tư thành công', formattedInvestments);
    } catch (error) {
        console.error('[InvestmentController] Error getting investments:', error);
        return errorResponse(res, 'Lỗi máy chủ khi lấy danh sách đầu tư', 500);
    }
};

/**
 * @desc    Lấy chi tiết một khoản đầu tư
 * @route   GET /api/investments/:id
 * @access  Private
 */
const getInvestmentById = async (req, res) => {
    try {
        const investment = await Investment.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!investment) {
            return errorResponse(res, 'Không tìm thấy khoản đầu tư', 404);
        }

        return successResponse(res, 'Lấy chi tiết đầu tư thành công', formatInvestmentResponse(investment));
    } catch (error) {
        console.error('[InvestmentController] Error getting investment by ID:', error);
        // Kiểm tra nếu lỗi là do CastError (ID không đúng định dạng)
        if (error.name === 'CastError') {
            return errorResponse(res, 'ID khoản đầu tư không hợp lệ', 400);
        }
        return errorResponse(res, 'Lỗi máy chủ khi lấy chi tiết đầu tư', 500);
    }
};

/**
 * @desc    Cập nhật khoản đầu tư
 * @route   PUT /api/investments/:id
 * @access  Private
 */
const updateInvestment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, category, notes, currentPrice } = req.body;

        const investment = await Investment.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).session(session);

        if (!investment) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse(res, 'Không tìm thấy khoản đầu tư', 404);
        }

        // Cập nhật các trường được phép
        if (name !== undefined) investment.name = name;
        if (category !== undefined) investment.category = category;
        if (notes !== undefined) investment.notes = notes;
        if (currentPrice !== undefined) {
            investment.updateCurrentPrice(currentPrice);
            // Không cần gọi save riêng vì pre-save hook sẽ chạy khi save() ở cuối
        }

        // Hàm calculateMetrics sẽ được gọi tự động bởi pre-save hook
        await investment.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Gửi thông báo real-time nếu cần
        emit(req.user.id, 'investment:updated', formatInvestmentResponse(investment));

        return successResponse(res, 'Cập nhật khoản đầu tư thành công', formatInvestmentResponse(investment));

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('[InvestmentController] Error updating investment:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, `Dữ liệu không hợp lệ: ${error.message}`, 400);
        }
        if (error.name === 'CastError') {
            return errorResponse(res, 'ID khoản đầu tư không hợp lệ', 400);
        }
        return errorResponse(res, 'Lỗi máy chủ khi cập nhật khoản đầu tư', 500);
    }
};

/**
 * @desc    Xóa khoản đầu tư
 * @route   DELETE /api/investments?id=...
 * @access  Private
 */
const deleteInvestment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const investmentId = req.query.id;

        const investment = await Investment.findOneAndDelete({
            _id: investmentId,
            userId: req.user.id
        }).session(session);

        if (!investment) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse(res, 'Không tìm thấy khoản đầu tư hoặc bạn không có quyền xóa', 404);
        }

        await session.commitTransaction();
        session.endSession();

        // Gửi thông báo real-time nếu cần
        emit(req.user.id, 'investment:deleted', { id: investmentId });

        return successResponse(res, 'Xóa khoản đầu tư thành công');

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('[InvestmentController] Error deleting investment:', error);
        if (error.name === 'CastError') {
            return errorResponse(res, 'ID khoản đầu tư không hợp lệ', 400);
        }
        return errorResponse(res, 'Lỗi máy chủ khi xóa khoản đầu tư', 500);
    }
};

/**
 * @desc    Thêm giao dịch cho khoản đầu tư
 * @route   POST /api/investments/:id/transactions
 * @access  Private
 */
const addTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        console.log('[InvestmentController] Adding transaction to investment', req.params.id, 'with data:', req.body);

        // Kiểm tra nếu thiếu dữ liệu cần thiết
        const { type, price, quantity, date, amount, fee, notes } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!type) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse(res, 'Thiếu loại giao dịch', 400);
        }

        // Kiểm tra dữ liệu dựa trên loại giao dịch
        if (['buy', 'sell'].includes(type) && (price === undefined || quantity === undefined)) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse(res, 'Thiếu giá hoặc số lượng cho giao dịch mua/bán', 400);
        }

        if (['deposit', 'withdraw', 'dividend', 'interest'].includes(type) && amount === undefined) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse(res, 'Thiếu số tiền cho loại giao dịch này', 400);
        }

        // Tìm khoản đầu tư
        const investment = await Investment.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).session(session);

        if (!investment) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse(res, 'Không tìm thấy khoản đầu tư', 404);
        }

        console.log('[InvestmentController] Found investment:', investment._id.toString());

        // Chuẩn bị dữ liệu giao dịch
        const transactionData = {
            type,
            date: date ? new Date(date) : new Date(),
            fee: fee || 0,
            notes: notes || ''
        };

        // Thêm các trường phù hợp với loại giao dịch
        if (['buy', 'sell'].includes(type)) {
            transactionData.price = price;
            transactionData.quantity = quantity;

            // Kiểm tra số lượng bán không vượt quá số lượng hiện có
            if (type === 'sell' && quantity > investment.totalQuantity) {
                await session.abortTransaction();
                session.endSession();
                return errorResponse(res, `Số lượng bán (${quantity}) vượt quá số lượng hiện có (${investment.totalQuantity})`, 400);
            }
        } else {
            transactionData.amount = amount;
        }

        console.log('[InvestmentController] Prepared transaction data:', transactionData);

        // Thêm giao dịch vào khoản đầu tư
        investment.transactions.push(transactionData);

        // Tính toán lại các chỉ số
        investment.calculateMetrics();

        // Lưu thay đổi
        await investment.save({ session });
        console.log('[InvestmentController] Investment updated with new transaction');

        await session.commitTransaction();
        session.endSession();

        // Gửi thông báo real-time
        emit(req.user.id, 'investment:transaction:added', {
            investmentId: investment._id.toString(),
            transaction: investment.transactions[investment.transactions.length - 1]
        });

        return successResponse(res, 'Thêm giao dịch thành công', formatInvestmentResponse(investment));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('[InvestmentController] Error adding transaction:', error.message, error.stack);

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return errorResponse(res, `Dữ liệu không hợp lệ: ${validationErrors.join(', ')}`, 400);
        }

        if (error.name === 'CastError') {
            return errorResponse(res, 'ID khoản đầu tư không hợp lệ', 400);
        }

        return errorResponse(res, 'Lỗi máy chủ khi thêm giao dịch', 500);
    }
};

/**
 * @desc    Xóa giao dịch của khoản đầu tư
 * @route   DELETE /api/investments/:id/transactions/:transactionId
 * @access  Private
 */
const deleteTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id: investmentId, transactionId } = req.params;

        const investment = await Investment.findOne({
            _id: investmentId,
            userId: req.user.id
        }).session(session);

        if (!investment) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse(res, 'Không tìm thấy khoản đầu tư', 404);
        }

        // Tìm index của giao dịch cần xóa
        const transactionIndex = investment.transactions.findIndex(
            t => t._id.toString() === transactionId
        );

        if (transactionIndex === -1) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse(res, 'Không tìm thấy giao dịch', 404);
        }

        // Xóa giao dịch khỏi mảng
        investment.transactions.splice(transactionIndex, 1);

        // Hàm calculateMetrics sẽ được gọi tự động bởi pre-save hook
        await investment.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Gửi thông báo real-time nếu cần
        emit(req.user.id, 'investment:transaction:deleted', { investmentId, transactionId });

        return successResponse(res, 'Xóa giao dịch thành công', formatInvestmentResponse(investment));

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('[InvestmentController] Error deleting transaction:', error);
        if (error.name === 'CastError') {
            return errorResponse(res, 'ID không hợp lệ', 400);
        }
        return errorResponse(res, 'Lỗi máy chủ khi xóa giao dịch', 500);
    }
};

/**
 * @desc    Lấy tổng hợp đầu tư của người dùng
 * @route   GET /api/investments/summary
 * @access  Private
 */
const getInvestmentSummary = async (req, res) => {
    try {
        const investments = await Investment.find({ userId: req.user.id });

        const summary = {
            totalInitialInvestment: 0,
            totalCurrentValue: 0,
            totalProfitLoss: 0,
            overallROI: 0,
            count: investments.length,
            byType: {}
        };

        investments.forEach(inv => {
            const profitLoss = inv.currentValue - inv.initialInvestment;

            // Tổng hợp chung
            summary.totalInitialInvestment += inv.initialInvestment;
            summary.totalCurrentValue += inv.currentValue;
            summary.totalProfitLoss += profitLoss;

            // Tổng hợp theo loại
            const type = inv.type || 'other';
            if (!summary.byType[type]) {
                summary.byType[type] = {
                    count: 0,
                    initialInvestment: 0,
                    currentValue: 0,
                    profitLoss: 0,
                    roi: 0
                };
            }
            summary.byType[type].count += 1;
            summary.byType[type].initialInvestment += inv.initialInvestment;
            summary.byType[type].currentValue += inv.currentValue;
            summary.byType[type].profitLoss += profitLoss;
        });

        // Tính ROI tổng
        summary.overallROI = summary.totalInitialInvestment !== 0
            ? (summary.totalProfitLoss / summary.totalInitialInvestment) * 100
            : 0;

        // Tính ROI cho từng loại
        Object.keys(summary.byType).forEach(type => {
            const typeSummary = summary.byType[type];
            typeSummary.roi = typeSummary.initialInvestment !== 0
                ? (typeSummary.profitLoss / typeSummary.initialInvestment) * 100
                : 0;
            // Làm tròn các giá trị
            typeSummary.initialInvestment = parseFloat(typeSummary.initialInvestment.toFixed(2));
            typeSummary.currentValue = parseFloat(typeSummary.currentValue.toFixed(2));
            typeSummary.profitLoss = parseFloat(typeSummary.profitLoss.toFixed(2));
            typeSummary.roi = parseFloat(typeSummary.roi.toFixed(2));
        });

        // Làm tròn các giá trị tổng
        summary.totalInitialInvestment = parseFloat(summary.totalInitialInvestment.toFixed(2));
        summary.totalCurrentValue = parseFloat(summary.totalCurrentValue.toFixed(2));
        summary.totalProfitLoss = parseFloat(summary.totalProfitLoss.toFixed(2));
        summary.overallROI = parseFloat(summary.overallROI.toFixed(2));

        return successResponse(res, 'Lấy tổng hợp đầu tư thành công', summary);

    } catch (error) {
        console.error('[InvestmentController] Error getting investment summary:', error);
        return errorResponse(res, 'Lỗi máy chủ khi lấy tổng hợp đầu tư', 500);
    }
};

/**
 * @desc    Lấy danh sách đầu tư theo loại
 * @route   GET /api/investments/by-type/:type
 * @access  Private
 */
const getInvestmentsByType = async (req, res) => {
    try {
        const { type } = req.params;

        // Kiểm tra xem type có hợp lệ không (tùy chọn, vì validation middleware đã làm)
        // const allowedTypes = ['stock', 'crypto', 'gold', 'savings', 'fund', 'realestate', 'other'];
        // if (!allowedTypes.includes(type)) {
        //     return errorResponse(res, 'Loại đầu tư không hợp lệ', 400);
        // }

        const investments = await Investment.find({ userId: req.user.id, type: type }).sort({ createdAt: -1 });

        if (!investments || investments.length === 0) {
            // Trả về mảng rỗng thay vì lỗi 404 nếu không tìm thấy
            return successResponse(res, `Không tìm thấy khoản đầu tư loại ${type}`, []);
        }

        const formattedInvestments = investments.map(formatInvestmentResponse);
        return successResponse(res, `Lấy danh sách đầu tư loại ${type} thành công`, formattedInvestments);

    } catch (error) {
        console.error(`[InvestmentController] Error getting investments by type ${req.params.type}:`, error);
        return errorResponse(res, `Lỗi máy chủ khi lấy danh sách đầu tư loại ${req.params.type}`, 500);
    }
};

/**
 * @desc    Cập nhật giá hàng loạt cho các khoản đầu tư
 * @route   POST /api/investments/batch-update-price
 * @access  Private
 */
const batchUpdatePrice = async (req, res) => {
    const { updates } = req.body; // Expecting [{ id: string, currentPrice: number }, ...]
    const session = await mongoose.startSession();
    session.startTransaction();

    const results = {
        success: [],
        failed: []
    };

    try {
        for (const update of updates) {
            const { id, currentPrice } = update;
            try {
                const investment = await Investment.findOne({
                    _id: id,
                    userId: req.user.id
                }).session(session);

                if (!investment) {
                    results.failed.push({ id, error: 'Investment not found or unauthorized' });
                    continue; // Bỏ qua nếu không tìm thấy hoặc không có quyền
                }

                investment.updateCurrentPrice(currentPrice);
                await investment.save({ session }); // Pre-save hook sẽ chạy

                results.success.push({
                    id,
                    ...formatInvestmentResponse(investment) // Trả về investment đã cập nhật
                });

                // Gửi thông báo real-time
                emit(req.user.id, 'investment:updated', formatInvestmentResponse(investment));

            } catch (itemError) {
                console.error(`[InvestmentController] Error updating price for investment ${id}:`, itemError);
                results.failed.push({ id, error: itemError.message || 'Server error during update' });
                // Không rollback ngay, cho phép các item khác tiếp tục
            }
        }

        // Chỉ commit nếu không có lỗi nghiêm trọng nào xảy ra
        // Nếu bạn muốn rollback toàn bộ nếu có BẤT KỲ lỗi nào, hãy thêm kiểm tra results.failed.length > 0 và gọi abortTransaction
        await session.commitTransaction();
        session.endSession();

        return successResponse(res, 'Cập nhật giá hàng loạt hoàn tất', results);

    } catch (error) {
        // Lỗi xảy ra bên ngoài vòng lặp (ví dụ: lỗi kết nối)
        await session.abortTransaction();
        session.endSession();
        console.error('[InvestmentController] Error in batch update price:', error);
        return errorResponse(res, 'Lỗi máy chủ khi cập nhật giá hàng loạt', 500);
    }
};

/**
 * @desc    Thêm giao dịch cho khoản đầu tư cổ phiếu dựa trên mã (symbol)
 * @route   POST /api/investments/stocks/:stockSymbol/transactions
 * @access  Private
 */
const addStockTransactionBySymbol = async (req, res) => {
    const { stockSymbol } = req.params;
    const transactionData = req.body;
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Tìm khoản đầu tư cổ phiếu tương ứng
        const investment = await Investment.findOne({
            userId: userId,
            type: 'stock',
            symbol: stockSymbol // Tìm bằng symbol
        }).session(session);

        if (!investment) {
            await session.abortTransaction();
            session.endSession();
            return errorResponse(res, `Không tìm thấy khoản đầu tư cổ phiếu với mã ${stockSymbol}`, 404);
        }

        // Thêm giao dịch sử dụng phương thức của model
        investment.addTransaction(transactionData);

        // Hàm calculateMetrics sẽ được gọi tự động bởi pre-save hook
        await investment.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Gửi thông báo real-time nếu cần
        emit(userId, 'investment:transaction:added', formatInvestmentResponse(investment));
        // Cũng có thể emit investment:updated nếu cần
        emit(userId, 'investment:updated', formatInvestmentResponse(investment));

        // Trả về toàn bộ investment đã cập nhật
        return successResponse(res, 'Thêm giao dịch cổ phiếu thành công', formatInvestmentResponse(investment));

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(`[InvestmentController] Error adding stock transaction for symbol ${stockSymbol}:`, error);
        if (error.name === 'ValidationError') {
            // Lỗi validation có thể từ transactionSchema hoặc investmentSchema
            return errorResponse(res, `Dữ liệu giao dịch không hợp lệ: ${error.message}`, 400);
        }
        return errorResponse(res, 'Lỗi máy chủ khi thêm giao dịch cổ phiếu', 500);
    }
};

/**
 * @desc    Lấy đầu tư theo mã cổ phiếu (symbol)
 * @route   GET /api/investments/stocks/:symbol
 * @access  Private
 */
const getInvestmentBySymbol = async (req, res) => {
    try {
        const { symbol } = req.params;
        console.log(`[InvestmentController] Getting investment by symbol: ${symbol}`);

        if (!symbol) {
            return errorResponse(res, 'Cần cung cấp mã cổ phiếu/tài sản', 400);
        }

        // Tìm khoản đầu tư theo mã symbol
        const investment = await Investment.findOne({
            userId: req.user.id,
            symbol: symbol.toUpperCase(),
            type: { $in: ['stock', 'crypto', 'gold'] } // Chỉ các loại tài sản có symbol
        });

        if (!investment) {
            return errorResponse(res, `Không tìm thấy khoản đầu tư với mã ${symbol}`, 404);
        }

        return successResponse(res, 'Lấy thông tin đầu tư theo mã thành công', formatInvestmentResponse(investment));
    } catch (error) {
        console.error('[InvestmentController] Error getting investment by symbol:', error.message, error.stack);
        return errorResponse(res, 'Lỗi máy chủ khi tìm khoản đầu tư theo mã', 500);
    }
};

// Export các hàm controller
export {
    createInvestment,
    getInvestments,
    getInvestmentById,
    updateInvestment,
    deleteInvestment,
    addTransaction,
    deleteTransaction,
    getInvestmentSummary,
    getInvestmentsByType,
    batchUpdatePrice,
    addStockTransactionBySymbol,
    getInvestmentBySymbol
    // Thêm các hàm khác nếu cần (getByType, etc.)
}; 
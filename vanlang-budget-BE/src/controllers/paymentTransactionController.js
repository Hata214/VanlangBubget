import PaymentTransaction from '../models/paymentTransactionModel.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import logger from '../utils/logger.js';
import AdminActivityLogger from '../utils/adminActivityLogger.js';

/**
 * @desc    Lấy danh sách tất cả giao dịch thanh toán (Admin/SuperAdmin)
 * @route   GET /api/admin/transactions
 * @access  Private (Admin/SuperAdmin)
 */
export const getAllPaymentTransactions = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            type,
            planType,
            paymentMethod,
            startDate,
            endDate,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (planType) filter.planType = planType;
        if (paymentMethod) filter.paymentMethod = paymentMethod;
        
        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Search filter (user name, email, transaction ID)
        if (search) {
            const users = await User.find({
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            
            const userIds = users.map(user => user._id);
            
            filter.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { userId: { $in: userIds } }
            ];
        }

        // Sort configuration
        const sortConfig = {};
        sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const transactions = await PaymentTransaction.find(filter)
            .populate('userId', 'firstName lastName email role')
            .populate('processedBy', 'firstName lastName email')
            .sort(sortConfig)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // Get total count for pagination
        const total = await PaymentTransaction.countDocuments(filter);

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user._id,
            'TRANSACTIONS_VIEW',
            { 
                filters: filter,
                pagination: { page, limit },
                totalResults: total
            },
            'SUCCESS',
            req
        );

        res.status(200).json({
            status: 'success',
            data: {
                transactions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching payment transactions:', error);
        next(new AppError('Không thể lấy danh sách giao dịch', 500));
    }
};

/**
 * @desc    Lấy chi tiết một giao dịch thanh toán
 * @route   GET /api/admin/transactions/:id
 * @access  Private (Admin/SuperAdmin)
 */
export const getPaymentTransactionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const transaction = await PaymentTransaction.findById(id)
            .populate('userId', 'firstName lastName email role phone createdAt')
            .populate('processedBy', 'firstName lastName email role');

        if (!transaction) {
            return next(new AppError('Không tìm thấy giao dịch', 404));
        }

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user._id,
            'TRANSACTION_VIEW',
            { transactionId: id },
            'SUCCESS',
            req
        );

        res.status(200).json({
            status: 'success',
            data: {
                transaction
            }
        });
    } catch (error) {
        logger.error('Error fetching payment transaction:', error);
        next(new AppError('Không thể lấy chi tiết giao dịch', 500));
    }
};

/**
 * @desc    Cập nhật trạng thái giao dịch
 * @route   PATCH /api/admin/transactions/:id/status
 * @access  Private (Admin/SuperAdmin)
 */
export const updateTransactionStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const transaction = await PaymentTransaction.findById(id);
        if (!transaction) {
            return next(new AppError('Không tìm thấy giao dịch', 404));
        }

        const oldStatus = transaction.status;
        
        // Update transaction
        transaction.status = status;
        transaction.processedBy = req.user._id;
        transaction.processedAt = new Date();
        
        if (notes) {
            transaction.notes = (transaction.notes || '') + `\n[${new Date().toISOString()}] ${notes}`;
        }

        await transaction.save();

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user._id,
            'TRANSACTION_STATUS_UPDATE',
            { 
                transactionId: id,
                oldStatus,
                newStatus: status,
                notes
            },
            'SUCCESS',
            req
        );

        res.status(200).json({
            status: 'success',
            message: 'Cập nhật trạng thái giao dịch thành công',
            data: {
                transaction
            }
        });
    } catch (error) {
        logger.error('Error updating transaction status:', error);
        next(new AppError('Không thể cập nhật trạng thái giao dịch', 500));
    }
};

/**
 * @desc    Lấy thống kê giao dịch thanh toán
 * @route   GET /api/admin/transactions/stats
 * @access  Private (Admin/SuperAdmin)
 */
export const getPaymentTransactionStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // Get basic stats
        const stats = await PaymentTransaction.getTransactionStats({ startDate, endDate });
        
        // Get stats by status
        const statusStats = await PaymentTransaction.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Get stats by plan type
        const planStats = await PaymentTransaction.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$planType',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Get stats by payment method
        const paymentMethodStats = await PaymentTransaction.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user._id,
            'TRANSACTION_STATS_VIEW',
            { dateRange: { startDate, endDate } },
            'SUCCESS',
            req
        );

        res.status(200).json({
            status: 'success',
            data: {
                overview: stats[0] || {
                    totalTransactions: 0,
                    totalAmount: 0,
                    completedTransactions: 0,
                    completedAmount: 0,
                    pendingTransactions: 0,
                    failedTransactions: 0
                },
                byStatus: statusStats,
                byPlanType: planStats,
                byPaymentMethod: paymentMethodStats
            }
        });
    } catch (error) {
        logger.error('Error fetching payment transaction stats:', error);
        next(new AppError('Không thể lấy thống kê giao dịch', 500));
    }
};

/**
 * @desc    Tạo giao dịch mẫu (cho development/testing)
 * @route   POST /api/admin/transactions/create-sample
 * @access  Private (SuperAdmin only)
 */
export const createSampleTransactions = async (req, res, next) => {
    try {
        // Chỉ cho phép SuperAdmin tạo dữ liệu mẫu
        if (req.user.role !== 'superadmin') {
            return next(new AppError('Chỉ SuperAdmin mới có thể tạo dữ liệu mẫu', 403));
        }

        // Get some users to assign transactions to
        const users = await User.find({ role: 'user' }).limit(5);
        if (users.length === 0) {
            return next(new AppError('Không có user nào để tạo giao dịch mẫu', 400));
        }

        const sampleTransactions = [];
        const statuses = ['completed', 'pending', 'failed', 'processing'];
        const planTypes = ['basic', 'standard', 'premium'];
        const paymentMethods = ['credit_card', 'bank_transfer', 'e_wallet'];
        const paymentGateways = ['vnpay', 'momo', 'zalopay'];

        for (let i = 0; i < 20; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const planType = planTypes[Math.floor(Math.random() * planTypes.length)];
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            const paymentGateway = paymentGateways[Math.floor(Math.random() * paymentGateways.length)];

            const transaction = {
                userId: user._id,
                transactionId: `TXN${Date.now()}${i}`,
                type: 'subscription',
                status,
                planType,
                planName: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
                amount: planType === 'basic' ? 99000 : planType === 'standard' ? 199000 : 299000,
                currency: 'VND',
                paymentMethod,
                paymentGateway,
                gatewayTransactionId: `GW${Date.now()}${i}`,
                description: `Subscription to ${planType} plan`,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
            };

            sampleTransactions.push(transaction);
        }

        const createdTransactions = await PaymentTransaction.insertMany(sampleTransactions);

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user._id,
            'SAMPLE_TRANSACTIONS_CREATE',
            { count: createdTransactions.length },
            'SUCCESS',
            req
        );

        res.status(201).json({
            status: 'success',
            message: `Đã tạo ${createdTransactions.length} giao dịch mẫu thành công`,
            data: {
                count: createdTransactions.length,
                transactions: createdTransactions
            }
        });
    } catch (error) {
        logger.error('Error creating sample transactions:', error);
        next(new AppError('Không thể tạo giao dịch mẫu', 500));
    }
};

import Income from '../models/incomeModel.js';
import Expense from '../models/expenseModel.js';
import Loan from '../models/loanModel.js';
import Investment from '../models/investmentModel.js';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import logger from '../utils/logger.js';
import AdminActivityLogger from '../utils/adminActivityLogger.js';

/**
 * Lấy danh sách tất cả giao dịch với phân trang và filter
 */
export const getAllTransactions = catchAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        search,
        type,
        dateRange,
        userId,
        amountRange,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build date filter
    let dateFilter = {};
    if (dateRange && dateRange !== 'all') {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));

        switch (dateRange) {
            case 'today':
                dateFilter = { createdAt: { $gte: startOfDay } };
                break;
            case 'week':
                const startOfWeek = new Date(startOfDay);
                startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
                dateFilter = { createdAt: { $gte: startOfWeek } };
                break;
            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = { createdAt: { $gte: startOfMonth } };
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
                dateFilter = { createdAt: { $gte: startOfQuarter } };
                break;
            case 'year':
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                dateFilter = { createdAt: { $gte: startOfYear } };
                break;
        }
    }

    // Build amount filter
    let amountFilter = {};
    if (amountRange && amountRange !== 'all') {
        switch (amountRange) {
            case 'under-100k':
                amountFilter = { amount: { $lt: 100000 } };
                break;
            case '100k-500k':
                amountFilter = { amount: { $gte: 100000, $lt: 500000 } };
                break;
            case '500k-1m':
                amountFilter = { amount: { $gte: 500000, $lt: 1000000 } };
                break;
            case '1m-5m':
                amountFilter = { amount: { $gte: 1000000, $lt: 5000000 } };
                break;
            case 'over-5m':
                amountFilter = { amount: { $gte: 5000000 } };
                break;
        }
    }

    // Build search filter
    let searchFilter = {};
    if (search) {
        searchFilter = {
            $or: [
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ]
        };
    }

    // Build user filter
    let userFilterQuery = {};
    if (userId) {
        userFilterQuery = { userId: userId };
    }

    // Combine all filters
    const baseFilter = {
        ...dateFilter,
        ...amountFilter,
        ...searchFilter,
        ...userFilterQuery
    };

    let allTransactions = [];
    let totalStats = {
        totalIncome: 0,
        totalExpense: 0,
        totalLoans: 0,
        totalInvestments: 0,
        transactionCount: 0
    };

    // Fetch data from different collections based on type filter
    const collections = [];
    if (!type || type === 'all' || type === 'income') {
        collections.push({ model: Income, type: 'income' });
    }
    if (!type || type === 'all' || type === 'expense') {
        collections.push({ model: Expense, type: 'expense' });
    }
    if (!type || type === 'all' || type === 'loan') {
        collections.push({ model: Loan, type: 'loan' });
    }
    if (!type || type === 'all' || type === 'investment') {
        collections.push({ model: Investment, type: 'investment' });
    }

    // Fetch transactions from each collection
    for (const collection of collections) {
        const transactions = await collection.model
            .find(baseFilter)
            .populate('userId', 'firstName lastName email')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .lean();

        // Add type field and format data
        const formattedTransactions = transactions.map(transaction => ({
            id: transaction._id.toString(),
            type: collection.type,
            amount: transaction.amount,
            description: transaction.description || transaction.title || 'Không có mô tả',
            category: transaction.category || transaction.type || 'Khác',
            date: transaction.date || transaction.createdAt,
            userId: transaction.userId ? transaction.userId._id.toString() : 'Không xác định',
            userName: transaction.userId ? `${transaction.userId.firstName || ''} ${transaction.userId.lastName || ''}`.trim() : 'Không xác định',
            userEmail: transaction.userId ? transaction.userId.email : 'Không xác định',
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt
        }));

        allTransactions = allTransactions.concat(formattedTransactions);

        // Calculate stats
        const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        switch (collection.type) {
            case 'income':
                totalStats.totalIncome += totalAmount;
                break;
            case 'expense':
                totalStats.totalExpense += totalAmount;
                break;
            case 'loan':
                totalStats.totalLoans += totalAmount;
                break;
            case 'investment':
                totalStats.totalInvestments += totalAmount;
                break;
        }
        totalStats.transactionCount += transactions.length;
    }

    // Sort all transactions
    allTransactions.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (sortOrder === 'desc') {
            return new Date(bValue) - new Date(aValue);
        } else {
            return new Date(aValue) - new Date(bValue);
        }
    });

    // Apply pagination
    const paginatedTransactions = allTransactions.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(allTransactions.length / limitNum);

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'TRANSACTIONS_VIEW',
        {
            filters: { type, dateRange, search, userId, amountRange },
            page: pageNum,
            limit: limitNum
        },
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        data: {
            transactions: paginatedTransactions,
            stats: totalStats
        },
        pagination: {
            page: pageNum,
            totalPages,
            total: allTransactions.length,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        }
    });
});

/**
 * Lấy chi tiết một giao dịch
 */
export const getTransactionById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { type } = req.query;

    let transaction = null;
    let transactionType = type;

    // If type is not specified, search in all collections
    if (!transactionType) {
        const collections = [
            { model: Income, type: 'income' },
            { model: Expense, type: 'expense' },
            { model: Loan, type: 'loan' },
            { model: Investment, type: 'investment' }
        ];

        for (const collection of collections) {
            const found = await collection.model
                .findById(id)
                .populate('userId', 'firstName lastName email')
                .lean();

            if (found) {
                transaction = found;
                transactionType = collection.type;
                break;
            }
        }
    } else {
        // Search in specific collection
        const modelMap = {
            income: Income,
            expense: Expense,
            loan: Loan,
            investment: Investment
        };

        const model = modelMap[transactionType];
        if (model) {
            transaction = await model
                .findById(id)
                .populate('userId', 'firstName lastName email')
                .lean();
        }
    }

    if (!transaction) {
        return next(new AppError('Không tìm thấy giao dịch', 404));
    }

    // Format response
    const formattedTransaction = {
        id: transaction._id.toString(),
        type: transactionType,
        amount: transaction.amount,
        description: transaction.description || transaction.title || 'Không có mô tả',
        category: transaction.category || transaction.type || 'Khác',
        date: transaction.date || transaction.createdAt,
        userId: transaction.userId ? transaction.userId._id.toString() : 'Không xác định',
        userName: transaction.userId ? `${transaction.userId.firstName || ''} ${transaction.userId.lastName || ''}`.trim() : 'Không xác định',
        userEmail: transaction.userId ? transaction.userId.email : 'Không xác định',
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        ...transaction // Include all other fields
    };

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'TRANSACTION_VIEW',
        { transactionId: id, transactionType },
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        data: {
            transaction: formattedTransaction
        }
    });
});

/**
 * Cập nhật giao dịch
 */
export const updateTransaction = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { type } = req.query;
    const updateData = req.body;

    if (!type) {
        return next(new AppError('Vui lòng chỉ định loại giao dịch', 400));
    }

    const modelMap = {
        income: Income,
        expense: Expense,
        loan: Loan,
        investment: Investment
    };

    const model = modelMap[type];
    if (!model) {
        return next(new AppError('Loại giao dịch không hợp lệ', 400));
    }

    const transaction = await model.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');

    if (!transaction) {
        return next(new AppError('Không tìm thấy giao dịch', 404));
    }

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'TRANSACTION_UPDATE',
        {
            transactionId: id,
            transactionType: type,
            updateData: Object.keys(updateData)
        },
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        data: {
            transaction
        }
    });
});

/**
 * Xóa giao dịch
 */
export const deleteTransaction = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { type } = req.query;

    if (!type) {
        return next(new AppError('Vui lòng chỉ định loại giao dịch', 400));
    }

    const modelMap = {
        income: Income,
        expense: Expense,
        loan: Loan,
        investment: Investment
    };

    const model = modelMap[type];
    if (!model) {
        return next(new AppError('Loại giao dịch không hợp lệ', 400));
    }

    const transaction = await model.findByIdAndDelete(id);

    if (!transaction) {
        return next(new AppError('Không tìm thấy giao dịch', 404));
    }

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'TRANSACTION_DELETE',
        {
            transactionId: id,
            transactionType: type,
            deletedData: {
                amount: transaction.amount,
                description: transaction.description || transaction.title
            }
        },
        'SUCCESS',
        req
    );

    res.status(204).json({
        status: 'success',
        data: null
    });
});

/**
 * Xuất dữ liệu giao dịch ra CSV
 */
export const exportTransactions = catchAsync(async (req, res, next) => {
    const {
        search,
        type,
        dateRange,
        userId,
        amountRange
    } = req.query;

    // Build filters (same logic as getAllTransactions)
    let dateFilter = {};
    if (dateRange && dateRange !== 'all') {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));

        switch (dateRange) {
            case 'today':
                dateFilter = { createdAt: { $gte: startOfDay } };
                break;
            case 'week':
                const startOfWeek = new Date(startOfDay);
                startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
                dateFilter = { createdAt: { $gte: startOfWeek } };
                break;
            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = { createdAt: { $gte: startOfMonth } };
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
                dateFilter = { createdAt: { $gte: startOfQuarter } };
                break;
            case 'year':
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                dateFilter = { createdAt: { $gte: startOfYear } };
                break;
        }
    }

    let amountFilter = {};
    if (amountRange && amountRange !== 'all') {
        switch (amountRange) {
            case 'under-100k':
                amountFilter = { amount: { $lt: 100000 } };
                break;
            case '100k-500k':
                amountFilter = { amount: { $gte: 100000, $lt: 500000 } };
                break;
            case '500k-1m':
                amountFilter = { amount: { $gte: 500000, $lt: 1000000 } };
                break;
            case '1m-5m':
                amountFilter = { amount: { $gte: 1000000, $lt: 5000000 } };
                break;
            case 'over-5m':
                amountFilter = { amount: { $gte: 5000000 } };
                break;
        }
    }

    let searchFilter = {};
    if (search) {
        searchFilter = {
            $or: [
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ]
        };
    }

    let userFilterQuery = {};
    if (userId) {
        userFilterQuery = { userId: userId };
    }

    const baseFilter = {
        ...dateFilter,
        ...amountFilter,
        ...searchFilter,
        ...userFilterQuery
    };

    let allTransactions = [];

    // Fetch data from collections
    const collections = [];
    if (!type || type === 'all' || type === 'income') {
        collections.push({ model: Income, type: 'income' });
    }
    if (!type || type === 'all' || type === 'expense') {
        collections.push({ model: Expense, type: 'expense' });
    }
    if (!type || type === 'all' || type === 'loan') {
        collections.push({ model: Loan, type: 'loan' });
    }
    if (!type || type === 'all' || type === 'investment') {
        collections.push({ model: Investment, type: 'investment' });
    }

    for (const collection of collections) {
        const transactions = await collection.model
            .find(baseFilter)
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean();

        const formattedTransactions = transactions.map(transaction => ({
            type: collection.type,
            amount: transaction.amount,
            description: transaction.description || transaction.title || 'Không có mô tả',
            category: transaction.category || transaction.type || 'Khác',
            date: transaction.date || transaction.createdAt,
            userName: transaction.userId ? `${transaction.userId.firstName || ''} ${transaction.userId.lastName || ''}`.trim() : 'Không xác định',
            userEmail: transaction.userId ? transaction.userId.email : 'Không xác định',
            createdAt: transaction.createdAt
        }));

        allTransactions = allTransactions.concat(formattedTransactions);
    }

    // Sort by creation date
    allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Generate CSV
    const csvHeader = 'Loại,Số tiền,Mô tả,Danh mục,Ngày giao dịch,Tên người dùng,Email,Ngày tạo\n';
    const csvRows = allTransactions.map(transaction => {
        const typeMap = {
            income: 'Thu nhập',
            expense: 'Chi tiêu',
            loan: 'Khoản vay',
            investment: 'Đầu tư'
        };

        return [
            typeMap[transaction.type] || transaction.type,
            transaction.amount,
            `"${transaction.description.replace(/"/g, '""')}"`,
            `"${transaction.category.replace(/"/g, '""')}"`,
            new Date(transaction.date).toLocaleDateString('vi-VN'),
            `"${transaction.userName.replace(/"/g, '""')}"`,
            transaction.userEmail,
            new Date(transaction.createdAt).toLocaleString('vi-VN')
        ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'TRANSACTIONS_EXPORT',
        {
            filters: { type, dateRange, search, userId, amountRange },
            exportedCount: allTransactions.length
        },
        'SUCCESS',
        req
    );

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${new Date().toISOString().split('T')[0]}.csv`);

    // Add BOM for proper UTF-8 encoding in Excel
    res.write('\uFEFF');
    res.end(csvContent);
});

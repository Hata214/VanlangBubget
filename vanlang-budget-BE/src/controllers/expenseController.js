import Expense from '../models/expenseModel.js';
import Budget from '../models/budgetModel.js';
import Notification from '../models/Notification.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import mongoose from 'mongoose';
import socketManager from '../utils/socketManager.js';
import ExpenseCategory from '../models/expenseCategoryModel.js';
import { formatCategoryName } from '../utils/helpers.js';

/**
 * @desc    Lấy tất cả chi tiêu của người dùng
 * @route   GET /api/expenses
 * @access  Private
 */
export const getExpenses = async (req, res, next) => {
    try {
        console.log('getExpenses - User:', req.user._id.toString());

        // Lọc các query params cho phép - bỏ qua các params không liên quan
        const { startDate, endDate, category, categories, group, limit = 50, page = 1 } = req.query;

        // Loại bỏ các query params không an toàn hoặc không cần thiết
        console.log('getExpenses - Original query params:', JSON.stringify(req.query));
        console.log('getExpenses - Filtered query params:', JSON.stringify({ startDate, endDate, category, categories, group, limit, page }));

        // Xây dựng query filter
        const filter = { userId: req.user._id };
        console.log('getExpenses - Filter:', JSON.stringify(filter));

        // Lọc theo ngày
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        // Lọc theo danh mục và nhóm danh mục
        if (group) {
            // Nếu lọc theo nhóm, cần tìm tất cả danh mục thuộc nhóm đó
            const groupCategories = await ExpenseCategory.find({
                userId: req.user._id,
                group: group
            }).select('_id');

            if (groupCategories && groupCategories.length > 0) {
                // Lấy mảng ID của các danh mục thuộc nhóm
                const groupCategoryIds = groupCategories.map(cat => cat._id);
                filter.category = { $in: groupCategoryIds };
            }
        }
        // Hỗ trợ lọc theo danh mục cũ (tương thích ngược)
        else if (category) {
            // Tìm danh mục được chọn
            const selectedCategory = await ExpenseCategory.findById(category);

            if (selectedCategory) {
                // Nếu danh mục này thuộc một nhóm nào đó
                if (selectedCategory.group) {
                    // Tìm tất cả danh mục cùng nhóm
                    const relatedCategories = await ExpenseCategory.find({
                        userId: req.user._id,
                        group: selectedCategory.group
                    }).select('_id');

                    if (relatedCategories && relatedCategories.length > 0) {
                        const relatedCategoryIds = relatedCategories.map(cat => cat._id);
                        filter.category = { $in: relatedCategoryIds };
                    } else {
                        filter.category = category;
                    }
                } else {
                    filter.category = category;
                }
            } else {
                filter.category = category;
            }
        }
        // Lọc theo nhiều danh mục
        else if (categories) {
            // Nếu categories là một mảng (từ query ?categories=A&categories=B)
            if (Array.isArray(categories)) {
                filter.category = { $in: categories };
            }
            // Nếu categories là một chuỗi phân tách bởi dấu phẩy (từ query ?categories=A,B,C)
            else if (typeof categories === 'string' && categories.includes(',')) {
                filter.category = { $in: categories.split(',') };
            }
            // Nếu categories là một chuỗi đơn (từ query ?categories=A)
            else {
                filter.category = categories;
            }
        }

        // Tính pagination
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        // Lấy chi tiêu và đếm tổng
        const [expenses, total] = await Promise.all([
            Expense.find(filter)
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit, 10))
                .populate('category', 'name icon color group'), // Thêm populate để lấy thông tin danh mục
            Expense.countDocuments(filter),
        ]);

        console.log(`getExpenses - Found ${expenses.length} expenses`);
        console.log('getExpenses - Applied filter:', JSON.stringify(filter));

        // Biến đổi dữ liệu để phù hợp với format frontend
        const formattedExpenses = expenses.map(expense => {
            // Chuyển đổi mongoose document thành JavaScript object
            const expenseObj = expense.toObject();

            // Đảm bảo _id được chuyển thành id
            expenseObj.id = expenseObj._id.toString();

            // Thêm thông tin về group của danh mục (nếu có)
            if (expense.category && typeof expense.category === 'object') {
                expenseObj.categoryGroup = expense.category.group;
                // Sử dụng hàm helper để định dạng tên danh mục
                expenseObj.category = formatCategoryName(expense.category);
            }

            return expenseObj;
        });

        // Log dữ liệu đã được format
        console.log(`getExpenses - Formatted ${formattedExpenses.length} expenses for frontend`);

        // Tính tổng chi tiêu từ TẤT CẢ records (không chỉ từ page hiện tại)
        const totalAmountResult = await Expense.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;
        console.log(`getExpenses - Total expense amount (ALL records): ${totalAmount}`);

        res.status(200).json({
            status: 'success',
            results: formattedExpenses.length,
            total,
            totalAmount,
            page: parseInt(page, 10),
            pages: Math.ceil(total / parseInt(limit, 10)),
            data: formattedExpenses,
        });
    } catch (error) {
        console.error('getExpenses error:', error);
        next(error);
    }
};

/**
 * @desc    Lấy một chi tiêu theo ID
 * @route   GET /api/expenses/:id
 * @access  Private
 */
export const getExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return next(new AppError('Không tìm thấy chi tiêu', 404));
        }

        // Log để debug
        console.log('getExpense - Expense userId:', expense.userId.toString());
        console.log('getExpense - User ID:', req.user._id.toString());
        console.log('getExpense - User role:', req.user.role);

        // Kiểm tra quyền sở hữu - chuyển đổi cả hai giá trị thành string để so sánh
        if (expense.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền truy cập chi tiêu này', 403));
        }

        res.status(200).json({
            status: 'success',
            data: expense,
        });
    } catch (error) {
        console.error('getExpense error:', error);
        next(error);
    }
};

/**
 * @desc    Tạo chi tiêu mới
 * @route   POST /api/expenses
 * @access  Private
 */
export const createExpense = async (req, res, next) => {
    try {
        let { amount, description, category, date, location, attachments } = req.body;

        console.log('createExpense - User ID:', req.user._id.toString());
        console.log('createExpense - Request body:', req.body);

        // Xử lý location
        if (location) {
            // Đảm bảo location luôn có đủ các trường
            location = {
                lat: location.lat || 0,
                lng: location.lng || 0,
                address: location.address
            };
        }

        // Tạo chi tiêu mới
        const newExpense = await Expense.create({
            userId: req.user._id,
            amount,
            description,
            category,
            date: date ? new Date(date) : new Date(),
            location,
            attachments,
        });

        console.log('createExpense - Created new expense:', newExpense);

        // Tạo thông báo bằng phương thức từ notificationModel
        const notification = await Notification.createExpenseNotification(newExpense);

        console.log('Đã tạo thông báo chi tiêu mới:', notification);

        // Gửi thông báo qua socket
        if (req.socketManager) {
            // Sử dụng req.socketManager nếu có
            console.log('Gửi expense:create qua req.socketManager');
            req.socketManager.emitExpenseCreate(req.user._id, newExpense);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            req.socketManager.sendNotification(req.user._id, notification);
            req.socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản chi tiêu',
                notification
            });
        } else if (socketManager) {
            // Fallback vào socketManager import nếu không có req.socketManager
            console.log('Gửi expense:create qua socketManager toàn cục');
            socketManager.emitExpenseCreate(req.user._id, newExpense);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            socketManager.sendNotification(req.user._id, notification);
            socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản chi tiêu',
                notification
            });
        }

        res.status(201).json({
            status: 'success',
            data: newExpense,
        });
    } catch (error) {
        console.error('Error creating expense:', error);
        next(error);
    }
};

/**
 * @desc    Cập nhật chi tiêu
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
export const updateExpense = async (req, res, next) => {
    try {
        let { amount, description, category, date, location, attachments } = req.body;

        console.log('updateExpense - Request body:', req.body);

        // Tìm chi tiêu
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return next(new AppError('Không tìm thấy chi tiêu', 404));
        }

        // Kiểm tra quyền sở hữu
        if (expense.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền cập nhật chi tiêu này', 403));
        }

        // Xử lý location
        if (location) {
            // Đảm bảo location luôn có đủ các trường
            location = {
                lat: location.lat || 0,
                lng: location.lng || 0,
                address: location.address
            };
        }

        // Cập nhật trường cho phép
        if (amount !== undefined) expense.amount = amount;
        if (description) expense.description = description;
        if (category) expense.category = category;
        if (date) expense.date = new Date(date);
        if (location !== undefined) expense.location = location;
        if (attachments) expense.attachments = attachments;

        // Lưu thay đổi
        await expense.save();

        console.log('updateExpense - Updated expense:', expense);

        // Tạo thông báo bằng phương thức chuyên dụng để đảm bảo định dạng đúng
        const notification = await Notification.createSystemNotification(
            expense.userId.toString(),
            'Cập nhật chi tiêu',
            `Bạn đã cập nhật khoản chi tiêu: ${expense.description || expense.category}`,
            'expense',
            `/expenses?highlight=${expense._id}`,
            { model: 'Expense', id: expense._id },
            expense._id.toString()
        );

        console.log('Đã tạo thông báo cập nhật chi tiêu:', notification);

        // Kiểm tra cả socketManager import và req.socketManager
        if (req.socketManager) {
            // Sử dụng req.socketManager nếu có
            console.log('Gửi expense:update qua req.socketManager');
            req.socketManager.emitExpenseUpdate(req.user._id, expense);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            req.socketManager.sendNotification(req.user._id, notification);
            req.socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản chi tiêu',
                notification
            });
        } else if (socketManager) {
            // Fallback vào socketManager import nếu không có req.socketManager
            console.log('Gửi expense:update qua socketManager toàn cục');
            socketManager.emitExpenseUpdate(req.user._id, expense);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            socketManager.sendNotification(req.user._id, notification);
            socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản chi tiêu',
                notification
            });
        }

        res.status(200).json({
            status: 'success',
            data: expense,
        });
    } catch (error) {
        console.error('Error updating expense:', error);
        next(error);
    }
};

/**
 * @desc    Xóa chi tiêu
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
export const deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!expense) {
            return next(new AppError('Không tìm thấy khoản chi tiêu này', 404));
        }

        // Chuẩn bị thông tin để gửi thông báo
        const expenseInfo = {
            id: expense._id,
            description: expense.description || expense.category
        };

        // Xóa chi tiêu
        await Expense.findByIdAndDelete(req.params.id);

        // Cập nhật ngân sách (nếu có)
        if (expense.category && expense.date) {
            const date = new Date(expense.date);
            try {
                await Budget.updateSpent(
                    req.user._id,
                    expense.category,
                    date.getMonth() + 1,
                    date.getFullYear(),
                    -expense.amount // Trừ đi số tiền của chi tiêu đã xóa
                );
            } catch (budgetError) {
                logger.error('Error updating budget after expense delete:', budgetError);
                // Không làm gián đoạn flow nếu cập nhật ngân sách thất bại
            }
        }

        // Tạo thông báo bằng phương thức chuyên dụng để đảm bảo định dạng đúng
        const notification = await Notification.createSystemNotification(
            req.user._id.toString(),
            'Xóa chi tiêu',
            `Bạn đã xóa khoản chi tiêu: ${expenseInfo.description}`,
            'expense',
            `/expenses`,
            { model: 'Expense', action: 'delete', id: expenseInfo.id },
            expenseInfo.id
        );

        console.log('Đã tạo thông báo xóa chi tiêu:', notification);

        // Gửi thông báo qua Socket.io
        // Kiểm tra cả socketManager import và req.socketManager
        if (req.socketManager && req.socketManager.emitExpenseDelete) {
            // Gửi sự kiện xóa chi tiêu
            console.log('Gửi expense:delete qua req.socketManager');
            req.socketManager.emitExpenseDelete(req.user._id, expenseInfo.id);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            req.socketManager.sendNotification(req.user._id, notification);
            req.socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản chi tiêu',
                notification
            });
        } else if (socketManager && socketManager.emitExpenseDelete) {
            // Fallback vào socketManager import nếu không có req.socketManager
            console.log('Gửi expense:delete qua socketManager toàn cục');
            socketManager.emitExpenseDelete(req.user._id, expenseInfo.id);

            // Gửi thông báo qua cả 2 cách để đảm bảo nhận được
            socketManager.sendNotification(req.user._id, notification);
            socketManager.to(req.user._id.toString()).emit('notification', {
                message: 'Bạn có thông báo mới về khoản chi tiêu',
                notification
            });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy tổng chi tiêu theo tháng
 * @route   GET /api/expenses/summary/monthly
 * @access  Private
 */
export const getMonthlyTotal = async (req, res, next) => {
    try {
        const { month, year } = req.query;

        // Kiểm tra tham số bắt buộc
        if (!month || !year) {
            return next(new AppError('Vui lòng cung cấp tháng và năm', 400));
        }

        // Chuyển đổi sang số
        const numMonth = parseInt(month, 10);
        const numYear = parseInt(year, 10);

        const startDate = new Date(numYear, numMonth - 1, 1);
        const endDate = new Date(numYear, numMonth, 0);

        const result = await Expense.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    date: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                },
            },
        ]);

        const total = result.length > 0 ? result[0].total : 0;

        res.status(200).json({
            status: 'success',
            data: {
                month: numMonth,
                year: numYear,
                total,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy tổng chi tiêu theo danh mục và tháng
 * @route   GET /api/expenses/summary/by-category
 * @access  Private
 */
export const getTotalByCategory = async (req, res, next) => {
    try {
        const { month, year } = req.query;

        // Kiểm tra tham số bắt buộc
        if (!month || !year) {
            return next(new AppError('Vui lòng cung cấp tháng và năm', 400));
        }

        // Chuyển đổi sang số
        const numMonth = parseInt(month, 10);
        const numYear = parseInt(year, 10);

        const startDate = new Date(numYear, numMonth - 1, 1);
        const endDate = new Date(numYear, numMonth, 0);

        const result = await Expense.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    date: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { total: -1 },
            },
            {
                $project: {
                    category: '$_id',
                    total: 1,
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        res.status(200).json({
            status: 'success',
            results: result.length,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
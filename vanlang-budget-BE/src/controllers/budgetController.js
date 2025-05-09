import Notification from '../models/Notification.js';
import Budget from '../models/budgetModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import budgetService from '../services/budget.service.js';
import socketManager from '../utils/socketManager.js';
import ExpenseCategory from '../models/expenseCategoryModel.js';
import { formatCategoryName } from '../utils/helpers.js';

/**
 * @desc    Lấy tất cả ngân sách của người dùng
 * @route   GET /api/budgets
 * @access  Private
 */
export const getBudgets = async (req, res, next) => {
    try {
        console.log('getBudgets - User:', req.user._id.toString());

        // Lọc các query params cho phép - bỏ qua các params không liên quan
        const { startDate, endDate, category, categories, group, limit = 50, page = 1 } = req.query;

        // Loại bỏ các query params không an toàn hoặc không cần thiết
        console.log('getBudgets - Original query params:', JSON.stringify(req.query));
        console.log('getBudgets - Filtered query params:', JSON.stringify({ startDate, endDate, category, categories, group, limit, page }));

        // Xây dựng query filter
        const filter = { userId: req.user._id };
        console.log('getBudgets - Filter:', JSON.stringify(filter));

        // Lọc theo ngày
        if (startDate || endDate) {
            // Ngân sách có khoảng thời gian bắt đầu và kết thúc, nên cần kiểm tra chồng chéo
            if (startDate) {
                // Lấy ngân sách mà ngày kết thúc >= startDate (có khoảng thời gian chồng chéo)
                filter.endDate = { $gte: new Date(startDate) };
            }
            if (endDate) {
                // Lấy ngân sách mà ngày bắt đầu <= endDate (có khoảng thời gian chồng chéo)
                filter.startDate = { $lte: new Date(endDate) };
            }
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

        // Lấy ngân sách và đếm tổng
        const [budgets, total] = await Promise.all([
            Budget.find(filter)
                .sort({ startDate: -1 })
                .skip(skip)
                .limit(parseInt(limit, 10))
                .populate('category', 'name icon color group'), // Thêm populate để lấy thông tin danh mục
            Budget.countDocuments(filter),
        ]);

        console.log(`getBudgets - Found ${budgets.length} budgets`);
        console.log('getBudgets - Applied filter:', JSON.stringify(filter));

        // Biến đổi dữ liệu để phù hợp với format frontend
        const formattedBudgets = budgets.map(budget => {
            // Chuyển đổi mongoose document thành JavaScript object
            const budgetObj = budget.toObject();

            // Đảm bảo _id được chuyển thành id
            budgetObj.id = budgetObj._id.toString();

            // Thêm thông tin về group của danh mục (nếu có)
            if (budget.category && typeof budget.category === 'object') {
                budgetObj.categoryGroup = budget.category.group;
                // Sử dụng hàm helper để định dạng tên danh mục
                budgetObj.category = formatCategoryName(budget.category);
            }

            return budgetObj;
        });

        // Log dữ liệu đã được format
        console.log(`getBudgets - Formatted ${formattedBudgets.length} budgets for frontend`);

        // Tính tổng số tiền ngân sách
        const totalAmount = formattedBudgets.reduce((total, budget) => total + budget.amount, 0);
        console.log(`getBudgets - Total budget amount: ${totalAmount}`);

        res.status(200).json({
            status: 'success',
            results: formattedBudgets.length,
            total,
            totalAmount,
            page: parseInt(page, 10),
            pages: Math.ceil(total / parseInt(limit, 10)),
            data: formattedBudgets,
        });
    } catch (error) {
        console.error('getBudgets error:', error);
        next(error);
    }
};

/**
 * @desc    Lấy một ngân sách theo ID
 * @route   GET /api/budgets/:id
 * @access  Private
 */
export const getBudget = async (req, res, next) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return next(new AppError('Không tìm thấy ngân sách', 404));
        }

        // Log để debug
        console.log('getBudget - Budget userId:', budget.userId.toString());
        console.log('getBudget - User ID:', req.user.id);
        console.log('getBudget - User role:', req.user.role);

        // Kiểm tra quyền sở hữu - chuyển đổi cả hai giá trị thành string để so sánh
        if (budget.userId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền truy cập ngân sách này', 403));
        }

        res.status(200).json({
            status: 'success',
            data: budget,
        });
    } catch (error) {
        console.error('getBudget error:', error);
        next(error);
    }
};

/**
 * @desc    Tạo ngân sách mới
 * @route   POST /api/budgets
 * @access  Private
 */
export const createBudget = async (req, res, next) => {
    try {
        const { category, amount, month, year } = req.body;

        // Tạo ngân sách mới
        const newBudget = await Budget.create({
            userId: req.user.id,
            category,
            amount,
            month,
            year,
            spent: 0,
        });

        // Tạo thông báo để gửi
        const notification = {
            userId: req.user.id,
            title: 'Ngân sách mới',
            message: `Bạn đã tạo ngân sách mới cho danh mục ${category} với số tiền ${amount} trong tháng ${month}/${year}`,
            type: 'budget',
            relatedId: newBudget._id
        };

        // Kiểm tra cả socketManager import và req.socketManager
        if (req.socketManager) {
            // Sử dụng req.socketManager nếu có
            req.socketManager.emitBudgetCreate(req.user.id, newBudget);
            req.socketManager.sendNotification(req.user.id, notification);
        } else if (socketManager) {
            // Fallback vào socketManager import nếu không có req.socketManager
            socketManager.emitBudgetCreate(req.user.id, newBudget);
            socketManager.sendNotification(req.user.id, notification);
        }

        res.status(201).json({
            status: 'success',
            data: newBudget,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cập nhật ngân sách
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
export const updateBudget = async (req, res, next) => {
    try {
        const { category, amount } = req.body;

        // Tìm ngân sách
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return next(new AppError('Không tìm thấy ngân sách', 404));
        }

        // Log để debug
        console.log('updateBudget - Budget userId:', budget.userId.toString());
        console.log('updateBudget - User ID:', req.user.id);
        console.log('updateBudget - User role:', req.user.role);

        // Kiểm tra quyền sở hữu - chuyển đổi cả hai giá trị thành string để so sánh
        if (budget.userId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền cập nhật ngân sách này', 403));
        }

        // Cập nhật trường cho phép
        if (category) budget.category = category;
        if (amount !== undefined) budget.amount = amount;

        // Lưu thay đổi
        await budget.save();

        // Kiểm tra xem cần tạo thông báo hay không
        const budgetAlert = await Notification.createBudgetAlert(budget);

        // Tạo thông báo để gửi
        const notification = {
            userId: req.user.id,
            title: 'Cập nhật ngân sách',
            message: `Bạn đã cập nhật ngân sách cho danh mục ${budget.category} trong tháng ${budget.month}/${budget.year}`,
            type: 'budget',
            relatedId: budget._id
        };

        // Kiểm tra cả socketManager import và req.socketManager
        if (req.socketManager) {
            // Sử dụng req.socketManager nếu có
            req.socketManager.emitBudgetUpdate(req.user.id, budget);
            req.socketManager.sendNotification(req.user.id, notification);

            // Nếu có cảnh báo ngân sách thì gửi thêm
            if (budgetAlert) {
                req.socketManager.sendNotification(req.user.id, budgetAlert);
            }
        } else if (socketManager) {
            // Fallback vào socketManager import nếu không có req.socketManager
            socketManager.emitBudgetUpdate(req.user.id, budget);
            socketManager.sendNotification(req.user.id, notification);

            // Nếu có cảnh báo ngân sách thì gửi thêm
            if (budgetAlert) {
                socketManager.sendNotification(req.user.id, budgetAlert);
            }
        }

        res.status(200).json({
            status: 'success',
            data: budget,
        });
    } catch (error) {
        console.error('updateBudget error:', error);
        next(error);
    }
};

/**
 * @desc    Xóa ngân sách
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
export const deleteBudget = async (req, res, next) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return next(new AppError('Không tìm thấy ngân sách', 404));
        }

        // Log để debug
        console.log('deleteBudget - Budget userId:', budget.userId.toString());
        console.log('deleteBudget - User ID:', req.user.id);
        console.log('deleteBudget - User role:', req.user.role);

        // Kiểm tra quyền sở hữu - chuyển đổi cả hai giá trị thành string để so sánh
        if (budget.userId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền xóa ngân sách này', 403));
        }

        // Nếu ngân sách đã có chi tiêu, không cho xóa
        if (budget.spent > 0) {
            return next(
                new AppError('Không thể xóa ngân sách đã có chi tiêu. Hãy cập nhật thay vì xóa', 400)
            );
        }

        // Lưu một số thông tin về ngân sách trước khi xóa
        const budgetInfo = {
            id: budget._id,
            category: budget.category,
            month: budget.month,
            year: budget.year
        };

        await budget.remove();

        // Tạo thông báo để gửi
        const notification = {
            userId: req.user.id,
            title: 'Xóa ngân sách',
            message: `Bạn đã xóa ngân sách cho danh mục ${budgetInfo.category} trong tháng ${budgetInfo.month}/${budgetInfo.year}`,
            type: 'budget'
        };

        // Kiểm tra cả socketManager import và req.socketManager
        if (req.socketManager) {
            // Sử dụng req.socketManager nếu có
            req.socketManager.emitBudgetDelete(req.user.id, budgetInfo.id);
            req.socketManager.sendNotification(req.user.id, notification);
        } else if (socketManager) {
            // Fallback vào socketManager import nếu không có req.socketManager
            socketManager.emitBudgetDelete(req.user.id, budgetInfo.id);
            socketManager.sendNotification(req.user.id, notification);
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        console.error('deleteBudget error:', error);
        next(error);
    }
};

/**
 * @desc    Lấy tất cả ngân sách theo danh mục
 * @route   GET /api/budgets/category/:category
 * @access  Private
 */
export const getBudgetsByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;
        const { month, year, categories } = req.query;

        // Kiểm tra tham số bắt buộc
        if (!month || !year) {
            return next(new AppError('Vui lòng cung cấp tháng và năm', 400));
        }

        // Chuyển đổi sang số
        const numMonth = parseInt(month, 10);
        const numYear = parseInt(year, 10);

        // Xây dựng filter
        const filter = {
            userId: req.user.id,
            month: numMonth,
            year: numYear
        };

        // Ưu tiên sử dụng tham số query categories nếu có, nếu không thì dùng param category
        if (categories) {
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
        } else {
            // Sử dụng category từ params nếu không có categories trong query
            filter.category = category;
        }

        console.log('getBudgetsByCategory - Filter:', JSON.stringify(filter));

        // Lấy ngân sách theo danh mục
        const budgets = await Budget.find(filter);

        res.status(200).json({
            status: 'success',
            results: budgets.length,
            data: budgets,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy thống kê ngân sách theo tháng và năm
 * @route   GET /api/budgets/statistics
 * @access  Private
 */
export const getBudgetStatistics = async (req, res, next) => {
    try {
        const { month, year } = req.query;

        // Chuyển đổi sang số
        const numMonth = parseInt(month, 10);
        const numYear = parseInt(year, 10);

        // Lấy tất cả ngân sách của tháng
        const budgets = await Budget.getMonthlyBudgets(req.user.id, numMonth, numYear);

        // Tính tổng ngân sách, tổng chi tiêu và các thông số khác
        const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
        const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
        const remaining = totalBudget - totalSpent;
        const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        // Phân loại các ngân sách theo trạng thái
        const categorizedBudgets = {
            safe: [],     // Dưới 70%
            warning: [],  // 70-90%
            danger: [],   // 90-100%
            exceeded: [], // Trên 100%
        };

        budgets.forEach(budget => {
            const percentage = budget.percentage;

            if (percentage > 100) {
                categorizedBudgets.exceeded.push(budget);
            } else if (percentage >= 90) {
                categorizedBudgets.danger.push(budget);
            } else if (percentage >= 70) {
                categorizedBudgets.warning.push(budget);
            } else {
                categorizedBudgets.safe.push(budget);
            }
        });

        // Thống kê theo danh mục
        const categoryStats = {};
        budgets.forEach(budget => {
            if (!categoryStats[budget.category]) {
                categoryStats[budget.category] = {
                    totalAmount: 0,
                    totalSpent: 0,
                    percentage: 0,
                    remaining: 0
                };
            }

            categoryStats[budget.category].totalAmount += budget.amount;
            categoryStats[budget.category].totalSpent += budget.spent;
        });

        // Tính toán thêm các thống kê cho mỗi danh mục
        Object.keys(categoryStats).forEach(category => {
            const stats = categoryStats[category];
            stats.remaining = stats.totalAmount - stats.totalSpent;
            stats.percentage = stats.totalAmount > 0
                ? (stats.totalSpent / stats.totalAmount) * 100
                : 0;
        });

        res.status(200).json({
            status: 'success',
            data: {
                month: numMonth,
                year: numYear,
                budgetCount: budgets.length,
                totalBudget,
                totalSpent,
                remaining,
                spentPercentage,
                categorizedBudgets,
                categoryStats
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy tất cả ngân sách của người dùng theo tháng
 * @route   GET /api/budgets/monthly
 * @access  Private
 */
export const getMonthlyBudgets = async (req, res, next) => {
    try {
        const { month, year, category, categories, group } = req.query;

        // Kiểm tra tham số bắt buộc
        if (!month || !year) {
            return next(new AppError('Vui lòng cung cấp tháng và năm', 400));
        }

        // Chuyển đổi sang số
        const numMonth = parseInt(month, 10);
        const numYear = parseInt(year, 10);

        // Validate tham số
        if (numMonth < 1 || numMonth > 12) {
            return next(new AppError('Tháng phải từ 1 đến 12', 400));
        }

        if (numYear < 2000) {
            return next(new AppError('Năm phải từ 2000 trở lên', 400));
        }

        // Xây dựng filter
        const filter = {
            userId: req.user._id,
            month: numMonth,
            year: numYear
        };

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

        console.log('getMonthlyBudgets - Filter:', JSON.stringify(filter));

        // Lấy ngân sách
        let budgets;
        if (category || categories || group) {
            // Nếu có lọc theo danh mục, sử dụng find thay vì method getMonthlyBudgets
            budgets = await Budget.find(filter)
                .sort({ category: 1 })
                .populate('category', 'name icon color group');
        } else {
            // Nếu không lọc danh mục, sử dụng method mặc định
            budgets = await Budget.getMonthlyBudgets(req.user._id, numMonth, numYear);
        }

        // Biến đổi dữ liệu để phù hợp với format frontend
        const formattedBudgets = budgets.map(budget => {
            // Chuyển đổi mongoose document thành JavaScript object
            const budgetObj = budget.toObject();

            // Đảm bảo _id được chuyển thành id
            budgetObj.id = budgetObj._id.toString();

            // Thêm thông tin về group của danh mục (nếu có)
            if (budget.category && typeof budget.category === 'object') {
                budgetObj.categoryGroup = budget.category.group;
                // Sử dụng hàm helper để định dạng tên danh mục
                budgetObj.category = formatCategoryName(budget.category);
            }

            return budgetObj;
        });

        // Tính tổng số tiền ngân sách
        const totalAmount = formattedBudgets.reduce((total, budget) => total + budget.amount, 0);

        res.status(200).json({
            status: 'success',
            results: formattedBudgets.length,
            totalAmount,
            data: formattedBudgets,
        });
    } catch (error) {
        console.error('getMonthlyBudgets error:', error);
        next(error);
    }
};

/**
 * Controller cho quản lý ngân sách
 */
const budgetController = {
    // Tham chiếu đến service để dễ dàng mock khi test
    budgetService,

    /**
     * Lấy tất cả ngân sách
     * @param {Object} req - Express Request object
     * @param {Object} res - Express Response object
     * @param {Function} next - Express Next function
     */
    async getBudgets(req, res, next) {
        try {
            const budgets = await budgetService.getBudgets();
            res.status(200).json({
                success: true,
                count: budgets.length,
                data: budgets
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Lấy ngân sách theo ID
     * @param {Object} req - Express Request object
     * @param {Object} res - Express Response object
     * @param {Function} next - Express Next function
     */
    async getBudgetById(req, res, next) {
        try {
            const budget = await budgetService.getBudgetById(req.params.id);
            if (!budget) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy ngân sách'
                });
            }

            res.status(200).json({
                success: true,
                data: budget
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Tạo ngân sách mới
     * @param {Object} req - Express Request object
     * @param {Object} res - Express Response object
     * @param {Function} next - Express Next function
     */
    async createBudget(req, res, next) {
        try {
            // Gán user ID từ req.user (được đặt bởi auth middleware)
            const budgetData = {
                ...req.body,
                user: req.user.id
            };

            const budget = await budgetService.createBudget(budgetData);

            res.status(201).json({
                success: true,
                data: budget
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Cập nhật ngân sách
     * @param {Object} req - Express Request object
     * @param {Object} res - Express Response object
     * @param {Function} next - Express Next function
     */
    async updateBudget(req, res, next) {
        try {
            const budget = await budgetService.updateBudget(req.params.id, req.body);
            if (!budget) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy ngân sách'
                });
            }

            res.status(200).json({
                success: true,
                data: budget
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Xóa ngân sách
     * @param {Object} req - Express Request object
     * @param {Object} res - Express Response object
     * @param {Function} next - Express Next function
     */
    async deleteBudget(req, res, next) {
        try {
            await budgetService.deleteBudget(req.params.id);

            res.status(200).json({
                success: true,
                data: {}
            });
        } catch (error) {
            next(error);
        }
    }
};

export default budgetController; 
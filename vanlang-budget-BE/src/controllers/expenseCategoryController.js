import ExpenseCategory from '../models/expenseCategoryModel.js';
import Expense from '../models/expenseModel.js';
import Budget from '../models/budgetModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';

/**
 * @desc    Lấy tất cả danh mục chi tiêu của người dùng
 * @route   GET /api/expense-categories
 * @access  Private
 */
export const getCategories = async (req, res, next) => {
    try {
        const categories = await ExpenseCategory.find({ userId: req.user.id })
            .sort({ isDefault: -1, name: 1 });

        res.status(200).json({
            status: 'success',
            results: categories.length,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy một danh mục chi tiêu theo ID
 * @route   GET /api/expense-categories/:id
 * @access  Private
 */
export const getCategory = async (req, res, next) => {
    try {
        const category = await ExpenseCategory.findById(req.params.id);

        if (!category) {
            return next(new AppError('Không tìm thấy danh mục chi tiêu', 404));
        }

        // Kiểm tra quyền sở hữu
        if (category.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền truy cập danh mục này', 403));
        }

        res.status(200).json({
            status: 'success',
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Tạo danh mục chi tiêu mới
 * @route   POST /api/expense-categories
 * @access  Private
 */
export const createCategory = async (req, res, next) => {
    try {
        const { name, icon, color } = req.body;

        // Kiểm tra xem danh mục đã tồn tại chưa
        const existingCategory = await ExpenseCategory.findOne({
            userId: req.user.id,
            name: { $regex: new RegExp(`^${name}$`, 'i') },
        });

        if (existingCategory) {
            return next(new AppError('Danh mục với tên này đã tồn tại', 400));
        }

        // Tạo danh mục mới
        const newCategory = await ExpenseCategory.create({
            userId: req.user.id,
            name,
            icon: icon || 'tag', // Biểu tượng mặc định
            color: color || '#6c757d', // Màu mặc định
            isDefault: false,
        });

        res.status(201).json({
            status: 'success',
            data: newCategory,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cập nhật danh mục chi tiêu
 * @route   PUT /api/expense-categories/:id
 * @access  Private
 */
export const updateCategory = async (req, res, next) => {
    try {
        const { name, icon, color } = req.body;

        // Tìm danh mục
        const category = await ExpenseCategory.findById(req.params.id);

        if (!category) {
            return next(new AppError('Không tìm thấy danh mục chi tiêu', 404));
        }

        // Kiểm tra quyền sở hữu
        if (category.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền cập nhật danh mục này', 403));
        }

        // Không cho phép cập nhật danh mục mặc định
        if (category.isDefault) {
            return next(new AppError('Không thể cập nhật danh mục mặc định', 400));
        }

        // Kiểm tra xem tên danh mục mới đã tồn tại chưa (nếu thay đổi tên)
        if (name && name !== category.name) {
            const existingCategory = await ExpenseCategory.findOne({
                userId: req.user.id,
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: category._id },
            });

            if (existingCategory) {
                return next(new AppError('Danh mục với tên này đã tồn tại', 400));
            }
        }

        // Cập nhật trường cho phép
        if (name) category.name = name;
        if (icon) category.icon = icon;
        if (color) category.color = color;

        // Lưu thay đổi
        await category.save();

        res.status(200).json({
            status: 'success',
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xóa danh mục chi tiêu
 * @route   DELETE /api/expense-categories/:id
 * @access  Private
 */
export const deleteCategory = async (req, res, next) => {
    try {
        const category = await ExpenseCategory.findById(req.params.id);

        if (!category) {
            return next(new AppError('Không tìm thấy danh mục chi tiêu', 404));
        }

        // Kiểm tra quyền sở hữu
        if (category.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền xóa danh mục này', 403));
        }

        // Không cho phép xóa danh mục mặc định
        if (category.isDefault) {
            return next(new AppError('Không thể xóa danh mục mặc định', 400));
        }

        // Tìm danh mục "Khác" để chuyển chi tiêu sang
        const otherCategory = await ExpenseCategory.findOne({
            userId: req.user.id,
            name: 'Khác',
            isDefault: true,
        });

        if (!otherCategory) {
            return next(new AppError('Không tìm thấy danh mục mặc định để chuyển chi tiêu', 500));
        }

        // Cập nhật tất cả chi tiêu thuộc danh mục này sang danh mục "Khác"
        await Expense.updateMany(
            { userId: req.user.id, category: category._id },
            { category: otherCategory._id }
        );

        // Cập nhật tất cả budget thuộc danh mục này sang danh mục "Khác"
        await Budget.updateMany(
            { userId: req.user.id, category: category._id },
            { category: otherCategory._id }
        );

        // Xóa danh mục
        await category.remove();

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reset về các danh mục mặc định
 * @route   POST /api/expense-categories/reset-default
 * @access  Private
 */
export const resetDefaultCategories = async (req, res, next) => {
    try {
        console.log('resetDefaultCategories - User:', req.user._id);

        // Xóa tất cả danh mục mặc định hiện tại
        await ExpenseCategory.deleteMany({ userId: req.user._id, isDefault: true });
        console.log('resetDefaultCategories - Đã xóa các danh mục mặc định cũ');

        // Tạo danh sách danh mục mặc định mới với thông tin nhóm
        const defaultCategories = [
            { name: 'Ăn uống', icon: 'utensils', color: '#F59E0B', group: 'daily' },
            { name: 'Di chuyển', icon: 'car', color: '#10B981', group: 'daily' },
            { name: 'Đồ ăn nhanh', icon: 'burger', color: '#ef4444', group: 'daily' },
            { name: 'Cà phê', icon: 'coffee', color: '#854d0e', group: 'daily' },
            { name: 'Ăn trưa', icon: 'plate-utensils', color: '#f97316', group: 'daily' },
            { name: 'Mua sắm', icon: 'shopping-bag', color: '#EC4899', group: 'shopping' },
            { name: 'Thời trang', icon: 'tshirt', color: '#d946ef', group: 'shopping' },
            { name: 'Điện tử', icon: 'laptop', color: '#0ea5e9', group: 'shopping' },
            { name: 'Hóa đơn điện', icon: 'bolt', color: '#facc15', group: 'bills' },
            { name: 'Hóa đơn nước', icon: 'faucet', color: '#0ea5e9', group: 'bills' },
            { name: 'Hóa đơn internet', icon: 'wifi', color: '#06b6d4', group: 'bills' },
            { name: 'Tiền thuê nhà', icon: 'home', color: '#14b8a6', group: 'bills' },
            { name: 'Giải trí', icon: 'film', color: '#8B5CF6', group: 'entertainment' },
            { name: 'Du lịch', icon: 'plane', color: '#0284c7', group: 'entertainment' },
            { name: 'Tiệc tùng', icon: 'glass-cheers', color: '#db2777', group: 'entertainment' },
            { name: 'Sức khỏe', icon: 'heartbeat', color: '#ef4444', group: 'health' },
            { name: 'Thuốc men', icon: 'pills', color: '#f97316', group: 'health' },
            { name: 'Thể thao', icon: 'dumbbell', color: '#84cc16', group: 'health' },
            { name: 'Giáo dục', icon: 'book', color: '#0891b2', group: 'education' },
            { name: 'Khóa học', icon: 'graduation-cap', color: '#4338ca', group: 'education' },
            { name: 'Sách', icon: 'book-open', color: '#7c3aed', group: 'education' },
            { name: 'Khác', icon: 'ellipsis-h', color: '#6B7280', group: 'other' }
        ];

        // Thêm userId và isDefault vào mỗi danh mục
        const categories = defaultCategories.map(category => ({
            ...category,
            userId: req.user._id,
            isDefault: true
        }));

        // Lưu các danh mục mặc định mới
        await ExpenseCategory.insertMany(categories);
        console.log(`resetDefaultCategories - Đã tạo ${categories.length} danh mục mặc định mới`);

        res.status(200).json({
            status: 'success',
            message: 'Đã reset về danh mục mặc định',
            results: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('resetDefaultCategories error:', error);
        next(error);
    }
};

/**
 * @desc    Lấy danh sách danh mục chi tiêu của người dùng với các tùy chọn lọc và nhóm
 * @route   GET /api/expense-categories/grouped
 * @access  Private
 */
export const getExpenseCategories = async (req, res, next) => {
    try {
        console.log('getExpenseCategories - User:', req.user._id);

        // Lấy tham số từ query
        const { group } = req.query;

        // Tạo filter cơ bản
        const filter = { userId: req.user._id };

        // Nếu có tham số group, thêm vào filter
        if (group) {
            filter.group = group;
        }

        console.log('getExpenseCategories - filter:', filter);

        // Lấy danh sách danh mục theo filter
        const categories = await ExpenseCategory.find(filter)
            .sort({ name: 1 })
            .select('name icon color group isDefault');

        console.log(`getExpenseCategories - Found ${categories.length} categories`);

        // Nhóm các danh mục theo trường group (nếu có)
        let result;

        if (req.query.grouped === 'true') {
            // Nhóm các danh mục theo group
            result = categories.reduce((acc, category) => {
                const categoryObj = category.toObject();
                categoryObj.id = categoryObj._id;
                delete categoryObj._id;

                // Nếu category không có group hoặc group là null, gán vào nhóm 'other'
                const groupKey = categoryObj.group || 'other';

                if (!acc[groupKey]) {
                    acc[groupKey] = [];
                }

                acc[groupKey].push(categoryObj);
                return acc;
            }, {});

            console.log(`getExpenseCategories - Grouped categories by group field`);
        } else {
            // Trả về danh sách các danh mục bình thường
            result = categories.map(category => {
                const categoryObj = category.toObject();
                categoryObj.id = categoryObj._id;
                delete categoryObj._id;
                return categoryObj;
            });
        }

        res.status(200).json({
            status: 'success',
            results: categories.length,
            data: result
        });
    } catch (error) {
        console.error('getExpenseCategories error:', error);
        next(error);
    }
}; 
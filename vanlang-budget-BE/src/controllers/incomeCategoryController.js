import IncomeCategory from '../models/incomeCategoryModel.js';
import Income from '../models/incomeModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';

/**
 * @desc    Lấy tất cả danh mục thu nhập của người dùng
 * @route   GET /api/income-categories
 * @access  Private
 */
export const getCategories = async (req, res, next) => {
    try {
        const categories = await IncomeCategory.find({ userId: req.user.id })
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
 * @desc    Lấy danh sách danh mục thu nhập của người dùng với các tùy chọn lọc và nhóm
 * @route   GET /api/income-categories/grouped
 * @access  Private
 */
export const getIncomeCategories = async (req, res, next) => {
    try {
        console.log('getIncomeCategories - User:', req.user._id);

        // Lấy tham số từ query
        const { group } = req.query;

        // Tạo filter cơ bản
        const filter = { userId: req.user._id };

        // Nếu có tham số group, thêm vào filter
        if (group) {
            filter.group = group;
        }

        console.log('getIncomeCategories - filter:', filter);

        // Lấy danh sách danh mục theo filter
        const categories = await IncomeCategory.find(filter)
            .sort({ name: 1 })
            .select('name icon color group isDefault');

        console.log(`getIncomeCategories - Found ${categories.length} categories`);

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

            console.log(`getIncomeCategories - Grouped categories by group field`);
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
        console.error('getIncomeCategories error:', error);
        next(error);
    }
};

/**
 * @desc    Lấy một danh mục thu nhập theo ID
 * @route   GET /api/income-categories/:id
 * @access  Private
 */
export const getCategory = async (req, res, next) => {
    try {
        const category = await IncomeCategory.findById(req.params.id);

        if (!category) {
            return next(new AppError('Không tìm thấy danh mục thu nhập', 404));
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
 * @desc    Tạo danh mục thu nhập mới
 * @route   POST /api/income-categories
 * @access  Private
 */
export const createCategory = async (req, res, next) => {
    try {
        const { name, icon, color } = req.body;

        // Kiểm tra xem danh mục đã tồn tại chưa
        const existingCategory = await IncomeCategory.findOne({
            userId: req.user.id,
            name: { $regex: new RegExp(`^${name}$`, 'i') },
        });

        if (existingCategory) {
            return next(new AppError('Danh mục với tên này đã tồn tại', 400));
        }

        // Tạo danh mục mới
        const newCategory = await IncomeCategory.create({
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
 * @desc    Cập nhật danh mục thu nhập
 * @route   PUT /api/income-categories/:id
 * @access  Private
 */
export const updateCategory = async (req, res, next) => {
    try {
        const { name, icon, color } = req.body;

        // Tìm danh mục
        const category = await IncomeCategory.findById(req.params.id);

        if (!category) {
            return next(new AppError('Không tìm thấy danh mục thu nhập', 404));
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
            const existingCategory = await IncomeCategory.findOne({
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
 * @desc    Xóa danh mục thu nhập
 * @route   DELETE /api/income-categories/:id
 * @access  Private
 */
export const deleteCategory = async (req, res, next) => {
    try {
        const category = await IncomeCategory.findById(req.params.id);

        if (!category) {
            return next(new AppError('Không tìm thấy danh mục thu nhập', 404));
        }

        // Kiểm tra quyền sở hữu
        if (category.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('Bạn không có quyền xóa danh mục này', 403));
        }

        // Không cho phép xóa danh mục mặc định
        if (category.isDefault) {
            return next(new AppError('Không thể xóa danh mục mặc định', 400));
        }

        // Tìm danh mục "Lương" để chuyển thu nhập sang
        const defaultCategory = await IncomeCategory.findOne({
            userId: req.user.id,
            name: 'Lương',
            isDefault: true,
        });

        if (!defaultCategory) {
            return next(new AppError('Không tìm thấy danh mục mặc định để chuyển thu nhập', 500));
        }

        // Cập nhật tất cả thu nhập thuộc danh mục này sang danh mục "Lương"
        await Income.updateMany(
            { userId: req.user.id, category: category._id },
            { category: defaultCategory._id }
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
 * @desc    Khôi phục danh mục mặc định
 * @route   POST /api/income-categories/reset-defaults
 * @access  Private
 */
export const resetDefaultCategories = async (req, res, next) => {
    try {
        // Xóa tất cả danh mục mặc định hiện tại
        await IncomeCategory.deleteMany({
            userId: req.user.id,
            isDefault: true,
        });

        console.log('Đã xóa các danh mục mặc định cũ');

        // Danh sách danh mục mặc định - đã loại bỏ SALARY, BONUS, INVESTMENT, Khác
        const defaultCategories = [
            // Giữ lại các danh mục tiếng Việt
            {
                name: 'Lương',
                icon: 'wallet',
                color: '#2ecc71',
                group: 'income'
            },
            {
                name: 'Thưởng',
                icon: 'gift',
                color: '#f39c12',
                group: 'income'
            },
            {
                name: 'Đầu tư',
                icon: 'chart-line',
                color: '#3498db',
                group: 'investment'
            },
            { name: 'Kinh doanh', icon: 'store', color: '#e74c3c', group: 'business' },
            { name: 'may mắn', icon: 'clover', color: '#16a085', group: 'other' },
            { name: 'tiền mẹ cho', icon: 'heart', color: '#e84393', group: 'other' }
            // Đã loại bỏ danh mục "Khác"
        ];

        // Tạo danh mục mặc định
        const operations = defaultCategories.map(cat => ({
            userId: req.user.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            isDefault: true,
            group: cat.group || null
        }));

        // Lưu các danh mục mới
        const newCategories = await IncomeCategory.insertMany(operations);

        console.log(`Đã tạo ${newCategories.length} danh mục mặc định mới`);

        // Lấy tất cả danh mục sau khi cập nhật
        const allCategories = await IncomeCategory.find({ userId: req.user.id })
            .sort({ isDefault: -1, name: 1 });

        res.status(200).json({
            status: 'success',
            results: allCategories.length,
            data: allCategories,
            message: `Đã cập nhật ${newCategories.length} danh mục mặc định và loại bỏ các danh mục không cần thiết.`,
        });
    } catch (error) {
        console.error('resetDefaultCategories error:', error);
        next(error);
    }
}; 
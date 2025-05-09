import mongoose from 'mongoose';

const expenseCategorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Danh mục phải thuộc về một người dùng']
        },
        name: {
            type: String,
            required: [true, 'Tên danh mục là bắt buộc'],
            trim: true
        },
        icon: {
            type: String,
            default: 'shopping-bag'
        },
        color: {
            type: String,
            default: '#4F46E5'
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        group: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Index để tối ưu truy vấn
expenseCategorySchema.index({ userId: 1 });
expenseCategorySchema.index({ userId: 1, name: 1 }, { unique: true });

/**
 * Middleware trước khi lưu để ngăn chặn sửa đổi danh mục mặc định
 */
expenseCategorySchema.pre('save', function (next) {
    if (this.isDefault && this.isModified('name')) {
        const error = new Error('Không thể thay đổi tên của danh mục mặc định');
        error.statusCode = 400;
        return next(error);
    }
    next();
});

/**
 * Middleware trước khi remove để ngăn chặn xóa danh mục mặc định
 */
expenseCategorySchema.pre('remove', function (next) {
    if (this.isDefault) {
        const error = new Error('Không thể xóa danh mục mặc định');
        error.statusCode = 400;
        return next(error);
    }
    next();
});

/**
 * Phương thức tĩnh để tạo các danh mục mặc định cho người dùng mới
 */
expenseCategorySchema.statics.createDefaultCategories = async function (userId) {
    const defaultCategories = [
        { name: 'Ăn uống', icon: 'utensils', color: '#F59E0B' },
        { name: 'Di chuyển', icon: 'car', color: '#10B981' },
        { name: 'Mua sắm', icon: 'shopping-bag', color: '#EC4899' },
        { name: 'Hóa đơn', icon: 'file-invoice', color: '#6366F1' },
        { name: 'Giải trí', icon: 'film', color: '#8B5CF6' },
        { name: 'Khác', icon: 'ellipsis-h', color: '#6B7280' }
    ];

    const categories = defaultCategories.map(category => ({
        ...category,
        userId,
        isDefault: true
    }));

    await this.insertMany(categories);
};

const ExpenseCategory = mongoose.model('ExpenseCategory', expenseCategorySchema);

export default ExpenseCategory; 
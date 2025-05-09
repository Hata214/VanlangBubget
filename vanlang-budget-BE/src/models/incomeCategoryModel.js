import mongoose from 'mongoose';

const incomeCategorySchema = new mongoose.Schema(
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
            default: 'wallet'
        },
        color: {
            type: String,
            default: '#059669'
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
incomeCategorySchema.index({ userId: 1 });
incomeCategorySchema.index({ userId: 1, name: 1 }, { unique: true });

/**
 * Middleware trước khi lưu để ngăn chặn sửa đổi danh mục mặc định
 */
incomeCategorySchema.pre('save', function (next) {
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
incomeCategorySchema.pre('remove', function (next) {
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
incomeCategorySchema.statics.createDefaultCategories = async function (userId) {
    const defaultCategories = [
        { name: 'Lương', icon: 'money-check-alt', color: '#10B981', group: 'income' },
        { name: 'Thưởng', icon: 'gift', color: '#6366F1', group: 'income' },
        { name: 'Đầu tư', icon: 'chart-line', color: '#F59E0B', group: 'investment' },
        { name: 'Kinh doanh', icon: 'store', color: '#e74c3c', group: 'business' },
        { name: 'may mắn', icon: 'clover', color: '#16a085', group: 'other' },
        { name: 'tiền mẹ cho', icon: 'heart', color: '#e84393', group: 'other' }
    ];

    const categories = defaultCategories.map(category => ({
        ...category,
        userId,
        isDefault: true
    }));

    await this.insertMany(categories);
};

const IncomeCategory = mongoose.model('IncomeCategory', incomeCategorySchema);

export default IncomeCategory; 
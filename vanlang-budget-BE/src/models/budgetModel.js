import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Budget phải thuộc về một người dùng']
        },
        category: {
            type: String,
            required: [true, 'Danh mục là bắt buộc'],
            trim: true
        },
        amount: {
            type: Number,
            required: [true, 'Số tiền là bắt buộc'],
            min: [0, 'Số tiền không thể là số âm']
        },
        spent: {
            type: Number,
            default: 0,
            min: [0, 'Số tiền chi tiêu không thể là số âm']
        },
        month: {
            type: Number,
            required: [true, 'Tháng là bắt buộc'],
            min: [1, 'Tháng phải từ 1-12'],
            max: [12, 'Tháng phải từ 1-12']
        },
        year: {
            type: Number,
            required: [true, 'Năm là bắt buộc'],
            min: [2000, 'Năm phải từ 2000 trở lên']
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Index để tối ưu truy vấn
budgetSchema.index({ userId: 1 });
budgetSchema.index({ month: 1, year: 1 });
budgetSchema.index({ userId: 1, month: 1, year: 1 });
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

/**
 * Virtual property để tính phần trăm đã chi tiêu
 */
budgetSchema.virtual('percentage').get(function () {
    return this.amount > 0 ? Math.round((this.spent / this.amount) * 100) : 0;
});

/**
 * Virtual property để tính số tiền còn lại
 */
budgetSchema.virtual('remaining').get(function () {
    return this.amount - this.spent;
});

/**
 * Middleware để kiểm tra trùng lặp danh mục trong cùng một tháng
 */
budgetSchema.pre('save', async function (next) {
    if (this.isNew) {
        const existingBudget = await this.constructor.findOne({
            userId: this.userId,
            category: this.category,
            month: this.month,
            year: this.year
        });

        if (existingBudget) {
            const error = new Error('Ngân sách cho danh mục này trong tháng đã tồn tại');
            error.statusCode = 400;
            return next(error);
        }
    }
    next();
});

/**
 * Phương thức tĩnh để cập nhật chi tiêu
 */
budgetSchema.statics.updateSpent = async function (userId, category, month, year, amount) {
    const budget = await this.findOne({
        userId,
        category,
        month,
        year
    });

    if (budget) {
        budget.spent += amount;
        await budget.save();

        // Kiểm tra cảnh báo ngân sách sau khi cập nhật
        try {
            const Notification = mongoose.model('Notification');
            await Notification.createBudgetAlert(budget);
        } catch (error) {
            console.error('Error checking budget alert:', error);
        }
    }
};

/**
 * Phương thức tĩnh để lấy tất cả ngân sách của một người dùng trong một tháng
 */
budgetSchema.statics.getMonthlyBudgets = function (userId, month, year) {
    return this.find({
        userId,
        month,
        year
    });
};

// Kiểm tra xem model đã được định nghĩa chưa
const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

export default Budget; 
import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Income must belong to a user']
        },
        amount: {
            type: Number,
            required: [true, 'Income amount is required'],
            min: [0, 'Amount cannot be negative']
        },
        description: {
            type: String,
            required: [true, 'Please provide a description'],
            trim: true
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        attachments: [String]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes để tối ưu hiệu suất truy vấn
incomeSchema.index({ userId: 1, date: -1 });
incomeSchema.index({ userId: 1, category: 1 });

// Thêm virtual fields
incomeSchema.virtual('month').get(function () {
    return this.date.getMonth() + 1; // Tháng bắt đầu từ 0
});

incomeSchema.virtual('year').get(function () {
    return this.date.getFullYear();
});

// Pre-save middleware để xử lý dữ liệu trước khi lưu
incomeSchema.pre('save', function (next) {
    // Đảm bảo userId là một đối tượng ObjectId hợp lệ
    if (typeof this.userId === 'string') {
        try {
            this.userId = new mongoose.Types.ObjectId(this.userId);
        } catch (error) {
            return next(new Error('Invalid user ID format'));
        }
    }
    next();
});

// Pre-find middleware để đảm bảo query hoạt động đúng
incomeSchema.pre(/^find/, function (next) {
    // Nếu có populate, đảm bảo lọc đúng các trường
    if (this._mongooseOptions.populate && this._mongooseOptions.populate.user) {
        this.populate({
            path: 'userId',
            select: 'firstName lastName email'
        });
    }

    next();
});

/**
 * Phương thức tĩnh để lấy tổng thu nhập theo tháng
 */
incomeSchema.statics.getMonthlyTotal = async function (userId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    return result.length > 0 ? result[0].total : 0;
};

/**
 * Phương thức tĩnh để lấy tổng thu nhập theo danh mục và tháng
 */
incomeSchema.statics.getMonthlyTotalByCategory = async function (userId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { total: -1 }
        },
        {
            $project: {
                category: '$_id',
                total: 1,
                count: 1,
                _id: 0
            }
        }
    ]);
};

const Income = mongoose.model('Income', incomeSchema);

export default Income; 
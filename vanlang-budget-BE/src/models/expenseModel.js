import mongoose from 'mongoose';
import Budget from './budgetModel.js';

const locationSchema = new mongoose.Schema(
    {
        lat: {
            type: Number,
            required: [true, 'Vĩ độ là bắt buộc']
        },
        lng: {
            type: Number,
            required: [true, 'Kinh độ là bắt buộc']
        },
        address: {
            type: String,
            default: ''
        }
    },
    { _id: false }
);

const expenseSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Expense must belong to a user']
        },
        amount: {
            type: Number,
            required: [true, 'Expense amount is required'],
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
        location: {
            lat: Number,
            lng: Number,
            address: String
        },
        attachments: [String]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Thêm index để tối ưu hiệu suất truy vấn
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

// Thêm virtual fields
expenseSchema.virtual('month').get(function () {
    return this.date.getMonth() + 1; // Tháng bắt đầu từ 0
});

expenseSchema.virtual('year').get(function () {
    return this.date.getFullYear();
});

// Pre-save middleware để xử lý dữ liệu trước khi lưu
expenseSchema.pre('save', function (next) {
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
expenseSchema.pre(/^find/, function (next) {
    // Đảm bảo chỉ tìm các chi tiêu không bị xóa mềm (nếu có)
    // this.find({ isDeleted: { $ne: true } });

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
 * Middleware trước khi lưu để cập nhật ngân sách
 */
/* // Tạm thời comment out middleware này
expenseSchema.pre('save', async function (next) {
    try {
        if (this.isNew) {
            const month = this.date.getMonth() + 1;
            const year = this.date.getFullYear();

            // Cập nhật ngân sách khi thêm chi tiêu mới
            await Budget.updateSpent(this.userId, this.category, month, year, this.amount);
        } else if (this.isModified('amount') || this.isModified('category') || this.isModified('date')) {
            // Lấy phiên bản gốc của document
            const original = await this.constructor.findById(this._id);

            if (!original) return next();

            // Nếu thay đổi số tiền nhưng không thay đổi danh mục và ngày
            if (
                this.isModified('amount') &&
                !this.isModified('category') &&
                !this.isModified('date')
            ) {
                const month = this.date.getMonth() + 1;
                const year = this.date.getFullYear();
                const amountDiff = this.amount - original.amount;

                // Cập nhật ngân sách với sự khác biệt về số tiền
                await Budget.updateSpent(this.userId, this.category, month, year, amountDiff);
            }
            // Nếu thay đổi danh mục hoặc ngày
            else if (this.isModified('category') || this.isModified('date')) {
                // Cập nhật ngân sách cũ: giảm chi tiêu
                const originalMonth = original.date.getMonth() + 1;
                const originalYear = original.date.getFullYear();
                await Budget.updateSpent(this.userId, original.category, originalMonth, originalYear, -original.amount);

                // Cập nhật ngân sách mới: tăng chi tiêu
                const newMonth = this.date.getMonth() + 1;
                const newYear = this.date.getFullYear();
                await Budget.updateSpent(this.userId, this.category, newMonth, newYear, this.amount);
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});
*/

/**
 * Middleware trước khi xóa để cập nhật ngân sách
 */
/* // Tạm thời comment out middleware này
expenseSchema.pre('remove', async function (next) {
    try {
        const month = this.date.getMonth() + 1;
        const year = this.date.getFullYear();

        // Giảm chi tiêu khi xóa
        await Budget.updateSpent(this.userId, this.category, month, year, -this.amount);
        next();
    } catch (error) {
        next(error);
    }
});
*/

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense; 
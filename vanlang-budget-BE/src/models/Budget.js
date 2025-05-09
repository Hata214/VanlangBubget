import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tên ngân sách là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên ngân sách không được vượt quá 100 ký tự']
    },
    description: {
        type: String,
        maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
    },
    amount: {
        type: Number,
        required: [true, 'Số tiền ngân sách là bắt buộc'],
        min: [0, 'Số tiền ngân sách phải lớn hơn hoặc bằng 0']
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    category: {
        type: String,
        enum: ['Cá nhân', 'Gia đình', 'Học tập', 'Công việc', 'Khác'],
        default: 'Cá nhân'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual cho số tiền đã sử dụng (được tính toán từ các transactions)
budgetSchema.virtual('usedAmount').get(function () {
    // Trong trường hợp thực tế, sẽ cần truy vấn từ collection transactions
    return 0;
});

// Virtual cho số tiền còn lại
budgetSchema.virtual('remainingAmount').get(function () {
    return this.amount - this.usedAmount;
});

// Đảm bảo virtuals được bao gồm khi chuyển đổi sang JSON
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

// Kiểm tra xem model đã được định nghĩa chưa
const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

export default Budget; 
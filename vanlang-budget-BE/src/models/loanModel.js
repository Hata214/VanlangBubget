import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Khoản vay phải thuộc về một người dùng']
        },
        amount: {
            type: Number,
            required: [true, 'Số tiền vay là bắt buộc'],
            min: [0, 'Số tiền không thể là số âm']
        },
        description: {
            type: String,
            required: [true, 'Mô tả là bắt buộc'],
            trim: true
        },
        lender: {
            type: String,
            required: [true, 'Người cho vay là bắt buộc'],
            trim: true
        },
        interestRate: {
            type: Number,
            default: 0,
            min: [0, 'Lãi suất không thể là số âm']
        },
        interestRateType: {
            type: String,
            enum: ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'],
            default: 'YEAR'
        },
        startDate: {
            type: Date,
            required: [true, 'Ngày bắt đầu là bắt buộc'],
            default: Date.now
        },
        dueDate: {
            type: Date,
            required: [true, 'Ngày đáo hạn là bắt buộc']
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'PAID', 'OVERDUE'],
            default: 'ACTIVE'
        },
        attachments: [String],

        // Các trường mới cho thông báo
        hasOverdueNotification: {
            type: Boolean,
            default: false
        },
        hasReminderNotification: {
            type: Boolean,
            default: false
        },
        isPaid: {
            type: Boolean,
            default: false
        },
        // Thêm trường để đánh dấu khoản vay đã được thông báo quá hạn
        notifiedOverdue: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes để tối ưu truy vấn
loanSchema.index({ userId: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ dueDate: 1 });
loanSchema.index({ userId: 1, status: 1 });

/**
 * Virtual để lấy các lần trả khoản vay
 */
loanSchema.virtual('payments', {
    ref: 'LoanPayment',
    localField: '_id',
    foreignField: 'loanId'
});

/**
 * Virtual để tính tổng số tiền đã trả
 */
loanSchema.virtual('totalPaid').get(function () {
    if (!this.payments) return 0;
    return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
});

/**
 * Virtual để tính số tiền còn phải trả
 */
loanSchema.virtual('remainingAmount').get(function () {
    const totalPaid = this.totalPaid || 0;
    return Math.max(0, this.amount - totalPaid);
});

/**
 * Virtual để tính số ngày còn lại
 */
loanSchema.virtual('daysRemaining').get(function () {
    if (this.isPaid) return 0;

    const today = new Date();
    const dueDate = new Date(this.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
});

/**
 * Middleware để cập nhật trạng thái khoản vay dựa trên ngày đáo hạn và số tiền đã trả
 */
loanSchema.pre('save', async function (next) {
    // Chuẩn hóa trường status để đảm bảo nhất quán
    if (this.status) {
        // Chuyển về chữ hoa cho đồng bộ
        const upperStatus = this.status.toUpperCase();
        if (['ACTIVE', 'PAID', 'OVERDUE'].includes(upperStatus)) {
            this.status = upperStatus;
        }
    }

    // Kiểm tra nếu đã trả đủ
    if (this.totalPaid >= this.amount) {
        this.status = 'PAID';
        this.isPaid = true;
    }
    // Kiểm tra nếu quá hạn
    else if (new Date() > this.dueDate) {
        this.status = 'OVERDUE';
        this.isPaid = false;
    }
    // Nếu không, vẫn đang hoạt động
    else {
        this.status = 'ACTIVE';
        this.isPaid = false;
    }

    next();
});

/**
 * Middleware sau khi lưu để kiểm tra và tạo thông báo khoản vay sắp đến hạn
 */
loanSchema.post('save', async function (doc) {
    try {
        // Kiểm tra thông báo khoản vay sắp đến hạn
        const Notification = mongoose.model('Notification');
        await Notification.createLoanDueAlert(doc);
    } catch (error) {
        console.error('Error checking loan due alert:', error);
    }
});

/**
 * Phương thức tĩnh để lấy tổng số tiền vay đang còn
 */
loanSchema.statics.getTotalActive = async function (userId) {
    const loans = await this.find({
        userId,
        isPaid: false
    }).populate('payments');

    return loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
};

const Loan = mongoose.model('Loan', loanSchema);

export default Loan; 
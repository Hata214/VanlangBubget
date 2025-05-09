import mongoose from 'mongoose';
import Loan from './loanModel.js';

const loanPaymentSchema = new mongoose.Schema(
    {
        loanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Loan',
            required: [true, 'Khoản thanh toán phải thuộc về một khoản vay']
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Khoản thanh toán phải thuộc về một người dùng']
        },
        amount: {
            type: Number,
            required: [true, 'Số tiền thanh toán là bắt buộc'],
            min: [0, 'Số tiền không thể là số âm']
        },
        paymentDate: {
            type: Date,
            required: [true, 'Ngày thanh toán là bắt buộc'],
            default: Date.now
        },
        description: {
            type: String,
            trim: true
        },
        attachments: [String]
    },
    {
        timestamps: true
    }
);

// Indexes để tối ưu truy vấn
loanPaymentSchema.index({ loanId: 1 });
loanPaymentSchema.index({ userId: 1 });
loanPaymentSchema.index({ paymentDate: -1 });

/**
 * Middleware trước khi lưu để cập nhật khoản vay
 */
loanPaymentSchema.pre('save', async function (next) {
    try {
        if (this.isNew) {
            const loan = await Loan.findById(this.loanId).populate('payments');

            if (!loan) {
                const error = new Error('Không tìm thấy khoản vay');
                error.statusCode = 404;
                return next(error);
            }

            // Kiểm tra nếu đã thanh toán đủ
            const totalPaid = loan.payments.reduce((sum, payment) => sum + payment.amount, 0) + this.amount;

            if (totalPaid > loan.amount) {
                const error = new Error('Số tiền thanh toán vượt quá số tiền vay');
                error.statusCode = 400;
                return next(error);
            }

            // Cập nhật trạng thái khoản vay
            if (totalPaid >= loan.amount) {
                loan.status = 'PAID';
            }

            await loan.save();
        }

        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Middleware trước khi xóa để cập nhật khoản vay
 */
loanPaymentSchema.pre('remove', async function (next) {
    try {
        const loan = await Loan.findById(this.loanId).populate('payments');

        if (loan) {
            // Cập nhật lại trạng thái khoản vay
            const remainingPayments = loan.payments.filter(payment => payment._id.toString() !== this._id.toString());
            const totalPaid = remainingPayments.reduce((sum, payment) => sum + payment.amount, 0);

            if (totalPaid >= loan.amount) {
                loan.status = 'PAID';
            } else if (new Date() > loan.dueDate) {
                loan.status = 'OVERDUE';
            } else {
                loan.status = 'ACTIVE';
            }

            await loan.save();
        }

        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Phương thức tĩnh để lấy tất cả thanh toán của một khoản vay
 */
loanPaymentSchema.statics.getPaymentsForLoan = function (loanId) {
    return this.find({ loanId }).sort({ paymentDate: -1 });
};

const LoanPayment = mongoose.model('LoanPayment', loanPaymentSchema);

export default LoanPayment; 
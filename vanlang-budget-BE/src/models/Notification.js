import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Notification must belong to a user']
        },
        title: {
            type: String,
            required: [true, 'Notification must have a title']
        },
        message: {
            type: String,
            required: [true, 'Notification must have a message']
        },
        type: {
            type: String,
            enum: [
                'info',
                'success',
                'warning',
                'error',
                'budget-alert',
                'transaction',
                'goal-reached',
                'report-ready',
                'system',
                'income',
                'expense',
                'loan',
                'loan-payment',
                'loan-due',
                'loan-overdue',
                'account-balance'
            ],
            default: 'info'
        },
        read: {
            type: Boolean,
            default: false
        },
        link: {
            type: String,
            default: null
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes để tối ưu truy vấn
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

/**
 * Middleware để tự động xóa thông báo cũ hơn 30 ngày trước khi tìm kiếm
 */
notificationSchema.pre('find', async function (next) {
    try {
        // Tính toán thời điểm 30 ngày trước
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Xóa các thông báo cũ hơn 30 ngày và đã đọc
        const Notification = mongoose.model('Notification');
        await Notification.deleteMany({
            createdAt: { $lt: thirtyDaysAgo },
            read: true
        });

        next();
    } catch (error) {
        console.error('Error deleting old notifications:', error);
        // Vẫn cho phép tìm kiếm tiếp tục ngay cả khi có lỗi
        next();
    }
});

/**
 * Phương thức tạo thông báo từ hệ thống
 */
notificationSchema.statics.createSystemNotification = async function (
    userId,
    title,
    message,
    type = 'system',
    link = null,
    data = {},
    relatedId = null
) {
    const notification = await this.create({
        user: userId,
        title,
        message,
        type,
        link,
        data,
        read: false,
        relatedId
    });

    return notification;
};

/**
 * Phương thức kiểm tra và tạo thông báo ngân sách vượt ngưỡng
 */
notificationSchema.statics.createBudgetAlert = async function (budget) {
    // Tính phần trăm đã chi tiêu
    const percentage = budget.amount > 0 ? Math.round((budget.spent / budget.amount) * 100) : 0;
    const userId = budget.userId || budget.user;

    // Nếu chi tiêu vượt 80% ngân sách, tạo thông báo
    if (percentage >= 80 && percentage < 100) {
        // Kiểm tra xem đã tạo thông báo chưa
        const existingNotification = await this.findOne({
            user: userId,
            'data.model': 'Budget',
            'data.id': budget._id,
            type: 'warning',
            read: false
        });

        if (!existingNotification) {
            return this.createSystemNotification(
                userId,
                'Cảnh báo ngân sách',
                `Bạn đã sử dụng ${percentage}% ngân sách "${budget.category}" trong tháng ${budget.month}/${budget.year}.`,
                'budget-alert',
                `/budgets/${budget._id}`,
                { model: 'Budget', id: budget._id },
                budget._id.toString()
            );
        }
    }
    // Nếu chi tiêu vượt 100% ngân sách, tạo thông báo
    else if (percentage >= 100) {
        // Kiểm tra xem đã tạo thông báo chưa
        const existingNotification = await this.findOne({
            user: userId,
            'data.model': 'Budget',
            'data.id': budget._id,
            type: 'error',
            read: false
        });

        if (!existingNotification) {
            return this.createSystemNotification(
                userId,
                'Vượt ngân sách',
                `Bạn đã sử dụng ${percentage}% ngân sách "${budget.category}" trong tháng ${budget.month}/${budget.year}.`,
                'budget-alert',
                `/budgets/${budget._id}`,
                { model: 'Budget', id: budget._id },
                budget._id.toString()
            );
        }
    }

    return null;
};

/**
 * Phương thức kiểm tra và tạo thông báo khoản vay sắp đến hạn
 */
notificationSchema.statics.createLoanDueAlert = async function (loan) {
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const userId = loan.userId || loan.user;

    // Chuẩn hóa status để so sánh không phân biệt chữ hoa/thường
    const loanStatus = loan.status ? loan.status.toLowerCase() : '';

    // Nếu còn 3 ngày đến hạn và chưa trả hết
    if (diffDays <= 3 && diffDays > 0 && loanStatus === 'active') {
        // Kiểm tra xem đã tạo thông báo chưa
        const existingNotification = await this.findOne({
            user: userId,
            'data.model': 'Loan',
            'data.id': loan._id,
            type: 'loan-due',
            read: false
        });

        if (!existingNotification) {
            return this.createSystemNotification(
                userId,
                'Khoản vay sắp đến hạn',
                `Khoản vay "${loan.description}" sẽ đến hạn trong ${diffDays} ngày.`,
                'loan-due',
                `/loans/${loan._id}`,
                { model: 'Loan', id: loan._id },
                loan._id.toString()
            );
        }
    }
    // Nếu quá hạn và chưa trả hết
    else if (diffDays <= 0 && loanStatus === 'overdue') {
        // Kiểm tra xem đã tạo thông báo chưa
        const existingNotification = await this.findOne({
            user: userId,
            'data.model': 'Loan',
            'data.id': loan._id,
            type: 'loan-overdue',
            read: false
        });

        if (!existingNotification) {
            return this.createSystemNotification(
                userId,
                'Khoản vay quá hạn',
                `Khoản vay "${loan.description}" đã quá hạn ${-diffDays} ngày.`,
                'loan-overdue',
                `/loans/${loan._id}`,
                { model: 'Loan', id: loan._id },
                loan._id.toString()
            );
        }
    }

    return null;
};

/**
 * Phương thức tạo thông báo khi thêm thu nhập mới
 */
notificationSchema.statics.createIncomeNotification = async function (income) {
    return this.createSystemNotification(
        income.userId || income.user,
        'Thu nhập mới',
        `Bạn đã thêm khoản thu nhập "${income.description}" với số tiền ${income.amount.toLocaleString('vi-VN')} VND`,
        'income',
        `/incomes?highlight=${income._id}`,
        { model: 'Income', id: income._id },
        income._id.toString()
    );
};

/**
 * Phương thức tạo thông báo khi thêm chi tiêu mới
 */
notificationSchema.statics.createExpenseNotification = async function (expense) {
    return this.createSystemNotification(
        expense.userId || expense.user,
        'Chi tiêu mới',
        `Bạn đã thêm khoản chi tiêu "${expense.description}" với số tiền ${expense.amount.toLocaleString('vi-VN')} VND`,
        'expense',
        `/expenses?highlight=${expense._id}`,
        { model: 'Expense', id: expense._id },
        expense._id.toString()
    );
};

/**
 * Phương thức tạo thông báo khi thêm khoản vay mới
 */
notificationSchema.statics.createLoanNotification = async function (loan) {
    return this.createSystemNotification(
        loan.userId || loan.user,
        'Khoản vay mới',
        `Bạn đã thêm khoản vay "${loan.description}" với số tiền ${loan.amount.toLocaleString('vi-VN')} VND từ ${loan.lender}`,
        'loan',
        `/loans?highlight=${loan._id}`,
        { model: 'Loan', id: loan._id },
        loan._id.toString()
    );
};

/**
 * Phương thức tạo thông báo khi thêm thanh toán khoản vay
 */
notificationSchema.statics.createLoanPaymentNotification = async function (payment, loan) {
    return this.createSystemNotification(
        payment.userId || payment.user,
        'Thanh toán khoản vay',
        `Bạn đã thanh toán ${payment.amount.toLocaleString('vi-VN')} VND cho khoản vay "${loan.description}"`,
        'loan-payment',
        `/loans/${loan._id}?highlight=payment`,
        { model: 'LoanPayment', id: payment._id, loanId: loan._id },
        payment._id.toString()
    );
};

/**
 * Phương thức tạo thông báo khi số dư âm
 */
notificationSchema.statics.createNegativeBalanceAlert = async function (userId, balance) {
    try {
        // Xóa các thông báo số dư âm cũ đã đọc
        await this.deleteMany({
            user: userId,
            type: 'account-balance',
            'data.type': 'negative-balance',
            read: true
        });

        // Kiểm tra xem đã tạo thông báo chưa đọc chưa
        const existingNotification = await this.findOne({
            user: userId,
            type: 'account-balance',
            'data.type': 'negative-balance',
            read: false
        });

        if (!existingNotification) {
            return this.createSystemNotification(
                userId,
                'Cảnh báo số dư âm',
                `Số dư tài khoản của bạn hiện đang âm: ${balance.toLocaleString('vi-VN')} VND. Vui lòng cân đối thu chi.`,
                'account-balance',
                '/dashboard',
                { type: 'negative-balance', balance },
                null
            );
        }

        return null;
    } catch (error) {
        console.error('Lỗi khi tạo thông báo số dư âm:', error);
        return null;
    }
};

/**
 * Tạo thông báo khi trạng thái khoản vay thay đổi
 * @param {Object} loan - Khoản vay đã cập nhật
 * @param {String} oldStatus - Trạng thái cũ của khoản vay
 * @returns {Promise<Object>} - Thông báo đã tạo
 */
notificationSchema.statics.createLoanStatusChangeNotification = async function (loan, oldStatus) {
    if (!loan || !loan.userId) {
        console.error('Invalid loan object for status change notification');
        return null;
    }

    // Nếu không có thay đổi trạng thái, không tạo thông báo
    if (oldStatus && oldStatus.toUpperCase() === loan.status.toUpperCase()) {
        return null;
    }

    let title = '';
    let message = '';
    let type = '';

    // Xác định loại thông báo dựa trên trạng thái mới
    switch (loan.status.toUpperCase()) {
        case 'ACTIVE':
            title = 'Khoản vay đang hoạt động';
            message = `Trạng thái khoản vay "${loan.description}" đã được chuyển thành Đang vay.`;
            type = 'INFO';
            break;
        case 'PAID':
            title = 'Khoản vay đã được thanh toán';
            message = `Khoản vay "${loan.description}" đã được đánh dấu là Đã trả.`;
            type = 'SUCCESS';
            break;
        case 'OVERDUE':
            title = 'Khoản vay đã quá hạn';
            message = `Khoản vay "${loan.description}" đã bị đánh dấu là Quá hạn.`;
            type = 'WARNING';
            break;
        default:
            title = 'Trạng thái khoản vay đã thay đổi';
            message = `Trạng thái khoản vay "${loan.description}" đã được cập nhật.`;
            type = 'INFO';
    }

    try {
        // Tạo thông báo mới
        const notification = await this.create({
            user: loan.userId,
            title,
            message,
            type,
            link: `/loans/${loan._id}`,
            data: {
                type: 'loan',
                id: loan._id,
                status: loan.status,
                oldStatus
            },
            read: false,
            createdAt: new Date()
        });

        return notification;
    } catch (error) {
        console.error('Error creating loan status change notification:', error);
        return null;
    }
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 
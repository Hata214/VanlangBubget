import mongoose from 'mongoose';

/**
 * Payment Transaction Model - Dành cho giao dịch thanh toán gói premium
 * Khác với transactionModel.js (dành cho income/expense tracking)
 */
const paymentTransactionSchema = new mongoose.Schema({
    // Thông tin người dùng
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: [true, 'Payment transaction must belong to a user']
    },
    
    // Thông tin giao dịch
    transactionId: {
        type: String,
        required: [true, 'Transaction ID is required'],
        unique: true,
        trim: true
    },
    
    // Loại giao dịch thanh toán
    type: { 
        type: String, 
        enum: ['subscription', 'upgrade', 'renewal', 'refund'], 
        required: [true, 'Payment transaction type is required']
    },
    
    // Trạng thái giao dịch
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    
    // Thông tin gói dịch vụ
    planType: {
        type: String,
        enum: ['basic', 'standard', 'premium'],
        required: [true, 'Plan type is required']
    },
    
    planName: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true
    },
    
    // Thông tin tài chính
    amount: { 
        type: Number, 
        required: [true, 'Payment amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    
    currency: {
        type: String,
        default: 'VND',
        enum: ['VND', 'USD']
    },
    
    // Thông tin thanh toán
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'paypal', 'stripe'],
        required: [true, 'Payment method is required']
    },
    
    paymentGateway: {
        type: String,
        enum: ['vnpay', 'momo', 'zalopay', 'paypal', 'stripe'],
        required: [true, 'Payment gateway is required']
    },
    
    // ID giao dịch từ payment gateway
    gatewayTransactionId: {
        type: String,
        trim: true
    },
    
    // Thông tin thời gian
    subscriptionStartDate: {
        type: Date
    },
    
    subscriptionEndDate: {
        type: Date
    },
    
    // Metadata
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    
    // Thông tin kỹ thuật
    ipAddress: {
        type: String,
        trim: true
    },
    
    userAgent: {
        type: String,
        trim: true
    },
    
    // Thông tin hoàn tiền (nếu có)
    refundAmount: {
        type: Number,
        min: [0, 'Refund amount cannot be negative']
    },
    
    refundReason: {
        type: String,
        trim: true
    },
    
    refundDate: {
        type: Date
    },
    
    // Thông tin admin xử lý
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin user
    },
    
    processedAt: {
        type: Date
    },
    
    // Metadata bổ sung
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ transactionId: 1 });
paymentTransactionSchema.index({ status: 1 });
paymentTransactionSchema.index({ type: 1 });
paymentTransactionSchema.index({ planType: 1 });
paymentTransactionSchema.index({ paymentGateway: 1 });
paymentTransactionSchema.index({ createdAt: -1 });

// Virtual for user full name
paymentTransactionSchema.virtual('userFullName').get(function() {
    if (this.userId && this.userId.firstName && this.userId.lastName) {
        return `${this.userId.firstName} ${this.userId.lastName}`;
    }
    return '';
});

// Virtual for formatted amount
paymentTransactionSchema.virtual('formattedAmount').get(function() {
    if (this.currency === 'VND') {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(this.amount);
    } else {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currency
        }).format(this.amount);
    }
});

// Static methods
paymentTransactionSchema.statics.getTransactionStats = async function(dateRange = {}) {
    const matchStage = {};
    
    if (dateRange.startDate && dateRange.endDate) {
        matchStage.createdAt = {
            $gte: new Date(dateRange.startDate),
            $lte: new Date(dateRange.endDate)
        };
    }
    
    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalTransactions: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                completedTransactions: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                completedAmount: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
                },
                pendingTransactions: {
                    $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                },
                failedTransactions: {
                    $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                }
            }
        }
    ]);
};

paymentTransactionSchema.statics.getTransactionsByStatus = async function(status, options = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = options;
    
    return await this.find({ status })
        .populate('userId', 'firstName lastName email')
        .populate('processedBy', 'firstName lastName email')
        .sort({ [sortBy]: sortOrder })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
};

// Instance methods
paymentTransactionSchema.methods.markAsCompleted = function(adminId) {
    this.status = 'completed';
    this.processedBy = adminId;
    this.processedAt = new Date();
    return this.save();
};

paymentTransactionSchema.methods.markAsFailed = function(adminId, reason) {
    this.status = 'failed';
    this.processedBy = adminId;
    this.processedAt = new Date();
    if (reason) {
        this.notes = (this.notes || '') + `\nFailed: ${reason}`;
    }
    return this.save();
};

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

export default PaymentTransaction;

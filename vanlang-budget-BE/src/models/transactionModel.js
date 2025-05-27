import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: [true, 'Transaction must belong to a user']
    },
    type: { 
        type: String, 
        enum: ['income', 'expense'], 
        required: [true, 'Transaction type is required']
    },
    amount: { 
        type: Number, 
        required: [true, 'Transaction amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    category: { 
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    note: { 
        type: String,
        trim: true,
        maxlength: [500, 'Note cannot exceed 500 characters']
    },
    date: { 
        type: Date, 
        default: Date.now
    },
    // Thêm các trường để tích hợp với hệ thống hiện tại
    description: {
        type: String,
        trim: true
    },
    // Metadata cho agent
    createdByAgent: {
        type: Boolean,
        default: false
    },
    agentSessionId: {
        type: String
    },
    // Tích hợp với expense/income models hiện tại
    linkedExpenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense'
    },
    linkedIncomeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Income'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.amount);
});

// Method to sync with existing expense/income models
transactionSchema.methods.syncWithExistingModels = async function() {
    if (this.type === 'expense' && !this.linkedExpenseId) {
        const Expense = mongoose.model('Expense');
        const expense = new Expense({
            userId: this.userId,
            amount: this.amount,
            description: this.description || this.note,
            category: this.category,
            date: this.date
        });
        await expense.save();
        this.linkedExpenseId = expense._id;
        await this.save();
    } else if (this.type === 'income' && !this.linkedIncomeId) {
        const Income = mongoose.model('Income');
        const income = new Income({
            userId: this.userId,
            amount: this.amount,
            description: this.description || this.note,
            category: this.category,
            date: this.date
        });
        await income.save();
        this.linkedIncomeId = income._id;
        await this.save();
    }
};

export default mongoose.model('Transaction', transactionSchema);

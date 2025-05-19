import mongoose from 'mongoose';

const { Schema } = mongoose;

// Định nghĩa Schema cho Giao dịch (Transaction) bên trong Investment
const transactionSchema = new Schema({
    type: {
        type: String,
        enum: ['buy', 'sell', 'deposit', 'withdraw', 'dividend', 'interest'], // Thêm các loại giao dịch nếu cần
        required: [true, 'Loại giao dịch là bắt buộc']
    },
    amount: {
        type: Number, // Số tiền tổng của giao dịch (có thể tính từ price * quantity + fee)
        required: [function () { return ['deposit', 'withdraw', 'dividend', 'interest'].includes(this.type); }, 'Số tiền là bắt buộc cho loại giao dịch này']
    },
    price: {
        type: Number, // Giá mỗi đơn vị (cho buy/sell)
        required: [function () { return ['buy', 'sell'].includes(this.type); }, 'Giá là bắt buộc cho giao dịch mua/bán']
    },
    quantity: {
        type: Number, // Số lượng (cho buy/sell)
        required: [function () { return ['buy', 'sell'].includes(this.type); }, 'Số lượng là bắt buộc cho giao dịch mua/bán']
    },
    fee: {
        type: Number, // Phí giao dịch (nếu có)
        default: 0
    },
    date: {
        type: Date,
        required: [true, 'Ngày giao dịch là bắt buộc'],
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true, // Tự động thêm createdAt và updatedAt cho giao dịch
    _id: true // Sử dụng ObjectId cho mỗi giao dịch
});


// Định nghĩa Schema chính cho Investment
const investmentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Tham chiếu đến User model
    },
    name: {
        type: String,
        required: [true, 'Tên khoản đầu tư là bắt buộc'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Loại đầu tư là bắt buộc'],
        enum: ['stock', 'crypto', 'gold', 'savings', 'fund', 'realestate', 'other'], // Các loại hình đầu tư
        default: 'other'
    },
    symbol: { // Mã (cho stock, crypto)
        type: String,
        trim: true,
        uppercase: true
    },
    category: { // Danh mục người dùng tự đặt (VD: Công nghệ, Ngân hàng, Vàng miếng...)
        type: String,
        trim: true
    },
    initialInvestment: { // Tổng vốn ban đầu (sẽ được tính toán từ transactions)
        type: Number,
        default: 0
    },
    currentValue: { // Giá trị hiện tại (sẽ được tính toán)
        type: Number,
        default: 0
    },
    totalQuantity: { // Tổng số lượng nắm giữ (cho stock, crypto, gold...)
        type: Number,
        default: 0
    },
    currentPrice: { // Giá hiện tại của một đơn vị tài sản (cập nhật thủ công hoặc tự động)
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    },
    // Các trường cho đầu tư đất đai (realestate)
    propertyType: {
        type: String,
        enum: ['residential', 'agricultural', 'commercial', 'project', 'other'],
        default: 'residential'
    },
    address: {
        type: String,
        trim: true
    },
    legalStatus: {
        type: String,
        enum: ['redbook', 'pinkbook', 'handwritten', 'pending', 'other'],
        default: 'redbook'
    },
    area: {
        type: Number,
        min: 0
    },
    frontWidth: {
        type: Number,
        min: 0
    },
    depth: {
        type: Number,
        min: 0
    },
    additionalFees: {
        type: Number,
        default: 0,
        min: 0
    },
    ownershipType: {
        type: String,
        enum: ['personal', 'shared', 'business', 'other'],
        default: 'personal'
    },
    investmentPurpose: {
        type: String,
        enum: ['holding', 'appreciation', 'development', 'other'],
        default: 'holding'
    },
    currentStatus: {
        type: String,
        enum: ['holding', 'sold', 'renting', 'other'],
        default: 'holding'
    },
    // Các trường cho tiết kiệm ngân hàng (savings)
    bankName: {
        type: String,
        trim: true
    },
    accountNumber: {
        type: String,
        trim: true
    },
    interestRate: {
        type: Number,
        min: 0
    },
    term: {
        type: Number, // Số tháng
        min: 0
    },
    interestPaymentType: {
        type: String,
        enum: ['end', 'monthly', 'prepaid'] // Hình thức nhận lãi: cuối kỳ, hàng tháng, trả trước
    },
    interestCalculationType: {
        type: String,
        enum: ['simple', 'compound'],
        default: 'simple'
    },
    autoRenewal: {
        type: Boolean,
        default: false
    },
    depositMethod: {
        type: String,
        enum: ['online', 'counter'] // Hình thức gửi: online, tại quầy
    },
    estimatedInterest: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    endDate: {
        type: Date
    },
    // Thêm trường mới cho ngày tính lãi cuối cùng của tiết kiệm
    lastInterestCalculationDate: {
        type: Date
    },
    transactions: [transactionSchema] // Mảng chứa các giao dịch
}, {
    timestamps: true, // Tự động thêm createdAt và updatedAt
    methods: {
        // Hàm tính toán lại các chỉ số chính dựa trên giao dịch và giá hiện tại
        calculateMetrics() {
            let totalQuantity = 0;
            let calculatedInitialInvestment = 0;
            let totalInterestEarned = 0; // Cho savings

            this.transactions.forEach(t => {
                const transactionFee = t.fee || 0;
                switch (t.type) {
                    case 'buy':
                        totalQuantity += t.quantity;
                        calculatedInitialInvestment += (t.price * t.quantity) + transactionFee;
                        break;
                    case 'sell':
                        totalQuantity -= t.quantity;
                        // Giá trị thu về làm giảm vốn đầu tư hiệu quả
                        calculatedInitialInvestment -= (t.price * t.quantity) - transactionFee;
                        break;
                    case 'deposit':
                        if (this.type === 'savings') {
                            calculatedInitialInvestment += t.amount + transactionFee;
                        } else {
                            // Đối với các loại khác, deposit có thể làm tăng vốn đầu tư
                            calculatedInitialInvestment += t.amount + transactionFee;
                        }
                        break;
                    case 'withdraw':
                        if (this.type === 'savings') {
                            calculatedInitialInvestment -= (t.amount - transactionFee);
                        } else {
                            // Đối với các loại khác, withdraw làm giảm vốn
                            calculatedInitialInvestment -= (t.amount - transactionFee);
                        }
                        break;
                    case 'interest':
                        if (this.type === 'savings') {
                            totalInterestEarned += t.amount; // Lãi không ảnh hưởng vốn gốc, chỉ cộng vào giá trị hiện tại
                        }
                        // For other types, 'interest' or 'dividend' might be handled differently
                        // or might directly contribute to currentValue if not reinvested as new shares.
                        // Current logic: interest/dividend transactions don't change totalQuantity or initialInvestment directly here.
                        // They will be reflected in profit/loss when currentValue is compared against initialInvestment.
                        break;
                    case 'dividend':
                        // Tương tự 'interest', dividend thường không thay đổi vốn gốc hoặc số lượng cổ phiếu trừ khi tái đầu tư.
                        // Lợi nhuận từ dividend sẽ thể hiện khi so sánh currentValue và initialInvestment.
                        // Hoặc có thể tạo giao dịch 'buy' nếu dividend được tái đầu tư.
                        break;
                }
            });

            this.totalQuantity = totalQuantity;
            this.initialInvestment = calculatedInitialInvestment;

            if (this.type === 'savings') {
                // Đối với tiết kiệm, currentValue = vốn gốc + tổng lãi
                this.currentValue = this.initialInvestment + totalInterestEarned;
                // profitLoss cho tiết kiệm là tổng lãi
                // this.profitLoss = totalInterestEarned; // Sẽ được tính bên ngoài hoặc qua getter
            } else {
                // Đối với các loại khác (stock, crypto, gold, etc.)
                this.currentValue = this.totalQuantity * (this.currentPrice || 0);
            }

            // profitLoss và roi sẽ được tính động dựa trên initialInvestment và currentValue
            // khi gọi formatInvestmentResponse hoặc tương tự.
        },

        // Hàm thêm giao dịch và tính toán lại
        addTransaction(transactionData) {
            this.transactions.push(transactionData);
            this.calculateMetrics();
        },

        // Hàm cập nhật giá hiện tại và tính toán lại
        updateCurrentPrice(newPrice) {
            if (typeof newPrice === 'number' && newPrice >= 0) {
                this.currentPrice = newPrice;
                this.calculateMetrics(); // Tính lại currentValue dựa trên giá mới
            }
        }
    }
});

// Middleware pre-save để tự động tính toán trước khi lưu
investmentSchema.pre('save', function (next) {
    this.calculateMetrics();
    next();
});

// Tạo Index để tăng tốc độ truy vấn thường dùng
investmentSchema.index({ userId: 1 });
investmentSchema.index({ userId: 1, type: 1 });

const Investment = mongoose.model('Investment', investmentSchema);

export default Investment;
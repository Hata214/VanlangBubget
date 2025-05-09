import mongoose from 'mongoose';

const cryptoPriceSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    usd: {
        type: Number,
        required: true
    },
    usdChange24h: {
        type: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index để tối ưu truy vấn
cryptoPriceSchema.index({ symbol: 1, timestamp: -1 });

const CryptoPrice = mongoose.model('CryptoPrice', cryptoPriceSchema);

export default CryptoPrice; 
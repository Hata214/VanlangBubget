import {
    fetchCryptoPrices,
    getLatestCryptoPrices,
    getCryptoPriceHistory
} from '../services/cryptoService.js';

/**
 * @desc    Lấy giá mới nhất của tất cả tiền điện tử
 * @route   GET /api/crypto/prices
 * @access  Public
 */
export const getLatestPrices = async (req, res) => {
    try {
        const latestPrices = await getLatestCryptoPrices();

        if (!latestPrices || latestPrices.length === 0) {
            // Nếu không có dữ liệu trong database, lấy dữ liệu mới từ API
            const currentPrices = await fetchCryptoPrices();

            if (!currentPrices) {
                return res.status(404).json({ message: 'Không thể lấy dữ liệu giá tiền điện tử' });
            }

            return res.json(currentPrices);
        }

        res.json(latestPrices);
    } catch (error) {
        console.error('Lỗi khi lấy giá mới nhất:', error.message);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc    Lấy lịch sử giá của một loại tiền điện tử
 * @route   GET /api/crypto/history/:symbol
 * @access  Public
 */
export const getPriceHistory = async (req, res) => {
    try {
        const { symbol } = req.params;
        const { days = 7 } = req.query;

        if (!symbol) {
            return res.status(400).json({ message: 'Symbol là bắt buộc' });
        }

        const priceHistory = await getCryptoPriceHistory(symbol, days);

        if (!priceHistory || priceHistory.length === 0) {
            return res.status(404).json({ message: `Không tìm thấy dữ liệu lịch sử giá cho ${symbol}` });
        }

        res.json(priceHistory);
    } catch (error) {
        console.error(`Lỗi khi lấy lịch sử giá:`, error.message);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc    Lấy giá hiện tại từ CoinGecko API
 * @route   GET /api/crypto/refresh
 * @access  Private (Admin)
 */
export const refreshCryptoPrices = async (req, res) => {
    try {
        const prices = await fetchCryptoPrices();

        if (!prices) {
            return res.status(500).json({ message: 'Không thể lấy dữ liệu từ CoinGecko API' });
        }

        res.json(prices);
    } catch (error) {
        console.error('Lỗi khi làm mới giá tiền điện tử:', error.message);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}; 
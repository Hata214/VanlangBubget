import axios from '@/lib/axios';

/**
 * Lấy giá mới nhất của tất cả tiền điện tử
 */
export const getLatestCryptoPrices = async () => {
    try {
        const response = await axios.get('/api/crypto/prices');
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy giá tiền điện tử:', error);
        throw error;
    }
};

/**
 * Lấy lịch sử giá của một loại tiền điện tử
 * @param symbol Ký hiệu của tiền điện tử (BTC, ETH,...)
 * @param days Số ngày cần lấy lịch sử (mặc định 7 ngày)
 */
export const getCryptoPriceHistory = async (symbol: string, days = 7) => {
    try {
        const response = await axios.get(`/api/crypto/history/${symbol}`, {
            params: { days }
        });
        return response.data;
    } catch (error) {
        console.error(`Lỗi khi lấy lịch sử giá ${symbol}:`, error);
        throw error;
    }
};

/**
 * Thêm khoản đầu tư tiền điện tử mới
 * @param data Dữ liệu khoản đầu tư
 */
export const addCryptoInvestment = async (data: any) => {
    try {
        const response = await axios.post('/api/investments', {
            ...data,
            type: 'crypto'
        });
        return response.data;
    } catch (error) {
        console.error('Lỗi khi thêm khoản đầu tư crypto:', error);
        throw error;
    }
};

/**
 * Lấy danh sách khoản đầu tư tiền điện tử
 */
export const getCryptoInvestments = async () => {
    try {
        const response = await axios.get('/api/investments', {
            params: { type: 'crypto' }
        });
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy khoản đầu tư crypto:', error);
        throw error;
    }
}; 
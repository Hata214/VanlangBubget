import { StockPriceResponse } from './stockApiService';

// URL cơ sở của API
const API_BASE_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'http://localhost:8000';

/**
 * Lấy giá cổ phiếu hiện tại theo mã
 * @param symbol Mã cổ phiếu (VD: VNM, FPT, VIC)
 * @returns Thông tin giá cổ phiếu
 */
export async function getStockPrice(symbol: string): Promise<StockPriceResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/price?symbol=${symbol}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Lỗi khi lấy giá cổ phiếu:', error);

        // Trả về dữ liệu giả nếu API không hoạt động
        return {
            symbol: symbol,
            price: Math.floor(Math.random() * 100000) + 10000,
            change: Math.floor(Math.random() * 2000) - 1000,
            changePercent: (Math.random() * 4) - 2,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
        };
    }
}

/**
 * Lấy danh sách tất cả cổ phiếu
 * @returns Danh sách cổ phiếu mặc định
 */
export async function getAllStocks() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stocks`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        // Silent error handling

        // Trả về danh sách mặc định nếu API không hoạt động
        return {
            stocks: [
                { symbol: 'VNM', name: 'Vinamilk', price: 85000, industry: 'Thực phẩm & Đồ uống' },
                { symbol: 'FPT', name: 'FPT Corp', price: 95000, industry: 'Công nghệ' },
                { symbol: 'VIC', name: 'Vingroup', price: 65000, industry: 'Bất động sản' },
                { symbol: 'VCB', name: 'Vietcombank', price: 88000, industry: 'Ngân hàng' },
                { symbol: 'MWG', name: 'Thế Giới Di Động', price: 45000, industry: 'Bán lẻ' },
            ]
        };
    }
}

export default {
    getStockPrice,
    getAllStocks
}; 
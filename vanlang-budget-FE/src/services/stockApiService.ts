import axios from 'axios';

// URL cơ sở của API
const API_BASE_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'http://localhost:8000';

/**
 * Interface dữ liệu trả về từ API
 */
export interface StockPriceResponse {
    symbol: string;
    price: number | null;
    name?: string;
    description?: string;
    industry?: string;
    founded?: number;
    error?: string;
    timestamp?: string;
}

/**
 * Interface danh sách cổ phiếu
 */
export interface StocksListResponse {
    stocks: Array<{
        symbol: string;
        name: string;
        price: number;
        industry: string;
    }>;
    count: number;
    timestamp: string;
}

/**
 * Lấy giá cổ phiếu hiện tại theo mã
 * @param symbol Mã cổ phiếu (VD: VNM, FPT, VIC)
 * @returns Thông tin giá cổ phiếu
 */
export const getStockPrice = async (symbol: string): Promise<StockPriceResponse> => {
    try {
        const response = await axios.get<StockPriceResponse>(`${API_BASE_URL}/api/price`, {
            params: { symbol }
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Lỗi khi gọi API lấy giá cổ phiếu:', error.message);
            return {
                symbol,
                price: null,
                error: error.message
            };
        }
        console.error('Lỗi không xác định:', error);
        return {
            symbol,
            price: null,
            error: 'Lỗi không xác định khi lấy dữ liệu'
        };
    }
};

/**
 * Lấy danh sách tất cả cổ phiếu
 * @returns Danh sách cổ phiếu
 */
export async function getAllStocks(): Promise<StocksListResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stocks`);
        if (!response.ok) {
            throw new Error(`Lỗi API: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Lỗi khi lấy danh sách cổ phiếu:', error);
        return {
            stocks: [],
            count: 0,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Hook prefetch để sử dụng với SWR hoặc React Query (nếu cần)
 */
export const stockApiService = {
    getStockPrice,
    getAllStocks
};

export default stockApiService; 
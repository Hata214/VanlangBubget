import axios from 'axios';

// URL cơ sở của API
const API_BASE_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'https://my-app-flashapi.onrender.com';
console.log('Stock API URL being used:', API_BASE_URL);

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
    change?: number;
    pct_change?: number;
    date?: string;
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
        change?: number;
        pct_change?: number;
        volume?: number;
    }>;
    count: number;
    timestamp: string;
}

/**
 * Interface dữ liệu theo thời gian thực
 */
export interface RealtimeStockResponse {
    symbols: string[];
    source: string;
    count: number;
    timestamp: string;
    data: Array<{
        symbol: string;
        price: number;
        change: number;
        pct_change: number;
        volume: number;
        high?: number;
        low?: number;
        open?: number;
    }>;
    error?: string;
}

/**
 * Interface dữ liệu lịch sử giá
 */
export interface StockHistoryResponse {
    symbol: string;
    source: string;
    interval: string;
    start_date: string;
    end_date: string;
    data: Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
        change?: number;
        pct_change?: number;
    }>;
    error?: string;
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
        const data = await response.json();

        // Thêm dữ liệu mô phỏng cho change, pct_change và volume vì API không cung cấp
        if (data && data.stocks) {
            data.stocks = data.stocks.map((stock: any) => ({
                ...stock,
                change: generateRandomChange(stock.price),
                pct_change: generateRandomPercentage(),
                volume: generateRandomVolume()
            }));
        }

        return data;
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
 * Lấy dữ liệu cổ phiếu theo thời gian thực (mô phỏng từ API stocks)
 * @param symbols Danh sách mã cổ phiếu, phân cách bằng dấu phẩy
 * @param source Nguồn dữ liệu (mặc định: VCI)
 * @returns Dữ liệu theo thời gian thực của các mã cổ phiếu
 */
export async function getRealtimeStocks(symbols: string = "VNM,VCB,HPG", source: string = "VCI"): Promise<RealtimeStockResponse> {
    try {
        // Lấy tất cả cổ phiếu
        const allStocksResponse = await getAllStocks();
        const allStocks = allStocksResponse.stocks || [];

        // Lọc theo danh sách mã cổ phiếu được yêu cầu
        const symbolList = symbols.split(',');
        const filteredStocks = allStocks.filter(stock => symbolList.includes(stock.symbol));

        // Chuyển đổi sang định dạng RealtimeStockResponse
        return {
            symbols: symbolList,
            source: source,
            count: filteredStocks.length,
            timestamp: new Date().toISOString(),
            data: filteredStocks.map(stock => ({
                symbol: stock.symbol,
                price: stock.price,
                change: stock.change || 0,
                pct_change: stock.pct_change || 0,
                volume: stock.volume || 0,
                high: stock.price + Math.abs(stock.change || 0),
                low: stock.price - Math.abs(stock.change || 0),
                open: stock.price - (stock.change || 0) / 2
            }))
        };
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu theo thời gian thực:', error);
        return {
            symbols: symbols.split(','),
            source,
            count: 0,
            timestamp: new Date().toISOString(),
            data: [],
            error: 'Lỗi khi lấy dữ liệu theo thời gian thực'
        };
    }
}

/**
 * Lấy dữ liệu lịch sử giá của một mã cổ phiếu (mô phỏng)
 * @param symbol Mã cổ phiếu
 * @param startDate Ngày bắt đầu (định dạng YYYY-MM-DD)
 * @param endDate Ngày kết thúc (định dạng YYYY-MM-DD)
 * @param interval Khoảng thời gian (1D, 1W, 1M)
 * @param source Nguồn dữ liệu (mặc định: VCI)
 * @returns Dữ liệu lịch sử giá của mã cổ phiếu
 */
export async function getStockHistory(
    symbol: string,
    startDate?: string,
    endDate?: string,
    interval: string = "1D",
    source: string = "VCI"
): Promise<StockHistoryResponse> {
    try {
        // Lấy giá hiện tại của cổ phiếu
        const priceResponse = await getStockPrice(symbol);
        if (!priceResponse || priceResponse.price === null) {
            throw new Error(`Không thể lấy giá hiện tại cho mã ${symbol}`);
        }

        const currentPrice = priceResponse.price;

        // Tạo dữ liệu lịch sử mô phỏng
        const data = [];
        const numPoints = 30; // Số điểm dữ liệu
        const endDateObj = endDate ? new Date(endDate) : new Date();
        const startDateObj = startDate ? new Date(startDate) : new Date(endDateObj);
        startDateObj.setDate(startDateObj.getDate() - numPoints);

        let previousPrice = currentPrice * (1 - Math.random() * 0.1); // Bắt đầu với giá thấp hơn hiện tại

        for (let i = 0; i < numPoints; i++) {
            const date = new Date(startDateObj);
            date.setDate(date.getDate() + i);

            // Tạo biến động giá ngẫu nhiên (±3%)
            const changePercent = (Math.random() - 0.5) * 0.06;
            const closePrice = previousPrice * (1 + changePercent);

            // Tạo giá mở cửa, cao nhất, thấp nhất
            const openPrice = previousPrice * (1 + (Math.random() - 0.5) * 0.02);
            const amplitude = closePrice * 0.02; // Biên độ dao động 2%
            const highPrice = Math.max(closePrice, openPrice) + Math.random() * amplitude;
            const lowPrice = Math.min(closePrice, openPrice) - Math.random() * amplitude;

            // Tính toán thay đổi giá
            const change = closePrice - previousPrice;
            const pctChange = (change / previousPrice) * 100;

            // Tạo khối lượng giao dịch ngẫu nhiên
            const volume = Math.floor(100000 + Math.random() * 900000);

            data.push({
                date: date.toISOString().split('T')[0],
                open: openPrice,
                high: highPrice,
                low: lowPrice,
                close: closePrice,
                volume: volume,
                change: change,
                pct_change: pctChange
            });

            previousPrice = closePrice;
        }

        return {
            symbol,
            source,
            interval,
            start_date: startDateObj.toISOString().split('T')[0],
            end_date: endDateObj.toISOString().split('T')[0],
            data
        };
    } catch (error) {
        console.error(`Lỗi khi lấy dữ liệu lịch sử giá của ${symbol}:`, error);
        return {
            symbol,
            source,
            interval,
            start_date: startDate || '',
            end_date: endDate || '',
            data: [],
            error: `Lỗi khi lấy dữ liệu lịch sử giá của ${symbol}`
        };
    }
}

// Hàm hỗ trợ tạo dữ liệu ngẫu nhiên
function generateRandomChange(price: number): number {
    const changePercent = (Math.random() - 0.5) * 0.05; // ±2.5%
    return Math.round(price * changePercent * 100) / 100;
}

function generateRandomPercentage(): number {
    return Math.round((Math.random() - 0.5) * 5 * 100) / 100; // ±2.5%
}

function generateRandomVolume(): number {
    return Math.floor(100000 + Math.random() * 9900000); // 100K to 10M
}

/**
 * Hook prefetch để sử dụng với SWR hoặc React Query (nếu cần)
 */
export const stockApiService = {
    getStockPrice,
    getAllStocks,
    getRealtimeStocks,
    getStockHistory
};

export default stockApiService; 
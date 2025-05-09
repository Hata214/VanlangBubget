import axios from "@/lib/axios";

interface GoldPrice {
    type: string;
    brand: string;
    buy: number;
    sell: number;
    updated_at: string;
}

/**
 * Lấy giá vàng mới nhất từ các thương hiệu SJC, PNJ, DOJI
 * @returns Promise<GoldPrice[]> Mảng chứa thông tin giá vàng
 */
export const getLatestGoldPrices = async (): Promise<GoldPrice[]> => {
    try {
        // Gọi API của tygia.com
        const response = await axios.get('/api/gold/prices');
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy giá vàng:", error);
        throw error;
    }
};

/**
 * Lấy lịch sử giá vàng SJC trong khoảng thời gian
 * @param days Số ngày cần lấy dữ liệu (mặc định: 30)
 * @returns Promise<{date: string, price: number}[]> Mảng chứa thông tin lịch sử giá vàng
 */
export const getGoldPriceHistory = async (days: number = 30) => {
    try {
        const response = await axios.get(`/api/gold/history?days=${days}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử giá vàng:", error);
        throw error;
    }
};

/**
 * Lấy giá vàng dựa trên thương hiệu cụ thể
 * @param brand Thương hiệu vàng (SJC, PNJ, DOJI)
 * @returns Promise<GoldPrice[]> Thông tin giá vàng của thương hiệu
 */
export const getGoldPriceByBrand = async (brand: string): Promise<GoldPrice[]> => {
    try {
        const response = await axios.get(`/api/gold/prices/${brand}`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi khi lấy giá vàng ${brand}:`, error);
        throw error;
    }
}; 
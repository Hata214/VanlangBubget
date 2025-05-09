import { Investment } from '@/types/investment';

// Định nghĩa các kiểu dữ liệu
export interface StockTransaction {
    id?: string;
    symbol: string;
    price: number;
    quantity: number;
    fee: number;
    transactionDate: string;
    type: 'BUY' | 'SELL';
    notes?: string;
}

// Mô hình phản hồi API
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// Hàm lấy tổng quan về cổ phiếu của người dùng
export async function getUserStockSummary() {
    try {
        // Mô phỏng dữ liệu API
        return {
            totalInvestment: 100000000,
            currentValue: 120000000,
            profitLoss: 20000000,
            roi: 20,
            industries: [
                { name: 'Ngân hàng', value: 50000000, percentage: 41.7 },
                { name: 'Bất động sản', value: 30000000, percentage: 25 },
                { name: 'Công nghệ', value: 25000000, percentage: 20.8 },
                { name: 'Bán lẻ', value: 15000000, percentage: 12.5 }
            ]
        };
    } catch (error) {
        console.error('Lỗi khi lấy thông tin tổng quan:', error);
        throw error;
    }
}

// Hàm tạo giao dịch mua cổ phiếu
export async function createStockTransaction(transaction: StockTransaction): Promise<ApiResponse<StockTransaction>> {
    try {
        // Mô phỏng gọi API
        console.log('Gọi API với dữ liệu:', transaction);

        // Mô phỏng delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mô phỏng phản hồi thành công
        return {
            success: true,
            data: {
                ...transaction,
                id: Math.random().toString(36).substring(2, 15)
            },
            message: 'Giao dịch đã được tạo thành công'
        };
    } catch (error) {
        console.error('Lỗi khi tạo giao dịch:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Lỗi không xác định'
        };
    }
}

/**
 * Tạo một đầu tư mới vào cổ phiếu
 * @param investment Thông tin đầu tư
 * @returns Thông tin đầu tư đã được tạo
 */
export async function createInvestment(investment: Omit<Investment, 'id'>): Promise<Investment> {
    try {
        // Trong môi trường thực, đây sẽ là một cuộc gọi API đến máy chủ
        // Nhưng hiện tại chúng ta đang sử dụng mock, nên chỉ giả định thành công

        // Tạo ID ngẫu nhiên
        const id = Math.random().toString(36).substring(2, 15);

        console.log('Đã tạo đầu tư mới:', { ...investment, id });

        // Giả lập độ trễ mạng
        await new Promise(resolve => setTimeout(resolve, 800));

        // Trả về đầu tư với ID mới
        return {
            ...investment,
            id
        };
    } catch (error) {
        console.error('Lỗi khi tạo đầu tư:', error);
        throw new Error('Không thể tạo đầu tư. Vui lòng thử lại sau.');
    }
}

/**
 * Lấy danh sách tất cả các đầu tư
 * @returns Danh sách đầu tư
 */
export async function getInvestments(): Promise<Investment[]> {
    try {
        // Giả lập độ trễ mạng
        await new Promise(resolve => setTimeout(resolve, 800));

        // Trả về danh sách đầu tư mẫu
        return [
            {
                id: '1',
                symbol: 'VNM',
                quantity: 100,
                price: 86000,
                totalAmount: 8600000,
                date: new Date().toISOString().split('T')[0],
                notes: 'Đầu tư dài hạn'
            },
            {
                id: '2',
                symbol: 'FPT',
                quantity: 50,
                price: 95600,
                totalAmount: 4780000,
                date: new Date().toISOString().split('T')[0],
                notes: 'Cổ phiếu công nghệ'
            }
        ];
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đầu tư:', error);
        return [];
    }
}

export default {
    createInvestment,
    getInvestments
}; 
/**
 * Định nghĩa kiểu dữ liệu cho giao dịch đầu tư
 */
export interface InvestmentTransaction {
    id?: string;
    type: 'buy' | 'sell' | 'deposit' | 'withdraw' | 'dividend' | 'interest';
    amount?: number;
    price?: number;
    quantity?: number;
    fee?: number;
    date: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Định nghĩa kiểu dữ liệu cho khoản đầu tư
 */
export interface Investment {
    /** ID đầu tư duy nhất */
    id: string;
    /** ID người dùng sở hữu khoản đầu tư */
    userId: string;
    /** Tên khoản đầu tư */
    name: string;
    /** Loại đầu tư */
    type: 'stock' | 'crypto' | 'gold' | 'savings' | 'fund' | 'realestate' | 'other';
    /** Mã ký hiệu (nếu có) */
    symbol?: string;
    /** Danh mục tùy chỉnh */
    category?: string;
    /** Tổng vốn đầu tư ban đầu */
    initialInvestment: number;
    /** Giá trị hiện tại */
    currentValue: number;
    /** Tổng số lượng nắm giữ */
    totalQuantity: number;
    /** Giá thị trường hiện tại */
    currentPrice: number;
    /** Ngày bắt đầu đầu tư */
    startDate: string;
    /** Ghi chú bổ sung */
    notes?: string;
    /** Ngày tạo */
    createdAt: string;
    /** Ngày cập nhật */
    updatedAt: string;
    /** Lãi/lỗ (currentValue - initialInvestment) */
    profitLoss: number;
    /** Tỷ suất lợi nhuận (%) */
    roi: number;
    /** Danh sách giao dịch */
    transactions: InvestmentTransaction[];
}

/**
 * Định nghĩa dữ liệu để tạo khoản đầu tư
 */
export interface CreateInvestmentData {
    name: string;
    type: string;
    symbol?: string;
    category?: string;
    startDate?: string;
    notes?: string;
    initialInvestment?: number;
    currentPrice?: number;
}

/**
 * Định nghĩa dữ liệu để cập nhật khoản đầu tư
 */
export interface UpdateInvestmentData {
    name?: string;
    category?: string;
    notes?: string;
    currentPrice?: number;
}

/**
 * Định nghĩa dữ liệu tổng quan đầu tư
 */
export interface InvestmentSummary {
    totalInitialInvestment: number;
    totalCurrentValue: number;
    totalProfitLoss: number;
    overallROI: number;
    count: number;
    byType: {
        [key: string]: {
            count: number;
            initialInvestment: number;
            currentValue: number;
            profitLoss: number;
            roi: number;
        }
    };
}

/**
 * Định nghĩa bộ lọc cho đầu tư
 */
export interface InvestmentFilters {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
} 
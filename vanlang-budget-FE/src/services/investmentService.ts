import api, { getToken, formatTokenForHeader, getAuthHeader } from './api';
// import axios từ api nếu cần
import { API_URL } from './api';
import type {
    Investment,
    InvestmentTransaction,
    CreateInvestmentData,
    UpdateInvestmentData,
    InvestmentSummary,
    InvestmentFilters
} from '@/types/investment';
import axios from 'axios';

// Chuyển đổi định dạng ngày
const formatDateString = (dateString?: string | Date): string | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

// Interface cho dữ liệu tổng quan đầu tư cổ phiếu
export interface StockSummary {
    totalInvestment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
    industries: {
        name: string;
        value: number;
        percentage: number;
    }[];
    performanceHistory: {
        date: string;
        value: number;
    }[];
    topStocks: {
        symbol: string;
        name: string;
        profitLoss: number;
        percentage: number;
    }[];
}

// Interface cho dữ liệu đầu tư cổ phiếu
export interface StockInvestment {
    symbol: string;
    price: number;
    quantity: number;
    purchaseDate: string;
    fee: number;
    broker: string;
    notes?: string;
}

// Interface cho giao dịch cổ phiếu
export interface StockTransaction {
    type: 'buy' | 'sell';
    price: number;
    quantity: number;
    date: string;
    fee?: number;
    notes?: string;
}

export const investmentService = {
    /**
     * Lấy danh sách đầu tư của người dùng với phân trang và bộ lọc
     */
    async getAll(page = 1, limit = 10, filters: InvestmentFilters = {}): Promise<{
        data: Investment[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
    }> {
        try {
            console.log('investmentService.getAll: Fetching investments with filters:', filters);

            // Xây dựng params từ filters
            const params: Record<string, any> = { page, limit, ...filters };

            const response = await api.get('/api/investments', { params });
            console.log('investmentService.getAll: Raw response:', response.data);

            // Xử lý cấu trúc response
            let result;
            if (response.data && response.data.data) {
                if (Array.isArray(response.data.data)) {
                    result = {
                        data: response.data.data,
                        total: response.data.pagination?.total || response.data.data.length,
                        page: response.data.pagination?.page || page,
                        totalPages: response.data.pagination?.totalPages || 1,
                        limit: response.data.pagination?.limit || limit
                    };
                } else {
                    // Nếu data không phải mảng mà là object có data
                    result = response.data;
                }
            } else if (Array.isArray(response.data)) {
                // Nếu response.data là mảng trực tiếp
                result = {
                    data: response.data,
                    total: response.data.length,
                    page,
                    totalPages: 1,
                    limit
                };
            } else {
                console.warn('investmentService.getAll: Unexpected response format', response.data);
                result = {
                    data: [],
                    total: 0,
                    page,
                    totalPages: 0,
                    limit
                };
            }

            console.log('investmentService.getAll: Returning processed data:', result);
            return result;
        } catch (error) {
            console.error('investmentService.getAll: Error fetching investments', error);
            throw error;
        }
    },

    /**
     * Lấy thông tin chi tiết của một khoản đầu tư
     */
    async getById(id: string): Promise<Investment | null> {
        try {
            console.log(`investmentService.getById: Fetching investment with id ${id}`);
            const response = await api.get<{ data: Investment }>(`/api/investments/${id}`);

            // Xử lý cấu trúc response
            let investmentData: Investment | null = null;
            if (response.data && response.data.data) {
                investmentData = response.data.data;
            } else {
                investmentData = response.data as any;
            }

            console.log(`investmentService.getById: Received data for id ${id}`, investmentData);
            return investmentData;
        } catch (error) {
            console.error(`investmentService.getById: Error fetching investment with id ${id}`, error);
            throw error;
        }
    },

    /**
     * Tạo khoản đầu tư mới
     */
    async create(data: CreateInvestmentData): Promise<Investment | null> {
        try {
            console.log('investmentService.create: Creating new investment', data);

            // Đảm bảo định dạng ngày đúng
            const formattedData = {
                ...data,
                startDate: formatDateString(data.startDate)
            };

            const response = await api.post<{ data: Investment }>('/api/investments', formattedData);

            // Xử lý cấu trúc response
            let createdInvestment: Investment | null = null;
            if (response.data && response.data.data) {
                createdInvestment = response.data.data;
            } else {
                createdInvestment = response.data as any;
            }

            console.log('investmentService.create: Successfully created investment', createdInvestment);
            return createdInvestment;
        } catch (error) {
            console.error('investmentService.create: Error creating investment', error);
            throw error;
        }
    },

    /**
     * Cập nhật khoản đầu tư
     */
    async update(id: string, data: UpdateInvestmentData): Promise<Investment | null> {
        try {
            console.log(`investmentService.update: Updating investment with id ${id}`, data);
            const response = await api.put<{ data: Investment }>(`/api/investments/${id}`, data);

            // Xử lý cấu trúc response
            let updatedInvestment: Investment | null = null;
            if (response.data && response.data.data) {
                updatedInvestment = response.data.data;
            } else {
                updatedInvestment = response.data as any;
            }

            console.log(`investmentService.update: Successfully updated investment id ${id}`, updatedInvestment);
            return updatedInvestment;
        } catch (error) {
            console.error(`investmentService.update: Error updating investment with id ${id}`, error);
            throw error;
        }
    },

    /**
     * Xóa khoản đầu tư
     */
    async delete(id: string): Promise<boolean> {
        try {
            console.log(`investmentService.delete: Deleting investment with id ${id}`);

            // Kiểm tra ID trước khi gửi yêu cầu
            if (!id || typeof id !== 'string' || id.trim() === '') {
                console.error('investmentService.delete: Invalid investment ID');
                throw new Error('ID khoản đầu tư không hợp lệ');
            }

            // Sửa API URL để khớp với cấu trúc backend
            const apiUrl = `/api/investments?id=${id}`;
            console.log(`investmentService.delete: API URL = ${apiUrl}`);

            // Gọi API với timeout ngắn hơn
            const response = await api.delete(apiUrl, { timeout: 5000 });

            console.log(`investmentService.delete: Server response:`, response.status, response.statusText);
            console.log(`investmentService.delete: Successfully deleted investment with id ${id}`, response.data);

            return true;
        } catch (error: any) {
            console.error(`investmentService.delete: Error deleting investment with id ${id}`, error);

            // Xử lý lỗi chi tiết hơn
            if (error.response) {
                console.error(`API response error: ${error.response.status} - ${error.response.statusText}`);
                console.error('Error data:', error.response.data);

                // Kiểm tra nếu là lỗi 404 (Not Found)
                if (error.response.status === 404) {
                    console.warn(`Investment with ID ${id} not found on server. It may have been deleted already.`);
                    return true; // Coi như đã xóa thành công nếu không tìm thấy
                }
            } else if (error.request) {
                console.error('Request was made but no response was received:', error.request);
            }

            throw error;
        }
    },

    /**
     * Thêm giao dịch vào khoản đầu tư
     */
    async addTransaction(investmentId: string, transaction: InvestmentTransaction): Promise<Investment | null> {
        try {
            console.log(`investmentService.addTransaction: Adding transaction to investment ${investmentId}`, transaction);

            // Đảm bảo định dạng ngày đúng
            const formattedTransaction = {
                ...transaction,
                date: formatDateString(transaction.date)
            };

            const response = await api.post<{ data: Investment }>(
                `/api/investments/${investmentId}/transactions`,
                formattedTransaction
            );

            // Xử lý cấu trúc response
            let updatedInvestment: Investment | null = null;
            if (response.data && response.data.data) {
                updatedInvestment = response.data.data;
            } else {
                updatedInvestment = response.data as any;
            }

            console.log(`investmentService.addTransaction: Successfully added transaction to investment ${investmentId}`, updatedInvestment);
            return updatedInvestment;
        } catch (error) {
            console.error(`investmentService.addTransaction: Error adding transaction to investment ${investmentId}`, error);
            throw error;
        }
    },

    /**
     * Xóa giao dịch khỏi khoản đầu tư
     */
    async deleteTransaction(investmentId: string, transactionId: string): Promise<Investment | null> {
        try {
            console.log(`investmentService.deleteTransaction: Deleting transaction ${transactionId} from investment ${investmentId}`);
            const response = await api.delete<{ data: Investment }>(
                `/api/investments/${investmentId}/transactions/${transactionId}`
            );

            // Xử lý cấu trúc response
            let updatedInvestment: Investment | null = null;
            if (response.data && response.data.data) {
                updatedInvestment = response.data.data;
            } else {
                updatedInvestment = response.data as any;
            }

            console.log(`investmentService.deleteTransaction: Successfully deleted transaction ${transactionId}`, updatedInvestment);
            return updatedInvestment;
        } catch (error) {
            console.error(`investmentService.deleteTransaction: Error deleting transaction ${transactionId}`, error);
            throw error;
        }
    },

    /**
     * Cập nhật giá hiện tại của khoản đầu tư
     */
    async updateCurrentPrice(id: string, currentPrice: number): Promise<Investment | null> {
        try {
            console.log(`investmentService.updateCurrentPrice: Updating price for investment ${id} to ${currentPrice}`);
            return await this.update(id, { currentPrice });
        } catch (error) {
            console.error(`investmentService.updateCurrentPrice: Error updating price for investment ${id}`, error);
            throw error;
        }
    },

    /**
     * Lấy tổng quan đầu tư của người dùng
     */
    async getSummary(): Promise<InvestmentSummary | null> {
        try {
            console.log('investmentService.getSummary: Fetching investment summary');
            const response = await api.get<{ data: InvestmentSummary }>('/api/investments/summary');

            // Xử lý cấu trúc response
            let summaryData: InvestmentSummary | null = null;
            if (response.data && response.data.data) {
                summaryData = response.data.data;
            } else {
                summaryData = response.data as any;
            }

            console.log('investmentService.getSummary: Received summary data', summaryData);
            return summaryData;
        } catch (error) {
            console.error('investmentService.getSummary: Error fetching investment summary', error);
            throw error;
        }
    },

    /**
     * Lấy danh sách đầu tư theo loại
     */
    async getByType(type: string): Promise<Investment[]> {
        try {
            console.log(`investmentService.getByType: Fetching investments with type ${type}`);
            const response = await api.get<{ data: Investment[] }>(`/api/investments/type/${type}`);

            // Xử lý cấu trúc response
            let investmentsData: Investment[] = [];
            if (response.data && response.data.data) {
                investmentsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                investmentsData = response.data;
            } else {
                investmentsData = [];
            }

            console.log(`investmentService.getByType: Received data for type ${type}`, investmentsData);
            return investmentsData;
        } catch (error) {
            console.error(`investmentService.getByType: Error fetching investments with type ${type}`, error);
            throw error;
        }
    },

    // Các phương thức đặc thù cho cổ phiếu

    /**
     * Lấy tổng quan đầu tư cổ phiếu
     */
    async getUserStockSummary(): Promise<StockSummary> {
        try {
            console.log("investmentService.getUserStockSummary: Đang gọi API để lấy tổng quan cổ phiếu...");
            const response = await api.get('/api/investments/stocks/summary');

            // Xử lý response
            let summaryData: StockSummary;
            if (response.data && response.data.data) {
                summaryData = response.data.data;
            } else {
                summaryData = response.data;
            }

            if (!summaryData) {
                summaryData = {
                    totalInvestment: 0,
                    currentValue: 0,
                    profitLoss: 0,
                    roi: 0,
                    industries: [],
                    performanceHistory: [],
                    topStocks: []
                };
            }

            return summaryData;
        } catch (error) {
            console.error("investmentService.getUserStockSummary: Lỗi khi lấy tổng quan cổ phiếu:", error);
            return {
                totalInvestment: 0,
                currentValue: 0,
                profitLoss: 0,
                roi: 0,
                industries: [],
                performanceHistory: [],
                topStocks: []
            };
        }
    },

    /**
     * Tạo giao dịch cổ phiếu mới
     */
    async createStockTransaction(stockSymbol: string, transactionData: StockTransaction): Promise<Investment | null> {
        try {
            console.log(`investmentService.createStockTransaction: Creating stock transaction for ${stockSymbol}`, transactionData);
            const response = await api.post<{ data: Investment }>(`/api/investments/stocks/${stockSymbol}/transactions`, transactionData);

            let result: Investment | null = null;
            if (response.data && response.data.data) {
                result = response.data.data;
            } else {
                result = response.data as any;
            }

            return result;
        } catch (error) {
            console.error(`investmentService.createStockTransaction: Error creating stock transaction for ${stockSymbol}`, error);
            throw error;
        }
    },

    /**
     * Lấy danh sách cổ phiếu của người dùng
     */
    async getUserStocks(): Promise<Investment[]> {
        try {
            console.log('investmentService.getUserStocks: Fetching user stocks');
            return await this.getByType('stock');
        } catch (error) {
            console.error('investmentService.getUserStocks: Error fetching user stocks', error);
            throw error;
        }
    },

    /**
     * Thêm cổ phiếu mới
     */
    async addStockInvestment(stockData: StockInvestment): Promise<Investment | null> {
        try {
            console.log('investmentService.addStockInvestment: Adding new stock investment', stockData);

            // Tính toán vốn đầu tư ban đầu (bao gồm phí)
            const initialInvestment = stockData.price * stockData.quantity + (stockData.fee || 0);

            // Đảm bảo dữ liệu gửi đi đúng với schema của backend
            const investmentData = {
                name: `Cổ phiếu ${stockData.symbol}`, // Tên có ý nghĩa hơn
                type: 'stock',
                symbol: stockData.symbol.toUpperCase(), // Đảm bảo symbol viết hoa
                category: 'Chứng khoán', // Thêm category mặc định bằng tiếng Việt
                startDate: formatDateString(stockData.purchaseDate), // Đảm bảo định dạng ISO
                notes: stockData.notes || '',
                initialInvestment: initialInvestment, // Tổng giá trị đầu tư bao gồm phí
                currentPrice: stockData.price
            };

            console.log('investmentService.addStockInvestment: Formatted data', JSON.stringify(investmentData, null, 2));

            // Gọi API trực tiếp thay vì qua phương thức create
            const response = await api.post<{ data: Investment }>('/api/investments', investmentData);

            console.log('investmentService.addStockInvestment: API response', response.status, response.statusText);

            // Xử lý response
            let createdInvestment: Investment | null = null;
            if (response.data && response.data.data) {
                createdInvestment = response.data.data;
            } else {
                createdInvestment = response.data as any;
            }

            console.log('investmentService.addStockInvestment: Created investment', createdInvestment);
            return createdInvestment;
        } catch (error: any) {
            console.error('investmentService.addStockInvestment: Error adding stock investment', error);
            // Log chi tiết hơn về lỗi nếu có
            if (error.response && error.response.data) {
                console.error('API Error details:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    },

    /**
     * Lấy danh sách giao dịch cổ phiếu của người dùng
     */
    async getUserStockTransactions(): Promise<any[]> {
        try {
            const response = await api.get('/api/investments/transactions/stocks');
            return response.data.data || response.data || [];
        } catch (error) {
            console.error('Error fetching stock transactions:', error);
            return [];
        }
    }
};

/**
 * Lấy danh sách đầu tư từ API
 * Được tối ưu để tránh vòng lặp vô hạn
 */
export const getInvestments = async (
    page = 1,
    limit = 10,
    filters: InvestmentFilters = {}
): Promise<any> => {
    try {
        console.log('getInvestments: Fetching investments with params:', { page, limit, ...filters });
        // Đảm bảo endpoint API chính xác
        const response = await api.get('/api/investments', {
            params: { page, limit, ...filters }
        });

        console.log('getInvestments: Raw response:', response);

        // Phân tích và xử lý dữ liệu một cách linh hoạt
        let investmentsData: any[] = [];

        if (response.data && response.data.data) {
            if (Array.isArray(response.data.data)) {
                investmentsData = response.data.data;
            } else {
                investmentsData = [response.data.data];
            }
        } else if (response.data && response.data.message) {
            if (Array.isArray(response.data.message)) {
                investmentsData = response.data.message;
            } else {
                investmentsData = [response.data.message];
            }
        } else if (Array.isArray(response.data)) {
            investmentsData = response.data;
        } else {
            console.warn('getInvestments: Unexpected response format:', response.data);
            investmentsData = [];
        }

        console.log(`getInvestments: Processed ${investmentsData.length} investment records`);
        return investmentsData;
    } catch (error) {
        console.error('getInvestments: Error fetching investments:', error);
        throw error;
    }
};

export const getInvestmentDetails = async (id: string): Promise<Investment | null> => {
    return await investmentService.getById(id);
};

export const createInvestment = async (data: CreateInvestmentData): Promise<Investment | null> => {
    return await investmentService.create(data);
};

export const updateInvestment = async (id: string, data: UpdateInvestmentData): Promise<Investment | null> => {
    return await investmentService.update(id, data);
};

export const deleteInvestment = async (id: string): Promise<boolean> => {
    try {
        return await investmentService.delete(id);
    } catch (error: any) {
        console.error(`deleteInvestment: Error deleting investment with id ${id}`, error);

        // Kiểm tra lỗi 404 và xử lý
        if (error.response && error.response.status === 404) {
            console.warn(`deleteInvestment: Investment with ID ${id} not found - assuming already deleted`);
            return true; // Trả về true nếu ID không tồn tại (coi như đã xóa)
        }

        throw error;
    }
};

export const addTransaction = async (investmentId: string, transaction: InvestmentTransaction): Promise<Investment | null> => {
    return await investmentService.addTransaction(investmentId, transaction);
};

export const deleteTransaction = async (investmentId: string, transactionId: string): Promise<Investment | null> => {
    return await investmentService.deleteTransaction(investmentId, transactionId);
};

export const updateCurrentPrice = async (id: string, currentPrice: number): Promise<Investment | null> => {
    return await investmentService.updateCurrentPrice(id, currentPrice);
};

export const getUserStockSummary = async (): Promise<StockSummary> => {
    return await investmentService.getUserStockSummary();
};

export const getInvestmentSummary = async (): Promise<InvestmentSummary | null> => {
    return await investmentService.getSummary();
};

export const getUserStocks = async (): Promise<Investment[]> => {
    return await investmentService.getUserStocks();
};

export const createStockTransaction = async (stockSymbol: string, transactionData: StockTransaction): Promise<Investment | null> => {
    return await investmentService.createStockTransaction(stockSymbol, transactionData);
};

export const addStockInvestment = async (stockData: StockInvestment): Promise<Investment | null> => {
    return await investmentService.addStockInvestment(stockData);
};

export const getUserStockTransactions = async (): Promise<any[]> => {
    try {
        const response = await api.get('/api/investments/transactions/stocks');
        return response.data.data || response.data || [];
    } catch (error) {
        console.error('Error fetching stock transactions:', error);
        return [];
    }
};

export default investmentService;
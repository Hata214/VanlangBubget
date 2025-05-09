import api from './api'
import type { Loan, LoanPayment } from '@/types'

export type CreateLoanData = Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
export type UpdateLoanData = Partial<Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>>
export type CreateLoanPaymentData = Omit<LoanPayment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
export type UpdateLoanPaymentData = Partial<Omit<LoanPayment, 'id' | 'createdAt' | 'updatedAt'>>

// Định nghĩa kiểu response từ API
interface LoanResponse {
    status: string;
    results: number;
    total: number;
    page: number;
    pages: number;
    data: Loan[];
}

export const loanService = {
    /**
     * Lấy tất cả các khoản vay
     */
    async getAll() {
        console.log('loanService: Fetching all loans');
        try {
            const response = await api.get('/api/loans');
            console.log('loanService: Raw loan response:', response.status, typeof response.data);

            // Kiểm tra cấu trúc response
            const data = response.data;

            if (data && typeof data === 'object') {
                // Nếu API trả về cấu trúc mới (có data array)
                if ('data' in data && Array.isArray(data.data)) {
                    console.log(`loanService: Received structured response with ${data.data.length} loans`);
                    // Trả về toàn bộ cấu trúc response
                    return data;
                } else if (Array.isArray(data)) {
                    // Nếu API trả về mảng trực tiếp
                    console.log(`loanService: Received array response with ${data.length} loans`);
                    return data;
                }
            }

            console.warn('loanService: Unexpected response format:', data);
            return data || []; // Trả về dữ liệu hoặc mảng rỗng
        } catch (error: any) {
            console.error('loanService: Error fetching loans:', error.message);
            console.error('loanService: Error details:', error.response?.data);
            throw error;
        }
    },

    async getById(id: string): Promise<Loan> {
        console.log(`loanService: Fetching loan with id: ${id}`);
        try {
            const response = await api.get<{ status: string, data: Loan }>(`/api/loans/${id}`);

            // Kiểm tra cấu trúc response
            if (response.data && typeof response.data === 'object') {
                if ('data' in response.data && response.data.data) {
                    // Nếu API trả về dạng { data: Loan }
                    console.log('loanService: Received loan in data property');
                    return response.data.data;
                } else {
                    // Nếu API trả về Loan trực tiếp
                    console.log('loanService: Received loan directly');
                    return response.data as any;
                }
            }

            console.warn('loanService: Unexpected loan format:', response.data);
            return response.data as any;
        } catch (error: any) {
            console.error(`loanService: Error fetching loan ${id}:`, error.message);
            console.error('loanService: Error details:', error.response?.data);
            throw error;
        }
    },

    async create(data: CreateLoanData): Promise<Loan> {
        console.log('loanService: Creating new loan with data:', data);
        try {
            const response = await api.post<{ status: string, data: Loan }>('/api/loans', data);

            // Kiểm tra cấu trúc response
            if (response.data && typeof response.data === 'object') {
                if ('data' in response.data) {
                    // Nếu API trả về dạng { data: Loan }
                    console.log('loanService: Loan created successfully with ID:', response.data.data.id);
                    return response.data.data;
                } else {
                    // Nếu API trả về Loan trực tiếp
                    console.log('loanService: Loan created successfully with ID:', (response.data as Loan).id);
                    return response.data as Loan;
                }
            }

            console.warn('loanService: Unexpected created loan format:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('loanService: Error creating loan:', error.message);
            console.error('loanService: Error details:', error.response?.data);
            throw error;
        }
    },

    async update(id: string, data: UpdateLoanData): Promise<Loan> {
        console.log(`loanService: Updating loan ${id} with data:`, data);
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid update data');
            }

            // Deep clone dữ liệu ban đầu để tránh biến đổi tham chiếu
            const inputData = JSON.parse(JSON.stringify(data));

            // Kiểm tra dữ liệu trước khi gửi
            let hasValidData = false;
            let onlyHasStatus = true;
            let fieldCount = 0;

            // Kiểm tra xem dữ liệu có rỗng không hoặc chỉ có status
            for (const key in inputData) {
                if (inputData[key] !== undefined) {
                    fieldCount++;
                    hasValidData = true;
                    if (key !== 'status') {
                        onlyHasStatus = false;
                    }
                }
            }

            // Loại bỏ các trường không tồn tại (undefined) để tránh lỗi khi cập nhật
            const filteredData: Record<string, any> = {};

            for (const key in inputData) {
                if (inputData[key] !== undefined) {
                    filteredData[key] = inputData[key];
                }
            }

            // Log thông tin chi tiết
            console.log(`loanService: Status check - hasValidData: ${hasValidData}, onlyHasStatus: ${onlyHasStatus}, fieldCount: ${fieldCount}`);
            console.log(`loanService: Filtered data for update:`, filteredData);

            // Thêm trường _forceUpdate nếu dữ liệu quá nghèo nàn
            if (!hasValidData || onlyHasStatus || fieldCount < 2) {
                filteredData._forceUpdate = true;
                console.log(`loanService: Adding _forceUpdate flag to prevent validation error`);
            }

            // Chuẩn hóa trạng thái
            if (filteredData.status === null || filteredData.status === undefined) {
                filteredData.status = 'ACTIVE';
                console.log(`loanService: Setting default status: ACTIVE`);
            } else if (typeof filteredData.status === 'string') {
                filteredData.status = filteredData.status.toUpperCase();
                console.log(`loanService: Normalized status to uppercase: ${filteredData.status}`);
            }

            // Gửi dữ liệu đã lọc và chuẩn hóa
            console.log(`loanService: Sending final data for update:`, filteredData);
            const response = await api.put<{ status: string, data: Loan }>(`/api/loans/${id}`, filteredData);

            console.log(`loanService: Response received:`, response);

            if (!response.data) {
                throw new Error('No response data received');
            }

            // Kiểm tra và xử lý response
            let result: Loan;
            if (typeof response.data === 'object') {
                if ('data' in response.data && response.data.data) {
                    result = response.data.data;
                } else {
                    // Chuyển đổi an toàn hơn, sử dụng unknown trước
                    result = response.data as unknown as Loan;
                }
            } else {
                throw new Error('Invalid response format');
            }

            // Chuẩn hóa lại trạng thái thành chữ hoa để phù hợp với Frontend
            if (result && result.status) {
                result.status = result.status.toUpperCase() as any;
                console.log(`loanService: Normalized response status to uppercase: ${result.status}`);
            }

            return result;
        } catch (error: any) {
            console.error(`loanService: Error updating loan ${id}:`, error.message);
            console.error('loanService: Error details:', error.response?.data);
            throw error;
        }
    },

    async delete(id: string): Promise<void> {
        console.log(`loanService: Deleting loan with id: ${id}`);
        try {
            await api.delete(`/api/loans/${id}`);
            console.log(`loanService: Loan ${id} deleted successfully`);
        } catch (error: any) {
            console.error(`loanService: Error deleting loan ${id}:`, error.message);
            console.error('loanService: Error details:', error.response?.data);
            throw error;
        }
    },

    async getPayments(loanId: string): Promise<LoanPayment[]> {
        console.log(`loanService: Fetching payments for loan: ${loanId}`);
        try {
            const response = await api.get<LoanPayment[]>(`/api/loans/${loanId}/payments`);
            console.log(`loanService: Retrieved ${response.data.length} payments for loan ${loanId}`);
            return response.data;
        } catch (error: any) {
            console.error(`loanService: Error fetching payments for loan ${loanId}:`, error.message);
            console.error('loanService: Error details:', error.response?.data);
            throw error;
        }
    },

    async addPayment(loanId: string, data: CreateLoanPaymentData): Promise<LoanPayment> {
        console.log(`loanService: Adding payment to loan ${loanId} with data:`, data);
        try {
            const response = await api.post<LoanPayment>(`/api/loans/${loanId}/payments`, data);
            console.log(`loanService: Payment added successfully to loan ${loanId}`);
            return response.data;
        } catch (error: any) {
            console.error(`loanService: Error adding payment to loan ${loanId}:`, error.message);
            console.error('loanService: Error details:', error.response?.data);
            throw error;
        }
    },

    async updatePayment(loanId: string, paymentId: string, data: UpdateLoanPaymentData): Promise<LoanPayment> {
        console.log(`loanService: Updating payment ${paymentId} for loan ${loanId} with data:`, data);
        try {
            const response = await api.put<LoanPayment>(`/api/loans/${loanId}/payments/${paymentId}`, data);
            console.log(`loanService: Payment ${paymentId} updated successfully`);
            return response.data;
        } catch (error: any) {
            console.error(`loanService: Error updating payment ${paymentId}:`, error.message);
            console.error('loanService: Error details:', error.response?.data);
            throw error;
        }
    },

    async deletePayment(loanId: string, paymentId: string): Promise<void> {
        console.log(`loanService: Deleting payment ${paymentId} from loan ${loanId}`);
        try {
            await api.delete(`/api/loans/${loanId}/payments/${paymentId}`);
            console.log(`loanService: Payment ${paymentId} deleted successfully`);
        } catch (error: any) {
            console.error(`loanService: Error deleting payment ${paymentId}:`, error.message);
            console.error('loanService: Error details:', error.response?.data);
            throw error;
        }
    },

    async uploadAttachment(loanId: string, paymentId: string, file: File): Promise<string> {
        console.log(`loanService: Uploading attachment for payment ${paymentId} in loan ${loanId}`);
        try {
            const formData = new FormData();
            formData.append('attachment', file);

            const response = await api.post(
                `/api/loans/${loanId}/payments/${paymentId}/attachments`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            console.log(`loanService: Attachment uploaded successfully for payment ${paymentId}`);
            return response.data.url;
        } catch (error: any) {
            console.error(`loanService: Error uploading attachment for payment ${paymentId}:`, error.message);
            console.error('loanService: Error details:', error.response?.data);
            throw error;
        }
    },
} 
import axios from 'axios';
import { LoanPayment } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const loanPaymentService = {
    getAll: async (loanId: string): Promise<LoanPayment[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/loans/${loanId}/payments`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getById: async (loanId: string, paymentId: string): Promise<LoanPayment> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/loans/${loanId}/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    create: async (loanId: string, data: Omit<LoanPayment, 'id' | 'loanId' | 'createdAt' | 'updatedAt'>): Promise<LoanPayment> => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/loans/${loanId}/payments`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    update: async (loanId: string, paymentId: string, data: Partial<Omit<LoanPayment, 'id' | 'loanId' | 'createdAt' | 'updatedAt'>>): Promise<LoanPayment> => {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/loans/${loanId}/payments/${paymentId}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    delete: async (loanId: string, paymentId: string): Promise<void> => {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/loans/${loanId}/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    uploadAttachment: async (loanId: string, paymentId: string, file: File): Promise<{ attachmentUrl: string }> => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
            `${API_URL}/loans/${loanId}/payments/${paymentId}/attachment`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return response.data;
    }
};

export default loanPaymentService; 
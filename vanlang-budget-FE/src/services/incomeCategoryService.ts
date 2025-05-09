import axios from 'axios';
import { IncomeCategory } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const incomeCategoryService = {
    getAll: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/income-categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    create: async (data: Omit<IncomeCategory, 'id'>) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/income-categories`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    update: async (id: string, data: Partial<IncomeCategory>) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_URL}/income-categories/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    delete: async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/income-categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            throw error;
        }
    }
};

export default incomeCategoryService; 
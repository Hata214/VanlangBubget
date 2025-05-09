import axios from 'axios';
import { ExpenseCategory } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const expenseCategoryService = {
    getAll: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/expense-categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    create: async (data: Omit<ExpenseCategory, 'id'>) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/expense-categories`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    update: async (id: string, data: Partial<ExpenseCategory>) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_URL}/expense-categories/${id}`, data, {
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
            await axios.delete(`${API_URL}/expense-categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            throw error;
        }
    },

    getById: async (id: string) => {
        const response = await axios.get(`${API_URL}/expense-categories/${id}`);
        return response.data;
    }
};

export default expenseCategoryService; 
import api from './api'
import type { Budget } from '@/types'

interface CreateBudgetData {
    category: string
    amount: number
    month: number
    year: number
}

export const budgetService = {
    async getAll(month: number, year: number): Promise<Budget[]> {
        const response = await api.get<Budget[]>(`/budgets?month=${month}&year=${year}`)
        return response.data
    },

    async getById(id: string): Promise<Budget> {
        const response = await api.get<Budget>(`/budgets/${id}`)
        return response.data
    },

    async create(data: CreateBudgetData): Promise<Budget> {
        const response = await api.post<Budget>('/budgets', data)
        return response.data
    },

    async update(id: string, data: Partial<CreateBudgetData>): Promise<Budget> {
        const response = await api.put<Budget>(`/budgets/${id}`, data)
        return response.data
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/budgets/${id}`)
    },

    async getByCategory(category: string, month: number, year: number): Promise<Budget[]> {
        const response = await api.get<Budget[]>(`/budgets/category/${category}`, {
            params: { month, year },
        })
        return response.data
    },
} 
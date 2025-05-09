import api from './api'
import type { Income, Expense, Loan } from '@/types'

interface ReportData {
    incomes: {
        total: number
        byCategory: Record<string, number>
        byMonth: Record<string, number>
    }
    expenses: {
        total: number
        byCategory: Record<string, number>
        byMonth: Record<string, number>
        byLocation?: Record<string, number>
    }
    loans: {
        total: number
        active: number
        paid: number
        overdue: number
    }
    budgets: {
        planned: number
        actual: number
        variance: number
        byCategory: Record<string, {
            planned: number
            actual: number
            variance: number
        }>
    }
}

export const reportService = {
    async getReport(startDate: string, endDate: string): Promise<ReportData> {
        const response = await api.get<ReportData>('/api/reports', {
            params: { startDate, endDate }
        })
        return response.data
    },

    async exportReport(startDate: string, endDate: string, format: 'pdf' | 'excel' = 'pdf') {
        const response = await api.get('/api/reports/export', {
            params: { startDate, endDate, format },
            responseType: 'blob'
        })

        // Tạo URL cho file và tải xuống
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `report-${startDate}-to-${endDate}.${format}`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    },

    async getTrends(months: number = 12) {
        const response = await api.get('/api/reports/trends', {
            params: { months }
        })
        return response.data
    },

    async getAnalytics(startDate: string, endDate: string) {
        const response = await api.get('/api/reports/analytics', {
            params: { startDate, endDate }
        })
        return response.data
    }
} 
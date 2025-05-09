import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { reportService } from '@/services/reportService'

interface TrendData {
    labels: string[]
    incomes: number[]
    expenses: number[]
    savings: number[]
}

interface AnalyticsData {
    totalIncome: number
    totalExpense: number
    totalSavings: number
    incomeByCategory: Record<string, number>
    expenseByCategory: Record<string, number>
    savingsRate: number
}

export interface ReportState {
    data: any | null
    trends: TrendData | null
    analytics: AnalyticsData | null
    isLoading: boolean
    error: string | null
}

const initialState: ReportState = {
    data: null,
    trends: null,
    analytics: null,
    isLoading: false,
    error: null,
}

export const getReport = createAsyncThunk(
    'report/getReport',
    async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
        const response = await reportService.getReport(startDate, endDate)
        return response
    }
)

export const fetchTrends = createAsyncThunk(
    'report/fetchTrends',
    async (months: number = 12) => {
        const response = await reportService.getTrends(months)
        return response
    }
)

export const fetchAnalytics = createAsyncThunk(
    'report/fetchAnalytics',
    async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
        const response = await reportService.getAnalytics(startDate, endDate)
        return response
    }
)

export const exportReport = createAsyncThunk(
    'report/exportReport',
    async ({
        startDate,
        endDate,
        format,
    }: {
        startDate: string
        endDate: string
        format: 'pdf' | 'excel'
    }) => {
        await reportService.exportReport(startDate, endDate, format)
        return true
    }
)

const reportSlice = createSlice({
    name: 'report',
    initialState,
    reducers: {
        clearReportData: (state) => {
            state.data = null
            state.trends = null
            state.analytics = null
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            // Get Report
            .addCase(getReport.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(getReport.fulfilled, (state, action) => {
                state.isLoading = false
                state.data = action.payload
            })
            .addCase(getReport.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Fetch trends
            .addCase(fetchTrends.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchTrends.fulfilled, (state, action) => {
                state.isLoading = false
                state.trends = action.payload
            })
            .addCase(fetchTrends.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra khi tải dữ liệu xu hướng'
            })
            // Fetch analytics
            .addCase(fetchAnalytics.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchAnalytics.fulfilled, (state, action) => {
                state.isLoading = false
                state.analytics = action.payload
            })
            .addCase(fetchAnalytics.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra khi tải dữ liệu phân tích'
            })
            // Export Report
            .addCase(exportReport.rejected, (state, action) => {
                state.error = action.error.message || 'Xuất báo cáo thất bại'
            })
    },
})

export const { clearReportData } = reportSlice.actions
export default reportSlice.reducer 
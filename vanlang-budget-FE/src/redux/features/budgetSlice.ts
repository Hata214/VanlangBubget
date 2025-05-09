import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { Budget } from '@/types'
import api from '@/services/api'

interface BudgetState {
    budgets: Budget[]
    isLoading: boolean
    error: string | null
}

const initialState: BudgetState = {
    budgets: [],
    isLoading: false,
    error: null,
}

export const fetchBudgets = createAsyncThunk(
    'budget/fetchBudgets',
    async ({ month, year }: { month: number; year: number }) => {
        const response = await api.get(`/budgets?month=${month}&year=${year}`)
        return response.data
    }
)

export const addBudget = createAsyncThunk(
    'budget/addBudget',
    async (budget: Omit<Budget, 'id' | 'userId' | 'spent' | 'createdAt' | 'updatedAt'>) => {
        const response = await api.post('/budgets', budget)
        return response.data
    }
)

export const updateBudget = createAsyncThunk(
    'budget/updateBudget',
    async ({ id, ...budget }: { id: string } & Partial<Budget>) => {
        const response = await api.put(`/budgets/${id}`, budget)
        return response.data
    }
)

export const deleteBudget = createAsyncThunk(
    'budget/deleteBudget',
    async (id: string) => {
        await api.delete(`/budgets/${id}`)
        return id
    }
)

const budgetSlice = createSlice({
    name: 'budget',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch budgets
            .addCase(fetchBudgets.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchBudgets.fulfilled, (state, action: PayloadAction<Budget[]>) => {
                state.isLoading = false
                state.budgets = action.payload
            })
            .addCase(fetchBudgets.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Add budget
            .addCase(addBudget.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(addBudget.fulfilled, (state, action: PayloadAction<Budget>) => {
                state.isLoading = false
                state.budgets.push(action.payload)
            })
            .addCase(addBudget.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Update budget
            .addCase(updateBudget.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateBudget.fulfilled, (state, action: PayloadAction<Budget>) => {
                state.isLoading = false
                const index = state.budgets.findIndex((budget) => budget.id === action.payload.id)
                if (index !== -1) {
                    state.budgets[index] = action.payload
                }
            })
            .addCase(updateBudget.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Delete budget
            .addCase(deleteBudget.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteBudget.fulfilled, (state, action: PayloadAction<string>) => {
                state.isLoading = false
                state.budgets = state.budgets.filter((budget) => budget.id !== action.payload)
            })
            .addCase(deleteBudget.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
    },
})

export default budgetSlice.reducer 
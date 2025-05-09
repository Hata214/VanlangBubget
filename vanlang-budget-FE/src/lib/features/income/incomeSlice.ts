import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import axios from '@/lib/axios'

interface Income {
    id: string
    amount: number
    description: string
    category: string
    date: string
}

interface IncomeState {
    incomes: Income[]
    isLoading: boolean
    error: string | null
}

const initialState: IncomeState = {
    incomes: [],
    isLoading: false,
    error: null,
}

export const fetchIncomes = createAsyncThunk(
    'income/fetchIncomes',
    async () => {
        const response = await axios.get('/api/incomes')
        return response.data
    }
)

export const addIncome = createAsyncThunk(
    'income/addIncome',
    async (income: Omit<Income, 'id'>) => {
        const response = await axios.post('/api/incomes', income)
        return response.data
    }
)

export const updateIncome = createAsyncThunk(
    'income/updateIncome',
    async ({ id, ...income }: Income) => {
        const response = await axios.put(`/api/incomes/${id}`, income)
        return response.data
    }
)

export const deleteIncome = createAsyncThunk(
    'income/deleteIncome',
    async (id: string) => {
        await axios.delete(`/api/incomes/${id}`)
        return id
    }
)

const incomeSlice = createSlice({
    name: 'income',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch incomes
            .addCase(fetchIncomes.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchIncomes.fulfilled, (state, action: PayloadAction<Income[]>) => {
                state.isLoading = false
                state.incomes = action.payload
            })
            .addCase(fetchIncomes.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Add income
            .addCase(addIncome.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(addIncome.fulfilled, (state, action: PayloadAction<Income>) => {
                state.isLoading = false
                state.incomes.push(action.payload)
            })
            .addCase(addIncome.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Update income
            .addCase(updateIncome.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateIncome.fulfilled, (state, action: PayloadAction<Income>) => {
                state.isLoading = false
                const index = state.incomes.findIndex((income) => income.id === action.payload.id)
                if (index !== -1) {
                    state.incomes[index] = action.payload
                }
            })
            .addCase(updateIncome.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Delete income
            .addCase(deleteIncome.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteIncome.fulfilled, (state, action: PayloadAction<string>) => {
                state.isLoading = false
                state.incomes = state.incomes.filter((income) => income.id !== action.payload)
            })
            .addCase(deleteIncome.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
    },
})

export default incomeSlice.reducer 
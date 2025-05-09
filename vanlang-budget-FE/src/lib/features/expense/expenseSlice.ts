import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import axios from '@/lib/axios'

interface Location {
    lat: number
    lng: number
    address: string
}

interface Expense {
    id: string
    amount: number
    description: string
    category: string
    date: string
    location?: Location
}

interface ExpenseState {
    expenses: Expense[]
    totalExpense: number
    isLoading: boolean
    error: string | null
}

const initialState: ExpenseState = {
    expenses: [],
    totalExpense: 0,
    isLoading: false,
    error: null,
}

export const fetchExpenses = createAsyncThunk(
    'expense/fetchExpenses',
    async () => {
        const response = await axios.get('/api/expenses')
        return response.data
    }
)

export const addExpense = createAsyncThunk(
    'expense/addExpense',
    async (expense: Omit<Expense, 'id'>) => {
        const response = await axios.post('/api/expenses', expense)
        return response.data
    }
)

export const updateExpense = createAsyncThunk(
    'expense/updateExpense',
    async ({ id, ...expense }: Expense) => {
        const response = await axios.put(`/api/expenses/${id}`, expense)
        return response.data
    }
)

export const deleteExpense = createAsyncThunk(
    'expense/deleteExpense',
    async (id: string) => {
        await axios.delete(`/api/expenses/${id}`)
        return id
    }
)

const expenseSlice = createSlice({
    name: 'expense',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch expenses
            .addCase(fetchExpenses.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchExpenses.fulfilled, (state, action: PayloadAction<Expense[]>) => {
                state.isLoading = false
                state.expenses = action.payload
                state.totalExpense = action.payload.reduce((total, expense) => total + expense.amount, 0)
            })
            .addCase(fetchExpenses.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Add expense
            .addCase(addExpense.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(addExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
                state.isLoading = false
                state.expenses.push(action.payload)
                state.totalExpense += action.payload.amount
            })
            .addCase(addExpense.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Update expense
            .addCase(updateExpense.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
                state.isLoading = false
                const index = state.expenses.findIndex((expense) => expense.id === action.payload.id)
                if (index !== -1) {
                    state.totalExpense = state.totalExpense - state.expenses[index].amount + action.payload.amount
                    state.expenses[index] = action.payload
                }
            })
            .addCase(updateExpense.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Delete expense
            .addCase(deleteExpense.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteExpense.fulfilled, (state, action: PayloadAction<string>) => {
                state.isLoading = false
                const deletedExpense = state.expenses.find((expense) => expense.id === action.payload)
                if (deletedExpense) {
                    state.totalExpense -= deletedExpense.amount
                }
                state.expenses = state.expenses.filter((expense) => expense.id !== action.payload)
            })
            .addCase(deleteExpense.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
    },
})

export default expenseSlice.reducer 
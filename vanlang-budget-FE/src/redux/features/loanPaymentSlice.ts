import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loanService } from '@/services/loanService'
import type { LoanPayment } from '@/types'

interface LoanPaymentState {
    payments: LoanPayment[]
    isLoading: boolean
    error: string | null
}

const initialState: LoanPaymentState = {
    payments: [],
    isLoading: false,
    error: null,
}

export const fetchLoanPayments = createAsyncThunk(
    'loanPayment/fetchLoanPayments',
    async (loanId: string) => {
        const response = await loanService.getPayments(loanId)
        return response
    }
)

export const addLoanPayment = createAsyncThunk(
    'loanPayment/addLoanPayment',
    async ({ loanId, data }: { loanId: string; data: Omit<LoanPayment, 'id' | 'userId' | 'createdAt' | 'updatedAt'> }) => {
        const response = await loanService.createPayment(loanId, data)
        return response
    }
)

export const updateLoanPayment = createAsyncThunk(
    'loanPayment/updateLoanPayment',
    async ({
        loanId,
        paymentId,
        data,
    }: {
        loanId: string
        paymentId: string
        data: Partial<Omit<LoanPayment, 'id' | 'createdAt' | 'updatedAt'>>
    }) => {
        const response = await loanService.updatePayment(loanId, paymentId, data)
        return response
    }
)

export const deleteLoanPayment = createAsyncThunk(
    'loanPayment/deleteLoanPayment',
    async ({ loanId, paymentId }: { loanId: string; paymentId: string }) => {
        await loanService.deletePayment(loanId, paymentId)
        return paymentId
    }
)

const loanPaymentSlice = createSlice({
    name: 'loanPayment',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch loan payments
            .addCase(fetchLoanPayments.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchLoanPayments.fulfilled, (state, action) => {
                state.isLoading = false
                state.payments = action.payload
            })
            .addCase(fetchLoanPayments.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })

            // Add loan payment
            .addCase(addLoanPayment.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(addLoanPayment.fulfilled, (state, action) => {
                state.isLoading = false
                state.payments.push(action.payload)
            })
            .addCase(addLoanPayment.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })

            // Update loan payment
            .addCase(updateLoanPayment.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateLoanPayment.fulfilled, (state, action) => {
                state.isLoading = false
                const index = state.payments.findIndex(
                    (payment) => payment.id === action.payload.id
                )
                if (index !== -1) {
                    state.payments[index] = action.payload
                }
            })
            .addCase(updateLoanPayment.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })

            // Delete loan payment
            .addCase(deleteLoanPayment.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteLoanPayment.fulfilled, (state, action) => {
                state.isLoading = false
                state.payments = state.payments.filter(
                    (payment) => payment.id !== action.payload
                )
            })
            .addCase(deleteLoanPayment.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
    },
})

export default loanPaymentSlice.reducer 
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { emailService } from '@/services/emailService'

interface EmailPreferences {
    verificationEmails: boolean
    paymentReminders: boolean
    monthlyReports: boolean
    budgetAlerts: boolean
}

interface EmailState {
    isLoading: boolean
    error: string | null
    lastSent: {
        type: string
        timestamp: string
    } | null
    preferences: EmailPreferences | null
}

const initialState: EmailState = {
    isLoading: false,
    error: null,
    lastSent: null,
    preferences: null,
}

// Fetch email preferences
export const fetchEmailPreferences = createAsyncThunk(
    'email/fetchPreferences',
    async () => {
        const preferences = await emailService.getPreferences()
        return preferences
    }
)

// Update email preferences
export const updateEmailPreferences = createAsyncThunk(
    'email/updatePreferences',
    async (preferences: EmailPreferences) => {
        const updatedPreferences = await emailService.updatePreferences(preferences)
        return updatedPreferences
    }
)

export const sendVerificationEmail = createAsyncThunk(
    'email/sendVerification',
    async ({ email, token }: { email: string; token: string }) => {
        await emailService.sendVerificationEmail(email, token)
        return { type: 'VERIFY_EMAIL', timestamp: new Date().toISOString() }
    }
)

export const sendPaymentReminder = createAsyncThunk(
    'email/sendPaymentReminder',
    async ({ email, loanData }: {
        email: string;
        loanData: {
            loanId: string
            lender: string
            amount: number
            dueDate: string
            remainingDays: number
        }
    }) => {
        await emailService.sendPaymentReminder(email, loanData)
        return { type: 'PAYMENT_REMINDER', timestamp: new Date().toISOString() }
    }
)

export const sendMonthlyReport = createAsyncThunk(
    'email/sendMonthlyReport',
    async ({ email, reportData }: {
        email: string;
        reportData: {
            month: number
            year: number
            totalIncome: number
            totalExpense: number
            totalSavings: number
            savingsRate: number
            topIncomeCategories: Array<{ category: string; amount: number }>
            topExpenseCategories: Array<{ category: string; amount: number }>
        }
    }) => {
        await emailService.sendMonthlyReport(email, reportData)
        return { type: 'MONTHLY_REPORT', timestamp: new Date().toISOString() }
    }
)

export const sendBudgetAlert = createAsyncThunk(
    'email/sendBudgetAlert',
    async ({ email, budgetData }: {
        email: string;
        budgetData: {
            category: string
            budgetAmount: number
            currentSpent: number
            percentageUsed: number
        }
    }) => {
        await emailService.sendBudgetAlert(email, budgetData)
        return { type: 'BUDGET_ALERT', timestamp: new Date().toISOString() }
    }
)

const emailSlice = createSlice({
    name: 'email',
    initialState,
    reducers: {
        clearEmailError: (state) => {
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Preferences
            .addCase(fetchEmailPreferences.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchEmailPreferences.fulfilled, (state, action) => {
                state.isLoading = false
                state.preferences = action.payload
            })
            .addCase(fetchEmailPreferences.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Không thể tải cài đặt email'
            })
            // Update Preferences
            .addCase(updateEmailPreferences.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateEmailPreferences.fulfilled, (state, action) => {
                state.isLoading = false
                state.preferences = action.payload
            })
            .addCase(updateEmailPreferences.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Không thể cập nhật cài đặt email'
            })
            // Verification Email
            .addCase(sendVerificationEmail.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(sendVerificationEmail.fulfilled, (state, action) => {
                state.isLoading = false
                state.lastSent = action.payload
            })
            .addCase(sendVerificationEmail.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Gửi email xác thực thất bại'
            })
            // Payment Reminder
            .addCase(sendPaymentReminder.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(sendPaymentReminder.fulfilled, (state, action) => {
                state.isLoading = false
                state.lastSent = action.payload
            })
            .addCase(sendPaymentReminder.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Gửi email nhắc nhở thất bại'
            })
            // Monthly Report
            .addCase(sendMonthlyReport.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(sendMonthlyReport.fulfilled, (state, action) => {
                state.isLoading = false
                state.lastSent = action.payload
            })
            .addCase(sendMonthlyReport.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Gửi báo cáo tháng thất bại'
            })
            // Budget Alert
            .addCase(sendBudgetAlert.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(sendBudgetAlert.fulfilled, (state, action) => {
                state.isLoading = false
                state.lastSent = action.payload
            })
            .addCase(sendBudgetAlert.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Gửi cảnh báo ngân sách thất bại'
            })
    },
})

export const { clearEmailError } = emailSlice.actions
export default emailSlice.reducer 
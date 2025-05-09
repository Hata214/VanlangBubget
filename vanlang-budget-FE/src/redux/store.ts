import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/authSlice'
import incomeReducer from './features/incomeSlice'
import expenseReducer from './features/expenseSlice'
import loanReducer from './features/loanSlice'
import loanPaymentReducer from './features/loanPaymentSlice'
import budgetReducer from './features/budgetSlice'
import reportReducer from './features/reportSlice'
import emailReducer from './features/emailSlice'
import notificationReducer from './features/notificationSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        income: incomeReducer,
        expense: expenseReducer,
        loan: loanReducer,
        loanPayment: loanPaymentReducer,
        budget: budgetReducer,
        report: reportReducer,
        email: emailReducer,
        notification: notificationReducer
    },
    devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 
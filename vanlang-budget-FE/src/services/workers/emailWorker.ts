import { emailService } from '../emailService'
import { store } from '@/redux/store'
import { sendPaymentReminder, sendMonthlyReport, sendBudgetAlert } from '@/redux/features/emailSlice'
import type { Loan, Budget } from '@/types'

class EmailWorker {
    private checkInterval: number = 1000 * 60 * 60 // 1 hour

    constructor() {
        this.startWorker()
    }

    private startWorker() {
        setInterval(() => {
            this.checkPaymentReminders()
            this.checkMonthlyReports()
            this.checkBudgetAlerts()
        }, this.checkInterval)
    }

    private async checkPaymentReminders() {
        try {
            const state = store.getState()
            const { preferences } = state.email
            if (!preferences?.paymentReminders) return

            const { user } = state.auth
            if (!user) return

            const { loans } = state.loan
            const today = new Date()

            loans.forEach(async (loan: Loan) => {
                if (loan.status !== 'ACTIVE') return

                const dueDate = new Date(loan.dueDate)
                const remainingDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                // Gửi nhắc nhở khi còn 7 ngày, 3 ngày và 1 ngày
                if ([7, 3, 1].includes(remainingDays)) {
                    await store.dispatch(sendPaymentReminder({
                        email: user.email,
                        loanData: {
                            loanId: loan.id,
                            lender: loan.lender,
                            amount: loan.amount,
                            dueDate: loan.dueDate,
                            remainingDays,
                        }
                    }))
                }
            })
        } catch (error) {
            console.error('Error checking payment reminders:', error)
        }
    }

    private async checkMonthlyReports() {
        try {
            const state = store.getState()
            const { preferences } = state.email
            if (!preferences?.monthlyReports) return

            const { user } = state.auth
            if (!user) return

            const today = new Date()
            // Gửi báo cáo vào ngày cuối cùng của tháng
            const isLastDayOfMonth = today.getDate() === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

            if (isLastDayOfMonth) {
                const { incomes } = state.income
                const { expenses } = state.expense

                const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0)
                const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0)
                const totalSavings = totalIncome - totalExpense
                const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

                // Tính toán top categories
                const incomeCategoriesMap = new Map<string, number>()
                const expenseCategoriesMap = new Map<string, number>()

                incomes.forEach(income => {
                    const current = incomeCategoriesMap.get(income.category) || 0
                    incomeCategoriesMap.set(income.category, current + income.amount)
                })

                expenses.forEach(expense => {
                    const current = expenseCategoriesMap.get(expense.category) || 0
                    expenseCategoriesMap.set(expense.category, current + expense.amount)
                })

                const topIncomeCategories = Array.from(incomeCategoriesMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([category, amount]) => ({ category, amount }))

                const topExpenseCategories = Array.from(expenseCategoriesMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([category, amount]) => ({ category, amount }))

                await store.dispatch(sendMonthlyReport({
                    email: user.email,
                    reportData: {
                        month: today.getMonth() + 1,
                        year: today.getFullYear(),
                        totalIncome,
                        totalExpense,
                        totalSavings,
                        savingsRate,
                        topIncomeCategories,
                        topExpenseCategories,
                    }
                }))
            }
        } catch (error) {
            console.error('Error sending monthly report:', error)
        }
    }

    private async checkBudgetAlerts() {
        try {
            const state = store.getState()
            const { preferences } = state.email
            if (!preferences?.budgetAlerts) return

            const { user } = state.auth
            if (!user) return

            const { budgets } = state.budget
            const { expenses } = state.expense

            budgets.forEach(async (budget: Budget) => {
                const totalSpent = expenses
                    .filter(expense =>
                        expense.category === budget.category &&
                        new Date(expense.date).getMonth() === budget.month &&
                        new Date(expense.date).getFullYear() === budget.year
                    )
                    .reduce((sum, expense) => sum + expense.amount, 0)

                const percentageUsed = (totalSpent / budget.amount) * 100

                // Gửi cảnh báo khi chi tiêu vượt quá 80% hoặc 100% ngân sách
                if (percentageUsed >= 80 && percentageUsed < 100 || percentageUsed >= 100) {
                    await store.dispatch(sendBudgetAlert({
                        email: user.email,
                        budgetData: {
                            category: budget.category,
                            budgetAmount: budget.amount,
                            currentSpent: totalSpent,
                            percentageUsed,
                        }
                    }))
                }
            })
        } catch (error) {
            console.error('Error checking budget alerts:', error)
        }
    }
}

export const emailWorker = new EmailWorker() 
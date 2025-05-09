import api from './api'

interface SendEmailParams {
    to: string
    subject: string
    template: string
    data: Record<string, any>
}

interface EmailTemplate {
    name: string
    subject: string
}

interface EmailPreferences {
    verificationEmails: boolean
    paymentReminders: boolean
    monthlyReports: boolean
    budgetAlerts: boolean
}

const EMAIL_TEMPLATES = {
    VERIFY_EMAIL: {
        name: 'verify-email',
        subject: 'Xác thực tài khoản VangLangBudget',
    },
    RESET_PASSWORD: {
        name: 'reset-password',
        subject: 'Đặt lại mật khẩu VangLangBudget',
    },
    PAYMENT_REMINDER: {
        name: 'payment-reminder',
        subject: 'Nhắc nhở thanh toán khoản vay',
    },
    MONTHLY_REPORT: {
        name: 'monthly-report',
        subject: 'Báo cáo tài chính tháng',
    },
    BUDGET_ALERT: {
        name: 'budget-alert',
        subject: 'Cảnh báo vượt ngân sách',
    },
} as const

class EmailService {
    private async send({ to, subject, template, data }: SendEmailParams) {
        const response = await api.post('/emails/send', {
            to,
            subject,
            template,
            data,
        })
        return response.data
    }

    // Email Preferences Management
    async getPreferences(): Promise<EmailPreferences> {
        const response = await api.get<EmailPreferences>('/emails/preferences')
        return response.data
    }

    async updatePreferences(preferences: EmailPreferences): Promise<EmailPreferences> {
        const response = await api.put<EmailPreferences>('/emails/preferences', preferences)
        return response.data
    }

    // Email Sending Methods
    async sendVerificationEmail(email: string, token: string) {
        return this.send({
            to: email,
            subject: EMAIL_TEMPLATES.VERIFY_EMAIL.subject,
            template: EMAIL_TEMPLATES.VERIFY_EMAIL.name,
            data: { token }
        })
    }

    async sendResetPasswordEmail(email: string, token: string) {
        return this.send({
            to: email,
            subject: EMAIL_TEMPLATES.RESET_PASSWORD.subject,
            template: EMAIL_TEMPLATES.RESET_PASSWORD.name,
            data: { token }
        })
    }

    async sendPaymentReminder(email: string, data: {
        loanId: string
        lender: string
        amount: number
        dueDate: string
        remainingDays: number
    }) {
        return this.send({
            to: email,
            subject: EMAIL_TEMPLATES.PAYMENT_REMINDER.subject,
            template: EMAIL_TEMPLATES.PAYMENT_REMINDER.name,
            data
        })
    }

    async sendMonthlyReport(email: string, data: {
        month: number
        year: number
        totalIncome: number
        totalExpense: number
        totalSavings: number
        savingsRate: number
        topIncomeCategories: Array<{ category: string; amount: number }>
        topExpenseCategories: Array<{ category: string; amount: number }>
    }) {
        return this.send({
            to: email,
            subject: `${EMAIL_TEMPLATES.MONTHLY_REPORT.subject} ${data.month}/${data.year}`,
            template: EMAIL_TEMPLATES.MONTHLY_REPORT.name,
            data
        })
    }

    async sendBudgetAlert(email: string, data: {
        category: string
        budgetAmount: number
        currentSpent: number
        percentageUsed: number
    }) {
        return this.send({
            to: email,
            subject: EMAIL_TEMPLATES.BUDGET_ALERT.subject,
            template: EMAIL_TEMPLATES.BUDGET_ALERT.name,
            data
        })
    }
}

export const emailService = new EmailService() 
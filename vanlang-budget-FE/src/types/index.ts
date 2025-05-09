export interface User {
    _id: string
    email: string
    firstName: string
    lastName: string
    phoneNumber?: string
}

export interface Income {
    id: string
    amount: number
    description: string
    category: string
    date: string
    userId: string
    createdAt: string
    updatedAt: string
    _id?: string
}

export interface IncomeCategory {
    id: string
    name: string
    icon?: string
    color?: string
    userId: string
    createdAt: string
    updatedAt: string
}

export interface Expense {
    id: string
    amount: number
    description: string
    category: string
    date: string
    userId: string
    location?: {
        lat: number
        lng: number
        address: string
    }
    createdAt: string
    updatedAt: string
    _id?: string
}

export interface ExpenseCategory {
    id: string
    name: string
    icon?: string
    color?: string
    userId: string
    createdAt: string
    updatedAt: string
}

export interface Loan {
    id: string
    amount: number
    description: string
    lender: string
    interestRate: number
    interestRateType: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
    startDate: string
    dueDate: string
    status: 'ACTIVE' | 'PAID' | 'OVERDUE'
    userId: string
    payments?: LoanPayment[]
    createdAt: string
    updatedAt: string
    _id?: string
}

export interface LoanPayment {
    id: string
    loanId: string
    amount: number
    paymentDate: string
    description?: string
    attachments?: string[]
    userId: string
    createdAt: string
    updatedAt: string
}

export interface Budget {
    id: string
    category: string
    amount: number
    spent: number
    month: number
    year: number
    userId: string
    createdAt: string
    updatedAt: string
}

export interface ApiResponse<T> {
    data: T
    message?: string
}

export interface ApiError {
    message: string
    errors?: Record<string, string[]>
}

export type NotificationType = 'expense' | 'income' | 'budget' | 'system' | 'account-balance' | 'loan-due' | 'loan-overdue';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    relatedId?: string;
    createdAt: string;
    updatedAt: string;
}

export type EmailFrequency = 'immediately' | 'daily' | 'weekly' | 'never';

export interface NotificationSettings {
    id: string;
    userId: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    emailFrequency: EmailFrequency;
    notificationTypes: {
        expense: boolean;
        income: boolean;
        budget: boolean;
        system: boolean;
        'account-balance': boolean;
        'loan-due': boolean;
        'loan-overdue': boolean;
    };
    createdAt: string;
    updatedAt: string;
} 
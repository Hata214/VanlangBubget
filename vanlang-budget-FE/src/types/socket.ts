// Các sự kiện socket từ server
export enum SocketEvent {
    // Budget events
    BUDGET_CREATE = 'budget:create',
    BUDGET_UPDATE = 'budget:update',
    BUDGET_DELETE = 'budget:delete',

    // Expense events
    EXPENSE_CREATE = 'expense:create',
    EXPENSE_UPDATE = 'expense:update',
    EXPENSE_DELETE = 'expense:delete',

    // Income events
    INCOME_CREATE = 'income:create',
    INCOME_UPDATE = 'income:update',
    INCOME_DELETE = 'income:delete',

    // Loan events
    LOAN_CREATE = 'loan:create',
    LOAN_UPDATE = 'loan:update',
    LOAN_DELETE = 'loan:delete',
    LOAN_STATUS_CHANGED = 'loan_status_changed',

    // Loan payment events
    LOAN_PAYMENT_CREATE = 'loan:payment:create',
    LOAN_PAYMENT_DELETE = 'loan:payment:delete',

    // Investment events
    INVESTMENT_CREATE = 'investment:create',
    INVESTMENT_UPDATE = 'investment:update',
    INVESTMENT_DELETE = 'investment:delete',

    // Notification events
    NOTIFICATION_CREATE = 'notification:create',
    NOTIFICATION_READ = 'notification:read',
    NOTIFICATION_DELETE = 'notification:delete',

    // Connection events
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    CONNECTION_ERROR = 'connect_error'
}

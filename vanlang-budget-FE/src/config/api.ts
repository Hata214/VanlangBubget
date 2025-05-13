// Các endpoint của API
export const API_ENDPOINTS = {
    // Xác thực
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
        VERIFY_EMAIL: '/api/auth/verify-email',
        FORGOT_PASSWORD: '/api/auth/forgot-password',
        RESET_PASSWORD: '/api/auth/reset-password',
        REFRESH_TOKEN: '/api/auth/refresh-token',
        ME: '/api/auth/me',
    },

    // Người dùng
    USERS: '/api/users',

    // Admin
    ADMIN: {
        USERS: '/api/admin/users',
        DASHBOARD: '/api/admin/dashboard',
        ACTIVITY_LOGS: '/api/admin/activity-logs',
        NOTIFICATIONS: '/api/admin/notifications',
    },

    // Quản lý nội dung trang web
    SITE_CONTENT: '/api/site-content',

    // Ngân sách
    BUDGETS: '/api/budgets',

    // Thu nhập
    INCOMES: '/api/incomes',

    // Chi tiêu
    EXPENSES: '/api/expenses',

    // Báo cáo
    REPORTS: '/api/reports',

    // Khoản vay
    LOANS: '/api/loans',

    // Đầu tư
    INVESTMENTS: {
        GOLD: '/api/investments/gold',
        STOCKS: '/api/investments/stocks',
        CRYPTO: '/api/investments/crypto',
    },

    // Thông báo
    NOTIFICATIONS: '/api/notifications',

    // Thiết lập
    SETTINGS: '/api/settings',

    // Dữ liệu giá
    PRICE: {
        GOLD: '/api/price/gold',
        STOCKS: '/api/price/stocks',
        CRYPTO: '/api/price/crypto',
    },
};

// Cấu hình pagination
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    DEFAULT_SORT: 'createdAt:desc',
};

// Danh sách các lỗi có thể gặp
export const ERROR_CODES = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'BAD_REQUEST',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
};

// Thời gian timeout cho các request
export const REQUEST_TIMEOUT = 30000; // 30 giây 
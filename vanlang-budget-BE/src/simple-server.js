import express from 'express';
import authRoutes from './routes/authRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import expenseCategoryRoutes from './routes/expenseCategoryRoutes.js';
import incomeCategoryRoutes from './routes/incomeCategoryRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import loanPaymentRoutes from './routes/loanPaymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home route
app.get('/', (req, res) => {
    res.send('Simple VanLang Budget API Server');
});

// Thử đăng ký từng route một để xem route nào gây lỗi
const routes = [
    { name: 'auth', router: authRoutes, path: '/api/auth' },
    { name: 'budget', router: budgetRoutes, path: '/api/budgets' },
    { name: 'expense', router: expenseRoutes, path: '/api/expenses' },
    { name: 'income', router: incomeRoutes, path: '/api/incomes' },
    { name: 'expense-category', router: expenseCategoryRoutes, path: '/api/expense-categories' },
    { name: 'income-category', router: incomeCategoryRoutes, path: '/api/income-categories' },
    { name: 'loan', router: loanRoutes, path: '/api/loans' },
    { name: 'loan-payment', router: loanPaymentRoutes, path: '/api/loan-payments' },
    { name: 'notification', router: notificationRoutes, path: '/api/notifications' },
];

// Đăng ký từng route một và bắt lỗi
for (const route of routes) {
    try {
        app.use(route.path, route.router);
        console.log(`✅ ${route.name} routes registered successfully`);
    } catch (error) {
        console.error(`❌ Error registering ${route.name} routes:`, error);
        process.exit(1); // Thoát nếu có bất kỳ lỗi nào để nhanh chóng xác định route có vấn đề
    }
}

// Error handler
app.use(errorHandler);

const PORT = 3003;
app.listen(PORT, () => {
    console.log(`Simple server running on port ${PORT}`);
}); 
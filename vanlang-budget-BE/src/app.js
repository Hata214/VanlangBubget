import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler } from './middlewares/errorMiddleware.js';
import { socketMiddleware } from './middlewares/socketMiddleware.js';
import 'dotenv/config';

// Importing routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import expenseCategoryRoutes from './routes/expenseCategoryRoutes.js';
import incomeCategoryRoutes from './routes/incomeCategoryRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import loanPaymentRoutes from './routes/loanPaymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
// import statsRoutes from './routes/statsRoutes.js'; // Comment out import vì file không tồn tại
import oauthRoutes from './routes/oauthRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import siteContentRoutes from './routes/siteContentRoutes.js';

// Initialize Express app
const app = express();

// CORS middleware setup
// Lấy danh sách origin từ biến môi trường hoặc sử dụng mặc định cho development
const allowedOrigins = process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:4000']  // Đã bao gồm localhost:4000, kiểm tra lại logic
    : process.env.CORS_ORIGIN ?
        process.env.CORS_ORIGIN.split(',') :
        ['http://localhost:3000', 'https://vanlang-budget-fe.vercel.app'];

console.log('CORS Allowed Origins:', allowedOrigins);

app.use(cors({
    // Sử dụng cách cấu hình đơn giản hơn cho development
    origin: process.env.NODE_ENV === 'development' ? true : allowedOrigins,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma', 'Expires']
}));

// Add OPTIONS preflight response for all routes
app.options('*', cors());

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Socket middleware - Apply to all routes
app.use(socketMiddleware);

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // default: 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // default: 100 requests per window
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.'
});

// Apply rate limiting to all routes
app.use('/api', limiter);

// Log mọi request đến server
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
    next(); // Chuyển sang middleware hoặc route tiếp theo
});

// API routes
console.log('Đăng ký các routes API...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/income-categories', incomeCategoryRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/loan-payments', loanPaymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/investments', investmentRoutes);
console.log('Route investments đã đăng ký ✅');

app.use('/api/site-content', siteContentRoutes);
console.log('Route site-content đã đăng ký ✅');

// import statsRoutes from './routes/statsRoutes.js';
// app.use('/api/stats', statsRoutes);
// console.log('Route stats đã đăng ký ✅');

app.use('/api/oauth', oauthRoutes);

// Home route
app.get('/', (req, res) => {
    res.send('VanLang Budget API Server');
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', environment: process.env.NODE_ENV });
});

// Health check route (cho testing)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Error handler middleware
app.use(errorHandler);

export default app;
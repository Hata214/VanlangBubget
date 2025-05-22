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
import logger from './utils/logger.js';
import 'dotenv/config';
import xss from 'xss-clean';
import hpp from 'hpp';
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';

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
import adminRoutes from './routes/adminRoutes.js';
import chatbotRoutes from './routes/chatbot.js';

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

// Cấu hình CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép tất cả origin trong môi trường development
        if (process.env.NODE_ENV === 'development' || !origin) {
            callback(null, true);
            return;
        }

        // Kiểm tra origin có trong danh sách cho phép không
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log(`Origin ${origin} không được phép truy cập`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma', 'Expires', 'headers']
};

// Add OPTIONS preflight response for all routes
app.options('*', cors(corsOptions));

// Áp dụng CORS cho tất cả các routes
app.use(cors(corsOptions));

// Security middleware
// app.use(helmet({
//     contentSecurityPolicy: false,
//     crossOriginEmbedderPolicy: false,
// }));

// Body parser
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware debug sớm
app.use((req, res, next) => {
    console.log('Early middleware check:', req.method, req.originalUrl);
    next();
});

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
    whitelist: [
        // Add fields that you want to allow duplicates for
    ]
}));

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
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again in an hour!'
});

// Middleware debug trước siteContentRoutes
app.use('/api/site-content', (req, res, next) => {
    console.log('Request reached site-content middleware:', req.originalUrl);
    next(); // Chuyển tiếp yêu cầu
}, siteContentRoutes);
console.log('Route site-content đã đăng ký ✅');

// Apply rate limiting to all routes
app.use('/api', limiter);

// Bảo mật nghiêm ngặt hơn cho khu vực admin
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 50, // giới hạn 50 requests trong 15 phút
    message: 'Quá nhiều yêu cầu đến khu vực admin, vui lòng thử lại sau.'
});

// API version
const API_VERSION = '1.0.0';

// Log mọi request đến server
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);

    // Thêm header API version vào response
    res.setHeader('X-API-Version', API_VERSION);

    // Ghi log chi tiết hơn cho các request đến khu vực admin
    if (req.originalUrl.startsWith('/api/admin')) {
        logger.info(`ADMIN REQUEST: ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
    }

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

// Áp dụng giới hạn tốc độ nghiêm ngặt hơn cho khu vực admin
app.use('/api/admin', adminLimiter, adminRoutes);
console.log('Route admin đã đăng ký với bảo mật tăng cường ✅');

// import statsRoutes from './routes/statsRoutes.js';
// app.use('/api/stats', statsRoutes);
// console.log('Route stats đã đăng ký ✅');

app.use('/api/oauth', oauthRoutes);
app.use('/api/chatbot', chatbotRoutes);
console.log('Route chatbot đã đăng ký tại /api/chatbot ✅');

// Home route
app.get('/', (req, res) => {
    res.send('VanLang Budget API Server');
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        environment: process.env.NODE_ENV,
        version: API_VERSION
    });
});

// Health check route (cho testing)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        version: API_VERSION
    });
});

// Catch-all middleware ở cấp độ app
app.use((req, res, next) => {
    console.log('App-level catch-all middleware matched:', req.method, req.originalUrl);
    res.status(404).send('Not Found - App Catch-all');
});

// Error handler middleware
app.use(errorHandler);

// Handling unhandled routes (Đây nên là một trong những middleware cuối cùng)
app.all('*', (req, res, next) => {
    console.log(`Route không được xử lý: ${req.method} ${req.originalUrl} -> sẽ được chuyển cho AppError 404`);
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware (Đây nên là middleware CUỐI CÙNG)
app.use(globalErrorHandler);

export default app;

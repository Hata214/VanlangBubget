console.log('<<<< DEBUGGING APP.JS VERSION - CORS TEST - 2025-06-11 09:43 AM >>>>');
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
// import chatbotRoutes from './routes/chatbot.js'; // New refactored chatbot routes - có lỗi
import enhancedChatbotRoutes from './routes/enhancedChatbot.js'; // Legacy - working version
import initializeAgentRoutes from './routes/agent.js'; // Agent v2 routes

// Initialize Express app
const app = express();

// CORS middleware setup
// Lấy danh sách origin từ biến môi trường hoặc sử dụng mặc định
const productionOriginsFromEnv = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;

const allowedOrigins = process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:4000']
    : productionOriginsFromEnv ?
        productionOriginsFromEnv.split(',').map(origin => origin.trim()) : // Thêm .map(origin => origin.trim()) để loại bỏ khoảng trắng
        ['https://vanlang-budget-fe.vercel.app', 'https://vanlang-bubget-vanlang-budget-kg3i20asd-hata214s-projects.vercel.app']; // Mặc định nếu không có biến môi trường nào được đặt

console.log('CORS Allowed Origins on Startup:', allowedOrigins); // Log khi khởi động

// Cấu hình CORS
const corsOptions = {
    origin: function (origin, callback) {
        // TẠM THỜI CHO PHÉP TẤT CẢ ORIGIN ĐỂ GỠ LỖI
        console.log(`[DEBUG CORS] Request from origin: ${origin}. Allowing for debug purposes.`);
        callback(null, true);
        return;

        // // Cho phép tất cả origin trong môi trường development hoặc nếu không có origin (ví dụ: Postman)
        // if (process.env.NODE_ENV === 'development' || !origin) {
        //     callback(null, true);
        //     return;
        // }

        // // Kiểm tra origin có trong danh sách cho phép không
        // if (allowedOrigins.includes(origin)) { // Sử dụng .includes() cho mảng
        //     callback(null, true);
        // } else {
        //     // Log chi tiết hơn khi từ chối
        //     console.log(`CORS: Origin '${origin}' IS NOT ALLOWED. Allowed origins list: [${allowedOrigins.join(' | ')}]`);
        //     callback(new Error('Not allowed by CORS'));
        // }
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Add API version header to response
app.use((req, res, next) => {
    res.setHeader('X-API-Version', API_VERSION);

    // Ghi log chi tiết hơn cho các request đến khu vực admin
    if (req.originalUrl.startsWith('/api/admin')) {
        logger.info(`ADMIN REQUEST: ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
    }

    next(); // Chuyển sang middleware hoặc route tiếp theo
});

// API routes
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

// Áp dụng giới hạn tốc độ nghiêm ngặt hơn cho khu vực admin
app.use('/api/admin', adminLimiter, adminRoutes);

// import statsRoutes from './routes/statsRoutes.js';
// app.use('/api/stats', statsRoutes);
// console.log('Route stats đã đăng ký ✅');

app.use('/api/oauth', oauthRoutes);
app.use('/api/chatbot', enhancedChatbotRoutes); // Legacy - working version
console.log('Route chatbot đã đăng ký tại /api/chatbot ✅');
console.log('Enhanced chatbot routes (bao gồm legacy chatbot) đã đăng ký ✅');

// Initialize Agent v2 routes
try {
    // Import agent dependencies
    const AgentService = (await import('./services/agentService.js')).default;
    const AgentController = (await import('./controllers/agentController.js')).default;

    // Create instances with Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        console.error('LỖI NGHIÊM TRỌNG: Biến môi trường GEMINI_API_KEY chưa được đặt. Agent Service sẽ không được khởi tạo.');
        // Tùy chọn: throw new Error('GEMINI_API_KEY is not set'); để dừng hẳn ứng dụng nếu đây là critical feature
    } else {
        const agentService = new AgentService(geminiApiKey);
        const agentController = new AgentController(agentService);

        // Initialize and register agent routes
        const agentRoutes = initializeAgentRoutes(agentController);
        app.use('/api/agent', agentRoutes);
        console.log('Route agent v2 đã đăng ký tại /api/agent ✅');
    }
} catch (error) {
    console.error('Lỗi khi đăng ký agent routes:', error);
}

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
    res.status(404).send('Not Found');
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

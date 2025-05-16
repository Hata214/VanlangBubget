import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import 'dotenv/config';
import { initSocket } from './socket.js';
import { initCronJobs } from './cronjobs.js';
import logger from './utils/logger.js';
import { setupSwagger } from './swagger.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import expenseCategoryRoutes from './routes/expenseCategoryRoutes.js';
import incomeCategoryRoutes from './routes/incomeCategoryRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import loanPaymentRoutes from './routes/loanPaymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import siteContentRoutes from './routes/siteContentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Import middlewares
import { errorHandler } from './middlewares/errorMiddleware.js';
import { socketMiddleware } from './middlewares/socketMiddleware.js';

// App config
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URI = process.env.MONGODB_URI;

// Khởi tạo Express app
const app = express();

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Thêm tất cả origin có thể cần thiết
        const allowedOrigins = [
            'http://localhost:3000',  // NextJS dev
            'http://localhost:2000',  // Alternate dev port
            'http://localhost:4000',  // ExpressJS dev
            'https://vanlang-budget-fe.vercel.app',  // Production FE
            'https://vanlang-budget.vercel.app'  // Alternate production FE
        ];

        console.log('Request origin:', origin);

        // Allow requests with no origin (like mobile apps, curl requests)
        // Hoặc cho phép tất cả trong môi trường dev
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
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

// Handle OPTIONS requests globally for preflight
app.options('*', cors(corsOptions)); // Xử lý OPTIONS trước

app.use(cors(corsOptions)); // Áp dụng CORS cho các request khác

// Log mọi request đến server (sau CORS)
app.use((req, res, next) => {
    console.log(`Incoming Request (@server.js): ${req.method} ${req.originalUrl}`);
    next();
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Socket middleware cho real-time communication
app.use(socketMiddleware);

// Set up Swagger documentation
setupSwagger(app);

// Home route
app.get('/', (req, res) => {
    res.send('VanLang Budget API Server');
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', environment: NODE_ENV });
});

// API health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// API routes - Đăng ký từng route đơn lẻ
logger.info('Registering routes...');

// Đăng ký routes một cách tuần tự để xác định rõ vấn đề
app.use('/api/auth', authRoutes);
logger.info('Auth routes registered successfully');

app.use('/api/budgets', budgetRoutes);
logger.info('Budget routes registered successfully');

app.use('/api/expenses', expenseRoutes);
logger.info('Expense routes registered successfully');

app.use('/api/incomes', incomeRoutes);
logger.info('Income routes registered successfully');

app.use('/api/expense-categories', expenseCategoryRoutes);
logger.info('Expense category routes registered successfully');

app.use('/api/income-categories', incomeCategoryRoutes);
logger.info('Income category routes registered successfully');

app.use('/api/loans', loanRoutes);
logger.info('Loan routes registered successfully');

app.use('/api/loan-payments', loanPaymentRoutes);
logger.info('Loan payment routes registered successfully');

app.use('/api/notifications', notificationRoutes);
logger.info('Notification routes registered successfully');

app.use('/api/users', userRoutes);
logger.info('User routes registered successfully');

app.use('/api/investments', investmentRoutes);
logger.info('Investment routes registered successfully');

app.use('/api/site-content', siteContentRoutes);
logger.info('Site content routes registered successfully');

app.use('/api/admin', adminRoutes);
logger.info('Admin routes registered successfully');

// Error handler middleware
app.use(errorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Connect to MongoDB and start server
const connectDB = async () => {
    try {
        logger.info('Connecting to MongoDB...');
        logger.info(`MongoDB URI: ${MONGO_URI}`);

        // Khởi động server trước, dù có kết nối DB thành công hay không
        httpServer.listen(PORT, () => {
            logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
            logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
        });

        // Thử kết nối MongoDB
        try {
            logger.info(`Attempting to connect with MONGO_URI: ${MONGO_URI}`);
            const conn = await mongoose.connect(MONGO_URI, {
                // Options are no longer needed in Mongoose 7+
            });
            logger.info(`MongoDB Connected: ${conn.connection.host}`);

            // Khởi tạo Socket.io
            initSocket(httpServer);

            // Khởi tạo cron jobs
            initCronJobs();
        } catch (dbError) {
            logger.error(`Warning - Error connecting to MongoDB: ${dbError.message}`);
            logger.info('Server will continue to run without database connection');
            // Không thoát khỏi ứng dụng khi không kết nối được DB
            // process.exit(1);
        }
    } catch (error) {
        logger.error(`Error starting server: ${error.message}`);
        process.exit(1); // Exit with failure
    }
};

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
});

// Call connect function
connectDB();

export default app;
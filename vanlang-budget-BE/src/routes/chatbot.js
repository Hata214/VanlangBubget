import express from 'express';
import rateLimit from 'express-rate-limit';
// import ChatbotController from '../controllers/chatbotController.js'; // Controller sẽ được truyền vào
import { protect } from '../middlewares/authMiddleware.js';

// const router = express.Router(); // Sẽ được tạo bên trong hàm

// // Initialize controller
// const chatbotController = new ChatbotController(); // KHÔNG khởi tạo ở đây nữa

const initializeChatbotRoutes = (chatbotControllerInstance) => {
    const router = express.Router();

    // Rate limiting middleware
    const chatbotRateLimit = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 30, // 30 requests per minute per user
        message: {
            success: false,
            error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.',
            retryAfter: 60
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            return req.user?.id || req.user?._id || req.ip;
        },
        skip: (req) => {
            return req.path === '/health';
        }
    });

    // Apply rate limiting to all chatbot routes
    router.use(chatbotRateLimit);

    /**
     * @route   POST /api/chatbot/enhanced
     * @desc    Enhanced chatbot with NLP, caching, and financial calculations
     * @access  Private
     */
    router.post('/enhanced', protect, async (req, res) => {
        // Sử dụng instance được truyền vào
        await chatbotControllerInstance.enhanced(req, res);
    });

    /**
     * @route   POST /api/chatbot/chatbot
     * @desc    Legacy chatbot for backward compatibility
     * @access  Private
     */
    router.post('/chatbot', protect, async (req, res) => {
        await chatbotControllerInstance.legacy(req, res);
    });

    /**
     * @route   GET /api/chatbot/health
     * @desc    Health check endpoint
     * @access  Public
     */
    router.get('/health', async (req, res) => {
        await chatbotControllerInstance.healthCheck(req, res);
    });

    /**
     * @route   GET /api/chatbot/analytics
     * @desc    Get chatbot analytics (admin only)
     * @access  Private (Admin)
     */
    router.get('/analytics', protect, async (req, res) => {
        await chatbotControllerInstance.getAnalytics(req, res);
    });

    /**
     * @route   DELETE /api/chatbot/cache
     * @desc    Clear all cache
     * @access  Private
     */
    router.delete('/cache', protect, async (req, res) => {
        await chatbotControllerInstance.clearCache(req, res);
    });

    /**
     * @route   GET /api/chatbot/status
     * @desc    Get detailed system status
     * @access  Private (Admin)
     */
    router.get('/status', protect, async (req, res) => {
        // Gọi phương thức từ controller instance
        await chatbotControllerInstance.getSystemStatus(req, res);
    });

    /**
     * Error handling middleware for chatbot routes
     */
    router.use((error, req, res, next) => {
        console.error('Chatbot route error:', error);
        const language = req.body?.language || 'vi';
        const errorMessage = language === 'vi' ?
            'Đã có lỗi xảy ra trong hệ thống chatbot.' :
            'An error occurred in the chatbot system.';
        res.status(500).json({
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV === 'development' && { detail: error.message, stack: error.stack })
        });
    });

    return router;
};

export default initializeChatbotRoutes;

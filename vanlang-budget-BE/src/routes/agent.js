import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middlewares/authMiddleware.js';
import AgentController from '../controllers/agentController.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Rate limiting for agent endpoints
const agentRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded for agent', { 
            ip: req.ip, 
            userAgent: req.get('User-Agent') 
        });
        res.status(429).json({
            success: false,
            error: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.'
        });
    }
});

// Stricter rate limiting for main chat endpoint
const chatRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 chat requests per minute
    message: {
        success: false,
        error: 'Quá nhiều tin nhắn. Vui lòng chờ một chút trước khi gửi tiếp.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Initialize agent routes with dependency injection
 */
function initializeAgentRoutes(agentController) {
    if (!agentController) {
        throw new Error('AgentController is required to initialize agent routes');
    }

    // Apply rate limiting to all agent routes
    router.use(agentRateLimit);

    /**
     * @route   POST /api/agent/ask
     * @desc    Main agent endpoint - Process user message
     * @access  Private
     */
    router.post('/ask', protect, chatRateLimit, async (req, res) => {
        await agentController.ask(req, res);
    });

    /**
     * @route   GET /api/agent/capabilities
     * @desc    Get agent capabilities and features
     * @access  Public
     */
    router.get('/capabilities', async (req, res) => {
        await agentController.getCapabilities(req, res);
    });

    /**
     * @route   GET /api/agent/session
     * @desc    Get current user session information
     * @access  Private
     */
    router.get('/session', protect, async (req, res) => {
        await agentController.getSession(req, res);
    });

    /**
     * @route   POST /api/agent/session/reset
     * @desc    Reset user session
     * @access  Private
     */
    router.post('/session/reset', protect, async (req, res) => {
        await agentController.resetSession(req, res);
    });

    /**
     * @route   GET /api/agent/health
     * @desc    Health check for agent service
     * @access  Public
     */
    router.get('/health', async (req, res) => {
        await agentController.healthCheck(req, res);
    });

    /**
     * @route   GET /api/agent/stats
     * @desc    Get agent statistics (admin only)
     * @access  Private (Admin)
     */
    router.get('/stats', protect, async (req, res) => {
        await agentController.getStats(req, res);
    });

    /**
     * @route   POST /api/agent/chat
     * @desc    Legacy endpoint for backward compatibility
     * @access  Private
     */
    router.post('/chat', protect, chatRateLimit, async (req, res) => {
        await agentController.legacyChat(req, res);
    });

    // Error handling middleware for agent routes
    router.use((error, req, res, next) => {
        logger.error('Agent route error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Lỗi hệ thống agent. Vui lòng thử lại sau.',
            timestamp: new Date().toISOString()
        });
    });

    logger.info('Agent routes initialized successfully');
    return router;
}

export default initializeAgentRoutes;

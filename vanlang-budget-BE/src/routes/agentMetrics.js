/**
 * 📊 Agent Metrics API Routes
 * Provides monitoring and analytics for VanLang Agent performance
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Import VanLang Agent instance (will be set by the main app)
let vanlangAgentInstance = null;

export const setVanLangAgentInstance = (instance) => {
    vanlangAgentInstance = instance;
};

/**
 * 📊 Get Gemini AI performance metrics
 */
router.get('/gemini-metrics', authenticateToken, async (req, res) => {
    try {
        if (!vanlangAgentInstance) {
            return res.status(503).json({
                success: false,
                message: 'VanLang Agent not initialized'
            });
        }

        const metrics = vanlangAgentInstance.getGeminiMetrics();
        
        logger.info('Gemini metrics requested', {
            userId: req.user.id,
            metrics: {
                totalRequests: metrics.totalRequests,
                cacheHitRate: metrics.cacheHitRate,
                errorRate: metrics.errorRate
            }
        });

        res.json({
            success: true,
            data: {
                geminiMetrics: metrics,
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            }
        });

    } catch (error) {
        logger.error('Error getting Gemini metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin metrics'
        });
    }
});

/**
 * 📈 Get conversation statistics
 */
router.get('/conversation-stats/:userId?', authenticateToken, async (req, res) => {
    try {
        if (!vanlangAgentInstance) {
            return res.status(503).json({
                success: false,
                message: 'VanLang Agent not initialized'
            });
        }

        const targetUserId = req.params.userId || req.user.id;
        
        // Check if user can access other user's stats (admin only)
        if (targetUserId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập thống kê của người dùng khác'
            });
        }

        const conversationStats = vanlangAgentInstance.getConversationStats(targetUserId);
        
        logger.info('Conversation stats requested', {
            requesterId: req.user.id,
            targetUserId,
            hasStats: !!conversationStats
        });

        res.json({
            success: true,
            data: {
                conversationStats,
                userId: targetUserId,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error getting conversation stats:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thống kê cuộc hội thoại'
        });
    }
});

/**
 * 🗑️ Clear conversation context
 */
router.delete('/conversation/:userId?', authenticateToken, async (req, res) => {
    try {
        if (!vanlangAgentInstance) {
            return res.status(503).json({
                success: false,
                message: 'VanLang Agent not initialized'
            });
        }

        const targetUserId = req.params.userId || req.user.id;
        
        // Check if user can clear other user's conversation (admin only)
        if (targetUserId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xóa cuộc hội thoại của người dùng khác'
            });
        }

        const result = vanlangAgentInstance.clearConversation(targetUserId);
        
        logger.info('Conversation cleared', {
            requesterId: req.user.id,
            targetUserId,
            result
        });

        res.json({
            success: true,
            data: {
                message: result,
                userId: targetUserId,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error clearing conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa cuộc hội thoại'
        });
    }
});

/**
 * 🚀 Start conversation flow
 */
router.post('/conversation-flow', authenticateToken, async (req, res) => {
    try {
        if (!vanlangAgentInstance) {
            return res.status(503).json({
                success: false,
                message: 'VanLang Agent not initialized'
            });
        }

        const { flowType } = req.body;
        
        if (!flowType) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin flowType'
            });
        }

        const validFlowTypes = ['financial_planning', 'investment_consultation', 'debt_management'];
        if (!validFlowTypes.includes(flowType)) {
            return res.status(400).json({
                success: false,
                message: 'Loại flow không hợp lệ',
                validFlowTypes
            });
        }

        const result = await vanlangAgentInstance.handleConversationFlow(req.user.id, flowType);
        
        logger.info('Conversation flow started via API', {
            userId: req.user.id,
            flowType,
            success: !!result
        });

        res.json({
            success: true,
            data: {
                response: result,
                flowType,
                userId: req.user.id,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error starting conversation flow:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể bắt đầu cuộc hội thoại'
        });
    }
});

/**
 * 🔧 Reset Gemini metrics (Admin only)
 */
router.post('/gemini-metrics/reset', authenticateToken, async (req, res) => {
    try {
        // Check admin permission
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có thể reset metrics'
            });
        }

        if (!vanlangAgentInstance) {
            return res.status(503).json({
                success: false,
                message: 'VanLang Agent not initialized'
            });
        }

        vanlangAgentInstance.enhancedGemini.resetMetrics();
        
        logger.info('Gemini metrics reset by admin', {
            adminId: req.user.id,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                message: 'Đã reset Gemini metrics thành công',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error resetting Gemini metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể reset metrics'
        });
    }
});

/**
 * 🧹 Clear Gemini cache (Admin only)
 */
router.post('/gemini-cache/clear', authenticateToken, async (req, res) => {
    try {
        // Check admin permission
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có thể clear cache'
            });
        }

        if (!vanlangAgentInstance) {
            return res.status(503).json({
                success: false,
                message: 'VanLang Agent not initialized'
            });
        }

        vanlangAgentInstance.enhancedGemini.clearCache();
        
        logger.info('Gemini cache cleared by admin', {
            adminId: req.user.id,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                message: 'Đã clear Gemini cache thành công',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error clearing Gemini cache:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể clear cache'
        });
    }
});

/**
 * 📊 Get comprehensive agent analytics (Admin only)
 */
router.get('/analytics', authenticateToken, async (req, res) => {
    try {
        // Check admin permission
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có thể xem analytics'
            });
        }

        if (!vanlangAgentInstance) {
            return res.status(503).json({
                success: false,
                message: 'VanLang Agent not initialized'
            });
        }

        const geminiMetrics = vanlangAgentInstance.getGeminiMetrics();
        
        // Get system metrics
        const systemMetrics = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };

        logger.info('Comprehensive analytics requested', {
            adminId: req.user.id,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                geminiMetrics,
                systemMetrics,
                timestamp: new Date().toISOString(),
                serverInfo: {
                    environment: process.env.NODE_ENV || 'development',
                    port: process.env.PORT || 4000
                }
            }
        });

    } catch (error) {
        logger.error('Error getting comprehensive analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy analytics'
        });
    }
});

export default router;

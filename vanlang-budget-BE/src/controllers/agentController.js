import AgentService from '../services/agentService.js';
import logger from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

class AgentController {
    constructor(agentService) {
        this.agentService = agentService;
    }

    /**
     * Main agent endpoint - Process user message
     * @route POST /api/agent/ask
     */
    async ask(req, res) {
        const startTime = Date.now();

        try {
            // Debug raw request body
            logger.info('🔍 Raw request body debug', {
                body: req.body,
                headers: req.headers['content-type'],
                method: req.method,
                bodyKeys: Object.keys(req.body || {}),
                bodyStringified: JSON.stringify(req.body)
            });

            const { message, language = 'vi', aiMode } = req.body;
            const userId = req.user?.id || req.user?._id;

            // Validation
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return errorResponse(res,
                    language === 'vi' ? 'Tin nhắn không hợp lệ.' : 'Invalid message.',
                    400
                );
            }

            if (!userId) {
                return errorResponse(res,
                    language === 'vi' ?
                        'Xác thực thất bại. Vui lòng đăng nhập lại.' :
                        'Authentication failed. Please log in again.',
                    401
                );
            }

            // Validate aiMode flag - handle undefined, null, false, true
            const isAIMode = Boolean(aiMode);

            logger.info('Agent request received', {
                userId,
                message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
                messageLength: message.length,
                language,
                aiMode: isAIMode,
                aiModeType: typeof aiMode,
                aiModeOriginal: aiMode
            });

            // Process message with agent service including AI mode option
            const result = await this.agentService.processMessage(userId, message, {
                language,
                aiMode: isAIMode
            });

            if (!result.success) {
                return errorResponse(res, result.error, 400);
            }

            // Return successful response
            return successResponse(res, {
                response: result.response,
                metadata: {
                    ...result.metadata,
                    language,
                    aiMode: isAIMode,
                    timestamp: new Date().toISOString()
                }
            }, 'Agent response generated successfully');

        } catch (error) {
            logger.error('Agent controller error:', error);

            const errorMessage = req.body?.language === 'vi' ?
                'Lỗi hệ thống. Vui lòng thử lại sau.' :
                'System error. Please try again later.';

            return errorResponse(res, errorMessage, 500);
        }
    }

    /**
     * Get agent capabilities
     * @route GET /api/agent/capabilities
     */
    async getCapabilities(req, res) {
        try {
            const { language = 'vi' } = req.query;
            const capabilities = this.agentService.getCapabilities(language);

            return successResponse(res, capabilities, 'Capabilities retrieved successfully');
        } catch (error) {
            logger.error('Get capabilities error:', error);
            return errorResponse(res, 'Failed to get capabilities', 500);
        }
    }

    /**
     * Get user session information
     * @route GET /api/agent/session
     */
    async getSession(req, res) {
        try {
            const userId = req.user?.id || req.user?._id;

            if (!userId) {
                return errorResponse(res, 'Authentication required', 401);
            }

            const sessionStats = this.agentService.getSessionStats(userId);

            if (!sessionStats) {
                return successResponse(res, {
                    hasActiveSession: false,
                    message: 'No active session found'
                });
            }

            return successResponse(res, {
                hasActiveSession: true,
                session: sessionStats
            }, 'Session information retrieved');

        } catch (error) {
            logger.error('Get session error:', error);
            return errorResponse(res, 'Failed to get session information', 500);
        }
    }

    /**
     * Reset user session
     * @route POST /api/agent/session/reset
     */
    async resetSession(req, res) {
        try {
            const userId = req.user?.id || req.user?._id;

            if (!userId) {
                return errorResponse(res, 'Authentication required', 401);
            }

            this.agentService.resetSession(userId);

            return successResponse(res, {
                message: 'Session reset successfully'
            });

        } catch (error) {
            logger.error('Reset session error:', error);
            return errorResponse(res, 'Failed to reset session', 500);
        }
    }

    /**
     * Health check for agent service
     * @route GET /api/agent/health
     */
    async healthCheck(req, res) {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                activeSessions: this.agentService.getActiveSessionsCount(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            };

            return successResponse(res, health, 'Agent service is healthy');
        } catch (error) {
            logger.error('Health check error:', error);
            return errorResponse(res, 'Health check failed', 500);
        }
    }

    /**
     * Get agent statistics (admin only)
     * @route GET /api/agent/stats
     */
    async getStats(req, res) {
        try {
            // Check if user is admin
            const userRole = req.user?.role;
            if (!userRole || !['admin', 'superadmin'].includes(userRole)) {
                return errorResponse(res, 'Admin access required', 403);
            }

            const stats = {
                totalActiveSessions: this.agentService.getActiveSessionsCount(),
                systemInfo: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    uptime: process.uptime(),
                    memory: process.memoryUsage()
                },
                timestamp: new Date().toISOString()
            };

            return successResponse(res, stats, 'Agent statistics retrieved');
        } catch (error) {
            logger.error('Get stats error:', error);
            return errorResponse(res, 'Failed to get statistics', 500);
        }
    }

    /**
     * Clear cache for debugging
     * @route DELETE /api/agent/cache
     */
    async clearCache(req, res) {
        try {
            const userId = req.user?.id || req.user?._id;

            if (!userId) {
                return errorResponse(res, 'Authentication required', 401);
            }

            // Clear cache if available
            if (this.agentService.cacheService) {
                // This would need to be implemented in cache service
                logger.info('Cache clear requested', { userId });
                return successResponse(res, { message: 'Cache cleared (if implemented)' });
            } else {
                return successResponse(res, { message: 'No cache service available' });
            }
        } catch (error) {
            logger.error('Clear cache error:', error);
            return errorResponse(res, 'Failed to clear cache', 500);
        }
    }

    /**
     * Legacy endpoint for backward compatibility
     * @route POST /api/agent/chat
     */
    async legacyChat(req, res) {
        // Redirect to main ask endpoint
        return this.ask(req, res);
    }
}

export default AgentController;

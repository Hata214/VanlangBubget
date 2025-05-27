import VanLangAgent from '../agent/vanlangAgent.js';
import logger from '../utils/logger.js';

class AgentService {
    constructor(geminiApiKey, cacheService = null) {
        this.agent = new VanLangAgent(geminiApiKey);
        this.cacheService = cacheService;
        this.sessionStore = new Map(); // Store user sessions
    }

    /**
     * Validate input message
     */
    validateInput(message, language = 'vi') {
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return {
                isValid: false,
                error: language === 'vi' ?
                    'Tin nhắn không hợp lệ.' :
                    'Invalid message.'
            };
        }

        if (message.length > 1000) {
            return {
                isValid: false,
                error: language === 'vi' ?
                    'Tin nhắn quá dài. Vui lòng rút gọn.' :
                    'Message too long. Please shorten it.'
            };
        }

        return { isValid: true };
    }

    /**
     * Generate session ID for user
     */
    generateSessionId(userId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${userId}_${timestamp}_${random}`;
    }

    /**
     * Get or create user session
     */
    getUserSession(userId) {
        if (!this.sessionStore.has(userId)) {
            const sessionId = this.generateSessionId(userId);
            this.sessionStore.set(userId, {
                sessionId,
                createdAt: new Date(),
                messageCount: 0,
                lastActivity: new Date()
            });
        }

        const session = this.sessionStore.get(userId);
        session.lastActivity = new Date();
        session.messageCount += 1;

        return session;
    }

    /**
     * Clean up old sessions
     */
    cleanupSessions() {
        const now = new Date();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const [userId, session] of this.sessionStore.entries()) {
            if (now - session.lastActivity > maxAge) {
                this.sessionStore.delete(userId);
                logger.info('Session cleaned up', { userId, sessionId: session.sessionId });
            }
        }
    }

    /**
     * Check cache for response
     */
    async getCachedResponse(cacheKey) {
        if (!this.cacheService) return null;

        try {
            return await this.cacheService.getGeminiResponse(cacheKey);
        } catch (error) {
            logger.warn('Cache retrieval error:', error);
            return null;
        }
    }

    /**
     * Store response in cache
     */
    async setCachedResponse(cacheKey, response) {
        if (!this.cacheService) return;

        try {
            await this.cacheService.cacheGeminiResponse(cacheKey, response);
        } catch (error) {
            logger.warn('Cache storage error:', error);
        }
    }

    /**
     * Generate cache key for message
     */
    generateCacheKey(userId, message) {
        const normalizedMessage = message.toLowerCase().trim();
        return `agent_${userId}_${Buffer.from(normalizedMessage).toString('base64')}`;
    }

    /**
     * Process user message with caching
     */
    async processMessage(userId, message, options = {}) {
        const startTime = Date.now();

        try {
            // Validate input
            const validation = this.validateInput(message, options.language);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error,
                    responseTime: Date.now() - startTime
                };
            }

            // Get user session
            const session = this.getUserSession(userId);

            // Check cache first
            const cacheKey = this.generateCacheKey(userId, message);
            let cachedResponse = await this.getCachedResponse(cacheKey);

            if (cachedResponse) {
                logger.info('Agent response from cache', { userId, sessionId: session.sessionId });
                return {
                    success: true,
                    response: cachedResponse,
                    metadata: {
                        cached: true,
                        sessionId: session.sessionId,
                        messageCount: session.messageCount,
                        responseTime: Date.now() - startTime
                    }
                };
            }

            // Process with agent
            const response = await this.agent.handleUserMessage(
                userId,
                message,
                session.sessionId
            );

            // Cache the response
            await this.setCachedResponse(cacheKey, response);

            logger.info('Agent response generated', {
                userId,
                sessionId: session.sessionId,
                responseTime: Date.now() - startTime
            });

            return {
                success: true,
                response,
                metadata: {
                    cached: false,
                    sessionId: session.sessionId,
                    messageCount: session.messageCount,
                    responseTime: Date.now() - startTime
                }
            };

        } catch (error) {
            logger.error('Agent service error:', error);

            const errorMessage = options.language === 'vi' ?
                'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.' :
                'Sorry, I encountered an error processing your request. Please try again later.';

            return {
                success: false,
                error: errorMessage,
                responseTime: Date.now() - startTime
            };
        }
    }

    /**
     * Get agent capabilities
     */
    getCapabilities(language = 'vi') {
        const capabilities = {
            vi: {
                title: 'VanLang Agent - Trợ lý tài chính AI',
                features: [
                    '💰 Thêm giao dịch thu nhập/chi tiêu bằng ngôn ngữ tự nhiên',
                    '📊 Phân tích tình hình tài chính cá nhân',
                    '🔍 Truy vấn thông tin về số dư, giao dịch',
                    '💡 Đưa ra lời khuyên tài chính thông minh',
                    '📈 Theo dõi mục tiêu tiết kiệm và đầu tư',
                    '⏰ Nhắc nhở thanh toán và kế hoạch tài chính'
                ],
                examples: [
                    'Tôi vừa mua cà phê 50000',
                    'Nhận lương 15 triệu hôm nay',
                    'Phân tích chi tiêu tháng này',
                    'Tôi có nên đầu tư vào cổ phiếu không?',
                    'Số dư hiện tại của tôi là bao nhiêu?'
                ]
            },
            en: {
                title: 'VanLang Agent - AI Financial Assistant',
                features: [
                    '💰 Add income/expense transactions using natural language',
                    '📊 Analyze personal financial situation',
                    '🔍 Query information about balance and transactions',
                    '💡 Provide smart financial advice',
                    '📈 Track savings and investment goals',
                    '⏰ Remind about payments and financial plans'
                ],
                examples: [
                    'I just bought coffee for 50000',
                    'Received salary 15 million today',
                    'Analyze this month\'s expenses',
                    'Should I invest in stocks?',
                    'What is my current balance?'
                ]
            }
        };

        return capabilities[language] || capabilities.vi;
    }

    /**
     * Get session statistics
     */
    getSessionStats(userId) {
        const session = this.sessionStore.get(userId);
        if (!session) {
            return null;
        }

        return {
            sessionId: session.sessionId,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            messageCount: session.messageCount,
            duration: new Date() - session.createdAt
        };
    }

    /**
     * Reset user session
     */
    resetSession(userId) {
        this.sessionStore.delete(userId);
        logger.info('User session reset', { userId });
    }

    /**
     * Get all active sessions count
     */
    getActiveSessionsCount() {
        return this.sessionStore.size;
    }
}

export default AgentService;

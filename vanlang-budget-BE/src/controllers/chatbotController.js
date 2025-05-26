// Simplified imports to avoid circular dependencies
// import { GoogleGenerativeAI } from '@google/generative-ai'; // Không cần ở đây nữa nếu GeminiService được dùng
// import getCacheService from '../services/cacheService.js'; // Sẽ được inject
// import NLPService from '../services/nlpService.js'; // Sẽ được inject
// import Income from '../models/incomeModel.js'; // Không dùng trực tiếp ở đây nữa
// import Expense from '../models/expenseModel.js'; // Không dùng trực tiếp ở đây nữa
// import Investment from '../models/investmentModel.js'; // Không dùng trực tiếp ở đây nữa
// import Budget from '../models/budgetModel.js'; // Không dùng trực tiếp ở đây nữa
// import Loan from '../models/loanModel.js'; // Không dùng trực tiếp ở đây nữa

/**
 * Chatbot Controller - Handles HTTP requests for chatbot functionality
 */
class ChatbotController {
    constructor(chatbotService, nlpService, geminiService, cacheService) {
        this.chatbotService = chatbotService;
        this.nlpService = nlpService;
        this.geminiService = geminiService;
        this.cacheService = cacheService;

        // Analytics có thể giữ lại hoặc chuyển vào ChatbotService nếu muốn tập trung hơn
        this.analytics = {
            requests: 0,
            errors: 0,
            ruleBasedResponses: 0,
            geminiResponses: 0,
            cacheHitsIntent: 0,
            cacheHitsGemini: 0,

            track: (event, data = {}) => {
                this[event] = (this[event] || 0) + 1;
                // console.log(`📊 Controller Analytics: ${event}`, data);
            },

            getStats: () => ({
                requests: this.requests || 0,
                errors: this.errors || 0,
                ruleBasedResponses: this.ruleBasedResponses || 0,
                geminiResponses: this.geminiResponses || 0,
                cacheHitsIntent: this.cacheHitsIntent || 0,
                cacheHitsGemini: this.cacheHitsGemini || 0,
                uptime: process.uptime()
            })
        };

        console.log('✅ ChatbotController initialized with injected services');
    }

    /**
     * Enhanced chatbot endpoint - Refactored
     */
    async enhanced(req, res) {
        const startTime = Date.now();
        this.analytics.track('requests');

        try {
            const { message, language = 'vi' } = req.body;
            const userId = req.user?.id || req.user?._id;

            const validation = this.chatbotService.validateInput(message, language);
            if (!validation.isValid) {
                this.analytics.track('errors', { error: 'invalid_input' });
                return res.status(400).json({ success: false, error: validation.error });
            }
            if (!userId) {
                this.analytics.track('errors', { error: 'auth_failed' });
                return res.status(401).json({
                    success: false,
                    error: language === 'vi' ? 'Xác thực thất bại. Vui lòng đăng nhập lại.' : 'Authentication failed. Please log in again.'
                });
            }
            console.log(`🤖 Enhanced Chat Request: "${message}" (${language}) from user ${userId}`);

            // 2. Analyze Intent (via new NLPService with node-nlp)
            // Cache key vẫn là message. Nếu bạn thay đổi cách NLP xử lý message (ví dụ toLowerCase), cache key cũng nên phản ánh điều đó.
            let intentAnalysis = await this.cacheService.getIntentAnalysis(message.toLowerCase().trim());
            if (intentAnalysis && intentAnalysis.source === 'nlp_cache') {
                this.analytics.track('cacheHitsIntent');
                console.log('🧠 Intent (from cache):', JSON.stringify(intentAnalysis, null, 2));
            } else {
                intentAnalysis = await this.nlpService.analyzeIntent(message); // NLPService mới sẽ tự xử lý toLowerCase
                // Cache kết quả mới này.
                await this.cacheService.cacheIntentAnalysis(message.toLowerCase().trim(), { ...intentAnalysis, source: 'nlp_cache' });
                console.log('🧠 Intent (from NLPService - node-nlp):', JSON.stringify(intentAnalysis, null, 2));
            }

            const intent = intentAnalysis.intent;
            const entities = intentAnalysis.entities || [];

            console.log(`💡 Node-NLP Intent: ${intent}, Confidence: ${intentAnalysis.confidence}`);
            if (entities.length > 0) {
                console.log('💡 Node-NLP Entities:', JSON.stringify(entities, null, 2));
            }

            // 3. Handle simple intents directly (BẠN CẦN CẬP NHẬT TÊN INTENT CHO KHỚP VỚI training-data.json)
            let simpleResponseText = null;
            switch (intent) {
                case 'greeting.hello': // Ví dụ, nếu intent trong training-data.json là 'greeting.hello'
                    simpleResponseText = this.chatbotService.getGreetingResponse(language);
                    break;
                case 'farewell.bye': // Ví dụ
                    simpleResponseText = this.chatbotService.getFarewellResponse(language);
                    break;
                case 'bot.introduction': // Ví dụ
                    simpleResponseText = this.chatbotService.getBotIntroductionResponse(language);
                    break;
                case 'bot.capabilities': // Ví dụ
                    simpleResponseText = this.chatbotService.getCapabilityResponse(language);
                    break;
                case 'common.time_date': // Ví dụ
                    simpleResponseText = this.chatbotService.getTimeDateResponse(language);
                    break;
                case 'nlu.fallback': // Hoặc intent bạn đặt cho trường hợp không hiểu rõ
                case 'None': // Thường node-nlp trả về 'None' nếu không khớp intent nào
                    // simpleResponseText = language === 'vi' ? 'Xin lỗi, tôi chưa hiểu rõ yêu cầu của bạn.' : 'Sorry, I didn\'t understand your request.';
                    // Để Gemini thử xử lý nếu NLP không chắc chắn
                    break;
            }

            if (simpleResponseText) {
                this.analytics.track('ruleBasedResponses');
                const responseTime = Date.now() - startTime;
                return res.json({
                    success: true,
                    response: simpleResponseText,
                    metadata: { intent, processedBy: 'rule', language, responseTime, nlp_analysis: intentAnalysis }
                });
            }

            // 4. For complex intents, proceed to get financial data and call Gemini
            const originalMessage = message;
            let financialContext = '';
            // Sử dụng intent từ node-nlp để kiểm tra needsFinancialData
            const needsData = await this.chatbotService.needsFinancialData(originalMessage, intentAnalysis);

            if (needsData) {
                console.log('Financial data needed for intent:', intent, 'Fetching...');
                const finData = await this.chatbotService.getUserFinancialData(userId);
                if (finData && finData.error && !finData.totalBalance) {
                    console.warn('ChatbotController: Error fetching financial data from ChatbotService -', finData.error);
                    financialContext = language === 'vi' ? ' (Lưu ý: có lỗi khi truy xuất dữ liệu tài chính của bạn) ' : ' (Note: error retrieving your financial data) ';
                } else if (finData) {
                    financialContext = this.chatbotService.formatFinancialContext(finData, language);
                }
            }

            // 5. Create user-side prompt for Gemini and call GeminiService
            let userSidePrompt = originalMessage;

            // Xây dựng userSidePrompt (BẠN CẦN CẬP NHẬT TÊN INTENT CHO KHỚP VỚI training-data.json)
            if (intent === 'expense.query' || intent === 'expense.summary') {
                userSidePrompt = `Người dùng muốn biết về chi tiêu của họ. Câu hỏi gốc: "${originalMessage}". Hãy tập trung vào việc cung cấp thông tin tổng quan về các khoản chi tiêu từ dữ liệu tài chính dưới đây.`;
            } else if (intent === 'expense.detail') {
                userSidePrompt = `Người dùng muốn biết chi tiết các khoản chi tiêu. Câu hỏi gốc: "${originalMessage}". Hãy liệt kê các khoản chi tiêu cụ thể từ dữ liệu tài chính dưới đây.`;
            } else if (intent === 'income.query' || intent === 'income.summary') {
                userSidePrompt = `Người dùng muốn biết về thu nhập của họ. Câu hỏi gốc: "${originalMessage}". Hãy tập trung vào việc cung cấp thông tin tổng quan về các khoản thu nhập từ dữ liệu tài chính dưới đây.`;
            } // ... (Thêm các else if khác cho các intent như income.detail, loan.query, balance.query, budget.check, etc.) ...
            else if (intent === 'balance.query') {
                userSidePrompt = `Người dùng muốn biết số dư hiện tại. Câu hỏi gốc: "${originalMessage}". Hãy cung cấp thông tin về số dư dựa trên dữ liệu tài chính.`;
            }
            // (Consider a fallback for other financial intents not explicitly handled to guide Gemini generally)
            else if (intent && (intent.startsWith('financial.') || intent.startsWith('calculate.') || needsData) && userSidePrompt === originalMessage) {
                userSidePrompt = `Người dùng có câu hỏi liên quan đến tài chính: "${originalMessage}". Hãy cố gắng trả lời dựa trên dữ liệu được cung cấp (nếu có).`;
            }


            if (financialContext && needsData) { // Chỉ thêm context nếu thực sự cần và có dữ liệu
                userSidePrompt += `\n\nDữ liệu tài chính tham khảo:\n${financialContext}`;
            }

            userSidePrompt = userSidePrompt.trim();
            console.log(`💬 User-side prompt for Gemini (length ${userSidePrompt.length}): ${userSidePrompt.substring(0, 500)}...`);

            let cachedGeminiResponse = await this.cacheService.getGeminiResponse(userSidePrompt);
            if (cachedGeminiResponse) {
                this.analytics.track('cacheHitsGemini');
                this.analytics.track('geminiResponses');
                const responseTime = Date.now() - startTime;
                return res.json({
                    success: true,
                    response: cachedGeminiResponse,
                    metadata: { intent, cached: true, processedBy: 'gemini', language, responseTime, nlp_analysis: intentAnalysis }
                });
            }

            const geminiResult = await this.geminiService.generateResponse(
                userSidePrompt,
                { language, mode: 'enhanced' }
            );
            this.analytics.track('geminiResponses');

            if (geminiResult.success) {
                await this.cacheService.cacheGeminiResponse(userSidePrompt, geminiResult.response);
                const responseTime = Date.now() - startTime;
                return res.json({
                    success: true,
                    response: geminiResult.response,
                    metadata: {
                        intent,
                        processedBy: 'gemini',
                        language,
                        model: geminiResult.model,
                        usage: geminiResult.usage,
                        responseTime,
                        nlp_analysis: intentAnalysis
                    }
                });
            } else {
                this.analytics.track('errors', { error: 'gemini_failed', details: geminiResult.error });
                const responseTime = Date.now() - startTime;
                return res.status(500).json({
                    success: false,
                    error: geminiResult.error,
                    blocked: geminiResult.blocked,
                    metadata: { intent, processedBy: 'gemini', language, responseTime, nlp_analysis: intentAnalysis }
                });
            }

        } catch (error) {
            console.error('❌ ChatbotController Enhanced Error:', error);
            this.analytics.track('errors', { error: 'internal_controller_error' });
            const responseTime = Date.now() - startTime;
            return res.status(500).json({
                success: false,
                error: req.body.language === 'vi' ? 'Đã có lỗi máy chủ xảy ra. Vui lòng thử lại sau.' : 'A server error occurred. Please try again later.',
                metadata: {
                    responseTime,
                    ...(process.env.NODE_ENV === 'development' && { detail: error.message, stack: error.stack })
                }
            });
        }
    }

    /**
     * Legacy chatbot endpoint - Can be refactored similarly if still in use
     * For now, focusing on 'enhanced' as it's the primary target.
     */
    async legacy(req, res) {
        // TODO: Refactor legacy endpoint to use the new service-oriented architecture if needed.
        // For now, it might still use its old logic or call a simplified path in ChatbotService.
        // Consider if ChatbotService needs a specific legacyHandleMessage method.
        console.warn('Legacy chatbot endpoint called. Consider refactoring or deprecating.');
        // Fallback to a simple error or a very basic response
        return res.status(501).json({
            success: false,
            error: 'Legacy chatbot endpoint is not fully refactored. Please use the enhanced endpoint.'
        });
    }

    /**
     * Analytics endpoint
     */
    async getAnalytics(req, res) {
        try {
            if (req.user?.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            const cacheStats = this.cacheService.getStats(); // Use injected service
            // const nlpStats = this.nlpService.getStats(); // If NLPService has getStats()
            // const geminiStats = await this.geminiService.healthCheck(); // For some Gemini stats

            res.json({
                controllerAnalytics: this.analytics.getStats(),
                cache: cacheStats,
                // nlp: nlpStats,
                // gemini: geminiStats,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            });
        } catch (error) {
            console.error('Error getting controller analytics:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Health check endpoint
     */
    async healthCheck(req, res) {
        try {
            const geminiHealth = await this.geminiService.healthCheck(); // Use injected service
            const nlpHealth = typeof this.nlpService.getStats === 'function' ? this.nlpService.getStats() : { status: 'unknown' }; // Basic check
            const cacheHealth = typeof this.cacheService.getStats === 'function' ? { status: 'healthy', ...this.cacheService.getStats() } : { status: 'unknown' };
            const chatbotServiceHealth = typeof this.chatbotService.validateInput === 'function' ? { status: 'healthy' } : { status: 'unhealthy' }; // Basic check

            res.json({
                status: geminiHealth.status === 'healthy' ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                services: {
                    nlp: nlpHealth,
                    cache: cacheHealth,
                    gemini: geminiHealth,
                    chatbot: chatbotServiceHealth
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Clear cache endpoint
     */
    async clearCache(req, res) { // Renamed from clearCache to avoid conflict if ChatbotService has it
        try {
            // Assuming admin role check is done via middleware or here
            if (req.user?.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            await this.cacheService.clearAll(); // Use injected service's method for clearing all caches
            console.log('🧹 CONTROLLER: All caches cleared via CacheService');
            res.json({
                success: true,
                message: 'All caches cleared successfully.'
            });
        } catch (error) {
            console.error('Error clearing all caches from controller:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to clear all caches'
            });
        }
    }

    async getSystemStatus(req, res) {
        try {
            // Role check (đã có protect middleware, nhưng check lại trong controller là tốt)
            if (req.user?.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Unauthorized' });
            }

            // Lấy thông tin từ các service nếu có thể (ví dụ, healthCheck của từng service)
            const geminiHealth = await this.geminiService.healthCheck();
            const nlpStatus = typeof this.nlpService.getStats === 'function' ? 'active' : 'unknown'; // Hoặc gọi getStats()
            const cacheStatus = typeof this.cacheService.getStats === 'function' ? 'active' : 'unknown'; // Hoặc gọi getStats()
            const chatbotServiceStatus = typeof this.chatbotService.validateInput === 'function' ? 'active' : 'unknown';

            const status = {
                server: {
                    uptime: process.uptime(),
                    memoryUsed: process.memoryUsage(),
                    cpuUsage: process.cpuUsage(),
                    nodeVersion: process.version,
                    platform: process.platform
                },
                environment: {
                    nodeEnv: process.env.NODE_ENV,
                    geminiModelUsed: this.geminiService.defaultModel, // Lấy từ geminiService
                    hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
                    isMongoDbConnected: process.env.MONGO_URI ? 'configured' : 'missing' // Cần cách kiểm tra kết nối thực tế
                },
                services: {
                    chatbotService: chatbotServiceStatus,
                    nlpService: nlpStatus,
                    cacheService: cacheStatus,
                    geminiService: geminiHealth.status || 'unknown'
                },
                timestamp: new Date().toISOString()
            };
            res.json({ success: true, status });
        } catch (error) {
            console.error('Error getting system status from controller:', error);
            res.status(500).json({ success: false, error: 'Internal server error while fetching status' });
        }
    }

    // Helper methods like getUserFinancialData, formatFinancialContext, generateGeminiResponse
    // are NOW REMOVED from ChatbotController as they are handled by respective services.
}

export default ChatbotController;

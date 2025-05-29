/**
 * 🗣️ Enhanced Conversation Handler for VanLang Agent
 * Handles complex conversations with context awareness and personalization
 */

import ConversationManager from './conversationManager.js';
import logger from '../utils/logger.js';

class EnhancedConversationHandler {
    constructor(vanlangAgent) {
        this.agent = vanlangAgent;
        this.conversationManager = new ConversationManager();
        
        // Conversation patterns for different scenarios
        this.conversationPatterns = {
            greeting_with_question: /^(chào|hello|hi).*(làm thế nào|how|cách|giúp)/i,
            follow_up_question: /^(còn|và|thêm|nữa|khác).*(gì|what|how)/i,
            clarification_request: /^(ý bạn là|you mean|tức là|nghĩa là)/i,
            comparison_request: /^(so sánh|compare|khác nhau|difference)/i,
            step_by_step_request: /^(từng bước|step by step|hướng dẫn|guide)/i
        };

        // Start cleanup interval (every 10 minutes)
        setInterval(() => {
            this.conversationManager.cleanupExpiredConversations();
        }, 10 * 60 * 1000);
    }

    /**
     * 🎯 Main conversation handler
     */
    async handleConversation(userId, message, financialData = null) {
        try {
            // Add user message to conversation history
            this.conversationManager.addMessage(userId, message, 'user');

            // Get conversation context
            const context = this.conversationManager.getConversationContext(userId);

            // Check if user is in a conversation flow
            if (context.currentFlow) {
                return await this.handleFlowConversation(userId, message, context);
            }

            // Analyze conversation intent
            const intentAnalysis = this.conversationManager.analyzeConversationIntent(message);

            // Check for conversation patterns
            const patternMatch = this.detectConversationPattern(message);

            // Generate personalized response
            const response = await this.generatePersonalizedResponse(
                userId, 
                message, 
                intentAnalysis, 
                patternMatch, 
                financialData
            );

            // Add agent response to conversation history
            this.conversationManager.addMessage(userId, response, 'agent');

            // Generate follow-up questions
            const followUps = this.conversationManager.generateFollowUpQuestions(userId, message);

            return {
                response,
                followUpQuestions: followUps,
                conversationContext: {
                    sessionId: context.sessionId,
                    messageCount: context.messages.length,
                    suggestedFlow: intentAnalysis.suggestedFlow,
                    patternDetected: patternMatch
                }
            };

        } catch (error) {
            logger.error('Error in enhanced conversation handler:', error);
            return {
                response: 'Xin lỗi, tôi gặp lỗi khi xử lý cuộc hội thoại. Bạn có thể thử hỏi lại không?',
                followUpQuestions: [],
                conversationContext: null
            };
        }
    }

    /**
     * 🔄 Handle conversation flow
     */
    async handleFlowConversation(userId, message, context) {
        const flowResult = this.conversationManager.advanceConversationFlow(userId, message);

        if (!flowResult) {
            return {
                response: 'Có lỗi trong quá trình hội thoại. Hãy bắt đầu lại nhé!',
                followUpQuestions: []
            };
        }

        if (flowResult.isComplete) {
            // Generate final recommendation based on collected data
            const recommendation = await this.generateFlowRecommendation(
                userId, 
                flowResult.flowType, 
                flowResult.collectedData
            );

            return {
                response: recommendation,
                followUpQuestions: [
                    "Bạn có muốn tôi giải thích chi tiết hơn không?",
                    "Bạn có câu hỏi nào khác về kế hoạch này không?",
                    "Bạn có muốn bắt đầu thực hiện ngay không?"
                ],
                conversationContext: {
                    flowCompleted: true,
                    flowType: flowResult.flowType
                }
            };
        } else {
            return {
                response: `📋 **Bước ${flowResult.progress + 1}/${flowResult.totalSteps}:** ${flowResult.prompt}`,
                followUpQuestions: [],
                conversationContext: {
                    currentFlow: flowResult.flowType,
                    currentStep: flowResult.currentStep,
                    progress: flowResult.progress
                }
            };
        }
    }

    /**
     * 🔍 Detect conversation patterns
     */
    detectConversationPattern(message) {
        for (const [pattern, regex] of Object.entries(this.conversationPatterns)) {
            if (regex.test(message)) {
                return pattern;
            }
        }
        return null;
    }

    /**
     * 🎨 Generate personalized response
     */
    async generatePersonalizedResponse(userId, message, intentAnalysis, patternMatch, financialData) {
        // Get user's financial context
        const userFinancialData = financialData || await this.agent.getUserFinancialData(userId);

        // Build personalized prompt
        const personalizedPrompt = this.buildPersonalizedPrompt(
            message, 
            userFinancialData, 
            intentAnalysis, 
            patternMatch
        );

        // Get conversation context for better responses
        const context = this.conversationManager.getConversationContext(userId);
        const recentMessages = context.messages.slice(-3).map(m => `${m.type}: ${m.content}`).join('\n');

        const enhancedPrompt = `
${personalizedPrompt}

**Ngữ cảnh cuộc hội thoại gần đây:**
${recentMessages}

**Hướng dẫn phản hồi:**
- Sử dụng thông tin tài chính cá nhân để đưa ra lời khuyên cụ thể
- Tham khảo các tin nhắn trước đó để duy trì tính liên tục
- Đề xuất hành động cụ thể dựa trên dữ liệu thực tế
- Sử dụng emoji phù hợp để làm rõ nội dung
- Giữ tone thân thiện và chuyên nghiệp

Trả lời bằng tiếng Việt, tối đa 200 từ.`;

        try {
            const response = await this.agent.callGeminiAI(enhancedPrompt, { 
                temperature: 0.7,
                maxOutputTokens: 512
            });

            // Check if should suggest conversation flow
            if (intentAnalysis.suggestedFlow && intentAnalysis.confidence > 0.7) {
                const flowSuggestion = this.generateFlowSuggestion(intentAnalysis.suggestedFlow);
                return `${response}\n\n${flowSuggestion}`;
            }

            return response;

        } catch (error) {
            logger.error('Error generating personalized response:', error);
            return this.getFallbackResponse(message, userFinancialData);
        }
    }

    /**
     * 🏗️ Build personalized prompt
     */
    buildPersonalizedPrompt(message, financialData, intentAnalysis, patternMatch) {
        const summary = financialData.summary || {};
        
        let prompt = `
Bạn là VanLang Agent - trợ lý tài chính AI thông minh. Hãy trả lời câu hỏi sau một cách cá nhân hóa: "${message}"

**Thông tin tài chính của người dùng:**
- Tổng thu nhập: ${(summary.totalIncomes || 0).toLocaleString('vi-VN')} VND
- Tổng chi tiêu: ${(summary.totalExpenses || 0).toLocaleString('vi-VN')} VND
- Số dư: ${((summary.totalIncomes || 0) - (summary.totalExpenses || 0)).toLocaleString('vi-VN')} VND
- Tổng đầu tư: ${(summary.totalInvestments || 0).toLocaleString('vi-VN')} VND
- Tổng khoản vay: ${(summary.totalLoans || 0).toLocaleString('vi-VN')} VND`;

        // Add pattern-specific context
        if (patternMatch) {
            switch (patternMatch) {
                case 'greeting_with_question':
                    prompt += '\n\n**Lưu ý:** Đây là lời chào kết hợp với câu hỏi. Hãy chào lại và trả lời câu hỏi.';
                    break;
                case 'follow_up_question':
                    prompt += '\n\n**Lưu ý:** Đây là câu hỏi tiếp theo. Hãy mở rộng thông tin dựa trên ngữ cảnh.';
                    break;
                case 'comparison_request':
                    prompt += '\n\n**Lưu ý:** Người dùng muốn so sánh. Hãy đưa ra bảng so sánh rõ ràng.';
                    break;
                case 'step_by_step_request':
                    prompt += '\n\n**Lưu ý:** Người dùng muốn hướng dẫn từng bước. Hãy chia nhỏ thành các bước cụ thể.';
                    break;
            }
        }

        // Add intent-specific context
        if (intentAnalysis.suggestedFlow) {
            prompt += `\n\n**Gợi ý:** Câu hỏi này có thể dẫn đến tư vấn ${intentAnalysis.suggestedFlow}. Hãy chuẩn bị cho cuộc hội thoại sâu hơn.`;
        }

        return prompt;
    }

    /**
     * 🎯 Generate flow suggestion
     */
    generateFlowSuggestion(flowType) {
        const suggestions = {
            financial_planning: `
💡 **Gợi ý:** Tôi có thể giúp bạn lập kế hoạch tài chính chi tiết qua 4 bước:
1️⃣ Đánh giá thu nhập
2️⃣ Phân tích chi tiêu  
3️⃣ Thiết lập mục tiêu
4️⃣ Đề xuất chiến lược

Bạn có muốn bắt đầu không? Chỉ cần nói "Bắt đầu lập kế hoạch tài chính"`,

            investment_consultation: `
💡 **Gợi ý:** Tôi có thể tư vấn đầu tư cá nhân hóa qua 4 bước:
1️⃣ Đánh giá khả năng chấp nhận rủi ro
2️⃣ Xác định vốn đầu tư
3️⃣ Chọn loại hình đầu tư
4️⃣ Đề xuất danh mục

Bạn có muốn bắt đầu không? Chỉ cần nói "Tư vấn đầu tư cho tôi"`,

            debt_management: `
💡 **Gợi ý:** Tôi có thể giúp bạn quản lý nợ hiệu quả qua 4 bước:
1️⃣ Đánh giá tổng nợ
2️⃣ Xác định thu nhập
3️⃣ Tính khả năng trả nợ
4️⃣ Lập kế hoạch trả nợ

Bạn có muốn bắt đầu không? Chỉ cần nói "Giúp tôi quản lý nợ"`
        };

        return suggestions[flowType] || '';
    }

    /**
     * 🏆 Generate flow recommendation
     */
    async generateFlowRecommendation(userId, flowType, collectedData) {
        const recommendationPrompt = `
Dựa trên thông tin người dùng đã cung cấp trong cuộc hội thoại ${flowType}, hãy đưa ra kế hoạch cụ thể:

**Dữ liệu đã thu thập:**
${Object.entries(collectedData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

**Yêu cầu:**
- Đưa ra kế hoạch chi tiết, từng bước cụ thể
- Sử dụng số liệu thực tế để tính toán
- Đề xuất timeline thực hiện
- Cảnh báo rủi ro nếu có
- Khuyến nghị theo dõi và điều chỉnh

Trả lời bằng tiếng Việt, có cấu trúc rõ ràng với emoji.`;

        try {
            const recommendation = await this.agent.callGeminiAI(recommendationPrompt, {
                temperature: 0.6,
                maxOutputTokens: 1024
            });

            return `🎯 **Kế hoạch ${flowType} của bạn:**\n\n${recommendation}`;

        } catch (error) {
            logger.error('Error generating flow recommendation:', error);
            return 'Đã hoàn thành thu thập thông tin. Tôi sẽ phân tích và đưa ra kế hoạch cụ thể cho bạn.';
        }
    }

    /**
     * 🆘 Fallback response
     */
    getFallbackResponse(message, financialData) {
        const summary = financialData.summary || {};
        const balance = (summary.totalIncomes || 0) - (summary.totalExpenses || 0);

        if (balance > 0) {
            return `Dựa trên tình hình tài chính của bạn (số dư: ${balance.toLocaleString('vi-VN')} VND), tôi thấy bạn đang quản lý tốt. Về câu hỏi "${message}", bạn có thể cụ thể hơn để tôi tư vấn chính xác hơn không?`;
        } else {
            return `Tôi thấy bạn đang có thâm hụt ${Math.abs(balance).toLocaleString('vi-VN')} VND. Về câu hỏi "${message}", tôi có thể giúp bạn cải thiện tình hình tài chính. Bạn muốn tôi tư vấn gì cụ thể?`;
        }
    }

    /**
     * 🚀 Start conversation flow manually
     */
    async startFlow(userId, flowType) {
        const flowResult = this.conversationManager.startConversationFlow(userId, flowType);
        
        if (!flowResult) {
            return {
                response: 'Loại tư vấn này chưa được hỗ trợ. Vui lòng thử lại.',
                followUpQuestions: []
            };
        }

        return {
            response: `🚀 **Bắt đầu ${flowType}**\n\n📋 **Bước 1/${flowResult.totalSteps}:** ${flowResult.prompt}`,
            followUpQuestions: [],
            conversationContext: {
                flowStarted: true,
                flowType: flowResult.flowType,
                currentStep: flowResult.currentStep
            }
        };
    }

    /**
     * 📊 Get conversation statistics
     */
    getConversationStats(userId) {
        return this.conversationManager.getConversationStats(userId);
    }

    /**
     * 🗑️ Clear conversation
     */
    clearConversation(userId) {
        this.conversationManager.clearConversationContext(userId);
        return 'Đã xóa lịch sử hội thoại. Chúng ta có thể bắt đầu cuộc trò chuyện mới!';
    }
}

export default EnhancedConversationHandler;

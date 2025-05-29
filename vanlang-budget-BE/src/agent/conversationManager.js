/**
 * 🗣️ Enhanced Conversation Manager for VanLang Agent
 * Manages multi-turn conversations with context awareness
 */

import logger from '../utils/logger.js';

class ConversationManager {
    constructor() {
        // Conversation contexts by userId
        this.conversations = new Map();
        
        // Conversation templates for different scenarios
        this.conversationTemplates = {
            financial_planning: {
                steps: ['income_assessment', 'expense_analysis', 'goal_setting', 'strategy_recommendation'],
                prompts: {
                    income_assessment: "Hãy cho tôi biết thu nhập hàng tháng của bạn để tôi có thể tư vấn tốt hơn.",
                    expense_analysis: "Bạn có thể chia sẻ các khoản chi tiêu chính hàng tháng không?",
                    goal_setting: "Mục tiêu tài chính của bạn trong 1-2 năm tới là gì?",
                    strategy_recommendation: "Dựa trên thông tin bạn cung cấp, tôi sẽ đưa ra kế hoạch cụ thể."
                }
            },
            investment_consultation: {
                steps: ['risk_assessment', 'capital_evaluation', 'investment_preference', 'portfolio_recommendation'],
                prompts: {
                    risk_assessment: "Bạn có sẵn sàng chấp nhận rủi ro để có lợi nhuận cao hơn không?",
                    capital_evaluation: "Số tiền bạn dự định đầu tư là bao nhiêu?",
                    investment_preference: "Bạn quan tâm đến loại đầu tư nào: cổ phiếu, vàng, bất động sản?",
                    portfolio_recommendation: "Tôi sẽ đề xuất danh mục đầu tư phù hợp với bạn."
                }
            },
            debt_management: {
                steps: ['debt_assessment', 'income_evaluation', 'repayment_capacity', 'strategy_planning'],
                prompts: {
                    debt_assessment: "Bạn có thể cho tôi biết tổng số nợ hiện tại không?",
                    income_evaluation: "Thu nhập ổn định hàng tháng của bạn là bao nhiêu?",
                    repayment_capacity: "Bạn có thể dành bao nhiêu tiền mỗi tháng để trả nợ?",
                    strategy_planning: "Tôi sẽ lập kế hoạch trả nợ tối ưu cho bạn."
                }
            }
        };

        // Context expiry time (30 minutes)
        this.contextExpiryTime = 30 * 60 * 1000;
    }

    /**
     * 🎯 Initialize or get conversation context
     */
    getConversationContext(userId) {
        const context = this.conversations.get(userId);
        
        if (!context || this.isContextExpired(context)) {
            return this.createNewContext(userId);
        }
        
        return context;
    }

    /**
     * 🆕 Create new conversation context
     */
    createNewContext(userId) {
        const context = {
            userId,
            sessionId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            startTime: Date.now(),
            lastActivity: Date.now(),
            messages: [],
            currentFlow: null,
            currentStep: null,
            userData: {},
            preferences: {},
            followUpQuestions: [],
            conversationState: 'active'
        };

        this.conversations.set(userId, context);
        logger.info('New conversation context created', { userId, sessionId: context.sessionId });
        
        return context;
    }

    /**
     * ⏰ Check if context is expired
     */
    isContextExpired(context) {
        return (Date.now() - context.lastActivity) > this.contextExpiryTime;
    }

    /**
     * 💬 Add message to conversation history
     */
    addMessage(userId, message, type = 'user', metadata = {}) {
        const context = this.getConversationContext(userId);
        
        const messageEntry = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type, // 'user' or 'agent'
            content: message,
            timestamp: Date.now(),
            metadata
        };

        context.messages.push(messageEntry);
        context.lastActivity = Date.now();

        // Keep only last 20 messages to prevent memory bloat
        if (context.messages.length > 20) {
            context.messages = context.messages.slice(-20);
        }

        logger.info('Message added to conversation', {
            userId,
            messageId: messageEntry.id,
            type,
            messageCount: context.messages.length
        });

        return messageEntry;
    }

    /**
     * 🔄 Start conversation flow
     */
    startConversationFlow(userId, flowType) {
        const context = this.getConversationContext(userId);
        const template = this.conversationTemplates[flowType];

        if (!template) {
            logger.warn('Unknown conversation flow type', { userId, flowType });
            return null;
        }

        context.currentFlow = flowType;
        context.currentStep = template.steps[0];
        context.flowProgress = 0;

        logger.info('Conversation flow started', {
            userId,
            flowType,
            firstStep: context.currentStep
        });

        return {
            flowType,
            currentStep: context.currentStep,
            prompt: template.prompts[context.currentStep],
            totalSteps: template.steps.length
        };
    }

    /**
     * ➡️ Advance to next step in conversation flow
     */
    advanceConversationFlow(userId, userResponse) {
        const context = this.getConversationContext(userId);
        
        if (!context.currentFlow) {
            return null;
        }

        const template = this.conversationTemplates[context.currentFlow];
        const currentStepIndex = template.steps.indexOf(context.currentStep);
        
        // Store user response for current step
        context.userData[context.currentStep] = userResponse;

        // Move to next step
        if (currentStepIndex < template.steps.length - 1) {
            context.currentStep = template.steps[currentStepIndex + 1];
            context.flowProgress = currentStepIndex + 1;

            return {
                flowType: context.currentFlow,
                currentStep: context.currentStep,
                prompt: template.prompts[context.currentStep],
                progress: context.flowProgress,
                totalSteps: template.steps.length,
                isComplete: false
            };
        } else {
            // Flow completed
            context.conversationState = 'completed';
            return {
                flowType: context.currentFlow,
                isComplete: true,
                collectedData: context.userData
            };
        }
    }

    /**
     * 🧠 Analyze conversation intent and suggest flow
     */
    analyzeConversationIntent(message) {
        const normalizedMessage = message.toLowerCase().trim();

        // Financial planning keywords
        if (this.containsKeywords(normalizedMessage, [
            'kế hoạch tài chính', 'lập kế hoạch', 'quản lý tiền bạc',
            'tư vấn tài chính', 'làm sao để', 'cách quản lý'
        ])) {
            return {
                suggestedFlow: 'financial_planning',
                confidence: 0.8,
                reason: 'Financial planning keywords detected'
            };
        }

        // Investment consultation keywords
        if (this.containsKeywords(normalizedMessage, [
            'đầu tư', 'investment', 'cổ phiếu', 'vàng', 'bất động sản',
            'lợi nhuận', 'rủi ro', 'portfolio'
        ])) {
            return {
                suggestedFlow: 'investment_consultation',
                confidence: 0.8,
                reason: 'Investment keywords detected'
            };
        }

        // Debt management keywords
        if (this.containsKeywords(normalizedMessage, [
            'trả nợ', 'khoản vay', 'debt', 'nợ', 'vay',
            'trả góp', 'lãi suất', 'thanh toán'
        ])) {
            return {
                suggestedFlow: 'debt_management',
                confidence: 0.8,
                reason: 'Debt management keywords detected'
            };
        }

        return {
            suggestedFlow: null,
            confidence: 0,
            reason: 'No specific flow pattern detected'
        };
    }

    /**
     * 🔍 Helper method to check keywords
     */
    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    /**
     * 📝 Generate follow-up questions based on context
     */
    generateFollowUpQuestions(userId, lastResponse) {
        const context = this.getConversationContext(userId);
        const recentMessages = context.messages.slice(-3);

        // Analyze recent conversation to suggest relevant follow-ups
        const followUps = [];

        // If user mentioned income, suggest expense tracking
        if (this.containsKeywords(lastResponse.toLowerCase(), ['thu nhập', 'lương', 'income'])) {
            followUps.push("Bạn có muốn tôi giúp phân tích chi tiêu hàng tháng không?");
            followUps.push("Tỷ lệ tiết kiệm hiện tại của bạn là bao nhiêu?");
        }

        // If user mentioned expenses, suggest budgeting
        if (this.containsKeywords(lastResponse.toLowerCase(), ['chi tiêu', 'expense', 'tiêu dùng'])) {
            followUps.push("Bạn có muốn thiết lập ngân sách cho từng danh mục không?");
            followUps.push("Khoản chi tiêu nào bạn muốn cắt giảm nhất?");
        }

        // If user mentioned investment, suggest portfolio analysis
        if (this.containsKeywords(lastResponse.toLowerCase(), ['đầu tư', 'investment'])) {
            followUps.push("Bạn có muốn tôi phân tích danh mục đầu tư hiện tại không?");
            followUps.push("Mức độ rủi ro bạn có thể chấp nhận là gì?");
        }

        context.followUpQuestions = followUps;
        return followUps;
    }

    /**
     * 🗑️ Clear conversation context
     */
    clearConversationContext(userId) {
        this.conversations.delete(userId);
        logger.info('Conversation context cleared', { userId });
    }

    /**
     * 📊 Get conversation statistics
     */
    getConversationStats(userId) {
        const context = this.getConversationContext(userId);
        
        return {
            sessionId: context.sessionId,
            messageCount: context.messages.length,
            duration: Date.now() - context.startTime,
            currentFlow: context.currentFlow,
            currentStep: context.currentStep,
            conversationState: context.conversationState,
            lastActivity: context.lastActivity
        };
    }

    /**
     * 🧹 Cleanup expired conversations
     */
    cleanupExpiredConversations() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [userId, context] of this.conversations.entries()) {
            if (this.isContextExpired(context)) {
                this.conversations.delete(userId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info('Cleaned up expired conversations', { count: cleanedCount });
        }

        return cleanedCount;
    }
}

export default ConversationManager;

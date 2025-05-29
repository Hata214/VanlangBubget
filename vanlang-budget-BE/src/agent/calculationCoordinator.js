/**
 * 🎯 Calculation Coordinator - Điều phối giữa 2 loại tính toán
 * Phân biệt và route đến đúng engine: General vs Financial Calculation
 */

import GeneralCalculationEngine from './generalCalculationEngine.js';
import FinancialCalculationEngine from './financialCalculationEngine.js';
import logger from '../utils/logger.js';

class CalculationCoordinator {
    constructor() {
        this.generalEngine = new GeneralCalculationEngine();
        this.financialEngine = new FinancialCalculationEngine();
    }

    /**
     * 🎯 Main Detection - Phân biệt loại tính toán
     */
    async detectCalculationType(message) {
        const normalizedMessage = message.toLowerCase().trim();
        
        logger.info('Calculation type detection started', { message: normalizedMessage });
        
        // Kiểm tra General Calculation trước
        const generalResult = this.generalEngine.detectGeneralCalculation(normalizedMessage);
        
        // Kiểm tra Financial Calculation
        const financialResult = this.financialEngine.detectFinancialCalculation(normalizedMessage);
        
        // Logic quyết định ưu tiên
        const decision = this.makeCalculationDecision(generalResult, financialResult, normalizedMessage);
        
        logger.info('Calculation type detection result', {
            message: normalizedMessage,
            generalConfidence: generalResult.confidence,
            financialConfidence: financialResult.confidence,
            decision: decision.type,
            finalConfidence: decision.confidence,
            intent: decision.intent
        });
        
        return {
            isCalculation: decision.confidence > 0.5,
            type: decision.type,
            confidence: decision.confidence,
            intent: decision.intent
        };
    }

    /**
     * 🧠 Logic quyết định loại tính toán
     */
    makeCalculationDecision(generalResult, financialResult, message) {
        // Nếu cả 2 đều có confidence thấp
        if (generalResult.confidence < 0.3 && financialResult.confidence < 0.3) {
            return {
                type: 'none',
                confidence: 0,
                intent: 'other'
            };
        }
        
        // Nếu chỉ có 1 loại có confidence cao
        if (generalResult.confidence >= 0.7 && financialResult.confidence < 0.5) {
            return {
                type: 'general',
                confidence: generalResult.confidence,
                intent: 'general_calculation'
            };
        }
        
        if (financialResult.confidence >= 0.7 && generalResult.confidence < 0.5) {
            return {
                type: 'financial',
                confidence: financialResult.confidence,
                intent: 'financial_calculation'
            };
        }
        
        // Nếu cả 2 đều có confidence cao - cần phân biệt bằng context
        if (generalResult.confidence >= 0.5 && financialResult.confidence >= 0.5) {
            return this.resolveConflict(generalResult, financialResult, message);
        }
        
        // Chọn loại có confidence cao hơn
        if (generalResult.confidence > financialResult.confidence) {
            return {
                type: 'general',
                confidence: generalResult.confidence,
                intent: 'general_calculation'
            };
        } else {
            return {
                type: 'financial',
                confidence: financialResult.confidence,
                intent: 'financial_calculation'
            };
        }
    }

    /**
     * ⚖️ Giải quyết xung đột khi cả 2 loại đều có confidence cao
     */
    resolveConflict(generalResult, financialResult, message) {
        // Các từ khóa ưu tiên Financial
        const financialPriorityKeywords = [
            'số dư', 'so du', 'balance',
            'có thể chi', 'co the chi', 'đủ tiền', 'du tien',
            'sau khi chi', 'nếu chi', 'neu chi',
            'còn bao nhiêu', 'con bao nhieu',
            'thiếu', 'thieu', 'shortage'
        ];
        
        // Các từ khóa ưu tiên General
        const generalPriorityKeywords = [
            'bằng bao nhiêu', 'bang bao nhieu', 'equals',
            'kết quả', 'ket qua', 'result',
            'cộng', 'trừ', 'nhân', 'chia',
            'phần trăm', 'percent', '%',
            'lãi suất', 'lai suat', 'interest'
        ];
        
        const hasFinancialPriority = financialPriorityKeywords.some(keyword =>
            message.includes(keyword)
        );
        
        const hasGeneralPriority = generalPriorityKeywords.some(keyword =>
            message.includes(keyword)
        );
        
        // Nếu có từ khóa ưu tiên rõ ràng
        if (hasFinancialPriority && !hasGeneralPriority) {
            return {
                type: 'financial',
                confidence: financialResult.confidence * 1.2, // Boost confidence
                intent: 'financial_calculation'
            };
        }
        
        if (hasGeneralPriority && !hasFinancialPriority) {
            return {
                type: 'general',
                confidence: generalResult.confidence * 1.2, // Boost confidence
                intent: 'general_calculation'
            };
        }
        
        // Nếu có cấu trúc điều kiện với context tài chính -> Financial
        const hasConditionalFinancial = this.hasConditionalFinancialStructure(message);
        if (hasConditionalFinancial) {
            return {
                type: 'financial',
                confidence: financialResult.confidence * 1.1,
                intent: 'financial_calculation'
            };
        }
        
        // Nếu có biểu thức toán học rõ ràng -> General
        const hasMathExpression = /[\d\s+\-*/()%=?]+/.test(message);
        if (hasMathExpression) {
            return {
                type: 'general',
                confidence: generalResult.confidence * 1.1,
                intent: 'general_calculation'
            };
        }
        
        // Default: chọn loại có confidence cao hơn
        if (financialResult.confidence >= generalResult.confidence) {
            return {
                type: 'financial',
                confidence: financialResult.confidence,
                intent: 'financial_calculation'
            };
        } else {
            return {
                type: 'general',
                confidence: generalResult.confidence,
                intent: 'general_calculation'
            };
        }
    }

    /**
     * 🔍 Kiểm tra cấu trúc điều kiện tài chính
     */
    hasConditionalFinancialStructure(message) {
        const patterns = [
            /(nếu|neu|if).*(chi|spend|mua|buy).*(thì|thi|then).*(còn|con|left|remain)/i,
            /(sau khi|after).*(chi|spend|mua|buy).*(thì|thi|then)/i,
            /(tôi|toi|i).*(có thể|co the|can).*(chi|spend)/i
        ];
        
        return patterns.some(pattern => pattern.test(message));
    }

    /**
     * 🚀 Main Processing - Xử lý tính toán
     */
    async processCalculation(message, calculationType, financialData = null) {
        try {
            logger.info('Processing calculation', {
                message,
                calculationType,
                hasFinancialData: !!financialData
            });
            
            switch (calculationType) {
                case 'general':
                    return await this.generalEngine.processCalculation(message);
                    
                case 'financial':
                    if (!financialData) {
                        return this.getNoDataError();
                    }
                    return await this.financialEngine.processFinancialCalculation(message, financialData);
                    
                default:
                    return this.getUnknownTypeError();
            }
            
        } catch (error) {
            logger.error('Error in calculation coordinator:', error);
            return this.getProcessingError();
        }
    }

    /**
     * 🎯 Convenience method - Detect và process trong 1 lần gọi
     */
    async detectAndProcess(message, financialData = null) {
        const detection = await this.detectCalculationType(message);
        
        if (!detection.isCalculation) {
            return {
                isCalculation: false,
                response: null
            };
        }
        
        const response = await this.processCalculation(message, detection.type, financialData);
        
        return {
            isCalculation: true,
            type: detection.type,
            confidence: detection.confidence,
            intent: detection.intent,
            response
        };
    }

    /**
     * 📊 Get calculation capabilities
     */
    getCapabilities() {
        return {
            general: {
                name: 'Tính toán thông thường',
                description: 'Thực hiện các phép tính cơ bản, biểu thức toán học, phần trăm, lãi suất đơn giản',
                examples: [
                    '2 + 3 = ?',
                    '15% của 1 triệu',
                    '1000 * 12 tháng',
                    'lãi suất 5% của 10 triệu trong 12 tháng'
                ]
            },
            financial: {
                name: 'Tính toán tài chính hiện tại',
                description: 'Tính số dư, phân tích khả năng chi tiêu dựa trên dữ liệu thực',
                examples: [
                    'Tôi có thể chi 4tr được không?',
                    'Nếu tôi chi 2 triệu thì còn bao nhiêu?',
                    'Tôi có đủ tiền chi 500k không?',
                    'Sau khi chi 1 triệu thì thiếu bao nhiêu?'
                ]
            }
        };
    }

    /**
     * 🔧 Error responses
     */
    getNoDataError() {
        return `❌ **Không thể thực hiện tính toán tài chính**

⚠️ **Lý do:** Không có dữ liệu tài chính để tính toán.

💡 **Gợi ý:**
• Thêm một số giao dịch thu nhập/chi tiêu trước
• Hoặc thử các phép tính thông thường như "2 + 3" hoặc "15% của 1 triệu"`;
    }

    getUnknownTypeError() {
        return `❌ **Không thể xác định loại tính toán**

💡 **Các loại tính toán được hỗ trợ:**

🧮 **Tính toán thông thường:**
• Phép tính cơ bản: "2 + 3", "100 * 12"
• Phần trăm: "15% của 1 triệu"
• Lãi suất: "lãi suất 5% của 10 triệu"

💰 **Tính toán tài chính:**
• Số dư: "Số dư của tôi"
• Khả năng chi tiêu: "Tôi có thể chi 4tr không?"
• Dự đoán: "Nếu chi 2 triệu thì còn bao nhiêu?"`;
    }

    getProcessingError() {
        return `❌ **Lỗi xử lý tính toán**

🔄 **Vui lòng thử lại hoặc:**
• Nói rõ hơn về phép tính cần thực hiện
• Kiểm tra cú pháp của biểu thức toán học
• Đảm bảo có đủ dữ liệu tài chính (nếu cần)

💡 **Ví dụ:**
• "2 cộng 3 bằng bao nhiêu?"
• "Tôi có đủ tiền chi 500k không?"`;
    }
}

export default CalculationCoordinator;

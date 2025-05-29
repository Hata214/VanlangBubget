/**
 * 🧮 General Calculation Engine - Tính toán thuần túy
 * Xử lý các phép tính cơ bản, biểu thức toán học, phần trăm, lãi suất đơn giản
 */

import logger from '../utils/logger.js';

class GeneralCalculationEngine {
    constructor() {
        this.mathOperators = ['+', '-', '*', '/', '(', ')', '%'];
        this.mathKeywords = {
            'cộng': '+',
            'trừ': '-', 
            'nhân': '*',
            'chia': '/',
            'phần trăm': '%',
            'percent': '%',
            'của': '*',
            'lần': '*',
            'bằng': '=',
            'là': '='
        };
    }

    /**
     * 🎯 Main Detection - Kiểm tra xem có phải general calculation không
     */
    detectGeneralCalculation(message) {
        const normalizedMessage = message.toLowerCase().trim();
        
        // Pattern 1: Biểu thức toán học trực tiếp
        const mathExpressionPattern = /[\d\s+\-*/()%=?]+/;
        const hasMathExpression = mathExpressionPattern.test(normalizedMessage);
        
        // Pattern 2: Từ khóa toán học
        const hasMathKeywords = Object.keys(this.mathKeywords).some(keyword => 
            normalizedMessage.includes(keyword)
        );
        
        // Pattern 3: Phần trăm calculation
        const percentagePattern = /(\d+(?:\.\d+)?)\s*%?\s*(của|of)\s*(\d+(?:[k|nghìn|triệu|tr|m])?)/i;
        const hasPercentageCalc = percentagePattern.test(normalizedMessage);
        
        // Pattern 4: Lãi suất đơn giản
        const interestPattern = /(lãi suất|interest|lãi|lai)\s*(\d+(?:\.\d+)?)\s*%/i;
        const hasInterestCalc = interestPattern.test(normalizedMessage);
        
        // Pattern 5: Các phép tính cơ bản với từ khóa
        const basicMathPatterns = [
            /(\d+(?:\.\d+)?)\s*(cộng|plus|\+)\s*(\d+(?:\.\d+)?)/i,
            /(\d+(?:\.\d+)?)\s*(trừ|minus|\-)\s*(\d+(?:\.\d+)?)/i,
            /(\d+(?:\.\d+)?)\s*(nhân|times|\*|x)\s*(\d+(?:\.\d+)?)/i,
            /(\d+(?:\.\d+)?)\s*(chia|divided|\/)\s*(\d+(?:\.\d+)?)/i,
            /(\d+(?:\.\d+)?)\s*(tháng|months?)\s*(x|\*|nhân)/i
        ];
        
        const hasBasicMath = basicMathPatterns.some(pattern => pattern.test(normalizedMessage));
        
        // Pattern 6: Câu hỏi tính toán thuần túy
        const pureCalculationKeywords = [
            'bằng bao nhiêu', 'bang bao nhieu', 'equals', 'result',
            'kết quả', 'ket qua', 'tính ra', 'tinh ra',
            'calculate', 'compute', 'math'
        ];
        
        const hasPureCalculationKeywords = pureCalculationKeywords.some(keyword =>
            normalizedMessage.includes(keyword)
        );
        
        const confidence = this.calculateConfidence({
            hasMathExpression,
            hasMathKeywords,
            hasPercentageCalc,
            hasInterestCalc,
            hasBasicMath,
            hasPureCalculationKeywords
        });
        
        const isGeneralCalculation = confidence > 0.6;
        
        logger.info('General calculation detection', {
            message: normalizedMessage,
            patterns: {
                hasMathExpression,
                hasMathKeywords,
                hasPercentageCalc,
                hasInterestCalc,
                hasBasicMath,
                hasPureCalculationKeywords
            },
            confidence,
            isGeneralCalculation
        });
        
        return {
            isGeneralCalculation,
            confidence,
            type: this.determineCalculationType(normalizedMessage)
        };
    }

    /**
     * 📊 Tính confidence score
     */
    calculateConfidence(patterns) {
        let score = 0;
        const weights = {
            hasMathExpression: 0.3,
            hasMathKeywords: 0.2,
            hasPercentageCalc: 0.25,
            hasInterestCalc: 0.25,
            hasBasicMath: 0.3,
            hasPureCalculationKeywords: 0.2
        };
        
        Object.entries(patterns).forEach(([key, value]) => {
            if (value && weights[key]) {
                score += weights[key];
            }
        });
        
        return Math.min(score, 1.0);
    }

    /**
     * 🔍 Xác định loại tính toán
     */
    determineCalculationType(message) {
        if (message.includes('%') || message.includes('phần trăm') || message.includes('percent')) {
            return 'percentage';
        }
        if (message.includes('lãi') || message.includes('interest')) {
            return 'interest';
        }
        if (/[\+\-\*\/]/.test(message)) {
            return 'arithmetic';
        }
        return 'general';
    }

    /**
     * 🧮 Main Processing - Xử lý tính toán
     */
    async processCalculation(message) {
        try {
            const normalizedMessage = message.toLowerCase().trim();
            
            // Xử lý theo loại tính toán
            const calculationType = this.determineCalculationType(normalizedMessage);
            
            switch (calculationType) {
                case 'percentage':
                    return await this.processPercentageCalculation(normalizedMessage);
                case 'interest':
                    return await this.processInterestCalculation(normalizedMessage);
                case 'arithmetic':
                    return await this.processArithmeticCalculation(normalizedMessage);
                default:
                    return await this.processGeneralMath(normalizedMessage);
            }
            
        } catch (error) {
            logger.error('Error processing general calculation:', error);
            return this.getErrorResponse();
        }
    }

    /**
     * 📊 Xử lý tính phần trăm
     */
    async processPercentageCalculation(message) {
        // Pattern: "15% của 1 triệu", "20 phần trăm của 500k"
        const percentagePattern = /(\d+(?:\.\d+)?)\s*%?\s*(phần trăm|percent|%)?\s*(của|of)\s*(\d+(?:[k|nghìn|triệu|tr|m])?)/i;
        const match = message.match(percentagePattern);
        
        if (match) {
            const percentage = parseFloat(match[1]);
            const amountStr = match[4];
            const amount = this.parseAmount(amountStr);
            
            const result = (amount * percentage) / 100;
            
            return `🧮 **Tính phần trăm:**

📊 **${percentage}% của ${this.formatCurrency(amount)}**
💰 **Kết quả:** ${this.formatCurrency(result)}

📝 **Công thức:** ${this.formatCurrency(amount)} × ${percentage}% = ${this.formatCurrency(result)}`;
        }
        
        return this.getErrorResponse('Không thể nhận diện phép tính phần trăm. Ví dụ: "15% của 1 triệu"');
    }

    /**
     * 💰 Xử lý tính lãi suất
     */
    async processInterestCalculation(message) {
        // Pattern: "lãi suất 5% của 10 triệu trong 12 tháng"
        const interestPattern = /(lãi suất|lãi|interest)\s*(\d+(?:\.\d+)?)\s*%\s*(của|of)?\s*(\d+(?:[k|nghìn|triệu|tr|m])?)\s*(trong|for)?\s*(\d+)?\s*(tháng|months?|năm|years?)?/i;
        const match = message.match(interestPattern);
        
        if (match) {
            const rate = parseFloat(match[2]);
            const principal = this.parseAmount(match[4]);
            const timeValue = match[6] ? parseInt(match[6]) : 12;
            const timeUnit = match[7] || 'tháng';
            
            // Convert to months if needed
            const months = timeUnit.includes('năm') || timeUnit.includes('year') ? timeValue * 12 : timeValue;
            
            const interest = (principal * rate * months) / (100 * 12); // Simple interest per month
            const total = principal + interest;
            
            return `🧮 **Tính lãi suất đơn giản:**

💰 **Vốn gốc:** ${this.formatCurrency(principal)}
📊 **Lãi suất:** ${rate}%/năm
⏰ **Thời gian:** ${timeValue} ${timeUnit}

💵 **Tiền lãi:** ${this.formatCurrency(interest)}
💎 **Tổng cộng:** ${this.formatCurrency(total)}

📝 **Công thức:** Lãi = Vốn × Lãi suất × Thời gian`;
        }
        
        return this.getErrorResponse('Không thể nhận diện phép tính lãi suất. Ví dụ: "lãi suất 5% của 10 triệu trong 12 tháng"');
    }

    /**
     * ➕ Xử lý phép tính số học
     */
    async processArithmeticCalculation(message) {
        try {
            // Chuẩn hóa biểu thức
            let expression = this.normalizeExpression(message);
            
            // Đánh giá biểu thức
            const result = this.evaluateExpression(expression);
            
            return `🧮 **Phép tính:**

📝 **Biểu thức:** ${expression}
💰 **Kết quả:** ${this.formatNumber(result)}`;
            
        } catch (error) {
            return this.getErrorResponse('Không thể tính toán biểu thức. Ví dụ: "2 + 3 * 4" hoặc "1000 * 12"');
        }
    }

    /**
     * 🔢 Xử lý tính toán tổng quát
     */
    async processGeneralMath(message) {
        // Tìm các số trong câu
        const numbers = this.extractNumbers(message);
        
        if (numbers.length >= 2) {
            // Thử đoán phép tính dựa trên context
            const operation = this.guessOperation(message);
            const result = this.performOperation(numbers, operation);
            
            return `🧮 **Tính toán:**

🔢 **Các số:** ${numbers.map(n => this.formatNumber(n)).join(', ')}
➕ **Phép tính:** ${operation}
💰 **Kết quả:** ${this.formatNumber(result)}`;
        }
        
        return this.getErrorResponse('Không thể nhận diện phép tính. Hãy nói rõ hơn, ví dụ: "2 cộng 3" hoặc "1000 * 12"');
    }

    /**
     * 🔧 Helper Methods
     */
    parseAmount(amountStr) {
        const number = parseFloat(amountStr.replace(/[^\d.]/g, ''));
        
        if (amountStr.includes('k') || amountStr.includes('nghìn')) {
            return number * 1000;
        }
        if (amountStr.includes('triệu') || amountStr.includes('tr') || amountStr.includes('m')) {
            return number * 1000000;
        }
        
        return number;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
    }

    formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }

    normalizeExpression(message) {
        let expr = message;
        
        // Replace Vietnamese keywords
        Object.entries(this.mathKeywords).forEach(([keyword, operator]) => {
            expr = expr.replace(new RegExp(keyword, 'gi'), operator);
        });
        
        // Clean up
        expr = expr.replace(/[^\d+\-*/().]/g, ' ').trim();
        expr = expr.replace(/\s+/g, '');
        
        return expr;
    }

    evaluateExpression(expression) {
        // Simple safe evaluation (only allow numbers and basic operators)
        if (!/^[\d+\-*/().\s]+$/.test(expression)) {
            throw new Error('Invalid expression');
        }
        
        return Function('"use strict"; return (' + expression + ')')();
    }

    extractNumbers(message) {
        const matches = message.match(/\d+(?:\.\d+)?/g);
        return matches ? matches.map(n => parseFloat(n)) : [];
    }

    guessOperation(message) {
        if (message.includes('cộng') || message.includes('+')) return 'cộng';
        if (message.includes('trừ') || message.includes('-')) return 'trừ';
        if (message.includes('nhân') || message.includes('*') || message.includes('x')) return 'nhân';
        if (message.includes('chia') || message.includes('/')) return 'chia';
        return 'cộng'; // default
    }

    performOperation(numbers, operation) {
        if (numbers.length < 2) return numbers[0] || 0;
        
        switch (operation) {
            case 'cộng': return numbers.reduce((a, b) => a + b, 0);
            case 'trừ': return numbers.reduce((a, b) => a - b);
            case 'nhân': return numbers.reduce((a, b) => a * b, 1);
            case 'chia': return numbers.reduce((a, b) => a / b);
            default: return numbers.reduce((a, b) => a + b, 0);
        }
    }

    getErrorResponse(customMessage = null) {
        return customMessage || `❌ **Không thể thực hiện tính toán**

💡 **Các loại tính toán được hỗ trợ:**
• Phép tính cơ bản: "2 + 3", "100 * 12"
• Phần trăm: "15% của 1 triệu"
• Lãi suất: "lãi suất 5% của 10 triệu trong 12 tháng"

🔍 **Ví dụ:**
• "2 cộng 3 bằng bao nhiêu?"
• "1000 nhân 12"
• "20% của 500k"`;
    }
}

export default GeneralCalculationEngine;

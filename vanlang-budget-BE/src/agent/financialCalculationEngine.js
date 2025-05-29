/**
 * 💰 Financial Calculation Engine - Tính toán tài chính dựa trên dữ liệu thực
 * Xử lý các câu hỏi về số dư, khả năng chi tiêu, dự đoán tài chính
 */

import logger from '../utils/logger.js';

class FinancialCalculationEngine {
    constructor() {
        this.financialKeywords = {
            balance: ['số dư', 'so du', 'balance', 'còn lại', 'con lai'],
            canSpend: ['có thể chi', 'co the chi', 'đủ tiền', 'du tien', 'can afford'],
            afterSpending: ['sau khi chi', 'sau khi chi', 'nếu chi', 'neu chi', 'if spend'],
            shortage: ['thiếu', 'thieu', 'shortage', 'không đủ', 'khong du'],
            remaining: ['còn bao nhiêu', 'con bao nhieu', 'how much left', 'sẽ còn', 'se con']
        };
    }

    /**
     * 🎯 Main Detection - Kiểm tra xem có phải financial calculation không
     */
    detectFinancialCalculation(message) {
        const normalizedMessage = message.toLowerCase().trim();
        
        // Pattern 1: Câu hỏi về số dư
        const hasBalanceKeywords = this.financialKeywords.balance.some(keyword =>
            normalizedMessage.includes(keyword)
        );
        
        // Pattern 2: Câu hỏi về khả năng chi tiêu
        const hasSpendingKeywords = this.financialKeywords.canSpend.some(keyword =>
            normalizedMessage.includes(keyword)
        );
        
        // Pattern 3: Câu hỏi về tình trạng sau chi tiêu
        const hasAfterSpendingKeywords = this.financialKeywords.afterSpending.some(keyword =>
            normalizedMessage.includes(keyword)
        );
        
        // Pattern 4: Câu hỏi về thiếu hụt
        const hasShortageKeywords = this.financialKeywords.shortage.some(keyword =>
            normalizedMessage.includes(keyword)
        );
        
        // Pattern 5: Câu hỏi về số tiền còn lại
        const hasRemainingKeywords = this.financialKeywords.remaining.some(keyword =>
            normalizedMessage.includes(keyword)
        );
        
        // Pattern 6: Có cấu trúc điều kiện với số tiền
        const hasConditionalWithAmount = this.hasConditionalStructureWithAmount(normalizedMessage);
        
        // Pattern 7: Có số tiền cụ thể trong context tài chính
        const hasAmountInFinancialContext = this.hasAmountInFinancialContext(normalizedMessage);
        
        const confidence = this.calculateConfidence({
            hasBalanceKeywords,
            hasSpendingKeywords,
            hasAfterSpendingKeywords,
            hasShortageKeywords,
            hasRemainingKeywords,
            hasConditionalWithAmount,
            hasAmountInFinancialContext
        });
        
        const isFinancialCalculation = confidence > 0.5;
        
        logger.info('Financial calculation detection', {
            message: normalizedMessage,
            patterns: {
                hasBalanceKeywords,
                hasSpendingKeywords,
                hasAfterSpendingKeywords,
                hasShortageKeywords,
                hasRemainingKeywords,
                hasConditionalWithAmount,
                hasAmountInFinancialContext
            },
            confidence,
            isFinancialCalculation
        });
        
        return {
            isFinancialCalculation,
            confidence,
            type: this.determineFinancialCalculationType(normalizedMessage)
        };
    }

    /**
     * 📊 Tính confidence score
     */
    calculateConfidence(patterns) {
        let score = 0;
        const weights = {
            hasBalanceKeywords: 0.25,
            hasSpendingKeywords: 0.25,
            hasAfterSpendingKeywords: 0.3,
            hasShortageKeywords: 0.2,
            hasRemainingKeywords: 0.3,
            hasConditionalWithAmount: 0.35,
            hasAmountInFinancialContext: 0.15
        };
        
        Object.entries(patterns).forEach(([key, value]) => {
            if (value && weights[key]) {
                score += weights[key];
            }
        });
        
        return Math.min(score, 1.0);
    }

    /**
     * 🔍 Kiểm tra cấu trúc điều kiện với số tiền
     */
    hasConditionalStructureWithAmount(message) {
        const conditionalPattern = /(nếu|neu|if).*(chi|spend|mua|buy).*(thì|thi|then)/i;
        const amountPattern = /\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)/i;
        
        return conditionalPattern.test(message) && amountPattern.test(message);
    }

    /**
     * 💰 Kiểm tra số tiền trong context tài chính
     */
    hasAmountInFinancialContext(message) {
        const amountPattern = /\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)/i;
        const financialContextKeywords = [
            'chi', 'spend', 'mua', 'buy', 'trả', 'pay',
            'tiền', 'money', 'đồng', 'vnd', 'budget'
        ];
        
        const hasAmount = amountPattern.test(message);
        const hasFinancialContext = financialContextKeywords.some(keyword =>
            message.includes(keyword)
        );
        
        return hasAmount && hasFinancialContext;
    }

    /**
     * 🔍 Xác định loại tính toán tài chính
     */
    determineFinancialCalculationType(message) {
        if (this.financialKeywords.balance.some(k => message.includes(k))) {
            return 'balance_check';
        }
        if (this.financialKeywords.canSpend.some(k => message.includes(k))) {
            return 'spending_ability';
        }
        if (this.financialKeywords.afterSpending.some(k => message.includes(k))) {
            return 'after_spending';
        }
        if (this.financialKeywords.shortage.some(k => message.includes(k))) {
            return 'shortage_check';
        }
        if (this.financialKeywords.remaining.some(k => message.includes(k))) {
            return 'remaining_balance';
        }
        return 'general_financial';
    }

    /**
     * 💰 Main Processing - Xử lý tính toán tài chính
     */
    async processFinancialCalculation(message, financialData) {
        try {
            const calculationType = this.determineFinancialCalculationType(message.toLowerCase());
            const currentBalance = this.calculateCurrentBalance(financialData);
            
            logger.info('Processing financial calculation', {
                calculationType,
                currentBalance,
                message
            });
            
            switch (calculationType) {
                case 'balance_check':
                    return this.processBalanceCheck(currentBalance, financialData);
                case 'spending_ability':
                    return this.processSpendingAbility(message, currentBalance, financialData);
                case 'after_spending':
                    return this.processAfterSpending(message, currentBalance, financialData);
                case 'shortage_check':
                    return this.processShortageCheck(message, currentBalance, financialData);
                case 'remaining_balance':
                    return this.processRemainingBalance(message, currentBalance, financialData);
                default:
                    return this.processGeneralFinancial(message, currentBalance, financialData);
            }
            
        } catch (error) {
            logger.error('Error processing financial calculation:', error);
            return this.getErrorResponse();
        }
    }

    /**
     * 💰 Tính số dư hiện tại
     */
    calculateCurrentBalance(financialData) {
        const totalIncome = financialData.summary.totalIncomes || 0;
        const totalExpense = financialData.summary.totalExpenses || 0;
        const totalSavings = this.calculateTotalSavings(financialData);
        
        return {
            netBalance: totalIncome - totalExpense,
            totalIncome,
            totalExpense,
            totalSavings,
            availableBalance: totalIncome - totalExpense + totalSavings
        };
    }

    /**
     * 💎 Tính tổng tiền tiết kiệm
     */
    calculateTotalSavings(financialData) {
        if (!financialData.incomes) return 0;
        
        return financialData.incomes
            .filter(income => {
                const categoryLower = income.category?.toLowerCase() || '';
                return categoryLower.includes('tiết kiệm') || categoryLower === 'tiền tiết kiệm';
            })
            .reduce((sum, income) => sum + income.amount, 0);
    }

    /**
     * 🔍 Xử lý kiểm tra số dư
     */
    processBalanceCheck(balance, financialData) {
        return `💰 **Số dư hiện tại của bạn:**

📊 **Tổng quan tài chính:**
• Thu nhập: ${this.formatCurrency(balance.totalIncome)}
• Chi tiêu: ${this.formatCurrency(balance.totalExpense)}
• Tiết kiệm: ${this.formatCurrency(balance.totalSavings)}

💎 **Số dư ròng:** ${this.formatCurrency(balance.netBalance)}
💵 **Số dư khả dụng:** ${this.formatCurrency(balance.availableBalance)}

${balance.netBalance >= 0 ? '✅ **Tình hình tài chính tích cực!**' : '⚠️ **Cần cân nhắc chi tiêu!**'}

💡 **Gợi ý:** ${this.getBalanceAdvice(balance)}`;
    }

    /**
     * 💸 Xử lý khả năng chi tiêu
     */
    processSpendingAbility(message, balance, financialData) {
        const amount = this.extractAmount(message);
        
        if (!amount) {
            return this.getErrorResponse('Không thể xác định số tiền. Ví dụ: "Tôi có thể chi 4tr được không?"');
        }
        
        const canAfford = balance.availableBalance >= amount;
        const remainingAfterSpending = balance.availableBalance - amount;
        
        return `💸 **Khả năng chi tiêu ${this.formatCurrency(amount)}:**

💰 **Số dư khả dụng:** ${this.formatCurrency(balance.availableBalance)}
💵 **Số tiền muốn chi:** ${this.formatCurrency(amount)}
📊 **Số dư sau khi chi:** ${this.formatCurrency(remainingAfterSpending)}

${canAfford ? 
    `✅ **Bạn có thể chi tiêu số tiền này!**\n💡 **Còn lại:** ${this.formatCurrency(remainingAfterSpending)}` :
    `❌ **Không đủ tiền để chi tiêu!**\n⚠️ **Thiếu:** ${this.formatCurrency(Math.abs(remainingAfterSpending))}`
}

💡 **Lời khuyên:** ${this.getSpendingAdvice(amount, balance, canAfford)}`;
    }

    /**
     * 🔮 Xử lý tình trạng sau chi tiêu
     */
    processAfterSpending(message, balance, financialData) {
        const amount = this.extractAmount(message);
        
        if (!amount) {
            return this.getErrorResponse('Không thể xác định số tiền. Ví dụ: "Nếu tôi chi 2 triệu thì còn bao nhiêu?"');
        }
        
        const remainingBalance = balance.availableBalance - amount;
        const percentageSpent = (amount / balance.availableBalance) * 100;
        
        return `🔮 **Dự đoán sau khi chi ${this.formatCurrency(amount)}:**

💰 **Số dư hiện tại:** ${this.formatCurrency(balance.availableBalance)}
💸 **Số tiền chi:** ${this.formatCurrency(amount)} (${percentageSpent.toFixed(1)}%)
💵 **Số dư còn lại:** ${this.formatCurrency(remainingBalance)}

${remainingBalance >= 0 ? 
    `✅ **Vẫn còn tiền!**` :
    `❌ **Sẽ bị âm:** ${this.formatCurrency(Math.abs(remainingBalance))}`
}

📊 **Phân tích:**
${this.getAfterSpendingAnalysis(amount, balance, remainingBalance)}

💡 **Khuyến nghị:** ${this.getAfterSpendingAdvice(remainingBalance, percentageSpent)}`;
    }

    /**
     * ⚠️ Xử lý kiểm tra thiếu hụt
     */
    processShortageCheck(message, balance, financialData) {
        const amount = this.extractAmount(message);
        
        if (!amount) {
            return this.getErrorResponse('Không thể xác định số tiền. Ví dụ: "Sau khi chi 1 triệu thì thiếu bao nhiêu?"');
        }
        
        const shortage = amount - balance.availableBalance;
        
        if (shortage <= 0) {
            return `✅ **Không thiếu tiền!**

💰 **Số dư khả dụng:** ${this.formatCurrency(balance.availableBalance)}
💸 **Số tiền cần:** ${this.formatCurrency(amount)}
💵 **Thừa:** ${this.formatCurrency(Math.abs(shortage))}

🎉 **Bạn có đủ tiền để chi tiêu!**`;
        }
        
        return `⚠️ **Thiếu hụt tài chính:**

💰 **Số dư khả dụng:** ${this.formatCurrency(balance.availableBalance)}
💸 **Số tiền cần:** ${this.formatCurrency(amount)}
❌ **Thiếu:** ${this.formatCurrency(shortage)}

💡 **Giải pháp:**
${this.getShortageAdvice(shortage, balance)}`;
    }

    /**
     * 💵 Xử lý số dư còn lại
     */
    processRemainingBalance(message, balance, financialData) {
        const amount = this.extractAmount(message);
        
        if (amount) {
            return this.processAfterSpending(message, balance, financialData);
        }
        
        return this.processBalanceCheck(balance, financialData);
    }

    /**
     * 🔧 Helper Methods
     */
    extractAmount(message) {
        const amountPattern = /(\d+(?:\.\d+)?)\s*(k|nghìn|triệu|tr|m)/i;
        const match = message.match(amountPattern);
        
        if (!match) return null;
        
        const number = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        
        switch (unit) {
            case 'k':
            case 'nghìn':
                return number * 1000;
            case 'triệu':
            case 'tr':
            case 'm':
                return number * 1000000;
            default:
                return number;
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
    }

    getBalanceAdvice(balance) {
        if (balance.netBalance < 0) {
            return 'Cần giảm chi tiêu hoặc tăng thu nhập để cân bằng tài chính.';
        }
        if (balance.netBalance < balance.totalIncome * 0.1) {
            return 'Nên tăng cường tiết kiệm để có dự phòng tài chính.';
        }
        return 'Tình hình tài chính ổn định. Có thể cân nhắc đầu tư hoặc tiết kiệm thêm.';
    }

    getSpendingAdvice(amount, balance, canAfford) {
        if (!canAfford) {
            return 'Cân nhắc giảm số tiền chi tiêu hoặc tìm nguồn thu nhập bổ sung.';
        }
        
        const percentageOfBalance = (amount / balance.availableBalance) * 100;
        
        if (percentageOfBalance > 50) {
            return 'Đây là khoản chi tiêu lớn. Hãy cân nhắc kỹ trước khi quyết định.';
        }
        if (percentageOfBalance > 20) {
            return 'Khoản chi tiêu này chiếm tỷ lệ đáng kể. Đảm bảo vẫn có dự phòng.';
        }
        return 'Khoản chi tiêu này nằm trong khả năng tài chính của bạn.';
    }

    getAfterSpendingAnalysis(amount, balance, remainingBalance) {
        const percentageRemaining = (remainingBalance / balance.availableBalance) * 100;
        
        if (remainingBalance < 0) {
            return '• Sẽ vượt quá khả năng tài chính\n• Cần tìm nguồn bổ sung hoặc giảm chi tiêu';
        }
        if (percentageRemaining < 10) {
            return '• Sẽ cạn kiệt tài chính\n• Cần thận trọng với các chi tiêu tiếp theo';
        }
        if (percentageRemaining < 30) {
            return '• Còn ít dự phòng\n• Nên hạn chế chi tiêu không cần thiết';
        }
        return '• Vẫn còn dư dả\n• Có thể tiếp tục chi tiêu hợp lý';
    }

    getAfterSpendingAdvice(remainingBalance, percentageSpent) {
        if (remainingBalance < 0) {
            return 'Không nên thực hiện giao dịch này. Tìm cách giảm chi tiêu hoặc tăng thu nhập.';
        }
        if (percentageSpent > 70) {
            return 'Cân nhắc kỹ trước khi chi tiêu. Đảm bảo có đủ tiền cho các nhu cầu thiết yếu.';
        }
        if (percentageSpent > 40) {
            return 'Có thể thực hiện nhưng nên hạn chế chi tiêu khác trong thời gian tới.';
        }
        return 'Có thể thực hiện giao dịch này một cách an toàn.';
    }

    getShortageAdvice(shortage, balance) {
        const suggestions = [
            `• Tiết kiệm thêm ${this.formatCurrency(shortage)}`,
            '• Tìm nguồn thu nhập bổ sung',
            '• Giảm bớt các chi tiêu không cần thiết',
            '• Cân nhắc vay mượn (nếu thực sự cần thiết)'
        ];
        
        if (balance.totalSavings > 0) {
            suggestions.unshift(`• Sử dụng tiền tiết kiệm (hiện có ${this.formatCurrency(balance.totalSavings)})`);
        }
        
        return suggestions.join('\n');
    }

    getErrorResponse(customMessage = null) {
        return customMessage || `❌ **Không thể thực hiện tính toán tài chính**

💡 **Các loại tính toán được hỗ trợ:**
• Kiểm tra số dư: "Số dư của tôi"
• Khả năng chi tiêu: "Tôi có thể chi 4tr được không?"
• Dự đoán sau chi tiêu: "Nếu tôi chi 2 triệu thì còn bao nhiêu?"
• Kiểm tra thiếu hụt: "Sau khi chi 1 triệu thì thiếu bao nhiêu?"

🔍 **Ví dụ:**
• "Tôi có đủ tiền chi 500k không?"
• "Sau khi mua xe 10 triệu thì còn bao nhiêu?"`;
    }

    /**
     * 🔄 Xử lý tính toán tài chính tổng quát
     */
    processGeneralFinancial(message, balance, financialData) {
        return `💰 **Tổng quan tài chính:**

📊 **Số dư hiện tại:** ${this.formatCurrency(balance.availableBalance)}
💵 **Thu nhập:** ${this.formatCurrency(balance.totalIncome)}
💸 **Chi tiêu:** ${this.formatCurrency(balance.totalExpense)}
💎 **Tiết kiệm:** ${this.formatCurrency(balance.totalSavings)}

💡 **Bạn có thể hỏi cụ thể hơn:**
• "Tôi có thể chi [số tiền] được không?"
• "Nếu tôi chi [số tiền] thì còn bao nhiêu?"
• "Tôi có đủ tiền mua [món đồ] [giá] không?"`;
    }
}

export default FinancialCalculationEngine;

import crypto from 'crypto';

class NLPService {
    constructor() {
        console.log('✅ NLP Service initialized successfully');

        // Vietnamese text normalization patterns
        this.vietnamesePatterns = {
            diacritics: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi,
            normalizeMap: {
                'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
                'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
                'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
                'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
                'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
                'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
                'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
                'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
                'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
                'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
                'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
                'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
                'đ': 'd'
            }
        };

        // Enhanced keyword scoring system với nhiều categories hơn
        this.keywords = {
            // Greeting keywords
            greeting: {
                vi: ['chào', 'xin chào', 'hello', 'hi', 'chao', 'xin chao', 'chào bạn'],
                en: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening'],
                weight: 1.0
            },

            // Income related keywords
            income_query: {
                vi: ['thu nhập', 'thu nhap', 'lương', 'luong', 'tiền lương', 'tien luong',
                    'kiếm được', 'kiem duoc', 'tiền kiếm', 'tien kiem', 'được bao nhiêu'],
                en: ['income', 'salary', 'wage', 'earning', 'earn', 'make money'],
                weight: 1.2
            },

            // Expense related keywords  
            expense_query: {
                vi: ['chi tiêu', 'chi tieu', 'tiêu tiền', 'tieu tien', 'chi phí', 'chi phi',
                    'tiêu bao nhiêu', 'tieu bao nhieu', 'đã chi', 'da chi'],
                en: ['expense', 'spending', 'spend', 'cost', 'expenditure'],
                weight: 1.2
            },

            // Savings & Investment queries
            savings_investment: {
                vi: ['tiết kiệm', 'tiet kiem', 'đầu tư', 'dau tu', 'cổ phiếu', 'co phieu',
                    'vàng', 'vang', 'bitcoin', 'crypto', 'gửi tiết kiệm', 'gui tiet kiem'],
                en: ['saving', 'savings', 'investment', 'invest', 'stock', 'gold', 'crypto'],
                weight: 1.1
            },

            // Budget related keywords
            budget_query: {
                vi: ['ngân sách', 'ngan sach', 'budget', 'giới hạn', 'gioi han', 'hạn mức', 'han muc'],
                en: ['budget', 'budgeting', 'limit', 'allowance'],
                weight: 1.1
            },

            // Calculation & Analysis keywords
            calculation_query: {
                vi: ['tính', 'tinh', 'tính toán', 'tinh toan', 'phân tích', 'phan tich',
                    'so sánh', 'so sanh', 'dự đoán', 'du doan', 'ước tính', 'uoc tinh'],
                en: ['calculate', 'calculation', 'analyze', 'analysis', 'compare', 'predict', 'estimate'],
                weight: 1.3
            },

            // Time period keywords
            time_period: {
                vi: ['tháng này', 'thang nay', 'tháng trước', 'thang truoc', 'năm nay', 'nam nay',
                    'tuần này', 'tuan nay', 'hôm nay', 'hom nay', 'hiện tại', 'hien tai'],
                en: ['this month', 'last month', 'this year', 'current', 'today', 'this week'],
                weight: 0.8
            },

            // Goal & Planning keywords
            goal_planning: {
                vi: ['mục tiêu', 'muc tieu', 'kế hoạch', 'ke hoach', 'dự định', 'du dinh',
                    'muốn', 'muon', 'cần', 'can', 'sẽ', 'se'],
                en: ['goal', 'target', 'plan', 'planning', 'want', 'need', 'will'],
                weight: 1.0
            },

            // Question words for better intent detection
            question_words: {
                vi: ['bao nhiêu', 'bao nhieu', 'thế nào', 'the nao', 'khi nào', 'khi nao',
                    'tại sao', 'tai sao', 'làm sao', 'lam sao', 'có thể', 'co the'],
                en: ['how much', 'how many', 'how', 'when', 'why', 'what', 'can'],
                weight: 0.6
            },

            // Trend & Comparison keywords
            trend_comparison: {
                vi: ['xu hướng', 'xu huong', 'tăng', 'tang', 'giảm', 'giam', 'thay đổi', 'thay doi',
                    'khác biệt', 'khac biet', 'hơn', 'hon', 'kém', 'kem'],
                en: ['trend', 'increase', 'decrease', 'change', 'difference', 'more', 'less', 'better', 'worse'],
                weight: 0.9
            },

            // Financial calculations
            financial_calculation: {
                vi: ['lãi suất', 'lai suat', 'lợi nhuận', 'loi nhuan', 'tỷ lệ', 'ty le',
                    'phần trăm', 'phan tram', '%', 'tỷ', 'ty', 'triệu', 'trieu'],
                en: ['interest', 'profit', 'percentage', 'rate', 'ratio', 'million', 'billion'],
                weight: 1.1
            },

            // Financial keywords với trọng số cao
            financial_primary: {
                vi: ['tài chính', 'tai chinh', 'ngân sách', 'ngan sach'],
                en: ['finance', 'financial', 'budget', 'budgeting'],
                weight: 1.0
            },

            // Contextual financial terms
            financial_contextual: {
                vi: ['tiền', 'tien', 'money', 'đồng', 'dong', 'vnd', 'vndong'],
                en: ['money', 'cash', 'dollar', 'currency'],
                weight: 0.5
            },

            // About bot keywords
            about_bot: {
                vi: ['bạn là ai', 'ban la ai', 'giúp gì', 'giup gi', 'bot', 'vanlangbot', 'chức năng', 'chuc nang'],
                en: ['who are you', 'what can you do', 'help', 'bot', 'assistant', 'function'],
                weight: 1.0
            },

            // Blocked topics với trọng số âm
            blocked_topics: {
                vi: ['thời tiết', 'thoi tiet', 'weather', 'tin tức', 'tin tuc', 'news',
                    'chính trị', 'chinh tri', 'politics', 'bóng đá', 'bong da', 'game'],
                en: ['weather', 'news', 'politics', 'religion', 'sports', 'games', 'entertainment'],
                weight: -1.0
            }
        };
    }

    // Normalize Vietnamese text
    normalizeVietnamese(text) {
        if (!text) return '';

        let normalized = text.toLowerCase();

        // Remove diacritics
        for (const [accented, plain] of Object.entries(this.vietnamesePatterns.normalizeMap)) {
            normalized = normalized.replace(new RegExp(accented, 'g'), plain);
        }

        return normalized;
    }

    // Detect language
    detectLanguage(text) {
        if (!text) return 'unknown';

        const vietnameseChars = text.match(this.vietnamesePatterns.diacritics);
        const vietnameseWords = ['tôi', 'bạn', 'của', 'là', 'và', 'có', 'này', 'được'];

        if (vietnameseChars || vietnameseWords.some(word => text.includes(word))) {
            return 'vi';
        }

        return 'en';
    }

    // Analyze intent với scoring system
    analyzeIntent(message) {
        if (!message || typeof message !== 'string') {
            return {
                intent: 'unknown',
                confidence: 0,
                language: 'unknown',
                score: 0,
                details: {},
                categories: []
            };
        }

        const language = this.detectLanguage(message);
        const normalizedMessage = this.normalizeVietnamese(message.toLowerCase().trim());

        let totalScore = 0;
        let matchedCategories = [];
        let categoryScores = {};

        // Calculate score dựa trên keyword matching
        for (const [category, data] of Object.entries(this.keywords)) {
            const keywords = [...(data.vi || []), ...(data.en || [])];
            const weight = data.weight;
            let categoryMatches = 0;

            for (const keyword of keywords) {
                const normalizedKeyword = this.normalizeVietnamese(keyword.toLowerCase());
                if (normalizedMessage.includes(normalizedKeyword)) {
                    categoryMatches++;
                }
            }

            if (categoryMatches > 0) {
                const categoryScore = categoryMatches * weight;
                totalScore += categoryScore;
                matchedCategories.push(category);
                categoryScores[category] = categoryScore;
            }
        }

        // Determine specific intent dựa trên matched categories
        let intent = 'unknown';
        let confidence = 0;
        let queryType = null;

        // Priority-based intent classification
        if (matchedCategories.includes('greeting')) {
            intent = 'greeting';
            confidence = 0.9;
        } else if (matchedCategories.includes('about_bot')) {
            intent = 'about_bot';
            confidence = 0.9;
        } else if (totalScore <= -0.5 || matchedCategories.includes('blocked_topics')) {
            intent = 'blocked_topic';
            confidence = 0.8;
        } else if (matchedCategories.includes('calculation_query')) {
            // Specific calculation intents
            if (matchedCategories.includes('income_query')) {
                intent = 'calculate_income';
                queryType = 'income_calculation';
            } else if (matchedCategories.includes('expense_query')) {
                intent = 'calculate_expense';
                queryType = 'expense_calculation';
            } else if (matchedCategories.includes('savings_investment')) {
                intent = 'calculate_investment';
                queryType = 'investment_calculation';
            } else if (matchedCategories.includes('budget_query')) {
                intent = 'calculate_budget';
                queryType = 'budget_calculation';
            } else {
                intent = 'general_calculation';
                queryType = 'general_calculation';
            }
            confidence = Math.min(totalScore / 2.0, 0.95);
        } else if (matchedCategories.includes('income_query')) {
            intent = 'income_query';
            queryType = 'income_info';
            confidence = Math.min(totalScore / 1.5, 0.9);
        } else if (matchedCategories.includes('expense_query')) {
            intent = 'expense_query';
            queryType = 'expense_info';
            confidence = Math.min(totalScore / 1.5, 0.9);
        } else if (matchedCategories.includes('savings_investment')) {
            intent = 'investment_query';
            queryType = 'investment_info';
            confidence = Math.min(totalScore / 1.5, 0.9);
        } else if (matchedCategories.includes('budget_query')) {
            intent = 'budget_query';
            queryType = 'budget_info';
            confidence = Math.min(totalScore / 1.5, 0.9);
        } else if (matchedCategories.includes('trend_comparison')) {
            intent = 'trend_analysis';
            queryType = 'trend_comparison';
            confidence = Math.min(totalScore / 1.3, 0.85);
        } else if (matchedCategories.includes('goal_planning')) {
            intent = 'financial_planning';
            queryType = 'goal_planning';
            confidence = Math.min(totalScore / 1.2, 0.8);
        } else if (totalScore >= 1.0) {
            intent = 'financial_high_confidence';
            confidence = Math.min(totalScore / 2.0, 0.95);
        } else if (totalScore >= 0.5) {
            intent = 'financial_medium_confidence';
            confidence = totalScore * 0.7;
        } else if (totalScore > 0) {
            intent = 'financial_low_confidence';
            confidence = totalScore * 0.5;
        }

        // Time period detection
        let timePeriod = null;
        if (matchedCategories.includes('time_period')) {
            if (normalizedMessage.includes('thang nay') || normalizedMessage.includes('this month')) {
                timePeriod = 'current_month';
            } else if (normalizedMessage.includes('thang truoc') || normalizedMessage.includes('last month')) {
                timePeriod = 'last_month';
            } else if (normalizedMessage.includes('nam nay') || normalizedMessage.includes('this year')) {
                timePeriod = 'current_year';
            } else if (normalizedMessage.includes('hom nay') || normalizedMessage.includes('today')) {
                timePeriod = 'today';
            }
        }

        return {
            intent,
            confidence: Math.round(confidence * 100) / 100,
            language,
            score: Math.round(totalScore * 100) / 100,
            categories: matchedCategories,
            categoryScores,
            queryType,
            timePeriod,
            details: {
                language,
                needsCalculation: matchedCategories.includes('calculation_query'),
                needsComparison: matchedCategories.includes('trend_comparison'),
                isQuestion: matchedCategories.includes('question_words'),
                specificCategory: this.getSpecificCategory(matchedCategories)
            }
        };
    }

    // Helper method to determine the most specific category
    getSpecificCategory(categories) {
        const priority = ['calculation_query', 'income_query', 'expense_query', 'savings_investment',
            'budget_query', 'trend_comparison', 'goal_planning'];

        for (const category of priority) {
            if (categories.includes(category)) {
                return category;
            }
        }
        return 'general';
    }

    // Check if content should be blocked
    isBlockedContent(message) {
        const analysis = this.analyzeIntent(message);
        return analysis.intent === 'blocked_topic' || analysis.score < -0.5;
    }

    // Generate hash for caching
    generateHash(text) {
        return crypto.createHash('md5').update(text).digest('hex');
    }

    // Simple sentiment analysis
    analyzeSentiment(text, language = 'en') {
        const positiveWords = ['tốt', 'tot', 'hay', 'good', 'great', 'excellent', 'tuyệt', 'tuyet'];
        const negativeWords = ['xấu', 'xau', 'bad', 'terrible', 'awful', 'tệ', 'te'];

        const normalized = this.normalizeVietnamese(text.toLowerCase());

        let positive = 0;
        let negative = 0;

        positiveWords.forEach(word => {
            if (normalized.includes(this.normalizeVietnamese(word))) positive++;
        });

        negativeWords.forEach(word => {
            if (normalized.includes(this.normalizeVietnamese(word))) negative++;
        });

        const score = (positive - negative) / Math.max(positive + negative, 1);

        return {
            score: Math.round(score * 100) / 100,
            magnitude: Math.abs(score),
            label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral'
        };
    }

    // Enhanced response formatting
    enhanceResponse(text, options = {}) {
        const { preferredLanguage = 'vi', hasHighSpending = false } = options;

        let enhanced = text;

        // Add suggestions based on context
        if (hasHighSpending && preferredLanguage === 'vi') {
            enhanced += '\n\n💡 Gợi ý: Bạn có thể cân nhắc thiết lập ngân sách chi tiêu để kiểm soát tốt hơn.';
        }

        return enhanced;
    }

    // Get processing statistics
    getStats() {
        return {
            service: 'NLP Service',
            version: '1.0.0',
            capabilities: [
                'Intent Classification',
                'Language Detection',
                'Vietnamese Text Normalization',
                'Basic Sentiment Analysis',
                'Content Filtering'
            ],
            supportedLanguages: ['vi', 'en']
        };
    }
}

export default NLPService; 
import crypto from 'crypto';

class NLPService {
    constructor() {
        // Bỏ sentiment analyzer để tránh lỗi Natural.js với Vietnamese
        console.log('NLP Service initialized successfully');

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

        // Enhanced keyword scoring system
        this.keywords = {
            // Greeting keywords
            greeting: {
                vi: ['chào', 'xin chào', 'hello', 'hi', 'chao', 'xin chao'],
                en: ['hello', 'hi', 'hey', 'greetings'],
                weight: 1.0
            },

            // Financial keywords với trọng số cao
            financial_primary: {
                vi: ['tài chính', 'tai chinh', 'ngân sách', 'ngan sach', 'thu nhập', 'thu nhap',
                    'chi tiêu', 'chi tieu', 'tiết kiệm', 'tiet kiem'],
                en: ['finance', 'financial', 'budget', 'budgeting', 'income', 'expense', 'saving', 'savings'],
                weight: 1.0
            },

            // Investment keywords
            financial_secondary: {
                vi: ['đầu tư', 'dau tu', 'cổ phiếu', 'co phieu', 'vàng', 'vang',
                    'bitcoin', 'crypto', 'tiền điện tử', 'tien dien tu'],
                en: ['investment', 'invest', 'stock', 'stocks', 'gold', 'crypto', 'cryptocurrency', 'bitcoin'],
                weight: 0.8
            },

            // Contextual financial terms
            financial_contextual: {
                vi: ['tiền', 'tien', 'money', 'đồng', 'dong', 'vnd', 'vndong'],
                en: ['money', 'cash', 'dollar', 'currency'],
                weight: 0.5
            },

            // About bot keywords
            about_bot: {
                vi: ['bạn là ai', 'ban la ai', 'giúp gì', 'giup gi', 'bot', 'vanlangbot'],
                en: ['who are you', 'what can you do', 'help', 'bot', 'assistant'],
                weight: 1.0
            },

            // Blocked topics với trọng số âm
            blocked_topics: {
                vi: ['thời tiết', 'thoi tiet', 'weather', 'tin tức', 'tin tuc', 'news',
                    'chính trị', 'chinh tri', 'politics'],
                en: ['weather', 'news', 'politics', 'religion', 'sports'],
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
                score: 0
            };
        }

        const language = this.detectLanguage(message);
        const normalizedMessage = this.normalizeVietnamese(message.toLowerCase().trim());

        let totalScore = 0;
        let matchedCategories = [];

        // Calculate score dựa trên keyword matching
        for (const [category, data] of Object.entries(this.keywords)) {
            const keywords = [...(data.vi || []), ...(data.en || [])];
            const weight = data.weight;

            for (const keyword of keywords) {
                const normalizedKeyword = this.normalizeVietnamese(keyword.toLowerCase());
                if (normalizedMessage.includes(normalizedKeyword)) {
                    totalScore += weight;
                    matchedCategories.push(category);
                    break; // Chỉ count một lần per category
                }
            }
        }

        // Determine intent dựa trên score
        let intent = 'unknown';
        let confidence = 0;

        if (matchedCategories.includes('greeting')) {
            intent = 'greeting';
            confidence = 0.9;
        } else if (matchedCategories.includes('about_bot')) {
            intent = 'about_bot';
            confidence = 0.9;
        } else if (totalScore <= -0.5) {
            intent = 'blocked_topic';
            confidence = 0.8;
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

        return {
            intent,
            confidence: Math.round(confidence * 100) / 100,
            language,
            score: Math.round(totalScore * 100) / 100,
            matchedCategories
        };
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

    // Simple sentiment analysis without Natural.js
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
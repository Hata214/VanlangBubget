import axios from 'axios';
import Transaction from '../models/transactionModel.js';
import Expense from '../models/expenseModel.js';
import Income from '../models/incomeModel.js';
import Budget from '../models/budgetModel.js';
import Loan from '../models/loanModel.js';
import Investment from '../models/investmentModel.js';
import logger from '../utils/logger.js';
import NLPService from '../services/nlpService.js'; // Import NLPService mới
import Notification from '../models/Notification.js';
import socketManager from '../utils/socketManager.js';
import CalculationCoordinator from './calculationCoordinator.js';
import EnhancedStatisticsEngine from './enhancedStatisticsEngine.js';
import EnhancedConversationHandler from './enhancedConversationHandler.js';
import EnhancedGeminiService from '../services/enhancedGeminiService.js';
import StockService from '../services/stockService.js';

class VanLangAgent {
    constructor(geminiApiKey) {
        this.geminiApiKey = geminiApiKey;
        this.modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash';
        this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`;
        // Lưu trữ context cuộc hội thoại để xử lý các yêu cầu chi tiết
        this.conversationContext = new Map();
        this.nlpService = new NLPService(); // Khởi tạo NLPService
        this.calculationCoordinator = new CalculationCoordinator(); // Khởi tạo Calculation Coordinator
        this.statisticsEngine = new EnhancedStatisticsEngine(); // Khởi tạo Enhanced Statistics Engine
        this.conversationHandler = new EnhancedConversationHandler(this); // Khởi tạo Enhanced Conversation Handler
        this.enhancedGemini = new EnhancedGeminiService(geminiApiKey); // Khởi tạo Enhanced Gemini Service
        this.stockService = new StockService(); // Khởi tạo Stock Service
    }

    /**
     * ⚡ Enhanced Gemini AI API with optimizations
     */
    async callGeminiAI(prompt, options = {}) {
        try {
            // Use Enhanced Gemini Service for optimized requests
            return await this.enhancedGemini.generateContent(prompt, options);
        } catch (error) {
            logger.error('Enhanced Gemini AI error:', error.message);
            throw new Error('Không thể kết nối với AI. Vui lòng thử lại sau.');
        }
    }

    /**
     * 🎯 Specialized Gemini methods for different use cases
     */
    async callGeminiForIntent(prompt) {
        return await this.enhancedGemini.analyzeIntent(prompt);
    }

    async callGeminiForDataExtraction(prompt) {
        return await this.enhancedGemini.extractData(prompt);
    }

    async callGeminiForFinancialAnalysis(prompt) {
        return await this.enhancedGemini.analyzeFinances(prompt);
    }

    async callGeminiForConversation(prompt) {
        return await this.enhancedGemini.generateConversation(prompt);
    }

    async callGeminiForCalculation(prompt) {
        return await this.enhancedGemini.calculateFinancial(prompt);
    }

    async callGeminiForAdvice(prompt) {
        return await this.enhancedGemini.generateAdvice(prompt);
    }

    /**
     * 📊 Get Gemini performance metrics
     */
    getGeminiMetrics() {
        return this.enhancedGemini.getMetrics();
    }

    /**
     * 🧮 Enhanced Calculation Type Detection
     */
    async detectCalculationType(message) {
        try {
            const result = await this.calculationCoordinator.detectCalculationType(message);

            // Log for demo purposes
            logger.info('🎯 Calculation Detection Result', {
                message,
                isCalculation: result.isCalculation,
                type: result.type,
                confidence: result.confidence,
                intent: result.intent
            });

            return result;
        } catch (error) {
            logger.error('Error in calculation type detection:', error);
            return {
                isCalculation: false,
                type: 'none',
                confidence: 0,
                intent: 'other'
            };
        }
    }

    /**
     * Phân tích ý định của người dùng với hệ thống nhận diện nâng cao
     */
    async analyzeIntent(message) {
        // AGENT INTERACTION: Bắt đầu quá trình phân tích ý định người dùng từ tin nhắn.
        // Sử dụng NLPService để phân tích intent cơ bản
        const nlpAnalysis = this.nlpService.analyzeIntent(message);
        logger.info('NLPService analysis result', { nlpAnalysis, message });

        if (nlpAnalysis.intent && nlpAnalysis.intent !== 'unknown' && nlpAnalysis.confidence > 0.6) { // Ngưỡng tin cậy
            // Ưu tiên kết quả từ NLPService nếu đủ tin cậy
            if (nlpAnalysis.intent === 'financial_high_confidence' || nlpAnalysis.intent === 'financial_medium_confidence') {
                // Cần phân loại chi tiết hơn cho các intent tài chính
                // Hiện tại, chúng ta sẽ để logic cũ xử lý việc này sau khi NLPService đưa ra gợi ý chung
                // Hoặc có thể gọi Gemini để phân loại cụ thể hơn dựa trên nlpAnalysis.matchedCategories
            } else if (nlpAnalysis.intent === 'blocked_topic') {
                return 'blocked_topic'; // Trả về intent bị chặn trực tiếp
            } else if (nlpAnalysis.intent === 'greeting') {
                return 'greeting.hello'; // Ánh xạ intent chào hỏi
            } else if (nlpAnalysis.intent === 'about_bot') {
                return 'bot.introduction'; // Ánh xạ intent giới thiệu bot
            }
            // Các intent khác từ NLPService có thể được ánh xạ tương tự ở đây
        }

        // Kiểm tra các intent cơ bản trước (dựa trên training data)
        const normalizedMessage = message.toLowerCase().trim();

        // 🔍 TÍNH NĂNG 4: TÌM KIẾM NÂNG CAO (ADVANCED FILTERING) - ƯU TIÊN CAO NHẤT
        console.log('🔍 CHECKING ADVANCED FILTER FIRST:', normalizedMessage);
        if (this.detectAdvancedFilter(normalizedMessage)) {
            console.log('✅ ADVANCED FILTER DETECTED - RETURNING filter_query');
            return 'filter_query';
        }

        // ⏰ TÍNH NĂNG 6: TRUY VẤN THEO THỜI GIAN (TIME-BASED QUERIES)
        console.log('🔍 CHECKING TIME QUERY FIRST:', normalizedMessage);
        if (this.detectTimeBasedQuery(normalizedMessage)) {
            console.log('✅ TIME QUERY DETECTED - RETURNING time_query');
            return 'time_query';
        }

        // Enhanced Calculation Detection - Phân biệt 2 loại tính toán
        const calculationResult = await this.detectCalculationType(normalizedMessage);
        if (calculationResult.isCalculation) {
            logger.info('Calculation detected', {
                message: normalizedMessage,
                calculationType: calculationResult.type,
                confidence: calculationResult.confidence
            });
            return calculationResult.intent;
        }

        // Kiểm tra các câu lệnh POST sau (ưu tiên thấp hơn)
        const hasAmount = /\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)/i.test(message);

        // Định nghĩa các biến calculation keywords
        const hasCalculationKeywords = normalizedMessage.includes('có thể chi') ||
            normalizedMessage.includes('còn bao nhiêu') || normalizedMessage.includes('đủ tiền') ||
            normalizedMessage.includes('thiếu bao nhiêu') || normalizedMessage.includes('nếu chi') ||
            normalizedMessage.includes('sau khi chi') || normalizedMessage.includes('tính toán');

        const hasConditionalStructure = normalizedMessage.includes('nếu') ||
            normalizedMessage.includes('sau khi') || normalizedMessage.includes('có thể');

        // AGENT INTERACTION: Kiểm tra xem tin nhắn có chứa thông tin về số tiền hay không.
        if (hasAmount) {
            logger.info('POST intent analysis - has amount detected', {
                message: normalizedMessage,
                hasAmount: true,
                hasCalculationKeywords,
                hasConditionalStructure
            });

            // Nếu có calculation keywords, skip POST logic và để Gemini AI xử lý
            if (hasCalculationKeywords || hasConditionalStructure) {
                logger.info('POST intent analysis - skipping due to calculation keywords', {
                    message: normalizedMessage,
                    hasCalculationKeywords,
                    hasConditionalStructure
                });
                // Không return gì, để logic tiếp tục xuống Gemini AI intent analysis
            } else {
                // Kiểm tra tiết kiệm (ưu tiên cao nhất trong POST)
                if ((normalizedMessage.includes('tiết kiệm') || normalizedMessage.includes('tiet kiem')) &&
                    !normalizedMessage.includes('ngân hàng') && !normalizedMessage.includes('ngan hang')) {

                    logger.info('POST intent analysis - savings keywords detected', {
                        message: normalizedMessage,
                        hasTietKiem: normalizedMessage.includes('tiết kiệm'),
                        hasTietKiemNoDiacritics: normalizedMessage.includes('tiet kiem'),
                        hasNganHang: normalizedMessage.includes('ngân hàng'),
                        hasNganHangNoDiacritics: normalizedMessage.includes('ngan hang'),
                        hasCalculationKeywords,
                        hasConditionalStructure
                    });

                    if (normalizedMessage.includes('tôi tiết kiệm') || normalizedMessage.includes('tôi tiet kiem') ||
                        normalizedMessage.includes('tiết kiệm được') || normalizedMessage.includes('tiet kiem duoc') ||
                        normalizedMessage.includes('mới tiết kiệm') || normalizedMessage.includes('moi tiet kiem') ||
                        normalizedMessage.includes('vừa tiết kiệm') || normalizedMessage.includes('vua tiet kiem') ||
                        normalizedMessage.includes('để dành') || normalizedMessage.includes('de danh') ||
                        normalizedMessage.includes('gom góp') || normalizedMessage.includes('gom gop') ||
                        normalizedMessage.includes('dành dụm') || normalizedMessage.includes('danh dum') ||
                        normalizedMessage.includes('save') || normalizedMessage.includes('saving')) {

                        logger.info('POST intent analysis - insert_savings detected!', {
                            message: normalizedMessage,
                            matchedKeywords: {
                                toiTietKiem: normalizedMessage.includes('tôi tiết kiệm'),
                                toiTietKiemNoDiacritics: normalizedMessage.includes('tôi tiet kiem'),
                                tietKiemDuoc: normalizedMessage.includes('tiết kiệm được'),
                                tietKiemDuocNoDiacritics: normalizedMessage.includes('tiet kiem duoc'),
                                moiTietKiem: normalizedMessage.includes('mới tiết kiệm'),
                                moiTietKiemNoDiacritics: normalizedMessage.includes('moi tiet kiem'),
                                vuaTietKiem: normalizedMessage.includes('vừa tiết kiệm'),
                                vuaTietKiemNoDiacritics: normalizedMessage.includes('vua tiet kiem')
                            }
                        });

                        return 'insert_savings';
                    }
                }

                // Kiểm tra thu nhập
                if (normalizedMessage.includes('tôi nhận') || normalizedMessage.includes('tôi được') ||
                    normalizedMessage.includes('tôi kiếm') || normalizedMessage.includes('tôi thu') ||
                    normalizedMessage.includes('nhận lương') || normalizedMessage.includes('được trả') ||
                    normalizedMessage.includes('thu về') || normalizedMessage.includes('kiếm được') ||
                    normalizedMessage.includes('lương tôi') || normalizedMessage.includes('tiền lương') ||
                    normalizedMessage.includes('thưởng') || normalizedMessage.includes('bonus') ||
                    normalizedMessage.includes('được thưởng') || normalizedMessage.includes('nhận thưởng')) {
                    // AGENT INTERACTION: Phát hiện ý định "thêm thu nhập" dựa trên từ khóa và số tiền.
                    return 'insert_income';
                }

                // Kiểm tra chi tiêu - NHƯNG KHÔNG KHI CÓ CALCULATION KEYWORDS
                if (!hasCalculationKeywords && !hasConditionalStructure &&
                    (normalizedMessage.includes('tôi mua') || normalizedMessage.includes('tôi chi') ||
                        normalizedMessage.includes('tôi trả') || normalizedMessage.includes('tôi tiêu') ||
                        normalizedMessage.includes('mua') || normalizedMessage.includes('chi') ||
                        normalizedMessage.includes('trả') || normalizedMessage.includes('tiêu') ||
                        normalizedMessage.includes('thanh toán') || normalizedMessage.includes('tốn') ||
                        normalizedMessage.includes('hết') || normalizedMessage.includes('chi tiêu') ||
                        normalizedMessage.includes('chi phí'))) {

                    logger.info('POST intent analysis - expense keywords detected (no calculation)', {
                        message: normalizedMessage,
                        hasCalculationKeywords,
                        hasConditionalStructure
                    });

                    return 'insert_expense';
                }

                // Kiểm tra khoản vay
                if (normalizedMessage.includes('tôi vay') || normalizedMessage.includes('tôi mượn') ||
                    normalizedMessage.includes('vay') || normalizedMessage.includes('mượn') ||
                    normalizedMessage.includes('nợ') || normalizedMessage.includes('cho vay')) {
                    return 'insert_loan';
                }
            }
        }

        if (normalizedMessage.includes('chào') || normalizedMessage.includes('hello') ||
            normalizedMessage.includes('hi') || normalizedMessage.includes('xin chào') ||
            normalizedMessage.includes('alo') || normalizedMessage.includes('a lô') ||
            normalizedMessage.includes('ê bot')) {
            return 'greeting.hello';
        }

        if (normalizedMessage.includes('tạm biệt') || normalizedMessage.includes('bye') ||
            normalizedMessage.includes('goodbye') || normalizedMessage.includes('cảm ơn') ||
            normalizedMessage.includes('thank you') || normalizedMessage.includes('thanks')) {
            return 'greeting.farewell';
        }

        if (normalizedMessage.includes('bạn là ai') || normalizedMessage.includes('giới thiệu') ||
            normalizedMessage.includes('bạn tên gì') || normalizedMessage.includes('vanlangbot là ai')) {
            return 'bot.introduction';
        }

        if (normalizedMessage.includes('bạn làm được gì') || normalizedMessage.includes('chức năng') ||
            normalizedMessage.includes('khả năng') || normalizedMessage.includes('giúp gì được')) {
            return 'bot.capabilities';
        }

        if (normalizedMessage.includes('mấy giờ') || normalizedMessage.includes('ngày mấy') ||
            normalizedMessage.includes('thời gian') || normalizedMessage.includes('bây giờ')) {
            return 'common.time_date';
        }

        if (normalizedMessage.includes('đăng nhập') || normalizedMessage.includes('tài khoản') ||
            normalizedMessage.includes('login') || normalizedMessage.includes('yêu cầu')) {
            return 'auth.require';
        }

        if (normalizedMessage.includes('bảo mật') || normalizedMessage.includes('an toàn') ||
            normalizedMessage.includes('riêng tư') || normalizedMessage.includes('security')) {
            return 'security.privacy';
        }

        if (normalizedMessage.includes('yêu') || normalizedMessage.includes('buồn') ||
            normalizedMessage.includes('phá sản') || normalizedMessage.includes('chuyện cười')) {
            return 'funny.chat';
        }

        // Kiểm tra statistics query trước khi gọi Gemini AI (ưu tiên cao nhất)
        if (normalizedMessage.includes('trung bình') || normalizedMessage.includes('trung binh') ||
            normalizedMessage.includes('average') || normalizedMessage.includes('so sánh') ||
            normalizedMessage.includes('so sanh') || normalizedMessage.includes('compare') ||
            normalizedMessage.includes('phân tích') || normalizedMessage.includes('phan tich') ||
            normalizedMessage.includes('analyze') || normalizedMessage.includes('thống kê') ||
            normalizedMessage.includes('thong ke') || normalizedMessage.includes('statistics') ||
            normalizedMessage.includes('breakdown') || normalizedMessage.includes('tỷ lệ') ||
            normalizedMessage.includes('ty le') || normalizedMessage.includes('ratio')) {
            return 'statistics_query';
        }

        // Kiểm tra stock query trước khi gọi Gemini AI (ưu tiên cao)
        if (this.detectStockQuery(normalizedMessage)) {
            return 'stock_query';
        }

        // Kiểm tra calculation query trước khi gọi Gemini AI
        if (normalizedMessage.includes('có thể chi') || normalizedMessage.includes('co the chi') ||
            normalizedMessage.includes('còn bao nhiêu') || normalizedMessage.includes('con bao nhieu') ||
            normalizedMessage.includes('đủ tiền') || normalizedMessage.includes('du tien') ||
            normalizedMessage.includes('thiếu bao nhiêu') || normalizedMessage.includes('thieu bao nhieu') ||
            normalizedMessage.includes('nếu chi') || normalizedMessage.includes('neu chi') ||
            normalizedMessage.includes('sau khi chi') || normalizedMessage.includes('sau khi chi') ||
            normalizedMessage.includes('tính toán') || normalizedMessage.includes('tinh toan') ||
            normalizedMessage.includes('calculate') || normalizedMessage.includes('calculation')) {
            return 'calculation_query';
        }



        console.log('🤖 FALLBACK TO GEMINI AI INTENT ANALYSIS:', normalizedMessage);
        const intentPrompt = `
Phân tích mục đích của câu sau và trả lời bằng một từ duy nhất: "${message}"

Các mục đích có thể (theo thứ tự ưu tiên):
- statistics_query: Thống kê nâng cao (từ khóa: "trung bình", "average", "tổng cộng", "sum", "so sánh", "compare", "phân tích", "analyze", "thống kê", "statistics", "breakdown", "tỷ lệ", "ratio")
- calculation_query: Câu hỏi suy luận, tính toán (từ khóa: tính, lãi suất, kế hoạch, dự đoán, "có thể chi", "còn bao nhiêu", "đủ tiền", "thiếu bao nhiêu", "nếu chi")
- income_query: Hỏi về thu nhập (từ khóa: thu nhập, lương, tiền lương, income, salary, kiếm được, nhận được)
- savings_income_query: Hỏi về tiền tiết kiệm trong thu nhập (từ khóa: tiền tiết kiệm, tiết kiệm - KHÔNG có "ngân hàng")
- expense_query: Hỏi về chi tiêu (từ khóa: chi tiêu, chi phí, tiêu dùng, expense, spending, mua, trả, thanh toán - NHƯNG KHÔNG có "trung bình", "average", "so sánh", "phân tích")
- loan_query: Hỏi về khoản vay (từ khóa: khoản vay, vay, nợ, loan, debt, mượn, cho vay)
- stock_query: Hỏi về cổ phiếu cụ thể (từ khóa: giá VNM, cổ phiếu FPT, VCB hôm nay, phân tích HPG, mã cổ phiếu, stock price)
- investment_query: Hỏi về đầu tư (từ khóa: đầu tư, investment, vàng, gold, bất động sản, real estate - KHÔNG bao gồm cổ phiếu cụ thể)
- savings_query: Hỏi về tiết kiệm ngân hàng (từ khóa: tiết kiệm ngân hàng, tiền gửi ngân hàng, gửi tiết kiệm, tiết kiệm từ ngân hàng, tiền tiết kiệm ngân hàng, bank savings)
- balance_query: Hỏi về số dư, tổng quan tài chính (từ khóa: số dư, balance, tổng quan, overview, tình hình tài chính)
- detail_query: Xem chi tiết các khoản còn lại (từ khóa: "còn lại", "khác", "chi tiết", "xem thêm", "tất cả", "danh sách đầy đủ")
- filter_query: Tìm kiếm có điều kiện (từ khóa: "trên", "dưới", "lớn hơn", "nhỏ hơn", "cao nhất", "thấp nhất", "lớn nhất", "nhỏ nhất", "above", "below", "highest", "lowest")
- time_query: Truy vấn theo thời gian cụ thể (từ khóa: "tuần này", "tháng trước", "năm nay", "hôm qua", "this week", "last month", "yesterday")

**THÊM DỮ LIỆU - Ưu tiên cao:**
- insert_savings: Thêm tiền tiết kiệm (cấu trúc: "tôi tiết kiệm", "tiết kiệm được", "mới tiết kiệm", "vừa tiết kiệm", "để dành", "gom góp", "dành dụm", "save" + số tiền - KHÔNG có "ngân hàng")
- insert_income: Thêm thu nhập (cấu trúc: "tôi nhận", "tôi được", "tôi kiếm", "tôi thu", "nhận lương", "được trả", "thu về", "kiếm được", "lương tôi", "tiền lương", "thưởng", "bonus" + số tiền)
- insert_expense: Thêm chi tiêu (cấu trúc: "tôi mua", "tôi chi", "tôi trả", "tôi tiêu", "mua", "chi", "trả", "tiêu", "thanh toán", "tốn", "hết" + số tiền)
- insert_loan: Thêm khoản vay (cấu trúc: "tôi vay", "tôi mượn", "vay", "mượn", "nợ", "cho vay" + số tiền)

- analyze: Phân tích tài chính tổng quan, báo cáo, thống kê
- advice: Xin lời khuyên tài chính
- greeting: Chào hỏi, giới thiệu
- chatbot.scope: Hỏi về phạm vi hoạt động của bot
- other: Các mục đích khác

**Lưu ý quan trọng:**
- Nếu có số tiền + động từ hành động (mua, chi, nhận, kiếm...) → ưu tiên insert_*
- Nếu chỉ hỏi thông tin → query_*

Chỉ trả lời một từ duy nhất.`;

        // AGENT INTERACTION: Nếu phân tích dựa trên từ khóa không xác định rõ, sử dụng Enhanced Gemini AI để phân tích intent.
        try {
            const intent = await this.callGeminiForIntent(intentPrompt);
            return intent.trim().toLowerCase();
        } catch (error) {
            logger.error('Intent analysis error:', error);
            return 'other';
        }
    }

    /**
     * 🔍 TÍNH NĂNG 4: Phát hiện truy vấn lọc nâng cao
     */
    detectAdvancedFilter(message) {
        const normalizedMessage = message.toLowerCase().trim();

        // DIRECT CONSOLE LOG - Không dùng logger
        console.log('🔍 DIRECT LOG - Advanced Filter Detection START:', {
            originalMessage: message,
            normalizedMessage: normalizedMessage,
            timestamp: new Date().toISOString()
        });

        // Debug log để kiểm tra
        logger.info('🔍 Checking Advanced Filter Detection', {
            message: normalizedMessage,
            originalMessage: message
        });

        const filterPatterns = [
            // Toán tử so sánh với số tiền - CẢI THIỆN
            /\b(trên|lớn hơn|lớn hon|above|greater than|greater|higher than|higher)\s+(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /\b(dưới|duoi|nhỏ hơn|nho hon|below|less than|less|lower than|lower)\s+(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,

            // Tìm kiếm cực trị - GENERAL PATTERNS
            /\b(cao nhất|cao nhat|lớn nhất|lon nhat|highest|maximum|max|biggest|largest)/i,
            /\b(thấp nhất|thap nhat|nhỏ nhất|nho nhat|lowest|minimum|min|smallest)/i,

            // CHI TIÊU PATTERNS - CỤ THỂ
            /(chi tiêu|chi tieu|expense|spending).*(cao nhất|cao nhat|lớn nhất|lon nhat|highest|maximum|max)/i,
            /(chi tiêu|chi tieu|expense|spending).*(thấp nhất|thap nhat|nhỏ nhất|nho nhat|lowest|minimum|min)/i,
            /(chi tiêu|chi tieu|expense|spending).*(trên|above|lớn hơn|lon hon).+(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /(chi tiêu|chi tieu|expense|spending).*(dưới|duoi|nhỏ hơn|nho hon).+(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,

            // THU NHẬP PATTERNS - CỤ THỂ
            /(thu nhập|thu nhap|income|salary).*(cao nhất|cao nhat|lớn nhất|lon nhat|highest|maximum|max)/i,
            /(thu nhập|thu nhap|income|salary).*(thấp nhất|thap nhat|nhỏ nhất|nho nhat|lowest|minimum|min)/i,
            /(thu nhập|thu nhap|income|salary).*(trên|above|lớn hơn|lon hon).+(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /(thu nhập|thu nhap|income|salary).*(dưới|duoi|nhỏ hơn|nho hon).+(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,

            // KHOẢN VAY PATTERNS - CỤ THỂ
            /(khoản vay|khoan vay|loan|debt).*(cao nhất|cao nhat|lớn nhất|lon nhat|highest|maximum|max)/i,
            /(khoản vay|khoan vay|loan|debt).*(thấp nhất|thap nhat|nhỏ nhất|nho nhat|lowest|minimum|min)/i,
            /(khoản vay|khoan vay|loan|debt).*(trên|above|lớn hơn|lon hon).+(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /(khoản vay|khoan vay|loan|debt).*(dưới|duoi|nhỏ hơn|nho hon).+(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,

            // PATTERNS ĐƠN GIẢN CHO TEST CASES - CẢI THIỆN
            /chi tiêu.*cao nhất/i,
            /chi tiêu.*lớn nhất/i,
            /chi tiêu.*thấp nhất/i,
            /chi tiêu.*nhỏ nhất/i,
            /chi tiêu.*trên.*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /chi tiêu.*dưới.*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,

            /thu nhập.*cao nhất/i,
            /thu nhập.*lớn nhất/i,
            /thu nhập.*thấp nhất/i,
            /thu nhập.*nhỏ nhất/i,
            /thu nhập.*trên.*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /thu nhập.*dưới.*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,

            /khoản vay.*cao nhất/i,
            /khoản vay.*lớn nhất/i,
            /khoản vay.*thấp nhất/i,
            /khoản vay.*nhỏ nhất/i,
            /khoản vay.*trên.*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /khoản vay.*dưới.*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,

            // PATTERNS ĐẶC BIỆT CHO "500k"
            /khoản vay.*dưới.*500k/i,
            /khoản vay.*nhỏ hơn.*500k/i,
            /khoản vay.*below.*500k/i,
            /khoản vay.*less.*500k/i,

            // PATTERNS CHO CẤU TRÚC "NÀO"
            /khoản vay.*nào.*dưới.*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /khoản vay.*nào.*nhỏ hơn.*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /khoản vay.*nào.*below.*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /khoản vay.*nào.*less.*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
            /khoản vay.*nào.*dưới.*500k/i,

            // PATTERNS CHO CẤU TRÚC KHÁC
            /(chi tiêu|thu nhập|khoản vay).*nào.*(cao nhất|thấp nhất|lớn nhất|nhỏ nhất)/i,
            /(chi tiêu|thu nhập|khoản vay).*nào.*(trên|dưới|lớn hơn|nhỏ hơn).*(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,

            // PATTERNS ĐẶC BIỆT CHO "THU NHẬP THẤP NHẤT"
            /thu nhập.*thấp nhất/i,
            /thu nhap.*thap nhat/i,
            /income.*lowest/i,
            /income.*minimum/i,
            /thu nhập.*nhỏ nhất/i,
            /thu nhap.*nho nhat/i
        ];

        // SPECIAL DEBUG CHO "THU NHẬP THẤP NHẤT"
        if (normalizedMessage.includes('thu nhập thấp nhất')) {
            console.log('🚨 SPECIAL DEBUG - THU NHẬP THẤP NHẤT DETECTED!');
            console.log('🚨 Message:', normalizedMessage);
            console.log('🚨 Total patterns:', filterPatterns.length);

            // Test từng pattern cuối cùng
            const lastPatterns = filterPatterns.slice(-6);
            lastPatterns.forEach((pattern, index) => {
                const actualIndex = filterPatterns.length - 6 + index;
                const testResult = pattern.test(normalizedMessage);
                console.log(`🚨 PATTERN ${actualIndex} (${pattern.toString()}): ${testResult}`);
            });

            // Test specific patterns manually
            console.log('🚨 MANUAL PATTERN TESTS:');
            console.log('- /thu nhập.*thấp nhất/i.test():', /thu nhập.*thấp nhất/i.test(normalizedMessage));
            console.log('- /thấp nhất/i.test():', /thấp nhất/i.test(normalizedMessage));
            console.log('- includes("thu nhập"):', normalizedMessage.includes('thu nhập'));
            console.log('- includes("thấp nhất"):', normalizedMessage.includes('thấp nhất'));
        }

        // Kiểm tra từng pattern và log kết quả
        for (let i = 0; i < filterPatterns.length; i++) {
            const pattern = filterPatterns[i];
            const isMatch = pattern.test(normalizedMessage);

            // Log chi tiết cho patterns cuối (thu nhập thấp nhất)
            if (normalizedMessage.includes('thu nhập thấp nhất') && i >= filterPatterns.length - 6) {
                console.log(`🚨 TESTING PATTERN ${i}:`, {
                    pattern: pattern.toString(),
                    message: normalizedMessage,
                    isMatch: isMatch,
                    testResult: pattern.test(normalizedMessage)
                });
            }

            if (isMatch) {
                console.log('🎯 DIRECT LOG - Advanced Filter Pattern MATCHED!', {
                    patternIndex: i,
                    pattern: pattern.toString(),
                    message: normalizedMessage
                });

                logger.info('🎯 Advanced Filter Pattern Matched!', {
                    patternIndex: i,
                    pattern: pattern.toString(),
                    message: normalizedMessage
                });
                return true;
            }
        }

        console.log('❌ DIRECT LOG - No Advanced Filter Pattern Matched', {
            message: normalizedMessage,
            totalPatterns: filterPatterns.length
        });

        logger.info('❌ No Advanced Filter Pattern Matched', {
            message: normalizedMessage,
            totalPatterns: filterPatterns.length
        });

        return false;
    }

    /**
     * ⏰ TÍNH NĂNG 6: Phát hiện truy vấn theo thời gian
     */
    detectTimeBasedQuery(message) {
        const timePatterns = [
            // Thời gian cụ thể
            /\b(tuần này|tuan nay|this week|tuần hiện tại|tuan hien tai)/i,
            /\b(tháng trước|thang truoc|last month|tháng vừa rồi|thang vua roi)/i,
            /\b(hôm nay|hom nay|today|ngày hôm nay|ngay hom nay)/i,
            /\b(hôm qua|hom qua|yesterday|ngày hôm qua|ngay hom qua)/i,
            /\b(tháng này|thang nay|this month|tháng hiện tại|thang hien tai)/i,
            /\b(năm nay|nam nay|this year|năm hiện tại|nam hien tai)/i,

            // Cấu trúc với dữ liệu tài chính
            /(thu nhập|thu nhap|income).*(tuần này|tuan nay|this week)/i,
            /(chi tiêu|chi tieu|expense).*(tháng trước|thang truoc|last month)/i,
            /(khoản vay|khoan vay|loan).*(hôm nay|hom nay|today)/i,
            /(tổng quan|tong quan|overview).*(tháng này|thang nay|this month)/i
        ];

        return timePatterns.some(pattern => pattern.test(message));
    }

    /**
     * 📊 Phát hiện truy vấn về cổ phiếu
     */
    detectStockQuery(message) {
        const normalizedMessage = message.toLowerCase().trim();

        // Patterns để nhận diện câu hỏi về cổ phiếu
        const stockPatterns = [
            // Hỏi giá cổ phiếu cụ thể
            /\b(giá|gia)\s+(cổ phiếu|co phieu|stock)\s+([A-Z]{3,4})\b/i,
            /\b(mã|ma)\s+([A-Z]{3,4})\s+(hôm nay|hom nay|bây giờ|bay gio|hiện tại|hien tai)/i,
            /\b([A-Z]{3,4})\s+(hôm nay|hom nay|bây giờ|bay gio|thế nào|the nao|như thế nào|nhu the nao)/i,

            // Hỏi về cổ phiếu nói chung
            /\b(cổ phiếu|co phieu|stock|chứng khoán|chung khoan)\s+(nào|nao|gì|gi|thế nào|the nao)/i,
            /\b(thị trường|thi truong|market)\s+(cổ phiếu|co phieu|stock|chứng khoán|chung khoan)/i,

            // Hỏi giá trực tiếp với mã cổ phiếu
            /\b(VNM|VCB|FPT|VIC|HPG|MSN|CTG|BID|TCB|VHM|MWG|SAB|GAS|PLX|VRE|POW|SSI|HDB|TPB|SHB)\b/i,

            // Câu hỏi phân tích
            /(phân tích|phan tich|analyze)\s+(cổ phiếu|co phieu|stock)/i,
            /(xu hướng|xu huong|trend)\s+(cổ phiếu|co phieu|stock)/i,
            /(nên mua|nen mua|should buy)\s+(cổ phiếu|co phieu|stock)/i,

            // Hỏi về ngành
            /(cổ phiếu|co phieu|stock)\s+(ngân hàng|ngan hang|banking|công nghệ|cong nghe|technology)/i,

            // Patterns đơn giản
            /giá\s+[A-Z]{3,4}/i,
            /[A-Z]{3,4}\s+giá/i,
            /stock\s+price/i,
            /price\s+of\s+[A-Z]{3,4}/i
        ];

        const isStockQuery = stockPatterns.some(pattern => pattern.test(normalizedMessage));

        if (isStockQuery) {
            logger.info('📊 Stock query detected', {
                message: normalizedMessage,
                patterns: stockPatterns.map(p => p.test(normalizedMessage))
            });
        }

        return isStockQuery;
    }

    /**
     * Trích xuất mã cổ phiếu từ tin nhắn
     */
    extractStockSymbol(message) {
        const normalizedMessage = message.toUpperCase().trim();

        // Danh sách mã cổ phiếu phổ biến
        const popularStocks = [
            'VNM', 'VCB', 'FPT', 'VIC', 'HPG', 'MSN', 'CTG', 'BID', 'TCB', 'VHM',
            'MWG', 'SAB', 'GAS', 'PLX', 'VRE', 'POW', 'SSI', 'HDB', 'TPB', 'SHB',
            'ACB', 'STB', 'VPB', 'EIB', 'LPB', 'MBB', 'NVB', 'OCB', 'PVB', 'SCB',
            'VIB', 'VND', 'VCG', 'VJC', 'GMD', 'DGC', 'REE', 'PNJ', 'DXG', 'KDH'
        ];

        // Tìm mã cổ phiếu trong tin nhắn
        for (const stock of popularStocks) {
            if (normalizedMessage.includes(stock)) {
                return stock;
            }
        }

        // Tìm pattern mã cổ phiếu (3-4 ký tự viết hoa)
        const stockMatch = normalizedMessage.match(/\b([A-Z]{3,4})\b/);
        if (stockMatch) {
            return stockMatch[1];
        }

        return null;
    }

    /**
     * Phân tích từ khóa và thời gian từ tin nhắn
     */
    analyzeKeywordsAndTime(message) {
        const normalizedMessage = message.toLowerCase().trim();

        // Hàm helper để loại bỏ dấu tiếng Việt
        const removeDiacritics = (str) => {
            return str.normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D');
        };

        const normalizedNoDiacritics = removeDiacritics(normalizedMessage);

        // Phân tích từ khóa chính
        let category = null;

        // Ưu tiên kiểm tra các từ khóa cụ thể trước - PHẢI THEO THỨ TỰ CHÍNH XÁC
        if (normalizedMessage.includes('tiết kiệm ngân hàng') || normalizedNoDiacritics.includes('tiet kiem ngan hang') ||
            normalizedMessage.includes('tiền gửi ngân hàng') || normalizedNoDiacritics.includes('tien gui ngan hang') ||
            normalizedMessage.includes('gửi tiết kiệm') || normalizedNoDiacritics.includes('gui tiet kiem') ||
            normalizedMessage.includes('bank savings') ||
            normalizedMessage.includes('tiền tiết kiệm ngân hàng') || normalizedNoDiacritics.includes('tien tiet kiem ngan hang')) {
            category = 'savings';
            logger.info('Keyword analysis: detected savings (bank)', { message: normalizedMessage });
        } else if (normalizedMessage.includes('tiết kiệm trong thu nhập') || normalizedNoDiacritics.includes('tiet kiem trong thu nhap')) {
            category = 'income';
            logger.info('Keyword analysis: detected income (savings in income)', { message: normalizedMessage });
        } else if (
            // Kiểm tra tiết kiệm ngân hàng TRƯỚC (ưu tiên cao hơn)
            (normalizedMessage.includes('tiết kiệm') && normalizedMessage.includes('ngân hàng')) ||
            (normalizedNoDiacritics.includes('tiet kiem') && normalizedNoDiacritics.includes('ngan hang')) ||
            normalizedMessage.includes('tiết kiệm gửi ngân hàng') ||
            normalizedMessage.includes('tiền gửi ngân hàng') ||
            normalizedMessage.includes('gửi tiết kiệm') ||
            normalizedMessage.includes('tiết kiệm từ ngân hàng') ||
            normalizedMessage.includes('tiền tiết kiệm ngân hàng') ||
            normalizedMessage.includes('bank savings') ||
            normalizedMessage.includes('savings bank') ||
            normalizedNoDiacritics.includes('tiet kiem ngan hang') ||
            normalizedNoDiacritics.includes('tien gui ngan hang')
        ) {
            category = 'savings'; // Tiết kiệm ngân hàng → investment
            logger.info('Keyword analysis: detected bank savings in investment category', { message: normalizedMessage });
        } else if (
            // Tiết kiệm thông thường (không có từ "ngân hàng")
            normalizedMessage === 'tiền tiết kiệm' || normalizedNoDiacritics === 'tien tiet kiem' ||
            normalizedMessage.includes('tiết kiệm') || normalizedNoDiacritics.includes('tiet kiem') ||
            normalizedMessage.includes('saving') || normalizedMessage.includes('savings') ||
            normalizedMessage.includes('tiền tiết kiệm') || normalizedNoDiacritics.includes('tien tiet kiem') ||
            normalizedMessage.includes('tổng tiết kiệm') || normalizedNoDiacritics.includes('tong tiet kiem')
        ) {
            category = 'savings_income'; // Tiết kiệm thông thường → income
            logger.info('Keyword analysis: detected general savings in income category', { message: normalizedMessage });
        } else if (normalizedMessage.includes('thu nhập') || normalizedNoDiacritics.includes('thu nhap') ||
            normalizedMessage.includes('lương') || normalizedNoDiacritics.includes('luong') ||
            normalizedMessage.includes('tiền lương') || normalizedNoDiacritics.includes('tien luong') ||
            normalizedMessage.includes('income') || normalizedMessage.includes('salary')) {
            category = 'income';
            logger.info('Keyword analysis: detected income (general)', { message: normalizedMessage });
        } else if (normalizedMessage.includes('chi tiêu') || normalizedNoDiacritics.includes('chi tieu') ||
            normalizedMessage.includes('chi phí') || normalizedNoDiacritics.includes('chi phi') ||
            normalizedMessage.includes('tiêu dùng') || normalizedNoDiacritics.includes('tieu dung') ||
            normalizedMessage.includes('expense') || normalizedMessage.includes('spending')) {
            category = 'expense';
        } else if (
            // Khoản vay quá hạn - Cải thiện khả năng nhận diện
            normalizedMessage.includes('nợ quá hạn') || normalizedNoDiacritics.includes('no qua han') ||
            normalizedMessage.includes('quá hạn') || normalizedNoDiacritics.includes('qua han') ||
            normalizedMessage.includes('vay quá hạn') || normalizedNoDiacritics.includes('vay qua han') ||
            normalizedMessage.includes('khoản vay quá hạn') || normalizedNoDiacritics.includes('khoan vay qua han') ||
            normalizedMessage.includes('nợ trễ hạn') || normalizedNoDiacritics.includes('no tre han') ||
            normalizedMessage.includes('trễ hạn') || normalizedNoDiacritics.includes('tre han') ||
            normalizedMessage.includes('nợ đến hạn') || normalizedNoDiacritics.includes('no den han') ||
            normalizedMessage.includes('đến hạn') || normalizedNoDiacritics.includes('den han') ||
            normalizedMessage.includes('hết hạn') || normalizedNoDiacritics.includes('het han') ||
            normalizedMessage.includes('nợ xấu') || normalizedNoDiacritics.includes('no xau') ||
            normalizedMessage.includes('vay xấu') || normalizedNoDiacritics.includes('vay xau') ||
            normalizedMessage.includes('nợ khó đòi') || normalizedNoDiacritics.includes('no kho doi') ||
            normalizedMessage.includes('vay khó đòi') || normalizedNoDiacritics.includes('vay kho doi') ||
            normalizedMessage.includes('nợ chậm trả') || normalizedNoDiacritics.includes('no cham tra') ||
            normalizedMessage.includes('vay chậm trả') || normalizedNoDiacritics.includes('vay cham tra') ||
            normalizedMessage.includes('nợ tồn đọng') || normalizedNoDiacritics.includes('no ton dong') ||
            normalizedMessage.includes('vay tồn đọng') || normalizedNoDiacritics.includes('vay ton dong') ||
            normalizedMessage.includes('nợ khó thu') || normalizedNoDiacritics.includes('no kho thu') ||
            normalizedMessage.includes('vay khó thu') || normalizedNoDiacritics.includes('vay kho thu') ||
            normalizedMessage.includes('overdue loan') || normalizedMessage.includes('overdue debt') ||
            normalizedMessage.includes('late payment') || normalizedMessage.includes('past due') ||
            normalizedMessage.includes('delinquent') || normalizedMessage.includes('defaulted') ||
            normalizedMessage.includes('bad debt') || normalizedMessage.includes('non-performing')
        ) {
            category = 'loan_overdue';
            logger.info('Keyword analysis: detected loan_overdue', {
                message: normalizedMessage,
                normalizedNoDiacritics,
                matchedKeywords: {
                    noQuaHan: normalizedMessage.includes('nợ quá hạn') || normalizedNoDiacritics.includes('no qua han'),
                    quaHan: normalizedMessage.includes('quá hạn') || normalizedNoDiacritics.includes('qua han'),
                    vayQuaHan: normalizedMessage.includes('vay quá hạn') || normalizedNoDiacritics.includes('vay qua han'),
                    khoanVayQuaHan: normalizedMessage.includes('khoản vay quá hạn') || normalizedNoDiacritics.includes('khoan vay qua han'),
                    noTreHan: normalizedMessage.includes('nợ trễ hạn') || normalizedNoDiacritics.includes('no tre han'),
                    treHan: normalizedMessage.includes('trễ hạn') || normalizedNoDiacritics.includes('tre han'),
                    noDenHan: normalizedMessage.includes('nợ đến hạn') || normalizedNoDiacritics.includes('no den han'),
                    denHan: normalizedMessage.includes('đến hạn') || normalizedNoDiacritics.includes('den han'),
                    hetHan: normalizedMessage.includes('hết hạn') || normalizedNoDiacritics.includes('het han'),
                    noXau: normalizedMessage.includes('nợ xấu') || normalizedNoDiacritics.includes('no xau'),
                    vayXau: normalizedMessage.includes('vay xấu') || normalizedNoDiacritics.includes('vay xau'),
                    noKhoDoi: normalizedMessage.includes('nợ khó đòi') || normalizedNoDiacritics.includes('no kho doi'),
                    vayKhoDoi: normalizedMessage.includes('vay khó đòi') || normalizedNoDiacritics.includes('vay kho doi'),
                    noChamTra: normalizedMessage.includes('nợ chậm trả') || normalizedNoDiacritics.includes('no cham tra'),
                    vayChamTra: normalizedMessage.includes('vay chậm trả') || normalizedNoDiacritics.includes('vay cham tra'),
                    noTonDong: normalizedMessage.includes('nợ tồn đọng') || normalizedNoDiacritics.includes('no ton dong'),
                    vayTonDong: normalizedMessage.includes('vay tồn đọng') || normalizedNoDiacritics.includes('vay ton dong'),
                    noKhoThu: normalizedMessage.includes('nợ khó thu') || normalizedNoDiacritics.includes('no kho thu'),
                    vayKhoThu: normalizedMessage.includes('vay khó thu') || normalizedNoDiacritics.includes('vay kho thu'),
                    overdueEn: normalizedMessage.includes('overdue loan') || normalizedMessage.includes('overdue debt'),
                    latePayment: normalizedMessage.includes('late payment') || normalizedMessage.includes('past due'),
                    delinquent: normalizedMessage.includes('delinquent') || normalizedMessage.includes('defaulted'),
                    badDebt: normalizedMessage.includes('bad debt') || normalizedMessage.includes('non-performing')
                }
            });
        } else if (
            // Khoản vay còn lại - ưu tiên cao hơn
            normalizedMessage.includes('nợ còn lại') || normalizedNoDiacritics.includes('no con lai') ||
            normalizedMessage.includes('còn nợ') || normalizedNoDiacritics.includes('con no') ||
            normalizedMessage.includes('vay còn lại') || normalizedNoDiacritics.includes('vay con lai') ||
            normalizedMessage.includes('khoản vay còn lại') || normalizedNoDiacritics.includes('khoan vay con lai') ||
            // Thêm xử lý lỗi đánh máy "alji" thay vì "lại"
            normalizedMessage.includes('vay còn alji') || normalizedMessage.includes('khoản vay còn alji') ||
            normalizedMessage.includes('chưa trả') || normalizedNoDiacritics.includes('chua tra') ||
            normalizedMessage.includes('chưa tất toán') || normalizedNoDiacritics.includes('chua tat toan') ||
            normalizedMessage.includes('chưa thanh toán') || normalizedNoDiacritics.includes('chua thanh toan') ||
            normalizedMessage.includes('chưa trả hết') || normalizedNoDiacritics.includes('chua tra het') ||
            normalizedMessage.includes('remaining debt') || normalizedMessage.includes('outstanding debt') ||
            normalizedMessage.includes('unpaid loan') || normalizedMessage.includes('active loan')
        ) {
            category = 'loan_remaining';
            logger.info('Keyword analysis: detected loan_remaining', {
                message: normalizedMessage,
                normalizedNoDiacritics,
                matchedKeywords: {
                    noConLai: normalizedMessage.includes('nợ còn lại') || normalizedNoDiacritics.includes('no con lai'),
                    conNo: normalizedMessage.includes('còn nợ') || normalizedNoDiacritics.includes('con no'),
                    vayConLai: normalizedMessage.includes('vay còn lại') || normalizedNoDiacritics.includes('vay con lai'),
                    khoanVayConLai: normalizedMessage.includes('khoản vay còn lại') || normalizedNoDiacritics.includes('khoan vay con lai'),
                    vayConAlji: normalizedMessage.includes('vay còn alji') || normalizedMessage.includes('khoản vay còn alji'),
                    chuaTra: normalizedMessage.includes('chưa trả') || normalizedNoDiacritics.includes('chua tra'),
                    chuaTatToan: normalizedMessage.includes('chưa tất toán') || normalizedNoDiacritics.includes('chua tat toan'),
                    chuaThanhToan: normalizedMessage.includes('chưa thanh toán') || normalizedNoDiacritics.includes('chua thanh toan'),
                    chuaTraHet: normalizedMessage.includes('chưa trả hết') || normalizedNoDiacritics.includes('chua tra het')
                }
            });
        } else if (
            // Khoản vay đã trả hết
            normalizedMessage.includes('nợ đã trả') || normalizedNoDiacritics.includes('no da tra') ||
            normalizedMessage.includes('đã trả nợ') || normalizedNoDiacritics.includes('da tra no') ||
            normalizedMessage.includes('khoản vay đã trả') || normalizedNoDiacritics.includes('khoan vay da tra') ||
            normalizedMessage.includes('vay đã trả') || normalizedNoDiacritics.includes('vay da tra') ||
            normalizedMessage.includes('đã tất toán') || normalizedNoDiacritics.includes('da tat toan') ||
            normalizedMessage.includes('đã thanh toán') || normalizedNoDiacritics.includes('da thanh toan') ||
            normalizedMessage.includes('đã trả hết') || normalizedNoDiacritics.includes('da tra het') ||
            normalizedMessage.includes('paid debt') || normalizedMessage.includes('paid loan') ||
            normalizedMessage.includes('completed loan') || normalizedMessage.includes('settled debt')
        ) {
            category = 'loan_paid';
            logger.info('Keyword analysis: detected loan_paid', {
                message: normalizedMessage,
                normalizedNoDiacritics,
                matchedKeywords: {
                    noDaTra: normalizedMessage.includes('nợ đã trả') || normalizedNoDiacritics.includes('no da tra'),
                    daTraNo: normalizedMessage.includes('đã trả nợ') || normalizedNoDiacritics.includes('da tra no'),
                    khoanVayDaTra: normalizedMessage.includes('khoản vay đã trả') || normalizedNoDiacritics.includes('khoan vay da tra'),
                    vayDaTra: normalizedMessage.includes('vay đã trả') || normalizedNoDiacritics.includes('vay da tra'),
                    daTatToan: normalizedMessage.includes('đã tất toán') || normalizedNoDiacritics.includes('da tat toan'),
                    daThanhToan: normalizedMessage.includes('đã thanh toán') || normalizedNoDiacritics.includes('da thanh toan'),
                    daTraHet: normalizedMessage.includes('đã trả hết') || normalizedNoDiacritics.includes('da tra het')
                }
            });
        } else if (normalizedMessage.includes('loan') || normalizedMessage.includes('debt') ||
            normalizedMessage.includes('số nợ') || normalizedNoDiacritics.includes('so no') ||
            (normalizedMessage.includes('khoản vay') && !normalizedMessage.includes('khoản vay còn lại') && !normalizedMessage.includes('khoản vay đã trả')) ||
            (normalizedNoDiacritics.includes('khoan vay') && !normalizedNoDiacritics.includes('khoan vay con lai') && !normalizedNoDiacritics.includes('khoan vay da tra')) ||
            (normalizedMessage.includes('vay') && !normalizedMessage.includes('vay còn lại') && !normalizedMessage.includes('vay đã trả')) ||
            (normalizedMessage.includes('nợ') && !normalizedMessage.includes('nợ còn lại') && !normalizedMessage.includes('nợ đã trả')) ||
            (normalizedNoDiacritics.includes('no') && !normalizedNoDiacritics.includes('no con lai') && !normalizedNoDiacritics.includes('no da tra'))) {
            category = 'loan';
            logger.info('Keyword analysis: detected general loan', {
                message: normalizedMessage,
                normalizedNoDiacritics,
                excludedSpecificLoanTypes: true
            });
        } else if (normalizedMessage.includes('cổ phiếu') || normalizedNoDiacritics.includes('co phieu') ||
            normalizedMessage.includes('stock') || normalizedMessage.includes('chứng khoán') ||
            normalizedNoDiacritics.includes('chung khoan')) {
            category = 'stock';
            logger.info('Keyword analysis: detected stock investment', { message: normalizedMessage });
        } else if (normalizedMessage.includes('vàng') || normalizedNoDiacritics.includes('vang') ||
            normalizedMessage.includes('gold') || normalizedMessage.includes('kim loại quý') ||
            normalizedNoDiacritics.includes('kim loai quy')) {
            category = 'gold';
            logger.info('Keyword analysis: detected gold investment', { message: normalizedMessage });
        } else if (normalizedMessage.includes('bất động sản') || normalizedNoDiacritics.includes('bat dong san') ||
            normalizedMessage.includes('đất đai') || normalizedNoDiacritics.includes('dat dai') ||
            normalizedMessage.includes('real estate') || normalizedMessage.includes('realestate') ||
            normalizedMessage.includes('nhà đất') || normalizedNoDiacritics.includes('nha dat') ||
            normalizedMessage.includes('đất của tôi') || normalizedNoDiacritics.includes('dat cua toi') ||
            normalizedMessage.includes('đất tôi') || normalizedNoDiacritics.includes('dat toi') ||
            normalizedMessage.includes('mảnh đất') || normalizedNoDiacritics.includes('manh dat') ||
            normalizedMessage.includes('lô đất') || normalizedNoDiacritics.includes('lo dat') ||
            normalizedMessage.includes('thửa đất') || normalizedNoDiacritics.includes('thua dat') ||
            normalizedMessage.includes('khu đất') || normalizedNoDiacritics.includes('khu dat') ||
            normalizedMessage.includes('căn nhà') || normalizedNoDiacritics.includes('can nha') ||
            normalizedMessage.includes('ngôi nhà') || normalizedNoDiacritics.includes('ngoi nha') ||
            normalizedMessage.includes('nhà của tôi') || normalizedNoDiacritics.includes('nha cua toi') ||
            normalizedMessage.includes('nhà tôi') || normalizedNoDiacritics.includes('nha toi') ||
            normalizedMessage.includes('property') || normalizedMessage.includes('land')) {
            category = 'realestate';
            logger.info('Keyword analysis: detected real estate investment', {
                message: normalizedMessage,
                normalizedNoDiacritics,
                matchedKeywords: {
                    batDongSan: normalizedMessage.includes('bất động sản'),
                    batDongSanNoDiacritics: normalizedNoDiacritics.includes('bat dong san'),
                    datDai: normalizedMessage.includes('đất đai'),
                    datDaiNoDiacritics: normalizedNoDiacritics.includes('dat dai'),
                    realEstate: normalizedMessage.includes('real estate') || normalizedMessage.includes('realestate'),
                    nhaDat: normalizedMessage.includes('nhà đất'),
                    nhaDatNoDiacritics: normalizedNoDiacritics.includes('nha dat'),
                    datCuaToi: normalizedMessage.includes('đất của tôi') || normalizedNoDiacritics.includes('dat cua toi'),
                    datToi: normalizedMessage.includes('đất tôi') || normalizedNoDiacritics.includes('dat toi'),
                    manhDat: normalizedMessage.includes('mảnh đất') || normalizedNoDiacritics.includes('manh dat'),
                    loDat: normalizedMessage.includes('lô đất') || normalizedNoDiacritics.includes('lo dat'),
                    thuaDat: normalizedMessage.includes('thửa đất') || normalizedNoDiacritics.includes('thua dat'),
                    khuDat: normalizedMessage.includes('khu đất') || normalizedNoDiacritics.includes('khu dat'),
                    canNha: normalizedMessage.includes('căn nhà') || normalizedNoDiacritics.includes('can nha'),
                    ngoiNha: normalizedMessage.includes('ngôi nhà') || normalizedNoDiacritics.includes('ngoi nha'),
                    nhaCuaToi: normalizedMessage.includes('nhà của tôi') || normalizedNoDiacritics.includes('nha cua toi'),
                    nhaToi: normalizedMessage.includes('nhà tôi') || normalizedNoDiacritics.includes('nha toi'),
                    property: normalizedMessage.includes('property'),
                    land: normalizedMessage.includes('land')
                }
            });
        } else if (normalizedMessage.includes('đầu tư') || normalizedNoDiacritics.includes('dau tu') ||
            normalizedMessage.includes('investment')) {
            category = 'investment';
            logger.info('Keyword analysis: detected general investment', { message: normalizedMessage });
        } else if (normalizedMessage.includes('số dư') || normalizedNoDiacritics.includes('so du') ||
            normalizedMessage.includes('balance') || normalizedMessage.includes('tổng quan') ||
            normalizedNoDiacritics.includes('tong quan') || normalizedMessage.includes('overview')) {
            category = 'balance';
        }

        // Phân tích thời gian
        let timeFilter = null;
        const monthNames = {
            'tháng 1': 1, 'tháng 2': 2, 'tháng 3': 3, 'tháng 4': 4, 'tháng 5': 5, 'tháng 6': 6,
            'tháng 7': 7, 'tháng 8': 8, 'tháng 9': 9, 'tháng 10': 10, 'tháng 11': 11, 'tháng 12': 12,
            'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
            'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
        };

        for (const [monthName, monthNumber] of Object.entries(monthNames)) {
            if (normalizedMessage.includes(monthName) || normalizedNoDiacritics.includes(monthName)) {
                timeFilter = { type: 'month', value: monthNumber };
                break;
            }
        }

        // Kiểm tra năm
        const yearMatch = normalizedMessage.match(/năm (\d{4})|year (\d{4})/) || normalizedNoDiacritics.match(/nam (\d{4})/);
        if (yearMatch) {
            const year = parseInt(yearMatch[1] || yearMatch[2]);
            if (timeFilter) {
                timeFilter.year = year;
            } else {
                timeFilter = { type: 'year', value: year };
            }
        }

        // Kiểm tra "hôm nay", "tuần này", "tháng này"
        if (normalizedMessage.includes('hôm nay') || normalizedNoDiacritics.includes('hom nay') || normalizedMessage.includes('today')) {
            timeFilter = { type: 'today' };
        } else if (normalizedMessage.includes('tuần này') || normalizedNoDiacritics.includes('tuan nay') || normalizedMessage.includes('this week')) {
            timeFilter = { type: 'week' };
        } else if (normalizedMessage.includes('tháng này') || normalizedNoDiacritics.includes('thang nay') || normalizedMessage.includes('this month')) {
            timeFilter = { type: 'current_month' };
        }

        return { category, timeFilter };
    }

    /**
     * Trích xuất dữ liệu giao dịch từ tin nhắn với type cụ thể
     */
    async extractTransactionData(message, forceType = null) {
        const typeInstruction = forceType ?
            `Loại giao dịch đã được xác định là "${forceType}". Chỉ cần trích xuất số tiền, danh mục và ghi chú.` :
            `Xác định loại giao dịch: "savings", "income", "expense", hoặc "loan".`;

        const dataPrompt = `
Phân tích câu sau và trích xuất dữ liệu giao dịch dạng JSON: "${message}"

${typeInstruction}

Format JSON cần trả về:
{
    "type": "${forceType || 'savings/income/expense/loan'}",
    "amount": số tiền (chỉ số, không có đơn vị),
    "category": "danh mục phù hợp",
    "note": "ghi chú hoặc mô tả",
    "date": "YYYY-MM-DD" (nếu không có thì để ngày hôm nay - ${new Date().toISOString().split('T')[0]}),
    "needsCategoryConfirmation": true/false,
    "suggestedCategories": ["danh_mục_1", "danh_mục_2", "danh_mục_3"]
}

**Hướng dẫn xử lý số tiền:**
- "50k", "50 nghìn" = 50000
- "1 triệu", "1tr", "1m" = 1000000
- "2.5 triệu" = 2500000
- "15 triệu" = 15000000

**Danh mục phổ biến:**
Tiền tiết kiệm: "Tiền tiết kiệm", "Để dành", "Gom góp", "Dành dụm"
Thu nhập: "Lương", "Thưởng", "Thu nhập khác", "Freelance", "Bán hàng", "Kinh doanh"
Chi tiêu: "Ăn uống", "Di chuyển", "Giải trí", "Mua sắm", "Học tập", "Y tế", "Hóa đơn", "Khác"
Khoản vay: "Ngân hàng", "Bạn bè", "Gia đình", "Công ty", "Khác"

Ví dụ (sử dụng ngày hiện tại ${new Date().toISOString().split('T')[0]}):
- "Tôi tiết kiệm được 2 triệu" -> {"type": "savings", "amount": 2000000, "category": "Tiền tiết kiệm", "note": "Tiết kiệm được", "date": "${new Date().toISOString().split('T')[0]}"}
- "Tôi mới tiết kiệm được 500k" -> {"type": "savings", "amount": 500000, "category": "Tiền tiết kiệm", "note": "Mới tiết kiệm được", "date": "${new Date().toISOString().split('T')[0]}"}
- "Vừa tiết kiệm 1 triệu" -> {"type": "savings", "amount": 1000000, "category": "Tiền tiết kiệm", "note": "Vừa tiết kiệm", "date": "${new Date().toISOString().split('T')[0]}"}
- "Để dành 500k hôm nay" -> {"type": "savings", "amount": 500000, "category": "Tiền tiết kiệm", "note": "Để dành", "date": "${new Date().toISOString().split('T')[0]}"}
- "Tôi vừa mua cà phê 50k" -> {"type": "expense", "amount": 50000, "category": "Ăn uống", "note": "Mua cà phê", "date": "${new Date().toISOString().split('T')[0]}"}
- "Nhận lương 15 triệu hôm nay" -> {"type": "income", "amount": 15000000, "category": "Lương", "note": "Nhận lương", "date": "${new Date().toISOString().split('T')[0]}"}
- "Tôi tiêu 200k mua quần áo" -> {"type": "expense", "amount": 200000, "category": "Mua sắm", "note": "Mua quần áo", "date": "${new Date().toISOString().split('T')[0]}"}
- "Mua xe đạp 4 triệu" -> {"type": "expense", "amount": 4000000, "category": "Mua sắm", "note": "Mua xe đạp", "date": "${new Date().toISOString().split('T')[0]}"}
- "Mua ô tô 200tr" -> {"type": "expense", "amount": 200000000, "category": "Mua sắm", "note": "Mua ô tô", "date": "${new Date().toISOString().split('T')[0]}"}
- "Đổ xăng 200k" -> {"type": "expense", "amount": 200000, "category": "Di chuyển", "note": "Đổ xăng", "date": "${new Date().toISOString().split('T')[0]}"}
- "Được thưởng 2 triệu" -> {"type": "income", "amount": 2000000, "category": "Thưởng", "note": "Được thưởng", "date": "${new Date().toISOString().split('T')[0]}"}
- "Vay bạn 500k" -> {"type": "loan", "amount": 500000, "category": "Bạn bè", "note": "Vay bạn", "date": "${new Date().toISOString().split('T')[0]}"}

Chỉ trả về JSON, không có text khác.`;

        try {
            const jsonText = await this.callGeminiAI(dataPrompt, { temperature: 0.1 });
            // Làm sạch response để chỉ lấy JSON
            const cleanJson = jsonText.replace(/```json|```/g, '').trim();
            const result = JSON.parse(cleanJson);

            // Ưu tiên forceType nếu có
            if (forceType) {
                result.type = forceType;
            }

            // Đảm bảo date luôn là ngày hiện tại nếu không có hoặc sai
            const today = new Date().toISOString().split('T')[0];
            if (!result.date || result.date === "2024-01-15" || new Date(result.date) < new Date('2024-10-01')) {
                result.date = today;
                logger.info('Date corrected to today', { originalDate: result.date, correctedDate: today });
            }

            return result;
        } catch (error) {
            logger.error('Transaction data extraction error:', error);
            throw new Error('Không thể hiểu dữ liệu giao dịch. Vui lòng nói rõ hơn.');
        }
    }

    /**
     * Lấy dữ liệu tài chính của người dùng
     */
    async getUserFinancialData(userId, timeFilter = null) {
        try {
            let dateQuery = {};

            if (timeFilter) {
                const now = new Date();
                switch (timeFilter.type) {
                    case 'today':
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        dateQuery = { date: { $gte: today, $lt: tomorrow } };
                        break;

                    case 'week':
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() - now.getDay());
                        startOfWeek.setHours(0, 0, 0, 0);
                        dateQuery = { date: { $gte: startOfWeek } };
                        break;

                    case 'current_month':
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        dateQuery = { date: { $gte: startOfMonth } };
                        break;

                    case 'month':
                        const year = timeFilter.year || now.getFullYear();
                        const monthStart = new Date(year, timeFilter.value - 1, 1);
                        const monthEnd = new Date(year, timeFilter.value, 1);
                        dateQuery = { date: { $gte: monthStart, $lt: monthEnd } };
                        break;

                    case 'year':
                        const yearStart = new Date(timeFilter.value, 0, 1);
                        const yearEnd = new Date(timeFilter.value + 1, 0, 1);
                        dateQuery = { date: { $gte: yearStart, $lt: yearEnd } };
                        break;
                }
            }

            const baseQuery = { userId, ...dateQuery };
            const createdAtQuery = { userId, ...dateQuery.date ? { createdAt: dateQuery.date } : {} };

            const [transactions, expenses, incomes, budgets, loans, investments] = await Promise.all([
                Transaction.find(baseQuery).sort({ date: -1 }).limit(100),
                Expense.find(baseQuery).sort({ date: -1 }),
                Income.find(baseQuery).sort({ date: -1 }),
                Budget.find(createdAtQuery).sort({ createdAt: -1 }),
                Loan.find(createdAtQuery).sort({ createdAt: -1 }).populate('payments'),
                Investment.find(createdAtQuery).sort({ createdAt: -1 })
            ]);

            // Debug logging để kiểm tra dữ liệu
            const totalIncomes = incomes.reduce((sum, inc) => sum + inc.amount, 0);
            const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

            // Tính tổng khoản vay theo logic của frontend (bao gồm lãi suất)
            const totalActiveLoans = loans.reduce((total, loan) => {
                // Chỉ tính những khoản vay có trạng thái ACTIVE
                const loanStatus = loan.status?.toUpperCase() || '';
                if (loanStatus !== 'ACTIVE') {
                    return total;
                }

                // Tính số tiền đã trả
                const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                // Số tiền còn lại sau khi trừ tiền đã trả
                const remainingAmount = Math.max(0, loan.amount - totalPaid);

                // Tính lãi suất giống như frontend
                if (loan.startDate && loan.dueDate && loan.interestRate) {
                    const startDate = new Date(loan.startDate);
                    const dueDate = new Date(loan.dueDate);
                    const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    let interestMultiplier = 0;
                    switch (loan.interestRateType) {
                        case 'DAY':
                            interestMultiplier = diffDays;
                            break;
                        case 'WEEK':
                            interestMultiplier = diffDays / 7;
                            break;
                        case 'MONTH':
                            interestMultiplier = diffDays / 30;
                            break;
                        case 'QUARTER':
                            interestMultiplier = diffDays / 90;
                            break;
                        case 'YEAR':
                            interestMultiplier = diffDays / 365;
                            break;
                        default:
                            interestMultiplier = 0;
                    }

                    // Tính lãi trên số tiền còn lại
                    const interestAmount = Math.round(remainingAmount * (loan.interestRate / 100) * interestMultiplier);

                    // Tổng tiền phải trả = Số tiền còn lại + Tiền lãi
                    return total + remainingAmount + interestAmount;
                } else {
                    // Nếu không có thông tin lãi suất, chỉ tính số tiền gốc
                    return total + remainingAmount;
                }
            }, 0);

            logger.info('Financial data summary', {
                userId,
                timeFilter,
                incomesCount: incomes.length,
                expensesCount: expenses.length,
                loansCount: loans.length,
                investmentsCount: investments.length,
                activeLoansCount: loans.filter(l => l.status?.toUpperCase() === 'ACTIVE').length,
                totalIncomes,
                totalExpenses,
                totalActiveLoans,
                totalInvestments: investments.reduce((sum, inv) => sum + (inv.initialInvestment || 0), 0),
                loanDetails: loans.map(loan => {
                    const totalPaid = loan.payments ? loan.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
                    const remainingAmount = Math.max(0, loan.amount - totalPaid);

                    let interestAmount = 0;
                    if (loan.startDate && loan.dueDate && loan.interestRate) {
                        const startDate = new Date(loan.startDate);
                        const dueDate = new Date(loan.dueDate);
                        const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        let interestMultiplier = 0;
                        switch (loan.interestRateType) {
                            case 'DAY': interestMultiplier = diffDays; break;
                            case 'WEEK': interestMultiplier = diffDays / 7; break;
                            case 'MONTH': interestMultiplier = diffDays / 30; break;
                            case 'QUARTER': interestMultiplier = diffDays / 90; break;
                            case 'YEAR': interestMultiplier = diffDays / 365; break;
                            default: interestMultiplier = 0;
                        }
                        interestAmount = Math.round(remainingAmount * (loan.interestRate / 100) * interestMultiplier);
                    }

                    return {
                        amount: loan.amount,
                        status: loan.status,
                        totalPaid,
                        remainingAmount,
                        interestAmount,
                        totalWithInterest: remainingAmount + interestAmount
                    };
                })
            });

            return {
                transactions,
                expenses,
                incomes,
                budgets,
                loans,
                investments,
                summary: {
                    totalTransactions: transactions.length,
                    totalExpenses,
                    totalIncomes,
                    activeBudgets: budgets.filter(b => b.isActive).length,
                    activeLoans: loans.filter(l => l.status?.toUpperCase() === 'ACTIVE').length,
                    totalInvestments: investments.reduce((sum, inv) => sum + (inv.initialInvestment || 0), 0),
                    totalLoans: totalActiveLoans // Sử dụng tổng khoản vay đã tính đúng
                },
                timeFilter
            };
        } catch (error) {
            logger.error('Error fetching user financial data:', error);
            throw new Error('Không thể lấy dữ liệu tài chính.');
        }
    }

    /**
     * Làm sạch message để xử lý nhất quán
     */
    cleanMessage(message) {
        if (!message) return '';

        return message
            .trim() // Xóa khoảng trắng đầu cuối
            .normalize('NFC') // Chuẩn hóa Unicode về dạng precomposed
            .replace(/\u00A0/g, ' ') // Thay non-breaking space bằng space thường
            .replace(/\u200B/g, '') // Xóa zero-width space
            .replace(/\u200C/g, '') // Xóa zero-width non-joiner
            .replace(/\u200D/g, '') // Xóa zero-width joiner
            .replace(/\uFEFF/g, '') // Xóa byte order mark
            .replace(/[\u2000-\u200A]/g, ' ') // Thay các loại space khác bằng space thường
            .replace(/\s+/g, ' ') // Thay nhiều space liên tiếp bằng 1 space
            .trim(); // Trim lại lần nữa
    }

    /**
     * Xử lý tin nhắn chính từ người dùng
     */
    async handleUserMessage(userId, message, sessionId = null, options = {}) {
        try {
            // Extract AI mode flag from options
            const isAIMode = options.aiMode === true;

            // Debug chi tiết message
            logger.info('Processing user message', {
                userId,
                message,
                sessionId,
                isAIMode,
                messageLength: message.length,
                trimmedMessage: message.trim(),
                normalizedMessage: message.toLowerCase().trim()
            });

            // Làm sạch message để xử lý nhất quán
            const cleanedMessage = this.cleanMessage(message);
            logger.info('Cleaned message', {
                original: message,
                cleaned: cleanedMessage,
                changed: message !== cleanedMessage,
                aiModeEnabled: isAIMode
            });

            // 🤖 AI Mode: Nếu AI mode được bật từ toggle switch
            if (isAIMode) {
                logger.info('🤖 AI MODE ACTIVATED - Bypassing normal VanLang Agent logic', {
                    userId,
                    message: cleanedMessage,
                    sessionId,
                    aiMode: true,
                    source: 'Toggle Switch',
                    originalMessage: message,
                    optionsReceived: options
                });

                // Directly call AI without any VanLang Agent processing
                const aiResponse = await this.handleAIDirectMode(userId, cleanedMessage, sessionId);

                logger.info('🤖 AI MODE RESPONSE GENERATED', {
                    userId,
                    responseLength: aiResponse.length,
                    responsePreview: aiResponse.substring(0, 100) + '...'
                });

                return aiResponse;
            }

            // 🔧 Normal Mode: VanLang Agent logic
            logger.info('🔧 NORMAL MODE - Using VanLang Agent logic', {
                userId,
                message: cleanedMessage,
                sessionId,
                aiMode: false
            });

            // AGENT INTERACTION: Bắt đầu xử lý tin nhắn từ người dùng.
            // Sử dụng NLPService để có được phân tích ban đầu với cleaned message
            const nlpAnalysis = this.nlpService.analyzeIntent(cleanedMessage);
            logger.info('NLPService analysis for handleUserMessage', { nlpAnalysis, message: cleanedMessage });

            let intent = nlpAnalysis.intent; // Lấy intent từ NLPService
            let confidence = nlpAnalysis.confidence;

            // Ánh xạ các intent từ NLPService sang các intent cụ thể của VanLangAgent
            // Ví dụ, nếu NLPService trả về 'financial_high_confidence', chúng ta cần logic tiếp theo để xác định đó là 'insert_income', 'expense_query', v.v.
            // Phần này cần được xây dựng dựa trên các 'matchedCategories' từ nlpAnalysis hoặc logic bổ sung.

            if (intent === 'blocked_topic') {
                return this.getFunnyResponse(); // Hoặc một phản hồi phù hợp cho nội dung bị chặn
            }
            if (intent === 'greeting') {
                intent = 'greeting.hello';
            }
            if (intent === 'about_bot') {
                intent = 'bot.introduction';
            }

            // Nếu NLPService không xác định được intent đủ rõ ràng (ví dụ: financial_low_confidence hoặc unknown)
            // hoặc là một intent tài chính chung chung, thì sử dụng logic phân tích intent hiện tại của VanLangAgent
            if (intent === 'unknown' || intent === 'financial_low_confidence' || intent === 'financial_medium_confidence' || intent === 'financial_high_confidence' || !intent) {
                logger.info('NLPService intent is general or low confidence, falling back to VanLangAgent internal intent analysis', { currentIntentFromNLP: intent, confidence });
                intent = await this.analyzeIntent(cleanedMessage); // AGENT INTERACTION: Gọi lại hàm analyzeIntent nội bộ nếu NLPService không đủ chắc chắn hoặc là intent tài chính chung.
                logger.info('VanLangAgent internal analyzeIntent result', {
                    intentFromInternal: intent,
                    message: cleanedMessage
                });
            }

            logger.info('Intent after NLP analysis', {
                originalIntent: nlpAnalysis.intent,
                finalIntent: intent,
                message,
                confidence
            });

            logger.info('analyzeIntent result', {
                intent,
                message,
                isInsertIntent: intent && intent.startsWith('insert_'),
                isCalculationIntent: intent && intent.includes('calculation'),
                isDetailIntent: intent && intent.includes('detail')
            });

            // Kiểm tra context trước để xử lý category confirmation
            const context = this.conversationContext.get(userId);
            if (context && context.type === 'category_confirmation' && (Date.now() - context.timestamp < 300000)) { // 5 phút
                return await this.handleCategoryConfirmation(userId, message, context);
            }

            // Chỉ sử dụng keyword analysis cho GET operations nếu analyzeIntent không trả về POST intent hoặc special intent
            // KHÔNG OVERRIDE các intent đặc biệt như filter_query, time_query, calculation_query, statistics_query
            if (!intent || (!intent.startsWith('insert_') && !intent.includes('calculation') && !intent.includes('detail') && !intent.includes('statistics') && intent !== 'filter_query' && intent !== 'time_query')) {
                const { category } = this.analyzeKeywordsAndTime(cleanedMessage);

                logger.info('Keyword analysis result', {
                    message: cleanedMessage,
                    category,
                    intent: intent || 'none'
                });

                if (category === 'savings') {
                    intent = 'savings_query';
                } else if (category === 'savings_income') {
                    intent = 'savings_income_query'; // Intent mới cho tiền tiết kiệm trong thu nhập
                } else if (category === 'income') {
                    intent = 'income_query';
                } else if (category === 'expense') {
                    intent = 'expense_query';
                } else if (category === 'loan') {
                    intent = 'loan_query';
                } else if (category === 'loan_paid') {
                    intent = 'loan_paid_query';
                } else if (category === 'loan_overdue') {
                    intent = 'loan_overdue_query';
                } else if (category === 'loan_remaining') {
                    intent = 'loan_remaining_query';
                } else if (category === 'stock') {
                    intent = 'stock_query';
                } else if (category === 'gold') {
                    intent = 'gold_query';
                } else if (category === 'realestate') {
                    intent = 'realestate_query';
                } else if (category === 'investment') {
                    intent = 'investment_query';
                } else if (category === 'balance') {
                    intent = 'balance_query';
                }
            }

            logger.info('Intent analyzed', {
                intent,
                message,
                normalizedMessage: message.toLowerCase().trim(),
                keywordAnalysis: {
                    containsBankSavings: message.toLowerCase().includes('tiết kiệm ngân hàng'),
                    containsSavingsInIncome: message.toLowerCase().includes('tiết kiệm trong thu nhập'),
                    containsGeneralSavings: message.toLowerCase().includes('tiết kiệm'),
                    exactMatch: message.toLowerCase().trim() === 'tiền tiết kiệm',
                    // Debug cho realestate
                    containsBatDongSan: message.toLowerCase().includes('bất động sản') || message.toLowerCase().includes('bat dong san'),
                    containsDatDai: message.toLowerCase().includes('đất đai') || message.toLowerCase().includes('dat dai'),
                    containsRealEstate: message.toLowerCase().includes('real estate') || message.toLowerCase().includes('realestate'),
                    containsNhaDat: message.toLowerCase().includes('nhà đất') || message.toLowerCase().includes('nha dat'),
                    containsDauTu: message.toLowerCase().includes('đầu tư') || message.toLowerCase().includes('dau tu')
                }
            });

            switch (intent) {
                // Nhóm POST - Thêm dữ liệu
                case 'insert_savings':
                    return await this.handleInsertTransaction(userId, message, sessionId, 'savings');

                // AGENT INTERACTION: Nếu intent là 'insert_income', điều hướng đến hàm xử lý thêm giao dịch thu nhập.
                case 'insert_income':
                    return await this.handleInsertTransaction(userId, message, sessionId, 'income');

                case 'insert_expense':
                    return await this.handleInsertTransaction(userId, message, sessionId, 'expense');

                case 'insert_loan':
                    return await this.handleInsertTransaction(userId, message, sessionId, 'loan');

                // Nhóm Query - Truy vấn thông tin
                case 'income_query':
                    return await this.handleSpecificQuery(userId, cleanedMessage, 'income');

                case 'expense_query':
                    return await this.handleSpecificQuery(userId, cleanedMessage, 'expense');

                case 'loan_query':
                    return await this.handleSpecificQuery(userId, cleanedMessage, 'loan');

                case 'loan_paid_query':
                    return await this.handleSpecificQuery(userId, cleanedMessage, 'loan_paid');

                case 'loan_overdue_query':
                    return await this.handleSpecificQuery(userId, cleanedMessage, 'loan_overdue');

                case 'loan_remaining_query':
                    return await this.handleSpecificQuery(userId, cleanedMessage, 'loan_remaining');

                case 'investment_query':
                    return await this.handleSpecificQuery(userId, message, 'investment');

                case 'stock_query':
                    return await this.handleSpecificQuery(userId, message, 'stock');

                case 'gold_query':
                    return await this.handleSpecificQuery(userId, message, 'gold');

                case 'realestate_query':
                    return await this.handleSpecificQuery(userId, message, 'realestate');

                case 'savings_query':
                    return await this.handleSpecificQuery(userId, message, 'savings');

                case 'savings_income_query':
                    return await this.handleSpecificQuery(userId, message, 'savings_income');

                case 'balance_query':
                    return await this.handleBalanceQuery(userId, message);

                // Nhóm Detail - Xem chi tiết
                case 'detail_query':
                    return await this.handleDetailQuery(userId, message);

                // Nhóm Filter - Tìm kiếm có điều kiện
                case 'filter_query':
                    return await this.handleFilterQuery(userId, message);

                // Nhóm Stock - Truy vấn cổ phiếu
                case 'stock_query':
                    return await this.handleStockQuery(userId, message);

                // Nhóm Statistics - Thống kê nâng cao
                case 'statistics_query':
                    return await this.handleStatisticsQuery(userId, message);

                // Nhóm Time - Truy vấn theo thời gian
                case 'time_query':
                    return await this.handleTimeQuery(userId, message);

                // Nhóm Calculation - Enhanced với 2 loại tính toán
                case 'general_calculation':
                    return await this.handleGeneralCalculation(userId, message);

                case 'financial_calculation':
                    return await this.handleFinancialCalculation(userId, message);

                case 'calculation_query': // Legacy support
                    return await this.handleCalculationQuery(userId, message);

                // Nhóm Analysis - Phân tích
                case 'analyze':
                    return await this.handleAnalyzeFinances(userId, message);

                // Nhóm Advice - Lời khuyên
                case 'advice':
                    return await this.handleFinancialAdvice(userId, message);

                // Nhóm Basic - Cơ bản (dựa trên training data)
                case 'greeting':
                case 'greeting.hello':
                    return this.getGreetingResponse();

                case 'greeting.farewell':
                    return this.getFarewellResponse();

                case 'bot.introduction':
                    return this.getBotIntroduction();

                case 'bot.capabilities':
                    return this.getBotCapabilities();

                case 'common.time_date':
                    return this.getCurrentDateTime();

                case 'auth.require':
                    return this.getAuthRequiredResponse();

                case 'chatbot.scope':
                    return this.getChatbotScope();

                case 'security.privacy':
                    return this.getSecurityInfo();

                case 'funny.chat':
                    return this.getFunnyResponse();

                default:
                    // Kiểm tra nếu user chỉ nói tên category mà không có context
                    const normalizedMessage = message.toLowerCase().trim();
                    const categoryKeywords = ['mua sắm', 'ăn uống', 'di chuyển', 'giải trí', 'học tập', 'y tế', 'hóa đơn'];

                    if (categoryKeywords.includes(normalizedMessage)) {
                        return `Không thể lưu chi tiêu. Bạn có thể nói rõ hơn như: "Tôi mua cà phê 50k" hoặc "Chi tiêu ăn uống 200 nghìn"?`;
                    }

                    return await this.handleGeneralQuestion(userId, message);
            }
        } catch (error) {
            logger.error('Error handling user message:', error);
            return 'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
        }
    }

    /**
     * Xử lý thêm giao dịch
     */
    async handleInsertTransaction(userId, message, sessionId, forceType = null) {
        // AGENT INTERACTION: Bắt đầu xử lý logic thêm giao dịch (bao gồm cả thu nhập).
        try {
            const transactionData = await this.extractTransactionData(message, forceType);

            // Ưu tiên forceType nếu có
            if (forceType) {
                transactionData.type = forceType;
            }

            // Kiểm tra nếu cần xác nhận category
            if (transactionData.needsCategoryConfirmation && transactionData.suggestedCategories && transactionData.suggestedCategories.length > 0) {
                // Lưu context để xử lý response sau
                this.conversationContext.set(userId, {
                    type: 'category_confirmation',
                    transactionData,
                    forceType,
                    sessionId,
                    timestamp: Date.now()
                });

                const typeNames = {
                    'savings': 'tiền tiết kiệm',
                    'income': 'thu nhập',
                    'expense': 'chi tiêu',
                    'loan': 'khoản vay'
                };

                let confirmationMessage = `🤔 **Tôi cần xác nhận danh mục cho ${typeNames[transactionData.type]} này:**\n\n`;
                confirmationMessage += `💰 **Số tiền:** ${transactionData.amount.toLocaleString('vi-VN')} VND\n`;
                confirmationMessage += `📝 **Mô tả:** ${transactionData.note}\n\n`;
                confirmationMessage += `📂 **Bạn muốn lưu vào danh mục nào?**\n`;

                transactionData.suggestedCategories.forEach((category, index) => {
                    confirmationMessage += `${index + 1}. ${category}\n`;
                });

                confirmationMessage += `\n💡 **Hướng dẫn:** Trả lời số thứ tự (VD: "1") hoặc nói tên danh mục (VD: "${transactionData.suggestedCategories[0]}")`;

                return confirmationMessage;
            }

            // Xử lý đặc biệt cho savings - lưu vào Income collection
            if (forceType === 'savings' || transactionData.type === 'savings') {
                const Income = (await import('../models/incomeModel.js')).default;

                const income = new Income({
                    userId,
                    amount: transactionData.amount,
                    description: transactionData.note || 'Tiền tiết kiệm',
                    category: 'Tiền tiết kiệm',
                    date: new Date(transactionData.date)
                });

                await income.save();
                logger.info('Savings saved to Income collection', { incomeId: income._id, amount: transactionData.amount });

                // Tạo notification cho savings
                try {
                    const notification = await Notification.createIncomeNotification(income);
                    if (socketManager && socketManager.to) {
                        socketManager.to(userId).emit('notification', notification);
                    }
                    logger.info('Notification created for agent savings', { notificationId: notification._id });
                } catch (notificationError) {
                    logger.error('Error creating notification for agent savings:', notificationError);
                }

                // Tạo response cho savings
                const successMessage = `✅ **Đã lưu tiền tiết kiệm thành công!**

💰 **Thông tin giao dịch:**
• Loại: Tiền tiết kiệm
• Số tiền: ${transactionData.amount.toLocaleString('vi-VN')} VND
• Danh mục: Tiền tiết kiệm
• Ngày: ${new Date(transactionData.date).toLocaleDateString('vi-VN')}
${transactionData.note ? `• Ghi chú: ${transactionData.note}` : ''}

💡 **Gợi ý:** Bạn có thể:
• Hỏi "tiền tiết kiệm của tôi" để xem tổng quan
• Nói "thêm tiền tiết kiệm khác" để tiếp tục
• Hỏi "số dư của tôi" để xem tình hình tài chính`;

                return successMessage;
            }

            // Xử lý các loại giao dịch khác (income, expense, loan)
            const transaction = new Transaction({
                userId,
                ...transactionData,
                createdByAgent: true,
                agentSessionId: sessionId
            });

            await transaction.save();

            // Đồng bộ với models hiện tại
            // AGENT INTERACTION: Sau khi lưu transaction, đồng bộ với các model cụ thể (Income, Expense, Loan).
            // Nếu transactionData.type là 'income', hàm syncWithExistingModels sẽ tạo/cập nhật bản ghi trong Income model.
            await transaction.syncWithExistingModels();

            logger.info('Transaction created by agent', { userId, transactionId: transaction._id, type: transactionData.type });

            // Tạo notification cho transaction
            try {
                let notification = null;
                if (transactionData.type === 'income') {
                    // Tìm income record đã được tạo
                    const income = await Income.findOne({
                        userId,
                        amount: transactionData.amount,
                        description: transactionData.note
                    }).sort({ createdAt: -1 });
                    if (income) {
                        notification = await Notification.createIncomeNotification(income);
                    }
                } else if (transactionData.type === 'expense') {
                    // Tìm expense record đã được tạo
                    const expense = await Expense.findOne({
                        userId,
                        amount: transactionData.amount,
                        description: transactionData.note
                    }).sort({ createdAt: -1 });
                    if (expense) {
                        notification = await Notification.createExpenseNotification(expense);
                    }
                } else if (transactionData.type === 'loan') {
                    // Tìm loan record đã được tạo
                    const loan = await Loan.findOne({
                        userId,
                        amount: transactionData.amount,
                        description: transactionData.note
                    }).sort({ createdAt: -1 });
                    if (loan) {
                        notification = await Notification.createLoanNotification(loan);
                    }
                }

                if (notification && socketManager && socketManager.to) {
                    socketManager.to(userId).emit('notification', notification);
                    logger.info('Notification created for agent transaction', {
                        notificationId: notification._id,
                        type: transactionData.type
                    });
                }
            } catch (notificationError) {
                logger.error('Error creating notification for agent transaction:', notificationError);
            }

            const typeNames = {
                'savings': 'tiền tiết kiệm',
                'income': 'thu nhập',
                'expense': 'chi tiêu',
                'loan': 'khoản vay'
            };

            const emoji = {
                'savings': '💰',
                'income': '💰',
                'expense': '💸',
                'loan': '🏦'
            };

            const successMessage = `✅ **Đã lưu ${typeNames[transactionData.type]} thành công!**

${emoji[transactionData.type]} **Thông tin giao dịch:**
• Loại: ${typeNames[transactionData.type]?.charAt(0).toUpperCase() + typeNames[transactionData.type]?.slice(1)}
• Số tiền: ${transaction.formattedAmount || transactionData.amount.toLocaleString('vi-VN')} VND
• Danh mục: ${transactionData.category}
• Ngày: ${new Date(transactionData.date).toLocaleDateString('vi-VN')}
${transactionData.note ? `• Ghi chú: ${transactionData.note}` : ''}

💡 **Gợi ý:** Bạn có thể:
• Hỏi "${typeNames[transactionData.type]} của tôi" để xem tổng quan
• Nói "thêm ${typeNames[transactionData.type]} khác" để tiếp tục
• Hỏi "số dư của tôi" để xem tình hình tài chính`;

            return successMessage;

        } catch (error) {
            logger.error('Error inserting transaction:', error);

            const errorMessages = {
                'savings': 'Không thể lưu tiền tiết kiệm. Bạn có thể nói rõ hơn như: "Tôi tiết kiệm được 2 triệu" hoặc "Để dành 500k hôm nay"?',
                'income': 'Không thể lưu thu nhập. Bạn có thể nói rõ hơn như: "Tôi nhận lương 15 triệu" hoặc "Được thưởng 2 triệu"?',
                'expense': 'Không thể lưu chi tiêu. Bạn có thể nói rõ hơn như: "Tôi mua cà phê 50k" hoặc "Chi tiêu ăn uống 200 nghìn"?',
                'loan': 'Không thể lưu khoản vay. Bạn có thể nói rõ hơn như: "Tôi vay ngân hàng 5 triệu" hoặc "Mượn bạn 500k"?'
            };

            return errorMessages[forceType] || 'Không thể lưu giao dịch. Bạn có thể nói rõ hơn về số tiền, loại giao dịch và mô tả không?';
        }
    }

    /**
     * Phân tích tài chính
     */
    async handleAnalyzeFinances(userId, message) {
        try {
            // Phân tích từ khóa và thời gian từ tin nhắn
            const { timeFilter } = this.analyzeKeywordsAndTime(message);
            const financialData = await this.getUserFinancialData(userId, timeFilter);

            let timeDescription = timeFilter ?
                (timeFilter.type === 'month' ? `tháng ${timeFilter.value}` :
                    timeFilter.type === 'current_month' ? 'tháng này' :
                        timeFilter.type === 'today' ? 'hôm nay' : 'thời gian được chỉ định') : 'tổng cộng';

            const analysisPrompt = `
Dựa trên dữ liệu tài chính ${timeDescription} sau, hãy phân tích và đưa ra lời khuyên:

Tổng quan ${timeDescription}:
- Tổng thu nhập: ${financialData.summary.totalIncomes.toLocaleString('vi-VN')} VND
- Tổng chi tiêu: ${financialData.summary.totalExpenses.toLocaleString('vi-VN')} VND
- Số dư: ${(financialData.summary.totalIncomes - financialData.summary.totalExpenses).toLocaleString('vi-VN')} VND
- Số ngân sách đang hoạt động: ${financialData.summary.activeBudgets}
- Tổng đầu tư: ${financialData.summary.totalInvestments.toLocaleString('vi-VN')} VND
- Tổng khoản vay: ${financialData.summary.totalLoans.toLocaleString('vi-VN')} VND

Câu hỏi cụ thể: "${message}"

Hãy đưa ra phân tích chi tiết và lời khuyên thực tế.`;

            const analysis = await this.callGeminiAI(analysisPrompt);
            return `📊 **Phân tích tài chính ${timeDescription} của bạn:**\n\n${analysis}`;

        } catch (error) {
            logger.error('Error analyzing finances:', error);
            return 'Không thể phân tích dữ liệu tài chính. Vui lòng thử lại sau.';
        }
    }

    /**
     * 🔍 TÍNH NĂNG 4: Xử lý truy vấn lọc nâng cao
     */
    async handleFilterQuery(userId, message) {
        try {
            logger.info('🔍 Advanced Filter Query detected', { userId, message });

            // 🚨 DEBUG: Log parseFilterConditions result
            const filterAnalysis = this.parseFilterConditions(message);
            logger.info('🚨 DEBUG parseFilterConditions result:', filterAnalysis);

            if (!filterAnalysis.isValid) {
                logger.error('🚨 DEBUG: filterAnalysis.isValid is FALSE!', {
                    isValid: filterAnalysis.isValid,
                    dataType: filterAnalysis.dataType,
                    operator: filterAnalysis.operator,
                    amount: filterAnalysis.amount
                });
                return `❌ **Không thể hiểu điều kiện lọc.**\n\n💡 **Ví dụ hợp lệ:**\n• "Chi tiêu trên 1 triệu"\n• "Thu nhập dưới 500k"\n• "Khoản vay cao nhất"\n• "Chi tiêu thấp nhất"`;
            }

            logger.info('🎉 DEBUG: filterAnalysis.isValid is TRUE! Proceeding with filter...');

            // Lấy dữ liệu và áp dụng filter
            const results = await this.applyAdvancedFilter(userId, filterAnalysis);

            return this.formatFilterResults(results, filterAnalysis);

        } catch (error) {
            logger.error('Error in handleFilterQuery:', error);
            return 'Xin lỗi, tôi gặp lỗi khi lọc dữ liệu. Vui lòng thử lại sau.';
        }
    }

    /**
     * ⏰ TÍNH NĂNG 6: Xử lý truy vấn theo thời gian
     */
    async handleTimeQuery(userId, message) {
        try {
            logger.info('⏰ Time-based Query detected', { userId, message });

            // Phân tích khoảng thời gian
            const timeAnalysis = this.parseTimeConditions(message);

            if (!timeAnalysis.isValid) {
                return `❌ **Không thể hiểu khoảng thời gian.**\n\n💡 **Ví dụ hợp lệ:**\n• "Thu nhập tuần này"\n• "Chi tiêu tháng trước"\n• "Khoản vay hôm nay"\n• "Tổng quan tài chính tháng này"`;
            }

            // Lấy dữ liệu theo thời gian
            const results = await this.getDataByTimeRange(userId, timeAnalysis);

            return this.formatTimeResults(results, timeAnalysis);

        } catch (error) {
            logger.error('Error in handleTimeQuery:', error);
            return 'Xin lỗi, tôi gặp lỗi khi truy vấn dữ liệu theo thời gian. Vui lòng thử lại sau.';
        }
    }

    /**
     * Xử lý truy vấn cụ thể theo từ khóa (thu nhập, chi tiêu, khoản vay)
     */
    async handleSpecificQuery(userId, message, category) {
        try {
            // Phân tích từ khóa và thời gian
            const { timeFilter } = this.analyzeKeywordsAndTime(message);

            // Lấy dữ liệu tài chính với bộ lọc thời gian
            const financialData = await this.getUserFinancialData(userId, timeFilter);

            let response = '';
            let timeDescription = '';

            // Tạo mô tả thời gian
            if (timeFilter) {
                switch (timeFilter.type) {
                    case 'today':
                        timeDescription = 'hôm nay';
                        break;
                    case 'week':
                        timeDescription = 'tuần này';
                        break;
                    case 'current_month':
                        timeDescription = 'tháng này';
                        break;
                    case 'month':
                        const monthNames = ['', 'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
                            'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
                        timeDescription = `${monthNames[timeFilter.value]}${timeFilter.year ? ` năm ${timeFilter.year}` : ''}`;
                        break;
                    case 'year':
                        timeDescription = `năm ${timeFilter.value}`;
                        break;
                    default:
                        timeDescription = 'thời gian được chỉ định';
                }
            } else {
                timeDescription = 'tổng cộng';
            }

            // Xử lý theo từng loại
            switch (category) {
                case 'income':
                    // Kiểm tra xem có phải đang hỏi về tiết kiệm không
                    const isAskingAboutSavings = message.toLowerCase().includes('tiết kiệm') ||
                        message.toLowerCase().includes('saving') ||
                        message.toLowerCase().includes('tiet kiem');

                    let incomesToShow = financialData.incomes;
                    let totalIncomeToShow = financialData.summary.totalIncomes;
                    let titleText = 'thu nhập';

                    if (isAskingAboutSavings) {
                        // Lọc chỉ các khoản thu nhập có category liên quan đến tiết kiệm
                        incomesToShow = financialData.incomes.filter(income => {
                            const categoryLower = income.category?.toLowerCase() || '';
                            const descriptionLower = income.description?.toLowerCase() || '';

                            return categoryLower.includes('tiết kiệm') ||
                                categoryLower.includes('saving') ||
                                categoryLower.includes('tiet kiem') ||
                                categoryLower === 'tiền tiết kiệm' ||
                                categoryLower === 'tien tiet kiem' ||
                                descriptionLower.includes('tiết kiệm') ||
                                descriptionLower.includes('saving') ||
                                descriptionLower.includes('tiet kiem');
                        });
                        totalIncomeToShow = incomesToShow.reduce((sum, income) => sum + income.amount, 0);
                        titleText = 'tiền tiết kiệm';

                        logger.info('Income savings filter debug', {
                            userId,
                            totalIncomes: financialData.incomes.length,
                            filteredSavings: incomesToShow.length,
                            totalSavingsAmount: totalIncomeToShow,
                            allIncomeCategories: financialData.incomes.map(i => i.category),
                            filteredCategories: incomesToShow.map(i => i.category)
                        });
                    }

                    response = `💰 **Tổng ${titleText} ${timeDescription}:** ${totalIncomeToShow.toLocaleString('vi-VN')} VND\n\n`;

                    if (incomesToShow.length > 0) {
                        response += `📊 **Chi tiết ${titleText}:**\n`;
                        incomesToShow.slice(0, 5).forEach((income, index) => {
                            const date = new Date(income.date).toLocaleDateString('vi-VN');
                            const category = income.category || 'Không có danh mục';
                            response += `${index + 1}. ${income.description || 'Thu nhập'}: ${income.amount.toLocaleString('vi-VN')} VND - ${category} (${date})\n`;
                        });

                        if (incomesToShow.length > 5) {
                            response += `\n... và ${incomesToShow.length - 5} khoản ${titleText} khác.`;
                            // Lưu context để xử lý yêu cầu xem chi tiết
                            this.conversationContext.set(userId, {
                                type: 'income',
                                data: incomesToShow,
                                timeFilter,
                                timeDescription,
                                timestamp: Date.now()
                            });
                            response += `\n\n💡 *Bạn có thể hỏi "xem chi tiết các khoản còn lại" để xem tất cả.*`;
                        }
                    } else {
                        if (isAskingAboutSavings) {
                            response += `Không có dữ liệu ${titleText} ${timeDescription}.\n\n`;
                            response += `💡 **Gợi ý:** Bạn có thể thêm tiết kiệm bằng cách:\n`;
                            response += `• Vào mục Thu nhập và chọn danh mục "Tiền tiết kiệm"\n`;
                            response += `• Hoặc nói với tôi: "Tôi tiết kiệm được 1 triệu hôm nay"`;
                        } else {
                            response += `Không có dữ liệu ${titleText} ${timeDescription}.`;
                        }
                    }
                    break;

                case 'expense':
                    const totalExpense = financialData.summary.totalExpenses;
                    response = `💸 **Tổng chi tiêu ${timeDescription}:** ${totalExpense.toLocaleString('vi-VN')} VND\n\n`;

                    if (financialData.expenses.length > 0) {
                        response += `📊 **Chi tiết chi tiêu:**\n`;
                        financialData.expenses.slice(0, 5).forEach((expense, index) => {
                            const date = new Date(expense.date).toLocaleDateString('vi-VN');
                            response += `${index + 1}. ${expense.description || 'Chi tiêu'}: ${expense.amount.toLocaleString('vi-VN')} VND (${date})\n`;
                        });

                        if (financialData.expenses.length > 5) {
                            response += `\n... và ${financialData.expenses.length - 5} khoản chi tiêu khác.`;
                            // Lưu context để xử lý yêu cầu xem chi tiết
                            this.conversationContext.set(userId, {
                                type: 'expense',
                                data: financialData.expenses,
                                timeFilter,
                                timeDescription,
                                timestamp: Date.now()
                            });
                            response += `\n\n💡 *Bạn có thể hỏi "xem chi tiết các khoản còn lại" để xem tất cả.*`;
                        }
                    } else {
                        response += `Không có dữ liệu chi tiêu ${timeDescription}.`;
                    }
                    break;

                case 'loan':
                    // Tính toán chi tiết cho tổng quan
                    let totalOriginalAmount = 0;
                    let totalPaidAmount = 0;
                    let totalRemainingAmount = 0;
                    let totalInterestAmount = 0;

                    financialData.loans.forEach(loan => {
                        const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                        const remainingAmount = Math.max(0, loan.amount - totalPaid);

                        totalOriginalAmount += loan.amount;
                        totalPaidAmount += totalPaid;
                        totalRemainingAmount += remainingAmount;

                        // Tính lãi cho khoản vay đang hoạt động
                        if (loan.startDate && loan.dueDate && loan.interestRate && loan.status?.toUpperCase() === 'ACTIVE') {
                            const startDate = new Date(loan.startDate);
                            const dueDate = new Date(loan.dueDate);
                            const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            let interestMultiplier = 0;
                            switch (loan.interestRateType) {
                                case 'DAY': interestMultiplier = diffDays; break;
                                case 'WEEK': interestMultiplier = diffDays / 7; break;
                                case 'MONTH': interestMultiplier = diffDays / 30; break;
                                case 'QUARTER': interestMultiplier = diffDays / 90; break;
                                case 'YEAR': interestMultiplier = diffDays / 365; break;
                            }
                            const interestAmount = Math.round(remainingAmount * (loan.interestRate / 100) * interestMultiplier);
                            totalInterestAmount += interestAmount;
                        }
                    });

                    const totalLoan = financialData.summary.totalLoans;
                    const activeLoans = financialData.summary.activeLoans;

                    response = `🏦 **Tổng quan khoản vay ${timeDescription}:**\n\n`;
                    response += `💰 **Tổng tiền gốc:** ${totalOriginalAmount.toLocaleString('vi-VN')} VND\n`;
                    response += `⏳ **Còn lại:** ${totalRemainingAmount.toLocaleString('vi-VN')} VND\n`;
                    response += `📈 **Tiền lãi:** ${totalInterestAmount.toLocaleString('vi-VN')} VND\n`;
                    response += `🔥 **Tổng phải trả:** ${(totalRemainingAmount + totalInterestAmount).toLocaleString('vi-VN')} VND\n`;
                    response += `📊 **Số khoản đang hoạt động:** ${activeLoans}/${financialData.loans.length}`;

                    if (financialData.loans.length === 0) {
                        response += `\n\nKhông có dữ liệu khoản vay ${timeDescription}.`;
                    }
                    break;

                case 'loan_paid':
                    // Lọc chỉ những khoản vay đã trả hết
                    const paidLoans = financialData.loans.filter(loan => {
                        const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                        const remainingAmount = Math.max(0, loan.amount - totalPaid);
                        return loan.status?.toUpperCase() === 'PAID' || remainingAmount === 0;
                    });

                    let totalPaidOriginalAmount = 0;
                    let totalPaidPaidAmount = 0;

                    paidLoans.forEach(loan => {
                        const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                        totalPaidOriginalAmount += loan.amount;
                        totalPaidPaidAmount += totalPaid;
                    });

                    response = `✅ **Khoản vay đã trả hết ${timeDescription}:**\n\n`;
                    response += `💰 **Tổng tiền gốc đã trả:** ${totalPaidOriginalAmount.toLocaleString('vi-VN')} VND\n`;
                    // Xóa dòng "Tổng số tiền đã thanh toán" khi số tiền = 0
                    if (totalPaidPaidAmount > 0) {
                        response += `✅ **Tổng số tiền đã thanh toán:** ${totalPaidPaidAmount.toLocaleString('vi-VN')} VND\n`;
                    }
                    response += `📊 **Số khoản đã hoàn thành:** ${paidLoans.length}/${financialData.loans.length}`;

                    if (paidLoans.length === 0) {
                        response += `\n\nKhông có khoản vay nào đã trả hết ${timeDescription}.\n\n`;
                        response += `💡 **Gợi ý:** Bạn có thể:\n`;
                        response += `• Hỏi "khoản vay của tôi" để xem tất cả khoản vay\n`;
                        response += `• Hỏi "nợ còn lại" để xem các khoản chưa trả hết`;
                    }
                    break;

                case 'loan_overdue':
                    // Lọc chỉ những khoản vay quá hạn - Cải thiện logic nhận diện
                    const today = new Date();
                    const overdueLoans = financialData.loans.filter(loan => {
                        // Kiểm tra trạng thái OVERDUE trực tiếp
                        if (loan.status?.toUpperCase() === 'OVERDUE') {
                            return true;
                        }

                        // Kiểm tra khoản vay ACTIVE nhưng đã quá hạn thanh toán
                        if (loan.status?.toUpperCase() === 'ACTIVE' && loan.dueDate) {
                            const dueDate = new Date(loan.dueDate);
                            return today > dueDate;
                        }

                        // Kiểm tra khoản vay không có trạng thái rõ ràng nhưng đã quá hạn
                        if (!loan.status && loan.dueDate) {
                            const dueDate = new Date(loan.dueDate);
                            return today > dueDate;
                        }

                        return false;
                    });

                    let totalOverdueOriginalAmount = 0;
                    let totalOverduePaidAmount = 0;
                    let totalOverdueRemainingAmount = 0;
                    let totalOverdueInterestAmount = 0;
                    let totalOverduePenalty = 0; // Thêm phí phạt quá hạn

                    const overdueDetails = overdueLoans.map(loan => {
                        const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                        const remainingAmount = Math.max(0, loan.amount - totalPaid);

                        // Tính số ngày quá hạn
                        const dueDate = new Date(loan.dueDate);
                        const overdueDays = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

                        totalOverdueOriginalAmount += (loan.amount || 0);
                        totalOverduePaidAmount += totalPaid;
                        totalOverdueRemainingAmount += remainingAmount;

                        let interestAmount = 0;
                        let penaltyAmount = 0;

                        // Tính lãi cho khoản vay quá hạn
                        if (loan.startDate && loan.dueDate && loan.interestRate) {
                            const startDate = new Date(loan.startDate);
                            const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            let interestMultiplier = 0;
                            switch (loan.interestRateType) {
                                case 'DAY': interestMultiplier = diffDays; break;
                                case 'WEEK': interestMultiplier = diffDays / 7; break;
                                case 'MONTH': interestMultiplier = diffDays / 30; break;
                                case 'QUARTER': interestMultiplier = diffDays / 90; break;
                                case 'YEAR': interestMultiplier = diffDays / 365; break;
                            }
                            interestAmount = Math.round(remainingAmount * (loan.interestRate / 100) * interestMultiplier);
                            totalOverdueInterestAmount += interestAmount;
                        }

                        // Tính phí phạt quá hạn (giả sử 0.1% mỗi ngày quá hạn)
                        if (overdueDays > 0) {
                            penaltyAmount = Math.round(remainingAmount * 0.001 * overdueDays);
                            totalOverduePenalty += penaltyAmount;
                        }

                        return {
                            ...loan,
                            amount: loan.amount || 0,
                            remainingAmount,
                            interestAmount,
                            penaltyAmount,
                            overdueDays,
                            totalWithInterestAndPenalty: remainingAmount + interestAmount + penaltyAmount
                        };
                    });

                    response = `🚨 **Khoản vay quá hạn ${timeDescription}:**\n\n`;
                    response += `💰 **Tổng tiền gốc:** ${totalOverdueOriginalAmount.toLocaleString('vi-VN')} VND\n`;
                    response += `⏳ **Còn lại:** ${totalOverdueRemainingAmount.toLocaleString('vi-VN')} VND\n`;
                    response += `📈 **Tiền lãi:** ${totalOverdueInterestAmount.toLocaleString('vi-VN')} VND\n`;
                    response += `⚠️ **Phí phạt:** ${totalOverduePenalty.toLocaleString('vi-VN')} VND\n`;
                    response += `🔥 **Tổng cần trả:** ${(totalOverdueRemainingAmount + totalOverdueInterestAmount + totalOverduePenalty).toLocaleString('vi-VN')} VND\n`;
                    response += `📊 **Số khoản quá hạn:** ${overdueLoans.length}/${financialData.loans.length}`;

                    if (overdueLoans.length === 0) {
                        response += `\n\n🎉 **Tuyệt vời!** Bạn không có khoản vay nào quá hạn ${timeDescription}.\n\n`;
                        response += `💡 **Gợi ý:** Bạn có thể:\n`;
                        response += `• Hỏi "khoản vay của tôi" để xem tất cả khoản vay\n`;
                        response += `• Hỏi "nợ còn lại" để xem các khoản chưa trả hết`;
                    } else {
                        response += `\n\n📋 **Chi tiết các khoản quá hạn:**\n`;
                        overdueDetails.slice(0, 5).forEach((loan, index) => {
                            const description = loan.description || loan.purpose || 'Khoản vay';
                            const amount = loan.amount || 0;
                            const remainingAmount = loan.remainingAmount || 0;
                            const interestAmount = loan.interestAmount || 0;
                            const penaltyAmount = loan.penaltyAmount || 0;
                            const overdueDays = loan.overdueDays || 0;
                            const totalWithInterestAndPenalty = loan.totalWithInterestAndPenalty || 0;

                            response += `${index + 1}. **${description}** - 🚨 Quá hạn ${overdueDays} ngày\n`;
                            response += `   💰 Gốc: ${amount.toLocaleString('vi-VN')} VND\n`;
                            response += `   ⏳ Còn lại: ${remainingAmount.toLocaleString('vi-VN')} VND`;
                            if (interestAmount > 0) {
                                response += ` | 📈 Lãi: ${interestAmount.toLocaleString('vi-VN')} VND`;
                            }
                            if (penaltyAmount > 0) {
                                response += ` | ⚠️ Phạt: ${penaltyAmount.toLocaleString('vi-VN')} VND`;
                            }
                            response += `\n   🔥 Tổng: ${totalWithInterestAndPenalty.toLocaleString('vi-VN')} VND\n\n`;
                        });

                        if (overdueLoans.length > 5) {
                            response += `... và ${overdueLoans.length - 5} khoản quá hạn khác.\n\n`;
                            // Lưu context để xử lý yêu cầu xem chi tiết
                            this.conversationContext.set(userId, {
                                type: 'loan_overdue',
                                data: overdueDetails,
                                timeFilter,
                                timeDescription,
                                timestamp: Date.now()
                            });
                            response += `💡 *Bạn có thể hỏi "xem chi tiết các khoản còn lại" để xem tất cả.*\n\n`;
                        }

                        response += `⚠️ **Cảnh báo:** Bạn có ${overdueLoans.length} khoản vay quá hạn cần ưu tiên thanh toán ngay!\n`;
                        response += `💡 **Khuyến nghị:** Hãy liên hệ với người cho vay để thỏa thuận kế hoạch thanh toán.`;
                    }
                    break;

                case 'loan_remaining':
                    // Lọc chỉ những khoản vay còn lại chưa trả hết
                    const remainingLoans = financialData.loans.filter(loan => {
                        const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                        const remainingAmount = Math.max(0, loan.amount - totalPaid);
                        return loan.status?.toUpperCase() === 'ACTIVE' && remainingAmount > 0;
                    });

                    let totalRemainingOriginalAmount = 0;
                    let totalRemainingPaidAmount = 0;
                    let totalRemainingRemainingAmount = 0;
                    let totalRemainingInterestAmount = 0;

                    remainingLoans.forEach(loan => {
                        const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                        const remainingAmount = Math.max(0, loan.amount - totalPaid);

                        totalRemainingOriginalAmount += loan.amount;
                        totalRemainingPaidAmount += totalPaid;
                        totalRemainingRemainingAmount += remainingAmount;

                        // Tính lãi cho khoản vay đang hoạt động
                        if (loan.startDate && loan.dueDate && loan.interestRate) {
                            const startDate = new Date(loan.startDate);
                            const dueDate = new Date(loan.dueDate);
                            const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            let interestMultiplier = 0;
                            switch (loan.interestRateType) {
                                case 'DAY': interestMultiplier = diffDays; break;
                                case 'WEEK': interestMultiplier = diffDays / 7; break;
                                case 'MONTH': interestMultiplier = diffDays / 30; break;
                                case 'QUARTER': interestMultiplier = diffDays / 90; break;
                                case 'YEAR': interestMultiplier = diffDays / 365; break;
                            }
                            const interestAmount = Math.round(remainingAmount * (loan.interestRate / 100) * interestMultiplier);
                            totalRemainingInterestAmount += interestAmount;
                        }
                    });

                    response = `⏳ **Khoản vay còn lại chưa trả hết ${timeDescription}:**\n\n`;
                    response += `💰 **Tổng tiền gốc:** ${totalRemainingOriginalAmount.toLocaleString('vi-VN')} VND\n`;
                    response += `⏳ **Còn lại:** ${totalRemainingRemainingAmount.toLocaleString('vi-VN')} VND\n`;
                    response += `📈 **Tiền lãi:** ${totalRemainingInterestAmount.toLocaleString('vi-VN')} VND\n`;
                    response += `🔥 **Tổng cần trả:** ${(totalRemainingRemainingAmount + totalRemainingInterestAmount).toLocaleString('vi-VN')} VND\n`;
                    response += `📊 **Số khoản chưa hoàn thành:** ${remainingLoans.length}/${financialData.loans.length}`;

                    if (remainingLoans.length === 0) {
                        response += `\n\n🎉 **Chúc mừng!** Bạn không có khoản vay nào chưa trả hết ${timeDescription}.\n\n`;
                        response += `💡 **Gợi ý:** Bạn có thể:\n`;
                        response += `• Hỏi "khoản vay của tôi" để xem tất cả khoản vay\n`;
                        response += `• Hỏi "nợ đã trả" để xem các khoản đã hoàn thành`;
                    }
                    break;

                case 'savings_income':
                    // Lọc chỉ các khoản thu nhập có category liên quan đến tiết kiệm
                    const savingsIncomes = financialData.incomes.filter(income => {
                        const categoryLower = income.category?.toLowerCase() || '';
                        const descriptionLower = income.description?.toLowerCase() || '';

                        return categoryLower.includes('tiết kiệm') ||
                            categoryLower.includes('saving') ||
                            categoryLower.includes('tiet kiem') ||
                            categoryLower === 'tiền tiết kiệm' ||
                            categoryLower === 'tien tiet kiem' ||
                            descriptionLower.includes('tiết kiệm') ||
                            descriptionLower.includes('saving') ||
                            descriptionLower.includes('tiet kiem');
                    });
                    const totalSavingsIncome = savingsIncomes.reduce((sum, income) => sum + income.amount, 0);

                    logger.info('Savings income query debug', {
                        userId,
                        savingsIncomesCount: savingsIncomes.length,
                        totalSavingsIncome,
                        timeDescription,
                        timeFilter,
                        allIncomeCategories: financialData.incomes.map(i => i.category),
                        filteredCategories: savingsIncomes.map(i => i.category)
                    });

                    response = `💰 **Tổng tiền tiết kiệm ${timeDescription}:** ${totalSavingsIncome.toLocaleString('vi-VN')} VND\n\n`;

                    if (savingsIncomes.length > 0) {
                        response += `📊 **Chi tiết tiền tiết kiệm:**\n`;
                        savingsIncomes.slice(0, 5).forEach((savings, index) => {
                            const date = new Date(savings.date).toLocaleDateString('vi-VN');
                            const category = savings.category || 'Tiết kiệm';
                            response += `${index + 1}. ${savings.description || 'Tiết kiệm'}: ${savings.amount.toLocaleString('vi-VN')} VND - ${category} (${date})\n`;
                        });

                        if (savingsIncomes.length > 5) {
                            response += `\n... và ${savingsIncomes.length - 5} khoản tiết kiệm khác.`;
                            // Lưu context để xử lý yêu cầu xem chi tiết
                            this.conversationContext.set(userId, {
                                type: 'savings_income',
                                data: savingsIncomes,
                                timeFilter,
                                timeDescription,
                                timestamp: Date.now()
                            });
                            response += `\n\n💡 *Bạn có thể hỏi "xem chi tiết các khoản còn lại" để xem tất cả.*`;
                        }
                    } else {
                        response += `Không có dữ liệu tiền tiết kiệm ${timeDescription}.\n\n`;
                        response += `💡 **Gợi ý:** Bạn có thể thêm tiết kiệm bằng cách:\n`;
                        response += `• Vào mục Thu nhập và chọn danh mục "Tiền tiết kiệm"\n`;
                        response += `• Hoặc nói với tôi: "Tôi tiết kiệm được 1 triệu hôm nay"`;
                    }
                    break;

                case 'savings':
                    // Lọc chỉ các khoản đầu tư loại savings
                    const savingsInvestments = financialData.investments.filter(inv => inv.type === 'savings');
                    const totalSavings = savingsInvestments.reduce((sum, inv) => sum + (inv.initialInvestment || 0), 0);

                    logger.info('Savings query debug', {
                        userId,
                        savingsCount: savingsInvestments.length,
                        totalSavings,
                        timeDescription,
                        timeFilter
                    });

                    response = `💰 **Tổng tiết kiệm ngân hàng ${timeDescription}:** ${totalSavings.toLocaleString('vi-VN')} VND\n\n`;

                    if (savingsInvestments.length > 0) {
                        response += `🏦 **Chi tiết tiết kiệm:**\n`;
                        savingsInvestments.slice(0, 5).forEach((savings, index) => {
                            const date = new Date(savings.createdAt).toLocaleDateString('vi-VN');
                            const bankName = savings.bankName || 'Ngân hàng';
                            const amount = savings.initialInvestment || 0;
                            response += `${index + 1}. ${savings.name || 'Tiết kiệm'}: ${amount.toLocaleString('vi-VN')} VND - ${bankName} (${date})\n`;
                        });

                        if (savingsInvestments.length > 5) {
                            response += `\n... và ${savingsInvestments.length - 5} khoản tiết kiệm khác.`;
                            // Lưu context để xử lý yêu cầu xem chi tiết
                            this.conversationContext.set(userId, {
                                type: 'savings',
                                data: savingsInvestments,
                                timeFilter,
                                timeDescription,
                                timestamp: Date.now()
                            });
                            response += `\n\n💡 *Bạn có thể hỏi "xem chi tiết các khoản còn lại" để xem tất cả.*`;
                        }
                    } else {
                        response += `Không có dữ liệu tiết kiệm ngân hàng ${timeDescription}.`;
                    }
                    break;

                case 'stock':
                    // Lọc chỉ các khoản đầu tư cổ phiếu
                    const stockInvestments = financialData.investments.filter(inv =>
                        inv.type === 'stock' || inv.type === 'stocks' ||
                        (inv.name && inv.name.toLowerCase().includes('cổ phiếu')) ||
                        (inv.name && inv.name.toLowerCase().includes('co phieu')) ||
                        (inv.name && inv.name.toLowerCase().includes('chứng khoán')) ||
                        (inv.name && inv.name.toLowerCase().includes('chung khoan'))
                    );
                    const totalStock = stockInvestments.reduce((sum, inv) => sum + (inv.initialInvestment || 0), 0);

                    logger.info('Stock query debug', {
                        userId,
                        stockCount: stockInvestments.length,
                        totalStock,
                        timeDescription,
                        timeFilter
                    });

                    response = `📈 **Tổng đầu tư cổ phiếu ${timeDescription}:** ${totalStock.toLocaleString('vi-VN')} VND\n\n`;

                    if (stockInvestments.length > 0) {
                        response += `📊 **Chi tiết đầu tư cổ phiếu:**\n`;
                        stockInvestments.slice(0, 5).forEach((stock, index) => {
                            const date = new Date(stock.createdAt).toLocaleDateString('vi-VN');
                            const amount = stock.initialInvestment || 0;
                            response += `${index + 1}. ${stock.name || 'Cổ phiếu'}: ${amount.toLocaleString('vi-VN')} VND (${date})\n`;
                        });

                        if (stockInvestments.length > 5) {
                            response += `\n... và ${stockInvestments.length - 5} khoản đầu tư cổ phiếu khác.`;
                            this.conversationContext.set(userId, {
                                type: 'stock',
                                data: stockInvestments,
                                timeFilter,
                                timeDescription,
                                timestamp: Date.now()
                            });
                            response += `\n\n💡 *Bạn có thể hỏi "xem chi tiết các khoản còn lại" để xem tất cả.*`;
                        }
                    } else {
                        response += `Không có dữ liệu đầu tư cổ phiếu ${timeDescription}.`;
                    }
                    break;

                case 'gold':
                    // Lọc chỉ các khoản đầu tư vàng
                    const goldInvestments = financialData.investments.filter(inv =>
                        inv.type === 'gold' ||
                        (inv.name && inv.name.toLowerCase().includes('vàng')) ||
                        (inv.name && inv.name.toLowerCase().includes('vang')) ||
                        (inv.name && inv.name.toLowerCase().includes('kim loại quý')) ||
                        (inv.name && inv.name.toLowerCase().includes('kim loai quy'))
                    );
                    const totalGold = goldInvestments.reduce((sum, inv) => sum + (inv.initialInvestment || 0), 0);

                    logger.info('Gold query debug', {
                        userId,
                        goldCount: goldInvestments.length,
                        totalGold,
                        timeDescription,
                        timeFilter
                    });

                    response = `🥇 **Tổng đầu tư vàng ${timeDescription}:** ${totalGold.toLocaleString('vi-VN')} VND\n\n`;

                    if (goldInvestments.length > 0) {
                        response += `📊 **Chi tiết đầu tư vàng:**\n`;
                        goldInvestments.slice(0, 5).forEach((gold, index) => {
                            const date = new Date(gold.createdAt).toLocaleDateString('vi-VN');
                            const amount = gold.initialInvestment || 0;
                            response += `${index + 1}. ${gold.name || 'Vàng'}: ${amount.toLocaleString('vi-VN')} VND (${date})\n`;
                        });

                        if (goldInvestments.length > 5) {
                            response += `\n... và ${goldInvestments.length - 5} khoản đầu tư vàng khác.`;
                            this.conversationContext.set(userId, {
                                type: 'gold',
                                data: goldInvestments,
                                timeFilter,
                                timeDescription,
                                timestamp: Date.now()
                            });
                            response += `\n\n💡 *Bạn có thể hỏi "xem chi tiết các khoản còn lại" để xem tất cả.*`;
                        }
                    } else {
                        response += `Không có dữ liệu đầu tư vàng ${timeDescription}.`;
                    }
                    break;

                case 'realestate':
                    // Lọc chỉ các khoản đầu tư bất động sản
                    const realestateInvestments = financialData.investments.filter(inv =>
                        inv.type === 'realestate' || inv.type === 'real_estate' ||
                        (inv.name && inv.name.toLowerCase().includes('đất đai')) ||
                        (inv.name && inv.name.toLowerCase().includes('dat dai')) ||
                        (inv.name && inv.name.toLowerCase().includes('bất động sản')) ||
                        (inv.name && inv.name.toLowerCase().includes('bat dong san')) ||
                        (inv.name && inv.name.toLowerCase().includes('đất')) ||
                        (inv.name && inv.name.toLowerCase().includes('dat')) ||
                        (inv.name && inv.name.toLowerCase().includes('nhà đất')) ||
                        (inv.name && inv.name.toLowerCase().includes('nha dat'))
                    );
                    const totalRealestate = realestateInvestments.reduce((sum, inv) => sum + (inv.initialInvestment || 0), 0);

                    logger.info('Real estate query debug', {
                        userId,
                        realestateCount: realestateInvestments.length,
                        totalRealestate,
                        timeDescription,
                        timeFilter
                    });

                    response = `🏡 **Tổng đầu tư đất đai ${timeDescription}:** ${totalRealestate.toLocaleString('vi-VN')} VND\n\n`;

                    if (realestateInvestments.length > 0) {
                        response += `📊 **Chi tiết đầu tư đất đai:**\n`;
                        realestateInvestments.slice(0, 5).forEach((realestate, index) => {
                            const date = new Date(realestate.createdAt).toLocaleDateString('vi-VN');
                            const amount = realestate.initialInvestment || 0;
                            response += `${index + 1}. ${realestate.name || 'Đất đai'}: ${amount.toLocaleString('vi-VN')} VND (${date})\n`;
                        });

                        if (realestateInvestments.length > 5) {
                            response += `\n... và ${realestateInvestments.length - 5} khoản đầu tư đất đai khác.`;
                            this.conversationContext.set(userId, {
                                type: 'realestate',
                                data: realestateInvestments,
                                timeFilter,
                                timeDescription,
                                timestamp: Date.now()
                            });
                            response += `\n\n💡 *Bạn có thể hỏi "xem chi tiết các khoản còn lại" để xem tất cả.*`;
                        }
                    } else {
                        response += `Không có dữ liệu đầu tư đất đai ${timeDescription}.`;
                    }
                    break;

                case 'investment':
                    // Lọc tất cả đầu tư trừ savings
                    const nonSavingsInvestments = financialData.investments.filter(inv => inv.type !== 'savings');
                    const totalInvestment = nonSavingsInvestments.reduce((sum, inv) => sum + (inv.initialInvestment || 0), 0);

                    logger.info('Investment query debug', {
                        userId,
                        investmentsCount: nonSavingsInvestments.length,
                        totalInvestment,
                        timeDescription,
                        timeFilter
                    });

                    response = `📈 **Tổng đầu tư ${timeDescription}:** ${totalInvestment.toLocaleString('vi-VN')} VND\n\n`;

                    if (nonSavingsInvestments.length > 0) {
                        response += `📊 **Chi tiết đầu tư:**\n`;
                        nonSavingsInvestments.slice(0, 5).forEach((investment, index) => {
                            const date = new Date(investment.createdAt).toLocaleDateString('vi-VN');
                            const type = investment.type || 'Không xác định';
                            const amount = investment.initialInvestment || 0;
                            response += `${index + 1}. ${investment.name || 'Đầu tư'}: ${amount.toLocaleString('vi-VN')} VND - ${type} (${date})\n`;
                        });

                        if (nonSavingsInvestments.length > 5) {
                            response += `\n... và ${nonSavingsInvestments.length - 5} khoản đầu tư khác.`;
                            // Lưu context để xử lý yêu cầu xem chi tiết
                            this.conversationContext.set(userId, {
                                type: 'investment',
                                data: nonSavingsInvestments,
                                timeFilter,
                                timeDescription,
                                timestamp: Date.now()
                            });
                            response += `\n\n💡 *Bạn có thể hỏi "xem chi tiết các khoản còn lại" để xem tất cả.*`;
                        }
                    } else {
                        response += `Không có dữ liệu đầu tư ${timeDescription}.`;
                    }
                    break;
            }

            return response;

        } catch (error) {
            logger.error(`Error handling ${category} query:`, {
                error: error.message,
                stack: error.stack,
                userId,
                category,
                message
            });
            const categoryNames = {
                'income': 'thu nhập',
                'expense': 'chi tiêu',
                'loan': 'khoản vay',
                'investment': 'đầu tư',
                'savings': 'tiết kiệm ngân hàng',
                'savings_income': 'tiền tiết kiệm',
                'stock': 'cổ phiếu',
                'gold': 'vàng',
                'realestate': 'đất đai'
            };
            return `Không thể truy vấn thông tin ${categoryNames[category] || category}. Vui lòng thử lại sau.`;
        }
    }

    /**
     * Xử lý truy vấn số dư và tổng quan tài chính
     */
    async handleBalanceQuery(userId, message) {
        try {
            // Phân tích từ khóa và thời gian
            const { timeFilter } = this.analyzeKeywordsAndTime(message);

            // Lấy dữ liệu tài chính với bộ lọc thời gian
            const financialData = await this.getUserFinancialData(userId, timeFilter);

            // Tính số dư
            const balance = financialData.summary.totalIncomes - financialData.summary.totalExpenses;

            // Tạo mô tả thời gian
            let timeDescription = '';
            if (timeFilter) {
                switch (timeFilter.type) {
                    case 'today':
                        timeDescription = 'hôm nay';
                        break;
                    case 'week':
                        timeDescription = 'tuần này';
                        break;
                    case 'current_month':
                        timeDescription = 'tháng này';
                        break;
                    case 'month':
                        const monthNames = ['', 'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
                            'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
                        timeDescription = `${monthNames[timeFilter.value]}${timeFilter.year ? ` năm ${timeFilter.year}` : ''}`;
                        break;
                    case 'year':
                        timeDescription = `năm ${timeFilter.value}`;
                        break;
                    default:
                        timeDescription = 'thời gian được chỉ định';
                }
            } else {
                timeDescription = 'tổng cộng';
            }

            // Tạo response với thông tin tổng quan
            let response = `💰 **Tổng quan tài chính ${timeDescription}:**\n\n`;

            response += `📊 **Số dư hiện tại:** ${balance.toLocaleString('vi-VN')} VND\n`;
            response += `${balance >= 0 ? '✅' : '⚠️'} ${balance >= 0 ? 'Tình hình tài chính tích cực' : 'Cần chú ý đến chi tiêu'}\n\n`;

            response += `📈 **Chi tiết:**\n`;
            response += `• Tổng thu nhập: ${financialData.summary.totalIncomes.toLocaleString('vi-VN')} VND\n`;
            response += `• Tổng chi tiêu: ${financialData.summary.totalExpenses.toLocaleString('vi-VN')} VND\n`;
            response += `• Tổng đầu tư: ${financialData.summary.totalInvestments.toLocaleString('vi-VN')} VND\n`;
            response += `• Tổng khoản vay: ${financialData.summary.totalLoans.toLocaleString('vi-VN')} VND\n\n`;

            response += `📋 **Thống kê:**\n`;
            response += `• Số giao dịch: ${financialData.summary.totalTransactions}\n`;
            response += `• Khoản vay đang hoạt động: ${financialData.summary.activeLoans}\n`;
            response += `• Ngân sách đang hoạt động: ${financialData.summary.activeBudgets}\n\n`;

            // Lưu context để có thể trả lời các câu hỏi tiếp theo
            this.conversationContext.set(userId, {
                type: 'balance',
                data: financialData,
                timeFilter,
                timeDescription,
                timestamp: Date.now()
            });

            response += `💡 *Bạn có thể hỏi thêm về thu nhập, chi tiêu, khoản vay hoặc đầu tư để xem chi tiết.*`;

            return response;

        } catch (error) {
            logger.error('Error handling balance query:', error);
            return 'Không thể truy vấn thông tin số dư. Vui lòng thử lại sau.';
        }
    }

    /**
     * Xử lý yêu cầu xem chi tiết các khoản còn lại
     */
    async handleDetailQuery(userId, message) {
        try {
            const context = this.conversationContext.get(userId);

            // Kiểm tra context có tồn tại và còn hợp lệ (trong vòng 10 phút)
            if (!context || (Date.now() - context.timestamp) > 10 * 60 * 1000) {
                return 'Tôi không tìm thấy cuộc hội thoại trước đó. Bạn có thể hỏi lại về thu nhập, chi tiêu, khoản vay hoặc đầu tư không?';
            }

            const { type, data, timeDescription } = context;
            const typeNames = {
                'income': 'thu nhập',
                'expense': 'chi tiêu',
                'loan': 'khoản vay',
                'loan_paid': 'khoản vay đã trả hết',
                'loan_overdue': 'khoản vay quá hạn',
                'loan_remaining': 'khoản vay chưa trả hết',
                'investment': 'đầu tư',
                'savings': 'tiết kiệm ngân hàng',
                'savings_income': 'tiền tiết kiệm',
                'stock': 'cổ phiếu',
                'gold': 'vàng',
                'realestate': 'đất đai'
            };

            const typeEmojis = {
                'income': '💰',
                'expense': '💸',
                'loan': '🏦',
                'loan_paid': '✅',
                'loan_overdue': '🚨',
                'loan_remaining': '⏳',
                'investment': '📈',
                'savings': '🏦',
                'stock': '📈',
                'gold': '🥇',
                'realestate': '🏡'
            };

            let response = `${typeEmojis[type]} **Chi tiết tất cả ${typeNames[type]} ${timeDescription}:**\n\n`;

            if (data.length > 0) {
                // Hiển thị từ khoản thứ 6 trở đi (vì đã hiển thị 5 khoản đầu)
                const remainingItems = data.slice(5);

                if (remainingItems.length > 0) {
                    response += `📊 **Các khoản ${typeNames[type]} còn lại:**\n`;

                    // Giới hạn hiển thị tối đa 15 khoản để tránh tin nhắn quá dài
                    const itemsToShow = remainingItems.slice(0, 15);

                    itemsToShow.forEach((item, index) => {
                        const date = new Date(item.date || item.createdAt).toLocaleDateString('vi-VN');

                        switch (type) {
                            case 'income':
                                response += `${index + 6}. ${item.description || 'Thu nhập'}: ${item.amount.toLocaleString('vi-VN')} VND (${date})\n`;
                                break;
                            case 'expense':
                                response += `${index + 6}. ${item.description || 'Chi tiêu'}: ${item.amount.toLocaleString('vi-VN')} VND (${date})\n`;
                                break;
                            case 'loan':
                                const status = item.status?.toUpperCase() === 'ACTIVE' ? '🟢 Đang hoạt động' : '🔴 Đã đóng';

                                // Tính toán chi tiết giống như frontend
                                const totalPaid = item.payments ? item.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                                const remainingAmount = Math.max(0, item.amount - totalPaid);

                                let interestAmount = 0;
                                if (item.startDate && item.dueDate && item.interestRate && item.status?.toUpperCase() === 'ACTIVE') {
                                    const startDate = new Date(item.startDate);
                                    const dueDate = new Date(item.dueDate);
                                    const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    let interestMultiplier = 0;
                                    switch (item.interestRateType) {
                                        case 'DAY': interestMultiplier = diffDays; break;
                                        case 'WEEK': interestMultiplier = diffDays / 7; break;
                                        case 'MONTH': interestMultiplier = diffDays / 30; break;
                                        case 'QUARTER': interestMultiplier = diffDays / 90; break;
                                        case 'YEAR': interestMultiplier = diffDays / 365; break;
                                    }
                                    interestAmount = Math.round(remainingAmount * (item.interestRate / 100) * interestMultiplier);
                                }

                                const totalWithInterest = remainingAmount + interestAmount;

                                response += `${index + 6}. **${item.description || 'Khoản vay'}** - ${status}\n`;
                                response += `   💰 Gốc: ${item.amount.toLocaleString('vi-VN')} VND\n`;
                                response += `   ⏳ Còn lại: ${remainingAmount.toLocaleString('vi-VN')} VND`;
                                if (interestAmount > 0) {
                                    response += ` | 📈 Lãi: ${interestAmount.toLocaleString('vi-VN')} VND`;
                                }
                                response += `\n   🔥 **Tổng phải trả: ${totalWithInterest.toLocaleString('vi-VN')} VND** (${date})\n\n`;
                                break;
                            case 'loan_paid':
                                const totalPaidAmount = item.payments ? item.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;

                                response += `${index + 6}. **${item.description || 'Khoản vay'}** - 🔴 Đã hoàn thành\n`;
                                response += `   💰 Tiền gốc: ${item.amount.toLocaleString('vi-VN')} VND\n`;
                                response += `   ✅ Đã thanh toán: ${totalPaidAmount.toLocaleString('vi-VN')} VND\n`;
                                response += `   📅 Ngày tạo: ${date}\n\n`;
                                break;
                            case 'loan_remaining':
                                const totalPaidRemaining = item.payments ? item.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                                const remainingAmountRemaining = Math.max(0, item.amount - totalPaidRemaining);

                                let interestAmountRemaining = 0;
                                if (item.startDate && item.dueDate && item.interestRate) {
                                    const startDate = new Date(item.startDate);
                                    const dueDate = new Date(item.dueDate);
                                    const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    let interestMultiplier = 0;
                                    switch (item.interestRateType) {
                                        case 'DAY': interestMultiplier = diffDays; break;
                                        case 'WEEK': interestMultiplier = diffDays / 7; break;
                                        case 'MONTH': interestMultiplier = diffDays / 30; break;
                                        case 'QUARTER': interestMultiplier = diffDays / 90; break;
                                        case 'YEAR': interestMultiplier = diffDays / 365; break;
                                    }
                                    interestAmountRemaining = Math.round(remainingAmountRemaining * (item.interestRate / 100) * interestMultiplier);
                                }

                                const totalWithInterestRemaining = remainingAmountRemaining + interestAmountRemaining;

                                response += `${index + 6}. **${item.description || 'Khoản vay'}** - 🟢 Chưa hoàn thành\n`;
                                response += `   💰 Gốc: ${item.amount.toLocaleString('vi-VN')} VND\n`;
                                response += `   ⏳ Còn lại: ${remainingAmountRemaining.toLocaleString('vi-VN')} VND`;
                                if (interestAmountRemaining > 0) {
                                    response += ` | 📈 Lãi: ${interestAmountRemaining.toLocaleString('vi-VN')} VND`;
                                }
                                response += `\n   🔥 **Cần trả: ${totalWithInterestRemaining.toLocaleString('vi-VN')} VND** (${date})\n\n`;
                                break;
                            case 'loan_overdue':
                                const totalPaidOverdue = item.payments ? item.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                                const remainingAmountOverdue = Math.max(0, item.amount - totalPaidOverdue);

                                let interestAmountOverdue = 0;
                                if (item.startDate && item.dueDate && item.interestRate) {
                                    const startDate = new Date(item.startDate);
                                    const dueDate = new Date(item.dueDate);
                                    const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    let interestMultiplier = 0;
                                    switch (item.interestRateType) {
                                        case 'DAY': interestMultiplier = diffDays; break;
                                        case 'WEEK': interestMultiplier = diffDays / 7; break;
                                        case 'MONTH': interestMultiplier = diffDays / 30; break;
                                        case 'QUARTER': interestMultiplier = diffDays / 90; break;
                                        case 'YEAR': interestMultiplier = diffDays / 365; break;
                                    }
                                    interestAmountOverdue = Math.round(remainingAmountOverdue * (item.interestRate / 100) * interestMultiplier);
                                }

                                const totalWithInterestOverdue = remainingAmountOverdue + interestAmountOverdue;
                                const today = new Date();
                                const dueDate = new Date(item.dueDate);
                                const overdueDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                                response += `${index + 6}. **${item.description || 'Khoản vay'}** - 🚨 Quá hạn ${overdueDays} ngày\n`;
                                response += `   💰 Gốc: ${item.amount.toLocaleString('vi-VN')} VND\n`;
                                response += `   ⏳ Còn lại: ${remainingAmountOverdue.toLocaleString('vi-VN')} VND`;
                                if (interestAmountOverdue > 0) {
                                    response += ` | 📈 Lãi: ${interestAmountOverdue.toLocaleString('vi-VN')} VND`;
                                }
                                response += `\n   🔥 **Cần trả gấp: ${totalWithInterestOverdue.toLocaleString('vi-VN')} VND** (${date})\n\n`;
                                break;
                            case 'investment':
                                const investmentType = item.type || 'Không xác định';
                                const investmentAmount = item.initialInvestment || 0;
                                response += `${index + 6}. ${item.name || 'Đầu tư'}: ${investmentAmount.toLocaleString('vi-VN')} VND - ${investmentType} (${date})\n`;
                                break;
                            case 'savings':
                                const bankName = item.bankName || 'Ngân hàng';
                                const savingsAmount = item.initialInvestment || 0;
                                response += `${index + 6}. ${item.name || 'Tiết kiệm'}: ${savingsAmount.toLocaleString('vi-VN')} VND - ${bankName} (${date})\n`;
                                break;
                            case 'stock':
                                const stockAmount = item.initialInvestment || 0;
                                response += `${index + 6}. ${item.name || 'Cổ phiếu'}: ${stockAmount.toLocaleString('vi-VN')} VND (${date})\n`;
                                break;
                            case 'gold':
                                const goldAmount = item.initialInvestment || 0;
                                response += `${index + 6}. ${item.name || 'Vàng'}: ${goldAmount.toLocaleString('vi-VN')} VND (${date})\n`;
                                break;
                            case 'realestate':
                                const realestateAmount = item.initialInvestment || 0;
                                response += `${index + 6}. ${item.name || 'Đất đai'}: ${realestateAmount.toLocaleString('vi-VN')} VND (${date})\n`;
                                break;
                        }
                    });

                    if (remainingItems.length > 15) {
                        response += `\n... và ${remainingItems.length - 15} khoản ${typeNames[type]} khác nữa.`;
                    }

                    response += `\n\n📈 **Tổng cộng:** ${data.length} khoản ${typeNames[type]}`;

                    // Tính tổng số tiền khác nhau cho từng loại
                    let totalAmount = 0;
                    if (type === 'loan' || type === 'loan_remaining' || type === 'loan_overdue') {
                        // Tính tổng khoản vay bao gồm lãi (cho loan, loan_remaining và loan_overdue)
                        totalAmount = data.reduce((sum, item) => {
                            const totalPaid = item.payments ? item.payments.reduce((s, payment) => s + payment.amount, 0) : 0;
                            const remainingAmount = Math.max(0, item.amount - totalPaid);

                            let totalWithInterest = remainingAmount;
                            if (item.startDate && item.dueDate && item.interestRate && item.status?.toUpperCase() === 'ACTIVE') {
                                const startDate = new Date(item.startDate);
                                const dueDate = new Date(item.dueDate);
                                const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                let interestMultiplier = 0;
                                switch (item.interestRateType) {
                                    case 'DAY': interestMultiplier = diffDays; break;
                                    case 'WEEK': interestMultiplier = diffDays / 7; break;
                                    case 'MONTH': interestMultiplier = diffDays / 30; break;
                                    case 'QUARTER': interestMultiplier = diffDays / 90; break;
                                    case 'YEAR': interestMultiplier = diffDays / 365; break;
                                }
                                const interestAmount = Math.round(remainingAmount * (item.interestRate / 100) * interestMultiplier);
                                totalWithInterest = remainingAmount + interestAmount;
                            }
                            return sum + totalWithInterest;
                        }, 0);
                    } else if (type === 'loan_paid') {
                        // Tính tổng số tiền đã thanh toán cho khoản vay đã trả hết
                        totalAmount = data.reduce((sum, item) => {
                            const totalPaid = item.payments ? item.payments.reduce((s, payment) => s + payment.amount, 0) : 0;
                            return sum + totalPaid;
                        }, 0);
                    } else if (type === 'investment' || type === 'savings' || type === 'stock' || type === 'gold' || type === 'realestate') {
                        // Tính tổng đầu tư, tiết kiệm, cổ phiếu, vàng hoặc đất đai
                        totalAmount = data.reduce((sum, item) => sum + (item.initialInvestment || 0), 0);
                    } else {
                        // Cho các loại khác, tính tổng bình thường
                        totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
                    }

                    response += `\n💰 **Tổng số tiền:** ${totalAmount.toLocaleString('vi-VN')} VND`;
                } else {
                    response += `Không có khoản ${typeNames[type]} nào khác.`;
                }
            } else {
                response += `Không có dữ liệu ${typeNames[type]} ${timeDescription}.`;
            }

            // Xóa context sau khi sử dụng
            this.conversationContext.delete(userId);

            return response;

        } catch (error) {
            logger.error('Error handling detail query:', error);
            return 'Không thể hiển thị chi tiết. Vui lòng thử lại sau.';
        }
    }

    /**
     * Truy vấn thông tin tài chính
     */
    async handleQueryFinances(userId, message) {
        try {
            const financialData = await this.getUserFinancialData(userId);

            const queryPrompt = `
Dựa trên dữ liệu tài chính và câu hỏi: "${message}"

Dữ liệu hiện tại:
- Tổng thu nhập: ${financialData.summary.totalIncomes.toLocaleString('vi-VN')} VND
- Tổng chi tiêu: ${financialData.summary.totalExpenses.toLocaleString('vi-VN')} VND
- Số dư hiện tại: ${(financialData.summary.totalIncomes - financialData.summary.totalExpenses).toLocaleString('vi-VN')} VND

Hãy trả lời câu hỏi một cách chính xác và hữu ích.`;

            const response = await this.callGeminiAI(queryPrompt);
            return response;

        } catch (error) {
            logger.error('Error querying finances:', error);
            return 'Không thể truy vấn thông tin tài chính. Vui lòng thử lại sau.';
        }
    }

    /**
     * 🧮 Xử lý tính toán thông thường (General Calculation)
     */
    async handleGeneralCalculation(userId, message) {
        try {
            logger.info('Processing general calculation', { userId, message });

            const result = await this.calculationCoordinator.processCalculation(message, 'general');

            return result;

        } catch (error) {
            logger.error('Error handling general calculation:', error);
            return `❌ **Lỗi tính toán thông thường**

🔄 **Vui lòng thử lại hoặc:**
• Kiểm tra cú pháp của biểu thức toán học
• Sử dụng các phép tính được hỗ trợ

💡 **Ví dụ:**
• "2 + 3 = ?"
• "15% của 1 triệu"
• "lãi suất 5% của 10 triệu trong 12 tháng"`;
        }
    }

    /**
     * 💰 Xử lý tính toán tài chính (Financial Calculation)
     */
    async handleFinancialCalculation(userId, message) {
        try {
            logger.info('Processing financial calculation', { userId, message });

            // Lấy dữ liệu tài chính hiện tại
            const financialData = await this.getUserFinancialData(userId);

            const result = await this.calculationCoordinator.processCalculation(message, 'financial', financialData);

            return result;

        } catch (error) {
            logger.error('Error handling financial calculation:', error);
            return `❌ **Lỗi tính toán tài chính**

🔄 **Vui lòng thử lại hoặc:**
• Đảm bảo có đủ dữ liệu tài chính
• Nói rõ hơn về số tiền cần tính toán

💡 **Ví dụ:**
• "Tôi có thể chi 4tr được không?"
• "Nếu tôi chi 2 triệu thì còn bao nhiêu?"
• "Số dư của tôi"`;
        }
    }

    /**
     * Xử lý câu hỏi suy luận và tính toán (Legacy)
     */
    async handleCalculationQuery(userId, message) {
        try {
            const financialData = await this.getUserFinancialData(userId);

            const calculationPrompt = `
Bạn là một chuyên gia tài chính với khả năng tính toán và phân tích. Hãy trả lời câu hỏi: "${message}"

Dữ liệu tài chính hiện tại:
- Tổng thu nhập: ${financialData.summary.totalIncomes.toLocaleString('vi-VN')} VND
- Tổng chi tiêu: ${financialData.summary.totalExpenses.toLocaleString('vi-VN')} VND
- Số dư hiện tại: ${(financialData.summary.totalIncomes - financialData.summary.totalExpenses).toLocaleString('vi-VN')} VND
- Tổng đầu tư: ${financialData.summary.totalInvestments.toLocaleString('vi-VN')} VND
- Tổng khoản vay: ${financialData.summary.totalLoans.toLocaleString('vi-VN')} VND

Hãy thực hiện các tính toán cần thiết như:
- Tính lãi suất đơn/kép
- Dự đoán tài chính
- Lập kế hoạch tiết kiệm
- So sánh các phương án đầu tư
- Tính toán khả năng trả nợ
- Phân tích tỷ lệ thu chi

Đưa ra kết quả tính toán chi tiết và giải thích rõ ràng.`;

            const calculation = await this.callGeminiAI(calculationPrompt);
            return `🧮 **Kết quả tính toán:**\n\n${calculation}`;

        } catch (error) {
            logger.error('Error handling calculation query:', error);
            return 'Không thể thực hiện tính toán lúc này. Vui lòng thử lại sau.';
        }
    }

    /**
     * Đưa ra lời khuyên tài chính
     */
    async handleFinancialAdvice(userId, message) {
        try {
            const financialData = await this.getUserFinancialData(userId);

            const advicePrompt = `
Với tư cách là cố vấn tài chính chuyên nghiệp, hãy đưa ra lời khuyên cho câu hỏi: "${message}"

Thông tin tài chính hiện tại:
- Thu nhập: ${financialData.summary.totalIncomes.toLocaleString('vi-VN')} VND
- Chi tiêu: ${financialData.summary.totalExpenses.toLocaleString('vi-VN')} VND
- Đầu tư: ${financialData.summary.totalInvestments.toLocaleString('vi-VN')} VND

Hãy đưa ra lời khuyên thực tế, có thể thực hiện được.`;

            const advice = await this.callGeminiAI(advicePrompt);
            return `💡 **Lời khuyên tài chính:**\n\n${advice}`;

        } catch (error) {
            logger.error('Error providing financial advice:', error);
            return 'Không thể đưa ra lời khuyên lúc này. Vui lòng thử lại sau.';
        }
    }

    /**
     * Xử lý calculation query với Gemini AI
     */
    async handleCalculationQuery(userId, message) {
        try {
            // Lấy dữ liệu tài chính hiện tại
            const financialData = await this.getUserFinancialData(userId);

            // Tính số dư hiện tại
            const currentBalance = financialData.summary.totalIncomes - financialData.summary.totalExpenses;
            const totalSavings = financialData.incomes
                .filter(income => {
                    const categoryLower = income.category?.toLowerCase() || '';
                    return categoryLower.includes('tiết kiệm') || categoryLower === 'tiền tiết kiệm';
                })
                .reduce((sum, income) => sum + income.amount, 0);

            logger.info('Calculation query with financial data', {
                userId,
                message,
                currentBalance,
                totalSavings,
                totalIncomes: financialData.summary.totalIncomes,
                totalExpenses: financialData.summary.totalExpenses
            });

            // Sử dụng Gemini AI để phân tích và tính toán
            const calculationPrompt = `
Bạn là một chuyên gia tài chính. Hãy phân tích câu hỏi sau và thực hiện tính toán:

**Câu hỏi:** "${message}"

**Dữ liệu tài chính hiện tại:**
- Tổng thu nhập: ${financialData.summary.totalIncomes.toLocaleString('vi-VN')} VND
- Tổng chi tiêu: ${financialData.summary.totalExpenses.toLocaleString('vi-VN')} VND
- Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} VND
- Tiền tiết kiệm: ${totalSavings.toLocaleString('vi-VN')} VND

**Nhiệm vụ:**
1. Trích xuất số tiền từ câu hỏi (VD: "4tr" = 4,000,000 VND)
2. Xác định loại tính toán (chi tiêu từ số dư, từ tiết kiệm, etc.)
3. Thực hiện tính toán chính xác
4. Đưa ra lời khuyên tài chính

**Quy tắc chuyển đổi:**
- "k", "nghìn" = x1,000
- "tr", "triệu", "m" = x1,000,000
- "4tr" = 4,000,000 VND

**Format trả về:**
🧮 **Tính toán tài chính:**

💰 **Số dư hiện tại:** [số dư] VND
💸 **Số tiền dự định chi:** [số tiền] VND
📊 **Số dư còn lại:** [kết quả] VND

[✅ Kết quả tích cực hoặc ❌ Cảnh báo]
💡 **Lời khuyên:** [lời khuyên cụ thể]

Hãy trả lời bằng tiếng Việt và sử dụng format trên.`;

            const geminiResponse = await this.callGeminiAI(calculationPrompt);

            logger.info('Gemini calculation response', {
                userId,
                message,
                responseLength: geminiResponse.length
            });

            return geminiResponse;

        } catch (error) {
            logger.error('Error handling calculation query:', error);

            // Fallback to simple calculation
            try {
                const financialData = await this.getUserFinancialData(userId);
                const currentBalance = financialData.summary.totalIncomes - financialData.summary.totalExpenses;

                // Simple amount extraction
                const amountMatch = message.match(/(\d+(?:\.\d+)?)\s*(k|nghìn|triệu|tr|m)/i);
                if (amountMatch) {
                    const number = parseFloat(amountMatch[1]);
                    const unit = amountMatch[2].toLowerCase();
                    let amount = 0;

                    switch (unit) {
                        case 'k':
                        case 'nghìn':
                            amount = number * 1000;
                            break;
                        case 'triệu':
                        case 'tr':
                        case 'm':
                            amount = number * 1000000;
                            break;
                    }

                    const remainingBalance = currentBalance - amount;

                    return `🧮 **Tính toán tài chính:**

💰 **Số dư hiện tại:** ${currentBalance.toLocaleString('vi-VN')} VND
💸 **Số tiền dự định chi:** ${amount.toLocaleString('vi-VN')} VND
📊 **Số dư còn lại:** ${remainingBalance.toLocaleString('vi-VN')} VND

${remainingBalance >= 0 ? '✅ **Kết quả:** Bạn có thể chi tiêu số tiền này!' : '❌ **Cảnh báo:** Bạn không đủ tiền!'}
💡 **Lời khuyên:** ${remainingBalance >= 0 ? `Sau khi chi tiêu, bạn sẽ còn ${remainingBalance.toLocaleString('vi-VN')} VND.` : `Bạn thiếu ${Math.abs(remainingBalance).toLocaleString('vi-VN')} VND.`}`;
                }
            } catch (fallbackError) {
                logger.error('Fallback calculation also failed:', fallbackError);
            }

            return 'Không thể thực hiện tính toán. Vui lòng nói rõ hơn như: "Nếu tôi chi 500k thì còn bao nhiều tiền?"';
        }
    }

    /**
     * Xử lý xác nhận category
     */
    async handleCategoryConfirmation(userId, message, context) {
        try {
            const { transactionData, forceType, sessionId } = context;
            const normalizedMessage = message.toLowerCase().trim();

            logger.info('Category confirmation received', {
                userId,
                message,
                suggestedCategories: transactionData.suggestedCategories,
                transactionData
            });

            // Kiểm tra nếu user chọn số thứ tự
            const numberMatch = normalizedMessage.match(/^(\d+)$/);
            if (numberMatch) {
                const index = parseInt(numberMatch[1]) - 1;
                if (index >= 0 && index < transactionData.suggestedCategories.length) {
                    transactionData.category = transactionData.suggestedCategories[index];
                    logger.info('Category selected by number', {
                        userId,
                        selectedIndex: index,
                        selectedCategory: transactionData.category
                    });
                } else {
                    return 'Số thứ tự không hợp lệ. Vui lòng chọn lại hoặc nói tên danh mục.';
                }
            } else {
                // Kiểm tra nếu user nói tên category - cải thiện logic matching
                let selectedCategory = null;

                // Tìm kiếm chính xác trước
                selectedCategory = transactionData.suggestedCategories.find(cat =>
                    normalizedMessage === cat.toLowerCase() ||
                    normalizedMessage.includes(cat.toLowerCase()) ||
                    cat.toLowerCase().includes(normalizedMessage)
                );

                // Nếu không tìm thấy, thử tìm kiếm mờ
                if (!selectedCategory) {
                    selectedCategory = transactionData.suggestedCategories.find(cat => {
                        const catWords = cat.toLowerCase().split(' ');
                        const messageWords = normalizedMessage.split(' ');

                        // Kiểm tra nếu có từ nào khớp
                        return catWords.some(catWord =>
                            messageWords.some(msgWord =>
                                catWord.includes(msgWord) || msgWord.includes(catWord)
                            )
                        );
                    });
                }

                if (selectedCategory) {
                    transactionData.category = selectedCategory;
                    logger.info('Category selected by name', {
                        userId,
                        selectedCategory: transactionData.category,
                        originalMessage: message
                    });
                } else {
                    // Nếu vẫn không tìm thấy, sử dụng category đầu tiên làm mặc định
                    transactionData.category = transactionData.suggestedCategories[0];
                    logger.info('Using default category (no match found)', {
                        userId,
                        defaultCategory: transactionData.category,
                        originalMessage: message,
                        suggestedCategories: transactionData.suggestedCategories
                    });
                }
            }

            // Xóa context để tránh loop
            this.conversationContext.delete(userId);

            // Xóa needsCategoryConfirmation để tránh loop
            transactionData.needsCategoryConfirmation = false;

            // Gọi trực tiếp API để lưu transaction thay vì gọi lại handleInsertTransaction
            const apiEndpoint = this.getApiEndpoint(transactionData.type);
            // Thêm userId vào transactionData
            transactionData.userId = userId;
            const response = await this.callTransactionAPI(apiEndpoint, transactionData, sessionId);

            if (response.success) {
                return `✅ **Đã lưu thành công!**

💰 **Số tiền:** ${transactionData.amount.toLocaleString('vi-VN')} VND
📝 **Ghi chú:** ${transactionData.note}
📂 **Danh mục:** ${transactionData.category}
📅 **Ngày:** ${new Date(transactionData.date).toLocaleDateString('vi-VN')}

Giao dịch đã được thêm vào hệ thống.`;
            } else {
                return `❌ **Lỗi khi lưu:** ${response.message || 'Không thể lưu giao dịch'}`;
            }

        } catch (error) {
            logger.error('Error handling category confirmation:', error);
            return 'Có lỗi xảy ra khi xác nhận danh mục. Vui lòng thử lại.';
        }
    }



    /**
     * 📊 Xử lý truy vấn cổ phiếu với Stock Service - Production Ready
     */
    async handleStockQuery(userId, message) {
        const startTime = Date.now();

        try {
            // Production logging
            if (process.env.NODE_ENV === 'production') {
                logger.info('📊 Stock query received', { userId: userId?.substring(0, 8) + '...', messageLength: message.length });
            } else {
                logger.info('Processing stock query', { userId, message });
            }

            // Trích xuất mã cổ phiếu từ tin nhắn
            const stockSymbol = this.extractStockSymbol(message);

            if (!stockSymbol) {
                return {
                    success: false,
                    response: `🤖 Tôi không thể xác định mã cổ phiếu từ câu hỏi của bạn.

Vui lòng hỏi theo cách sau:
• "Giá VNM hôm nay thế nào?"
• "Cổ phiếu FPT như thế nào?"
• "VCB bây giờ ra sao?"
• "Phân tích cổ phiếu HPG"

Các mã phổ biến: VNM, VCB, FPT, VIC, HPG, MSN, CTG, BID, TCB, VHM...`,
                    metadata: { intent: 'stock_query', error: 'no_symbol_found', responseTime: Date.now() - startTime }
                };
            }

            // Validate stock symbol format
            if (!/^[A-Z]{3,4}$/.test(stockSymbol)) {
                return {
                    success: false,
                    response: `❌ Mã cổ phiếu "${stockSymbol}" không hợp lệ. Mã cổ phiếu phải có 3-4 ký tự viết hoa (VD: VNM, FPT, VCB).`,
                    metadata: { intent: 'stock_query', symbol: stockSymbol, error: 'invalid_symbol_format', responseTime: Date.now() - startTime }
                };
            }

            // Lấy thông tin cổ phiếu từ Stock Service với timeout protection
            const stockAnalysisPromise = this.stockService.getStockAnalysis(stockSymbol);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Stock query timeout')), 20000) // 20s timeout
            );

            const stockAnalysis = await Promise.race([stockAnalysisPromise, timeoutPromise]);

            if (!stockAnalysis.success) {
                const errorMessage = stockAnalysis.error || stockAnalysis.message || 'Không thể lấy dữ liệu cổ phiếu';

                return {
                    success: false,
                    response: `❌ ${errorMessage}

Vui lòng thử lại sau hoặc kiểm tra mã cổ phiếu khác.`,
                    metadata: {
                        intent: 'stock_query',
                        symbol: stockSymbol,
                        error: errorMessage,
                        responseTime: Date.now() - startTime
                    }
                };
            }

            // Tạo response với thông tin chi tiết
            const response = this.formatStockResponse(stockAnalysis, message);

            // Production success logging
            if (process.env.NODE_ENV === 'production') {
                logger.info('📊 Stock query completed', {
                    symbol: stockSymbol,
                    price: stockAnalysis.price?.current,
                    responseTime: Date.now() - startTime
                });
            }

            return {
                success: true,
                response,
                metadata: {
                    intent: 'stock_query',
                    symbol: stockSymbol,
                    price: stockAnalysis.price?.current || 0,
                    change: stockAnalysis.price?.change || 0,
                    pct_change: stockAnalysis.price?.pct_change || 0,
                    volume: stockAnalysis.volume?.raw || 0,
                    analysis: stockAnalysis.analysis?.trend || 'neutral',
                    source: stockAnalysis.source || 'TCBS',
                    responseTime: Date.now() - startTime
                }
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;

            // Production error logging
            if (process.env.NODE_ENV === 'production') {
                logger.error('📊 Stock query error', {
                    error: error.message,
                    responseTime,
                    userId: userId?.substring(0, 8) + '...'
                });
            } else {
                logger.error('Error in handleStockQuery:', error);
            }

            return {
                success: false,
                response: `❌ Dịch vụ cổ phiếu tạm thời không khả dụng. Vui lòng thử lại sau.`,
                metadata: {
                    intent: 'stock_query',
                    error: process.env.NODE_ENV === 'production' ? 'service_unavailable' : error.message,
                    responseTime
                }
            };
        }
    }

    /**
     * 📊 Format response cho thông tin cổ phiếu
     */
    formatStockResponse(stockAnalysis, originalMessage) {
        const { symbol, price, volume, analysis, source, timestamp } = stockAnalysis;

        // Emoji cho xu hướng
        const trendEmoji = {
            'strong_bullish': '🚀',
            'bullish': '📈',
            'neutral': '➡️',
            'bearish': '📉',
            'strong_bearish': '💥'
        };

        const emoji = trendEmoji[analysis.trend] || '📊';

        // Tạo response chi tiết
        let response = `${emoji} **Thông tin cổ phiếu ${symbol}**\n\n`;

        response += `💰 **Giá hiện tại:** ${price.formatted}\n`;
        response += `📊 **Thay đổi:** ${price.pct_change_formatted}\n`;
        response += `📈 **Khối lượng:** ${volume.formatted}\n\n`;

        response += `🔍 **Phân tích:**\n${analysis.analysis}\n\n`;
        response += `💡 **Khuyến nghị:** ${analysis.recommendation}\n\n`;

        // Thêm thông tin kỹ thuật
        if (analysis.technical_indicators) {
            const indicators = analysis.technical_indicators;
            response += `📋 **Chỉ số kỹ thuật:**\n`;
            response += `• Thay đổi giá: ${indicators.price_change > 0 ? '+' : ''}${indicators.price_change.toLocaleString('vi-VN')} VND\n`;
            response += `• Mức khối lượng: ${indicators.volume_level === 'high' ? 'Cao' : indicators.volume_level === 'medium' ? 'Trung bình' : 'Thấp'}\n\n`;
        }

        response += `📅 **Cập nhật:** ${new Date(timestamp).toLocaleString('vi-VN')}\n`;
        response += `📡 **Nguồn:** ${source}\n\n`;

        response += `💬 *Lưu ý: Đây chỉ là thông tin tham khảo, không phải lời khuyên đầu tư. Vui lòng tự nghiên cứu kỹ trước khi đưa ra quyết định đầu tư.*`;

        return response;
    }

    /**
     * 📊 Xử lý thống kê nâng cao với Enhanced Statistics Engine
     */
    async handleStatisticsQuery(userId, message) {
        try {
            logger.info('Processing enhanced statistics query', { userId, message });

            // Phân tích từ khóa và thời gian từ tin nhắn
            const { timeFilter } = this.analyzeKeywordsAndTime(message);

            // Lấy dữ liệu tài chính với bộ lọc thời gian
            const financialData = await this.getUserFinancialData(userId, timeFilter);

            // Kiểm tra xem có phải statistics query không
            const detection = this.statisticsEngine.detectStatisticsQuery(message);

            logger.info('Statistics detection result', {
                message,
                detection,
                willUseEnhanced: detection.isStatistics
            });

            if (!detection.isStatistics) {
                // Fallback to legacy statistics handling
                logger.info('Using legacy statistics handling');
                return this.handleLegacyStatistics(financialData, message);
            }

            // Xử lý với Enhanced Statistics Engine
            const response = await this.statisticsEngine.processStatistics(message, financialData, timeFilter);

            logger.info('Enhanced statistics processed successfully', {
                userId,
                statisticsType: detection.type,
                confidence: detection.confidence
            });

            return response;

        } catch (error) {
            logger.error('Error handling enhanced statistics query:', error);
            return this.statisticsEngine.getErrorResponse();
        }
    }

    /**
     * 📊 Legacy statistics handling (fallback)
     */
    handleLegacyStatistics(financialData, message) {
        const messageLower = message.toLowerCase();
        let response = '';

        if (messageLower.includes('trung bình') || messageLower.includes('average')) {
            // Thống kê trung bình
            const avgIncome = financialData.incomes.length > 0 ?
                financialData.summary.totalIncomes / financialData.incomes.length : 0;
            const avgExpense = financialData.expenses.length > 0 ?
                financialData.summary.totalExpenses / financialData.expenses.length : 0;

            response = `📊 **Thống kê trung bình:**\n\n`;
            response += `💰 **Thu nhập trung bình:** ${avgIncome.toLocaleString('vi-VN')} VND/giao dịch\n`;
            response += `💸 **Chi tiêu trung bình:** ${avgExpense.toLocaleString('vi-VN')} VND/giao dịch\n`;
            response += `📈 **Tỷ lệ tiết kiệm:** ${((financialData.summary.totalIncomes - financialData.summary.totalExpenses) / financialData.summary.totalIncomes * 100).toFixed(1)}%`;

        } else if (messageLower.includes('so sánh') || messageLower.includes('compare')) {
            // So sánh thu chi
            const balance = financialData.summary.totalIncomes - financialData.summary.totalExpenses;
            const ratio = financialData.summary.totalExpenses / financialData.summary.totalIncomes * 100;

            response = `📊 **So sánh thu chi:**\n\n`;
            response += `💰 **Tổng thu nhập:** ${financialData.summary.totalIncomes.toLocaleString('vi-VN')} VND\n`;
            response += `💸 **Tổng chi tiêu:** ${financialData.summary.totalExpenses.toLocaleString('vi-VN')} VND\n`;
            response += `${balance >= 0 ? '💚' : '💔'} **Số dư:** ${balance.toLocaleString('vi-VN')} VND\n`;
            response += `📈 **Tỷ lệ chi tiêu:** ${ratio.toFixed(1)}% thu nhập\n\n`;

            if (balance >= 0) {
                response += `✅ **Tình hình tài chính tốt!** Bạn đang tiết kiệm được ${(100 - ratio).toFixed(1)}% thu nhập.`;
            } else {
                response += `⚠️ **Cần chú ý!** Chi tiêu vượt quá thu nhập ${Math.abs(balance).toLocaleString('vi-VN')} VND.`;
            }

        } else if (messageLower.includes('phân tích') || messageLower.includes('analyze')) {
            // Phân tích tổng quan
            response = `📊 **Phân tích tổng quan:**\n\n`;
            response += `📈 **Số giao dịch:**\n`;
            response += `• Thu nhập: ${financialData.incomes.length} giao dịch\n`;
            response += `• Chi tiêu: ${financialData.expenses.length} giao dịch\n`;
            response += `• Khoản vay: ${financialData.loans.length} khoản\n`;
            response += `• Đầu tư: ${financialData.investments.length} khoản\n\n`;

            response += `💰 **Tổng số tiền:**\n`;
            response += `• Thu nhập: ${financialData.summary.totalIncomes.toLocaleString('vi-VN')} VND\n`;
            response += `• Chi tiêu: ${financialData.summary.totalExpenses.toLocaleString('vi-VN')} VND\n`;
            response += `• Khoản vay: ${financialData.summary.totalLoans.toLocaleString('vi-VN')} VND\n`;
            response += `• Đầu tư: ${financialData.summary.totalInvestments.toLocaleString('vi-VN')} VND`;

        } else {
            // Thống kê tổng quan
            response = `📊 **Thống kê tổng quan:**\n\n`;
            response += `📈 **Số giao dịch:**\n`;
            response += `• Thu nhập: ${financialData.incomes.length} giao dịch\n`;
            response += `• Chi tiêu: ${financialData.expenses.length} giao dịch\n`;
            response += `• Khoản vay: ${financialData.loans.length} khoản\n`;
            response += `• Đầu tư: ${financialData.investments.length} khoản\n\n`;

            response += `💰 **Tổng số tiền:**\n`;
            response += `• Thu nhập: ${financialData.summary.totalIncomes.toLocaleString('vi-VN')} VND\n`;
            response += `• Chi tiêu: ${financialData.summary.totalExpenses.toLocaleString('vi-VN')} VND\n`;
            response += `• Khoản vay: ${financialData.summary.totalLoans.toLocaleString('vi-VN')} VND\n`;
            response += `• Đầu tư: ${financialData.summary.totalInvestments.toLocaleString('vi-VN')} VND`;
        }

        return response;
    }

    /**
     * ⏰ Xử lý truy vấn theo thời gian
     */
    async handleTimeQuery(userId, message) {
        try {
            const { timeFilter } = this.analyzeKeywordsAndTime(message);

            if (!timeFilter) {
                return 'Tôi chưa hiểu rõ khoảng thời gian bạn muốn xem. Bạn có thể nói:\n• "Thu nhập tuần này"\n• "Chi tiêu tháng trước"\n• "Khoản vay hôm qua"';
            }

            const financialData = await this.getUserFinancialData(userId, timeFilter);

            let timeDescription = '';
            switch (timeFilter.type) {
                case 'today': timeDescription = 'hôm nay'; break;
                case 'week': timeDescription = 'tuần này'; break;
                case 'current_month': timeDescription = 'tháng này'; break;
                case 'month': timeDescription = `tháng ${timeFilter.value}`; break;
                case 'year': timeDescription = `năm ${timeFilter.value}`; break;
                default: timeDescription = 'thời gian được chỉ định';
            }

            let response = `📅 **Tổng quan tài chính ${timeDescription}:**\n\n`;
            response += `💰 **Thu nhập:** ${financialData.summary.totalIncomes.toLocaleString('vi-VN')} VND (${financialData.incomes.length} giao dịch)\n`;
            response += `💸 **Chi tiêu:** ${financialData.summary.totalExpenses.toLocaleString('vi-VN')} VND (${financialData.expenses.length} giao dịch)\n`;
            response += `🏦 **Khoản vay:** ${financialData.summary.totalLoans.toLocaleString('vi-VN')} VND (${financialData.loans.length} khoản)\n`;
            response += `📈 **Đầu tư:** ${financialData.summary.totalInvestments.toLocaleString('vi-VN')} VND (${financialData.investments.length} khoản)\n\n`;

            const balance = financialData.summary.totalIncomes - financialData.summary.totalExpenses;
            response += `${balance >= 0 ? '💚' : '💔'} **Số dư ${timeDescription}:** ${balance.toLocaleString('vi-VN')} VND`;

            return response;

        } catch (error) {
            logger.error('Error handling time query:', error);
            return 'Không thể truy vấn dữ liệu theo thời gian. Vui lòng thử lại sau.';
        }
    }

    /**
     * 🔧 Helper method để trích xuất số tiền từ text
     */
    extractAmount(text) {
        const amountRegex = /(\d+(?:\.\d+)?)\s*(k|nghìn|triệu|tr|m|tỷ|billion|million|thousand)?/i;
        const match = text.match(amountRegex);

        if (match) {
            const number = parseFloat(match[1]);
            const unit = match[2]?.toLowerCase() || '';

            switch (unit) {
                case 'k':
                case 'nghìn':
                case 'thousand':
                    return number * 1000;
                case 'triệu':
                case 'tr':
                case 'm':
                case 'million':
                    return number * 1000000;
                case 'tỷ':
                case 'billion':
                    return number * 1000000000;
                default:
                    return number;
            }
        }

        return 0;
    }

    /**
     * Xử lý nhắc nhở
     */
    async handleReminder(userId, message) {
        // TODO: Implement reminder functionality
        return 'Tính năng nhắc nhở đang được phát triển. Bạn có thể sử dụng các tính năng khác của tôi.';
    }

    /**
     * 🤖 AI Direct Mode Handler - Chỉ sử dụng AI để trả lời
     */
    async handleAIDirectMode(userId, aiQuery, sessionId = null) {
        try {
            // Validate input
            if (!aiQuery || aiQuery.trim().length === 0) {
                return '🤖 **AI Mode:** Bạn muốn hỏi gì? Hãy nhập câu hỏi bất kỳ!\n\nVí dụ: "Thời tiết hôm nay như thế nào?" hoặc "Làm thế nào để nấu phở?"';
            }

            logger.info('AI Direct Mode processing - Pure AI response', {
                userId,
                aiQuery,
                sessionId,
                queryLength: aiQuery.length
            });

            // Get user's financial data for context
            const financialData = await this.getUserFinancialData(userId);

            // Build enhanced AI prompt with financial context
            const enhancedAIPrompt = this.buildEnhancedAIPrompt(aiQuery, financialData, userId);

            // 🤖 PURE AI MODE: Chỉ sử dụng Gemini AI, không qua Enhanced Conversation Handler
            logger.info('Calling Gemini AI directly for pure AI response');

            const aiResponse = await this.callGeminiAI(enhancedAIPrompt, {
                temperature: 0.7,
                maxOutputTokens: 1000,
                topP: 0.8,
                topK: 40
            });

            // Add AI mode indicator to response
            let response = `🤖 **AI Mode:** ${aiResponse}`;

            // Add usage tip
            response += '\n\n💬 **Tip:** Bật/tắt AI Mode bằng toggle switch để chuyển đổi chế độ!';

            logger.info('Pure AI Direct Mode response generated', {
                userId,
                aiQuery,
                responseLength: response.length,
                source: 'Gemini AI Direct'
            });

            return response;

        } catch (error) {
            logger.error('Error in AI Direct Mode:', error);
            return '🤖 **AI Mode:** Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại!\n\n💬 **Tip:** Bật/tắt AI Mode bằng toggle switch để chuyển đổi chế độ!';
        }
    }

    /**
     * 🏗️ Build Enhanced AI Prompt with Financial Context
     */
    buildEnhancedAIPrompt(aiQuery, financialData, userId) {
        const summary = financialData.summary || {};
        const balance = (summary.totalIncomes || 0) - (summary.totalExpenses || 0);

        // Get current date and time
        const currentDateTime = this.getCurrentDateTime();

        const prompt = `
Bạn là VanLang Agent trong AI Mode - một trợ lý AI thông minh có thể trả lời MỌI câu hỏi. Người dùng đã bật AI Mode và hỏi: "${aiQuery}"

**THÔNG TIN THỜI GIAN HIỆN TẠI:**
${currentDateTime}

**Thông tin tài chính của người dùng (để tham khảo khi cần):**
- Tổng thu nhập: ${(summary.totalIncomes || 0).toLocaleString('vi-VN')} VND
- Tổng chi tiêu: ${(summary.totalExpenses || 0).toLocaleString('vi-VN')} VND
- Số dư hiện tại: ${balance.toLocaleString('vi-VN')} VND
- Tổng đầu tư: ${(summary.totalInvestments || 0).toLocaleString('vi-VN')} VND
- Tổng khoản vay: ${(summary.totalLoans || 0).toLocaleString('vi-VN')} VND

**NHIỆM VỤ CHÍNH:**
🎯 Trả lời CHÍNH XÁC và HỮU ÍCH câu hỏi của người dùng, bất kể chủ đề gì:
- ☀️ Thời tiết: Cung cấp thông tin thời tiết chi tiết
- 🍜 Nấu ăn: Hướng dẫn công thức, mẹo nấu ăn
- 💻 Công nghệ: Giải thích khái niệm, xu hướng tech
- 🏥 Sức khỏe: Lời khuyên sức khỏe, dinh dưỡng
- 📚 Giáo dục: Kiến thức tổng quát, học tập
- 🌍 Thời sự: Thông tin về sự kiện, tin tức
- 💰 Tài chính: Sử dụng dữ liệu cá nhân để tư vấn cụ thể
- 🎯 Bất kỳ chủ đề nào khác

**CÁCH TRẢ LỜI:**
✅ Trả lời trực tiếp và chính xác câu hỏi
✅ Cung cấp thông tin hữu ích, thực tế
✅ Nếu liên quan tài chính → kết hợp với dữ liệu cá nhân
✅ Nếu không liên quan tài chính → vẫn trả lời đầy đủ
✅ Sử dụng emoji phù hợp
✅ Tone thân thiện, chuyên nghiệp
✅ Có thể gợi ý liên kết với quản lý tài chính nếu phù hợp

**LƯU Ý QUAN TRỌNG:**
🚨 KHÔNG từ chối trả lời vì "không phải chuyên môn tài chính"
🚨 PHẢI trả lời mọi câu hỏi một cách hữu ích
🚨 Đây là AI Mode - có thể trả lời về BẤT KỲ chủ đề nào

Trả lời bằng tiếng Việt, tối đa 350 từ, tập trung vào câu hỏi chính.`;

        return prompt;
    }

    /**
     * 🗣️ Enhanced General Question Handler with Conversation Context
     */
    async handleGeneralQuestion(userId, message) {
        try {
            // Get user's financial data for personalized responses
            const financialData = await this.getUserFinancialData(userId);

            // Use Enhanced Conversation Handler
            const conversationResult = await this.conversationHandler.handleConversation(
                userId,
                message,
                financialData
            );

            logger.info('Enhanced conversation result', {
                userId,
                message,
                hasFollowUps: conversationResult.followUpQuestions?.length > 0,
                conversationContext: conversationResult.conversationContext
            });

            // Return enhanced response with follow-up questions
            let response = conversationResult.response;

            // Add follow-up questions if available
            if (conversationResult.followUpQuestions && conversationResult.followUpQuestions.length > 0) {
                response += '\n\n💡 **Câu hỏi gợi ý:**\n';
                conversationResult.followUpQuestions.forEach((question, index) => {
                    response += `${index + 1}. ${question}\n`;
                });
            }

            return response;

        } catch (error) {
            logger.error('Error in enhanced general question handler:', error);
            return 'Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Bạn có thể thử hỏi lại không?';
        }
    }

    /**
     * 🚀 Start conversation flow manually
     */
    async handleConversationFlow(userId, flowType) {
        try {
            const result = await this.conversationHandler.startFlow(userId, flowType);

            logger.info('Conversation flow started', {
                userId,
                flowType,
                success: !!result.response
            });

            return result.response;

        } catch (error) {
            logger.error('Error starting conversation flow:', error);
            return 'Không thể bắt đầu cuộc hội thoại. Vui lòng thử lại sau.';
        }
    }

    /**
     * 📊 Get conversation statistics
     */
    getConversationStats(userId) {
        return this.conversationHandler.getConversationStats(userId);
    }

    /**
     * 🗑️ Clear conversation context
     */
    clearConversation(userId) {
        return this.conversationHandler.clearConversation(userId);
    }

    /**
     * Phản hồi chào hỏi (dựa trên training data)
     */
    getGreetingResponse() {
        const greetings = [
            'Chào bạn! Tôi là VanLangBot – trợ lý tài chính của bạn.',
            'Xin chào! Tôi có thể giúp gì cho bạn trong việc quản lý tài chính?',
            'Chào bạn! Tôi là VanLang Agent – trợ lý tài chính AI thông minh của bạn. Tôi có thể giúp bạn quản lý thu chi, phân tích tài chính và đưa ra lời khuyên. Bạn cần hỗ trợ gì? 💰',
            'Xin chào! Tôi là VanLang Agent. Tôi có thể giúp bạn theo dõi giao dịch, phân tích chi tiêu và đưa ra lời khuyên tài chính. Hãy cho tôi biết bạn muốn làm gì nhé! 📊'
        ];

        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    /**
     * Phản hồi tạm biệt
     */
    getFarewellResponse() {
        const farewells = [
            'Tạm biệt bạn! Chúc bạn một ngày tốt lành!',
            'Rất vui được hỗ trợ bạn. Hẹn gặp lại!',
            'Cảm ơn bạn đã sử dụng VanLang Agent. Chúc bạn quản lý tài chính hiệu quả!'
        ];

        return farewells[Math.floor(Math.random() * farewells.length)];
    }

    /**
     * Giới thiệu về bot
     */
    getBotIntroduction() {
        return 'Tôi là VanLangBot, trợ lý tài chính AI được thiết kế để giúp bạn quản lý tài chính cá nhân hiệu quả. Tôi có thể hỗ trợ bạn theo dõi thu chi, phân tích đầu tư và đưa ra lời khuyên tài chính thông minh.';
    }

    /**
     * Khả năng của bot
     */
    getBotCapabilities() {
        return `Tôi có thể giúp bạn:
💰 Theo dõi thu nhập và chi tiêu
📊 Quản lý khoản vay và nợ
🏦 Theo dõi đầu tư (cổ phiếu, vàng, bất động sản)
📈 Phân tích tài chính và đưa ra gợi ý hữu ích
💡 Tư vấn tiết kiệm và lập kế hoạch tài chính
📋 Tạo báo cáo và thống kê chi tiết

Bạn có thể hỏi tôi bất cứ điều gì về tài chính!`;
    }

    /**
     * Thời gian hiện tại
     */
    getCurrentDateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('vi-VN');

        return `Hôm nay là ${dateStr}, bây giờ là ${timeStr}.`;
    }

    /**
     * Yêu cầu đăng nhập
     */
    getAuthRequiredResponse() {
        return 'Bạn cần đăng nhập để sử dụng đầy đủ tính năng của VanLangBot và bảo vệ dữ liệu cá nhân. Để tương tác tốt nhất và truy xuất dữ liệu chính xác, vui lòng đăng nhập tài khoản trước nhé!';
    }

    /**
     * Phạm vi hoạt động của chatbot
     */
    getChatbotScope() {
        return `VanLangBot có thể giúp bạn:
🔹 Quản lý chi tiêu, thu nhập, ngân sách
🔹 Theo dõi khoản vay và đầu tư
🔹 Ghi lại giao dịch và xem báo cáo tài chính
🔹 Tư vấn tiết kiệm và trả lời các câu hỏi về ứng dụng VanLang Budget
🔹 Phân tích tình hình tài chính và đưa ra lời khuyên

Tôi hỗ trợ bạn 24/7 với mọi vấn đề tài chính!`;
    }

    /**
     * Thông tin bảo mật
     */
    getSecurityInfo() {
        const securityResponses = [
            'Chúng tôi sử dụng các phương pháp mã hóa hiện đại để bảo vệ dữ liệu người dùng.',
            'Bạn hoàn toàn có quyền xoá tài khoản và dữ liệu bất kỳ lúc nào tại phần "Cài đặt".',
            'VanLangBot cam kết không chia sẻ dữ liệu cá nhân với bất kỳ bên thứ ba nào.'
        ];

        return securityResponses[Math.floor(Math.random() * securityResponses.length)];
    }

    /**
     * Phản hồi vui nhộn
     */
    getFunnyResponse() {
        const funnyResponses = [
            'Tôi luôn yêu bạn và túi tiền của bạn 😄',
            'Tiêu nhiều thì phải tiết kiệm lại, tôi luôn bên bạn!',
            'Phá sản chỉ là bước đệm để làm lại từ đầu – tôi sẽ giúp bạn lên kế hoạch!',
            'Một đồng tiết kiệm là một đồng... không tiêu, haha!',
            'Đừng lo, tôi sẽ giúp bạn quản lý tiền bạc thông minh hơn! 💪'
        ];

        return funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
    }

    /**
     * Lấy API endpoint dựa trên loại transaction
     */
    getApiEndpoint(type) {
        const endpoints = {
            'income': '/api/incomes',
            'expense': '/api/expenses',
            'loan': '/api/loans',
            'savings': '/api/incomes' // Savings được lưu vào income
        };
        return endpoints[type] || '/api/transactions';
    }

    /**
     * Gọi API để lưu transaction
     */
    async callTransactionAPI(endpoint, transactionData, sessionId) {
        try {
            const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
            const url = `${baseUrl}${endpoint}`;

            // Chuẩn bị data cho API call
            const apiData = {
                amount: transactionData.amount,
                description: transactionData.note,
                category: transactionData.category,
                date: transactionData.date
            };

            // Thêm fields đặc biệt cho loan
            if (transactionData.type === 'loan') {
                apiData.lender = transactionData.category; // Sử dụng category làm lender
                apiData.interestRate = 0;
                apiData.interestRateType = 'MONTH';
                apiData.startDate = transactionData.date;
                apiData.dueDate = new Date(new Date(transactionData.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 ngày sau
                apiData.status = 'ACTIVE';
            }

            logger.info('Calling transaction API', {
                url,
                type: transactionData.type,
                apiData,
                sessionId
            });

            // Gọi API trực tiếp thông qua model thay vì HTTP request
            if (transactionData.type === 'income' || transactionData.type === 'savings') {
                const income = new Income({
                    userId: transactionData.userId,
                    ...apiData
                });
                await income.save();

                // Tạo notification
                const notification = await Notification.createIncomeNotification(income);
                if (socketManager && socketManager.to) {
                    socketManager.to(transactionData.userId).emit('notification', notification);
                }

                return { success: true, data: income };
            } else if (transactionData.type === 'expense') {
                const expense = new Expense({
                    userId: transactionData.userId,
                    ...apiData
                });
                await expense.save();

                // Tạo notification
                const notification = await Notification.createExpenseNotification(expense);
                if (socketManager && socketManager.to) {
                    socketManager.to(transactionData.userId).emit('notification', notification);
                }

                return { success: true, data: expense };
            } else if (transactionData.type === 'loan') {
                const loan = new Loan({
                    userId: transactionData.userId,
                    ...apiData
                });
                await loan.save();

                // Tạo notification
                const notification = await Notification.createLoanNotification(loan);
                if (socketManager && socketManager.to) {
                    socketManager.to(transactionData.userId).emit('notification', notification);
                }

                return { success: true, data: loan };
            }

            return { success: false, message: 'Unsupported transaction type' };

        } catch (error) {
            logger.error('Error calling transaction API:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * 🔍 TÍNH NĂNG 4: Phân tích điều kiện lọc từ tin nhắn
     */
    parseFilterConditions(message) {
        const normalizedMessage = message.toLowerCase().trim().normalize('NFC');



        // Phân tích loại dữ liệu (income, expense, loan)
        let dataType = null;
        if (normalizedMessage.includes('chi tiêu') || normalizedMessage.includes('chi tieu') ||
            normalizedMessage.includes('expense') || normalizedMessage.includes('spending')) {
            dataType = 'expense';
        } else if (normalizedMessage.includes('thu nhập') || normalizedMessage.includes('thu nhap') ||
            normalizedMessage.includes('income') || normalizedMessage.includes('salary')) {
            dataType = 'income';
        } else if (normalizedMessage.includes('khoản vay') || normalizedMessage.includes('khoan vay') ||
            normalizedMessage.includes('loan') || normalizedMessage.includes('debt') ||
            normalizedMessage.includes('vay') || normalizedMessage.includes('nợ')) {
            dataType = 'loan';
        }

        // Phân tích toán tử và giá trị
        let operator = null;
        let amount = null;

        // Tìm kiếm cực trị (cao nhất, thấp nhất)
        if (normalizedMessage.includes('cao nhất') || normalizedMessage.includes('cao nhat') ||
            normalizedMessage.includes('lớn nhất') || normalizedMessage.includes('lon nhat') ||
            normalizedMessage.includes('highest') || normalizedMessage.includes('maximum') ||
            normalizedMessage.includes('max') || normalizedMessage.includes('biggest')) {
            operator = 'max';
        } else if (normalizedMessage.includes('thấp nhất') || normalizedMessage.includes('thap nhat') ||
            normalizedMessage.includes('nhỏ nhất') || normalizedMessage.includes('nho nhat') ||
            normalizedMessage.includes('lowest') || normalizedMessage.includes('minimum') ||
            normalizedMessage.includes('min') || normalizedMessage.includes('smallest')) {
            operator = 'min';
        } else {
            // Tìm kiếm toán tử so sánh với số tiền
            const greaterPatterns = [
                /\b(trên|above|lớn hơn|lon hon|greater than|higher than)\s+(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
                /(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)\s+(trở lên|tro len|or more|and above)/i
            ];

            const lessPatterns = [
                /\b(dưới|duoi|nhỏ hơn|nho hon|below|less than|lower than)\s+(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)/i,
                /(\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)?)\s+(trở xuống|tro xuong|or less|and below)/i
            ];

            for (const pattern of greaterPatterns) {
                const match = normalizedMessage.match(pattern);
                if (match) {
                    operator = 'greater';
                    amount = this.parseAmount(match[2] || match[1]);
                    break;
                }
            }

            if (!operator) {
                for (const pattern of lessPatterns) {
                    const match = normalizedMessage.match(pattern);
                    if (match) {
                        operator = 'less';
                        amount = this.parseAmount(match[2] || match[1]);
                        break;
                    }
                }
            }
        }



        const result = {
            isValid: !!(dataType && operator),  // ✅ FORCE BOOLEAN CONVERSION
            dataType,
            operator,
            amount,
            originalMessage: message
        };

        return result;
    }

    /**
     * ⏰ TÍNH NĂNG 6: Phân tích điều kiện thời gian từ tin nhắn
     */
    parseTimeConditions(message) {
        const normalizedMessage = message.toLowerCase().trim();

        // Phân tích loại dữ liệu
        let dataType = 'overview'; // Mặc định là tổng quan
        if (normalizedMessage.includes('chi tiêu') || normalizedMessage.includes('chi tieu') ||
            normalizedMessage.includes('expense') || normalizedMessage.includes('spending')) {
            dataType = 'expense';
        } else if (normalizedMessage.includes('thu nhập') || normalizedMessage.includes('thu nhap') ||
            normalizedMessage.includes('income') || normalizedMessage.includes('salary')) {
            dataType = 'income';
        } else if (normalizedMessage.includes('khoản vay') || normalizedMessage.includes('khoan vay') ||
            normalizedMessage.includes('loan') || normalizedMessage.includes('debt') ||
            normalizedMessage.includes('vay') || normalizedMessage.includes('nợ')) {
            dataType = 'loan';
        }

        // Phân tích khoảng thời gian
        let timeRange = null;
        let timeDescription = '';

        const now = new Date();

        if (normalizedMessage.includes('tuần này') || normalizedMessage.includes('tuan nay') ||
            normalizedMessage.includes('this week')) {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            timeRange = { start: startOfWeek, end: endOfWeek };
            timeDescription = 'tuần này';
        } else if (normalizedMessage.includes('tháng trước') || normalizedMessage.includes('thang truoc') ||
            normalizedMessage.includes('last month')) {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            endOfLastMonth.setHours(23, 59, 59, 999);

            timeRange = { start: lastMonth, end: endOfLastMonth };
            timeDescription = 'tháng trước';
        } else if (normalizedMessage.includes('hôm nay') || normalizedMessage.includes('hom nay') ||
            normalizedMessage.includes('today')) {
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            timeRange = { start: startOfDay, end: endOfDay };
            timeDescription = 'hôm nay';
        } else if (normalizedMessage.includes('tháng này') || normalizedMessage.includes('thang nay') ||
            normalizedMessage.includes('this month')) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);

            timeRange = { start: startOfMonth, end: endOfMonth };
            timeDescription = 'tháng này';
        }

        return {
            isValid: timeRange !== null,
            dataType,
            timeRange,
            timeDescription,
            originalMessage: message
        };
    }

    /**
     * 🔍 TÍNH NĂNG 4: Áp dụng filter nâng cao lên dữ liệu
     */
    async applyAdvancedFilter(userId, filterAnalysis) {
        try {
            const { dataType, operator, amount } = filterAnalysis;
            let results = [];

            // Import models
            const Income = (await import('../models/incomeModel.js')).default;
            const Expense = (await import('../models/expenseModel.js')).default;
            const Loan = (await import('../models/loanModel.js')).default;

            // Lấy dữ liệu theo loại
            if (dataType === 'income') {
                const incomes = await Income.find({ userId }).sort({ amount: -1 });
                results = this.applyFilterToData(incomes, operator, amount);
            } else if (dataType === 'expense') {
                const expenses = await Expense.find({ userId }).sort({ amount: -1 });
                results = this.applyFilterToData(expenses, operator, amount);
            } else if (dataType === 'loan') {
                const loans = await Loan.find({ userId }).sort({ amount: -1 });
                results = this.applyFilterToData(loans, operator, amount);
            }

            return {
                dataType,
                operator,
                amount,
                results,
                totalFound: results.length
            };

        } catch (error) {
            logger.error('Error applying advanced filter:', error);
            throw error;
        }
    }

    /**
     * 🔍 TÍNH NĂNG 4: Áp dụng logic filter lên array dữ liệu
     */
    applyFilterToData(data, operator, amount) {
        switch (operator) {
            case 'greater':
                return data.filter(item => item.amount > amount);
            case 'less':
                return data.filter(item => item.amount < amount);
            case 'max':
                if (data.length === 0) return [];
                const maxAmount = Math.max(...data.map(item => item.amount));
                return data.filter(item => item.amount === maxAmount);
            case 'min':
                if (data.length === 0) return [];
                const minAmount = Math.min(...data.map(item => item.amount));
                return data.filter(item => item.amount === minAmount);
            default:
                return data;
        }
    }

    /**
     * ⏰ TÍNH NĂNG 6: Lấy dữ liệu theo khoảng thời gian
     */
    async getDataByTimeRange(userId, timeAnalysis) {
        try {
            const { dataType, timeRange } = timeAnalysis;

            // Import models
            const Income = (await import('../models/incomeModel.js')).default;
            const Expense = (await import('../models/expenseModel.js')).default;
            const Loan = (await import('../models/loanModel.js')).default;

            const dateFilter = {
                userId,
                date: {
                    $gte: timeRange.start,
                    $lte: timeRange.end
                }
            };

            let results = {};

            if (dataType === 'income') {
                const incomes = await Income.find(dateFilter).sort({ date: -1 });
                const total = incomes.reduce((sum, item) => sum + item.amount, 0);
                results = { incomes, total, count: incomes.length };
            } else if (dataType === 'expense') {
                const expenses = await Expense.find(dateFilter).sort({ date: -1 });
                const total = expenses.reduce((sum, item) => sum + item.amount, 0);
                results = { expenses, total, count: expenses.length };
            } else if (dataType === 'loan') {
                const loans = await Loan.find({
                    userId,
                    createdAt: {
                        $gte: timeRange.start,
                        $lte: timeRange.end
                    }
                }).sort({ createdAt: -1 });
                const total = loans.reduce((sum, item) => sum + item.amount, 0);
                results = { loans, total, count: loans.length };
            } else {
                // Tổng quan tất cả
                const [incomes, expenses, loans] = await Promise.all([
                    Income.find(dateFilter).sort({ date: -1 }),
                    Expense.find(dateFilter).sort({ date: -1 }),
                    Loan.find({
                        userId,
                        createdAt: {
                            $gte: timeRange.start,
                            $lte: timeRange.end
                        }
                    }).sort({ createdAt: -1 })
                ]);

                const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
                const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
                const totalLoan = loans.reduce((sum, item) => sum + item.amount, 0);

                results = {
                    incomes,
                    expenses,
                    loans,
                    totals: {
                        income: totalIncome,
                        expense: totalExpense,
                        loan: totalLoan,
                        balance: totalIncome - totalExpense
                    },
                    counts: {
                        income: incomes.length,
                        expense: expenses.length,
                        loan: loans.length
                    }
                };
            }

            return {
                dataType,
                timeRange,
                results
            };

        } catch (error) {
            logger.error('Error getting data by time range:', error);
            throw error;
        }
    }

    /**
     * 🔍 TÍNH NĂNG 4: Format kết quả filter nâng cao
     */
    formatFilterResults(filterData, filterAnalysis) {
        const { dataType, operator, amount, results, totalFound } = filterData;

        let title = '';
        let operatorText = '';

        // Tạo tiêu đề dựa trên loại dữ liệu
        const dataTypeText = {
            'income': 'Thu nhập',
            'expense': 'Chi tiêu',
            'loan': 'Khoản vay'
        };

        // Tạo text mô tả toán tử
        switch (operator) {
            case 'greater':
                operatorText = `trên ${this.formatCurrency(amount)}`;
                break;
            case 'less':
                operatorText = `dưới ${this.formatCurrency(amount)}`;
                break;
            case 'max':
                operatorText = 'cao nhất';
                break;
            case 'min':
                operatorText = 'thấp nhất';
                break;
        }

        title = `🔍 **${dataTypeText[dataType]} ${operatorText}**`;

        if (totalFound === 0) {
            return `${title}\n\n❌ **Không tìm thấy kết quả nào.**\n\n💡 Thử điều chỉnh điều kiện tìm kiếm của bạn.`;
        }

        let response = `${title}\n\n✅ **Tìm thấy ${totalFound} kết quả:**\n\n`;

        // Hiển thị từng kết quả
        results.slice(0, 10).forEach((item, index) => {
            const date = item.date ? new Date(item.date).toLocaleDateString('vi-VN') :
                new Date(item.createdAt).toLocaleDateString('vi-VN');
            const description = item.description || item.note || 'Không có mô tả';
            const category = item.category || 'Khác';

            response += `**${index + 1}.** ${this.formatCurrency(item.amount)} VND\n`;
            response += `   📅 ${date} | 📂 ${category}\n`;
            response += `   📝 ${description}\n\n`;
        });

        if (totalFound > 10) {
            response += `... và ${totalFound - 10} kết quả khác.\n\n`;
        }

        // Thống kê tổng kết
        const totalAmount = results.reduce((sum, item) => sum + item.amount, 0);
        response += `📊 **Tổng kết:**\n`;
        response += `• Số lượng: ${totalFound} giao dịch\n`;
        response += `• Tổng tiền: ${this.formatCurrency(totalAmount)} VND`;

        return response;
    }

    /**
     * ⏰ TÍNH NĂNG 6: Format kết quả truy vấn theo thời gian
     */
    formatTimeResults(timeData, timeAnalysis) {
        const { dataType, timeRange, results } = timeData;
        const { timeDescription } = timeAnalysis;

        const startDate = timeRange.start.toLocaleDateString('vi-VN');
        const endDate = timeRange.end.toLocaleDateString('vi-VN');

        let title = `⏰ **Dữ liệu tài chính ${timeDescription}**\n`;
        title += `📅 *Từ ${startDate} đến ${endDate}*\n\n`;

        if (dataType === 'overview') {
            // Tổng quan tất cả
            const { totals, counts } = results;

            if (counts.income === 0 && counts.expense === 0 && counts.loan === 0) {
                return `${title}❌ **Không có dữ liệu nào trong khoảng thời gian này.**`;
            }

            let response = title;
            response += `📊 **Tổng quan tài chính:**\n\n`;

            if (counts.income > 0) {
                response += `💰 **Thu nhập:** ${this.formatCurrency(totals.income)} VND (${counts.income} giao dịch)\n`;
            }

            if (counts.expense > 0) {
                response += `💸 **Chi tiêu:** ${this.formatCurrency(totals.expense)} VND (${counts.expense} giao dịch)\n`;
            }

            if (counts.loan > 0) {
                response += `🏦 **Khoản vay:** ${this.formatCurrency(totals.loan)} VND (${counts.loan} khoản)\n`;
            }

            response += `\n💹 **Số dư:** ${this.formatCurrency(totals.balance)} VND\n`;

            // Hiển thị chi tiết một số giao dịch gần nhất
            if (counts.income > 0 || counts.expense > 0) {
                response += `\n📋 **Giao dịch gần nhất:**\n`;

                const allTransactions = [
                    ...results.incomes.map(item => ({ ...item, type: 'income' })),
                    ...results.expenses.map(item => ({ ...item, type: 'expense' }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

                allTransactions.forEach((item) => {
                    const icon = item.type === 'income' ? '💰' : '💸';
                    const date = new Date(item.date).toLocaleDateString('vi-VN');
                    response += `${icon} ${this.formatCurrency(item.amount)} VND - ${item.description} (${date})\n`;
                });
            }

            return response;
        } else {
            // Dữ liệu cụ thể theo loại
            const dataTypeText = {
                'income': 'Thu nhập',
                'expense': 'Chi tiêu',
                'loan': 'Khoản vay'
            };

            const { total, count } = results;
            const dataArray = results[dataType === 'loan' ? 'loans' : dataType === 'income' ? 'incomes' : 'expenses'];

            if (count === 0) {
                return `${title}❌ **Không có ${dataTypeText[dataType].toLowerCase()} nào trong ${timeDescription}.**`;
            }

            let response = title;
            response += `📊 **${dataTypeText[dataType]} ${timeDescription}:**\n\n`;
            response += `💰 **Tổng cộng:** ${this.formatCurrency(total)} VND\n`;
            response += `📈 **Số lượng:** ${count} giao dịch\n\n`;

            // Hiển thị chi tiết
            response += `📋 **Chi tiết:**\n`;
            dataArray.slice(0, 8).forEach((item, index) => {
                const date = item.date ? new Date(item.date).toLocaleDateString('vi-VN') :
                    new Date(item.createdAt).toLocaleDateString('vi-VN');
                const description = item.description || item.note || 'Không có mô tả';
                const category = item.category || 'Khác';

                response += `**${index + 1}.** ${this.formatCurrency(item.amount)} VND\n`;
                response += `   📅 ${date} | 📂 ${category}\n`;
                response += `   📝 ${description}\n\n`;
            });

            if (count > 8) {
                response += `... và ${count - 8} giao dịch khác.\n`;
            }

            return response;
        }
    }

    /**
     * 🔧 Helper method để parse số tiền từ text
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

    /**
     * 🔧 Helper method để format số tiền
     */
    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            return '0';
        }

        return amount.toLocaleString('vi-VN');
    }
}

export default VanLangAgent;

// 🚨 IMMEDIATE TEST FUNCTION
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🔍 TESTING BOTH detectAdvancedFilter AND parseFilterConditions...\n');

    const agent = new VanLangAgent();

    const testCases = [
        'thu nhập thấp nhất',
        'chi tiêu thấp nhất',
        'chi tiêu cao nhất',
        'khoản vay cao nhất'
    ];

    testCases.forEach(testCase => {
        console.log(`\n📝 Testing: "${testCase}"`);
        console.log('='.repeat(60));

        // Test detectAdvancedFilter
        console.log('🔍 Testing detectAdvancedFilter:');
        const filterDetected = agent.detectAdvancedFilter(testCase);
        console.log('  - detectAdvancedFilter result:', filterDetected);

        // Test parseFilterConditions
        console.log('🔍 Testing parseFilterConditions:');
        const result = agent.parseFilterConditions(testCase);
        console.log('  - isValid:', result.isValid);
        console.log('  - dataType:', result.dataType);
        console.log('  - operator:', result.operator);
        console.log('  - amount:', result.amount);

        if (filterDetected && result.isValid) {
            console.log('✅ BOTH METHODS WORK!');
        } else if (filterDetected && !result.isValid) {
            console.log('⚠️ detectAdvancedFilter=true but parseFilterConditions=false');
        } else if (!filterDetected && result.isValid) {
            console.log('⚠️ detectAdvancedFilter=false but parseFilterConditions=true');
        } else {
            console.log('❌ BOTH METHODS FAILED!');
        }
    });
}

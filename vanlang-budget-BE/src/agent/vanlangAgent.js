import axios from 'axios';
import Transaction from '../models/transactionModel.js';
import Expense from '../models/expenseModel.js';
import Income from '../models/incomeModel.js';
import Budget from '../models/budgetModel.js';
import Loan from '../models/loanModel.js';
import Investment from '../models/investmentModel.js';
import logger from '../utils/logger.js';
import NLPService from '../services/nlpService.js'; // Import NLPService mới

class VanLangAgent {
    constructor(geminiApiKey) {
        this.geminiApiKey = geminiApiKey;
        this.modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash';
        this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`;
        // Lưu trữ context cuộc hội thoại để xử lý các yêu cầu chi tiết
        this.conversationContext = new Map();
        this.nlpService = new NLPService(); // Khởi tạo NLPService
    }

    /**
     * Gọi Gemini AI API
     */
    async callGeminiAI(prompt, options = {}) {
        try {
            const response = await axios.post(
                this.baseUrl,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        topK: options.topK || 40,
                        topP: options.topP || 0.95,
                        maxOutputTokens: options.maxOutputTokens || 1024,
                    }
                },
                {
                    params: { key: this.geminiApiKey },
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            logger.info('Gemini AI response received', { promptLength: prompt.length, responseLength: result.length });
            return result;
        } catch (error) {
            logger.error('Gemini AI API error:', error.response?.data || error.message);
            throw new Error('Không thể kết nối với AI. Vui lòng thử lại sau.');
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

        // Kiểm tra calculation query trước (ưu tiên cao nhất) - Sử dụng Gemini AI
        const calculationKeywords = [
            'còn bao nhiều', 'con bao nhieu', 'còn lại bao nhiều', 'con lai bao nhieu',
            'sẽ còn', 'se con', 'tôi sẽ có', 'toi se co', 'tính toán', 'tinh toan',
            'calculate', 'how much left', 'bao nhiêu tiền', 'bao nhieu tien'
        ];

        const hasCalculationKeywords = calculationKeywords.some(keyword =>
            normalizedMessage.includes(keyword)
        );

        const hasConditionalStructure = (normalizedMessage.includes('nếu') && normalizedMessage.includes('thì')) ||
            (normalizedMessage.includes('neu') && normalizedMessage.includes('thi'));

        if (hasCalculationKeywords || hasConditionalStructure) {
            logger.info('Potential calculation query detected, using Gemini AI for confirmation', {
                message: normalizedMessage,
                hasCalculationKeywords,
                hasConditionalStructure
            });

            // Sử dụng Gemini AI để xác nhận calculation intent
            const calculationPrompt = `
Phân tích câu sau và xác định xem đây có phải là câu hỏi tính toán tài chính không:
"${message}"

Câu hỏi tính toán tài chính là những câu:
- Hỏi về số tiền còn lại sau khi chi tiêu
- Hỏi về khả năng chi tiêu
- Tính toán số dư
- Có cấu trúc "nếu... thì..."
- Có từ khóa: còn bao nhiều, sẽ còn, tính toán

VÍ DỤ:
- "nếu tôi lấy tiền tiết kiệm để mua xe đạp giá 4tr thì tôi sẽ còn bao nhiều tiền?" → CALCULATION
- "tôi mua xe đạp 4tr" → NOT_CALCULATION
- "tôi chi 500k thì còn bao nhiều?" → CALCULATION
- "mua cà phê 50k" → NOT_CALCULATION

Chỉ trả về: "CALCULATION" hoặc "NOT_CALCULATION"`;

            try {
                const geminiResult = await this.callGeminiAI(calculationPrompt);
                const isCalculation = geminiResult.trim().toUpperCase() === 'CALCULATION';

                logger.info('Gemini calculation analysis result', {
                    message: normalizedMessage,
                    geminiResult: geminiResult.trim(),
                    isCalculation
                });

                if (isCalculation) {
                    return 'calculation_query';
                }
            } catch (error) {
                logger.error('Error in Gemini calculation analysis:', error);
                // Fallback to keyword detection
                if (hasCalculationKeywords || hasConditionalStructure) {
                    return 'calculation_query';
                }
            }
        }

        // Kiểm tra các câu lệnh POST sau (ưu tiên thấp hơn)
        const hasAmount = /\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)/i.test(message);

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

        const intentPrompt = `
Phân tích mục đích của câu sau và trả lời bằng một từ duy nhất: "${message}"

Các mục đích có thể:
- income_query: Hỏi về thu nhập (từ khóa: thu nhập, lương, tiền lương, income, salary, kiếm được, nhận được)
- savings_income_query: Hỏi về tiền tiết kiệm trong thu nhập (từ khóa: tiền tiết kiệm, tiết kiệm - KHÔNG có "ngân hàng")
- expense_query: Hỏi về chi tiêu (từ khóa: chi tiêu, chi phí, tiêu dùng, expense, spending, mua, trả, thanh toán)
- loan_query: Hỏi về khoản vay (từ khóa: khoản vay, vay, nợ, loan, debt, mượn, cho vay)
- investment_query: Hỏi về đầu tư (từ khóa: đầu tư, investment, cổ phiếu, stock, vàng, gold, bất động sản, real estate)
- savings_query: Hỏi về tiết kiệm ngân hàng (từ khóa: tiết kiệm ngân hàng, tiền gửi ngân hàng, gửi tiết kiệm, tiết kiệm từ ngân hàng, tiền tiết kiệm ngân hàng, bank savings)
- balance_query: Hỏi về số dư, tổng quan tài chính (từ khóa: số dư, balance, tổng quan, overview, tình hình tài chính)
- calculation_query: Câu hỏi suy luận, tính toán (từ khóa: tính, lãi suất, kế hoạch, dự đoán, phân tích, so sánh)
- detail_query: Xem chi tiết các khoản còn lại (từ khóa: "còn lại", "khác", "chi tiết", "xem thêm", "tất cả", "danh sách đầy đủ")

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

        // AGENT INTERACTION: Nếu phân tích dựa trên từ khóa không xác định rõ, sử dụng Gemini AI để phân tích intent.
        try {
            const intent = await this.callGeminiAI(intentPrompt, { temperature: 0.3 });
            return intent.trim().toLowerCase();
        } catch (error) {
            logger.error('Intent analysis error:', error);
            return 'other';
        }
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
        } else if (normalizedMessage.includes('khoản vay') || normalizedNoDiacritics.includes('khoan vay') ||
            normalizedMessage.includes('vay') || normalizedMessage.includes('nợ') || normalizedNoDiacritics.includes('no') ||
            normalizedMessage.includes('loan') || normalizedMessage.includes('debt')) {
            category = 'loan';
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
    "date": "YYYY-MM-DD" (nếu không có thì để ngày hôm nay),
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

Ví dụ:
- "Tôi tiết kiệm được 2 triệu" -> {"type": "savings", "amount": 2000000, "category": "Tiền tiết kiệm", "note": "Tiết kiệm được", "date": "2024-01-15"}
- "Tôi mới tiết kiệm được 500k" -> {"type": "savings", "amount": 500000, "category": "Tiền tiết kiệm", "note": "Mới tiết kiệm được", "date": "2024-01-15"}
- "Vừa tiết kiệm 1 triệu" -> {"type": "savings", "amount": 1000000, "category": "Tiền tiết kiệm", "note": "Vừa tiết kiệm", "date": "2024-01-15"}
- "Để dành 500k hôm nay" -> {"type": "savings", "amount": 500000, "category": "Tiền tiết kiệm", "note": "Để dành", "date": "2024-01-15"}
- "Tôi vừa mua cà phê 50k" -> {"type": "expense", "amount": 50000, "category": "Ăn uống", "note": "Mua cà phê", "date": "2024-01-15"}
- "Nhận lương 15 triệu hôm nay" -> {"type": "income", "amount": 15000000, "category": "Lương", "note": "Nhận lương", "date": "2024-01-15"}
- "Tôi tiêu 200k mua quần áo" -> {"type": "expense", "amount": 200000, "category": "Mua sắm", "note": "Mua quần áo", "date": "2024-01-15"}
- "Mua xe đạp 4 triệu" -> {"type": "expense", "amount": 4000000, "category": "Mua sắm", "note": "Mua xe đạp", "date": "2024-01-15"}
- "Đổ xăng 200k" -> {"type": "expense", "amount": 200000, "category": "Di chuyển", "note": "Đổ xăng", "date": "2024-01-15"}
- "Được thưởng 2 triệu" -> {"type": "income", "amount": 2000000, "category": "Thưởng", "note": "Được thưởng", "date": "2024-01-15"}
- "Vay bạn 500k" -> {"type": "loan", "amount": 500000, "category": "Bạn bè", "note": "Vay bạn", "date": "2024-01-15"}

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
     * Xử lý tin nhắn chính từ người dùng
     */
    async handleUserMessage(userId, message, sessionId = null) {
        try {
            logger.info('Processing user message', { userId, message, sessionId });

            // AGENT INTERACTION: Bắt đầu xử lý tin nhắn từ người dùng.
            // Sử dụng NLPService để có được phân tích ban đầu
            const nlpAnalysis = this.nlpService.analyzeIntent(message);
            logger.info('NLPService analysis for handleUserMessage', { nlpAnalysis, message });

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
                intent = await this.analyzeIntent(message); // AGENT INTERACTION: Gọi lại hàm analyzeIntent nội bộ nếu NLPService không đủ chắc chắn hoặc là intent tài chính chung.
                logger.info('VanLangAgent internal analyzeIntent result', {
                    intentFromInternal: intent,
                    message
                });
            }

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

            // Chỉ sử dụng keyword analysis cho GET operations nếu analyzeIntent không trả về POST intent
            if (!intent || (!intent.startsWith('insert_') && !intent.includes('calculation') && !intent.includes('detail'))) {
                const { category } = this.analyzeKeywordsAndTime(message);

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
                    return await this.handleSpecificQuery(userId, message, 'income');

                case 'expense_query':
                    return await this.handleSpecificQuery(userId, message, 'expense');

                case 'loan_query':
                    return await this.handleSpecificQuery(userId, message, 'loan');

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

                // Nhóm Calculation - Suy luận và tính toán
                case 'calculation_query':
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
                    return await this.handleGeneralQuestion(message);
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
                    const totalLoan = financialData.summary.totalLoans;
                    const activeLoans = financialData.summary.activeLoans;
                    response = `🏦 **Tổng khoản vay ${timeDescription} (bao gồm lãi):** ${totalLoan.toLocaleString('vi-VN')} VND\n`;
                    response += `📈 **Số khoản vay đang hoạt động:** ${activeLoans}\n\n`;

                    if (financialData.loans.length > 0) {
                        response += `📊 **Chi tiết khoản vay:**\n`;
                        financialData.loans.slice(0, 5).forEach((loan, index) => {
                            const date = new Date(loan.createdAt).toLocaleDateString('vi-VN');
                            const status = loan.status?.toUpperCase() === 'ACTIVE' ? '🟢 Đang hoạt động' : '🔴 Đã đóng';

                            // Tính toán chi tiết giống như frontend
                            const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                            const remainingAmount = Math.max(0, loan.amount - totalPaid);

                            let totalWithInterest = remainingAmount;
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
                                totalWithInterest = remainingAmount + interestAmount;
                            }

                            response += `${index + 1}. ${loan.description || 'Khoản vay'}: ${totalWithInterest.toLocaleString('vi-VN')} VND - ${status} (${date})\n`;
                        });

                        if (financialData.loans.length > 5) {
                            response += `\n... và ${financialData.loans.length - 5} khoản vay khác.`;
                            // Lưu context để xử lý yêu cầu xem chi tiết
                            this.conversationContext.set(userId, {
                                type: 'loan',
                                data: financialData.loans,
                                timeFilter,
                                timeDescription,
                                timestamp: Date.now()
                            });
                            response += `\n\n💡 *Bạn có thể hỏi "xem chi tiết các khoản còn lại" để xem tất cả.*`;
                        }
                    } else {
                        response += `Không có dữ liệu khoản vay ${timeDescription}.`;
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
                message,
                timeFilter
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

                                response += `${index + 6}. ${item.description || 'Khoản vay'}: ${totalWithInterest.toLocaleString('vi-VN')} VND - ${status} (${date})\n`;
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
                    if (type === 'loan') {
                        // Tính tổng khoản vay bao gồm lãi
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
     * Xử lý câu hỏi suy luận và tính toán
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

            // Xóa context
            this.conversationContext.delete(userId);

            // Kiểm tra nếu user chọn số thứ tự
            const numberMatch = normalizedMessage.match(/^(\d+)$/);
            if (numberMatch) {
                const index = parseInt(numberMatch[1]) - 1;
                if (index >= 0 && index < transactionData.suggestedCategories.length) {
                    transactionData.category = transactionData.suggestedCategories[index];
                } else {
                    return 'Số thứ tự không hợp lệ. Vui lòng chọn lại hoặc nói tên danh mục.';
                }
            } else {
                // Kiểm tra nếu user nói tên category
                const selectedCategory = transactionData.suggestedCategories.find(cat =>
                    normalizedMessage.includes(cat.toLowerCase()) ||
                    cat.toLowerCase().includes(normalizedMessage)
                );

                if (selectedCategory) {
                    transactionData.category = selectedCategory;
                } else {
                    return `Không tìm thấy danh mục "${message}". Vui lòng chọn một trong các danh mục đã gợi ý hoặc nói rõ hơn.`;
                }
            }

            // Xóa needsCategoryConfirmation để tránh loop
            transactionData.needsCategoryConfirmation = false;

            // Tiếp tục xử lý transaction với category đã được xác nhận
            return await this.handleInsertTransaction(userId, `${transactionData.note} ${transactionData.amount}`, sessionId, forceType);

        } catch (error) {
            logger.error('Error handling category confirmation:', error);
            return 'Có lỗi xảy ra khi xác nhận danh mục. Vui lòng thử lại.';
        }
    }

    /**
     * Xử lý nhắc nhở
     */
    async handleReminder(userId, message) {
        // TODO: Implement reminder functionality
        return 'Tính năng nhắc nhở đang được phát triển. Bạn có thể sử dụng các tính năng khác của tôi.';
    }

    /**
     * Xử lý câu hỏi chung
     */
    async handleGeneralQuestion(message) {
        // Kiểm tra xem có phải câu hỏi liên quan đến tài chính không
        const normalizedMessage = message.toLowerCase().trim();
        const removeDiacritics = (str) => {
            return str.normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D');
        };
        const normalizedNoDiacritics = removeDiacritics(normalizedMessage);

        // Danh sách từ khóa tài chính mở rộng (dựa trên training data)
        const financialKeywords = [
            // Tiền bạc cơ bản
            'tiền', 'tien', 'money', 'cash', 'đồng', 'dong', 'vnd',

            // Tài chính tổng quát
            'tài chính', 'tai chinh', 'finance', 'financial',
            'ngân hàng', 'ngan hang', 'bank', 'banking',
            'số dư', 'so du', 'balance', 'tài khoản', 'tai khoan',

            // Thu nhập
            'thu nhập', 'thu nhap', 'income', 'salary',
            'lương', 'luong', 'wage', 'pay', 'tiền lương', 'tien luong',
            'tiền thưởng', 'tien thuong', 'bonus', 'thưởng', 'thuong',
            'kiếm được', 'kiem duoc', 'nhận được', 'nhan duoc',

            // Chi tiêu
            'chi tiêu', 'chi tieu', 'expense', 'spending',
            'chi phí', 'chi phi', 'cost', 'tiêu dùng', 'tieu dung',
            'tiêu', 'tieu', 'spend', 'mua', 'buy', 'thanh toán', 'thanh toan',

            // Khoản vay và nợ
            'vay', 'loan', 'debt', 'nợ', 'no', 'khoản vay', 'khoan vay',
            'nợ nần', 'no nan', 'mượn', 'muon', 'borrow',
            'trả nợ', 'tra no', 'repay', 'thanh toán nợ', 'thanh toan no',

            // Đầu tư
            'đầu tư', 'dau tu', 'investment', 'invest',
            'cổ phiếu', 'co phieu', 'stock', 'share', 'chứng khoán', 'chung khoan',
            'vàng', 'vang', 'gold', 'crypto', 'bitcoin',
            'bất động sản', 'bat dong san', 'real estate', 'property',
            'đất', 'dat', 'land', 'nhà', 'nha', 'house',
            'lợi nhuận', 'loi nhuan', 'profit', 'lãi', 'lai',
            'thua lỗ', 'thua lo', 'loss', 'lỗ', 'lo',

            // Tiết kiệm và ngân sách
            'tiết kiệm', 'tiet kiem', 'saving', 'savings',
            'ngân sách', 'ngan sach', 'budget', 'hạn mức', 'han muc',
            'kế hoạch', 'ke hoach', 'plan', 'planning',
            'mục tiêu', 'muc tieu', 'goal', 'target',

            // Báo cáo và thống kê
            'báo cáo', 'bao cao', 'report', 'thống kê', 'thong ke',
            'biểu đồ', 'bieu do', 'chart', 'phân tích', 'phan tich',
            'tổng quan', 'tong quan', 'overview', 'summary',

            // Danh mục và phân loại
            'danh mục', 'danh muc', 'category', 'phân loại', 'phan loai',
            'ăn uống', 'an uong', 'food', 'di chuyển', 'di chuyen',
            'giải trí', 'giai tri', 'entertainment', 'học tập', 'hoc tap',

            // Lãi suất và tính toán
            'lãi suất', 'lai suat', 'interest', 'rate',
            'tính toán', 'tinh toan', 'calculate', 'calculation',

            // Kinh doanh
            'kinh doanh', 'business', 'doanh nghiệp', 'doanh nghiep'
        ];

        const isFinancialQuestion = financialKeywords.some(keyword =>
            normalizedMessage.includes(keyword) || normalizedNoDiacritics.includes(keyword)
        );

        if (isFinancialQuestion) {
            const generalPrompt = `
Bạn là VanLang Agent - trợ lý tài chính AI thông minh. Hãy trả lời câu hỏi sau một cách hữu ích và chuyên nghiệp: "${message}"

Hướng dẫn:
- Nếu câu hỏi về tài chính cá nhân, hãy đưa ra lời khuyên thực tế
- Nếu hỏi về thuật ngữ tài chính, hãy giải thích rõ ràng
- Nếu hỏi về đầu tư, hãy đưa ra thông tin khách quan
- Nếu hỏi về quản lý tiền bạc, hãy đưa ra các bước cụ thể
- Luôn khuyến khích người dùng sử dụng các tính năng của hệ thống để theo dõi tài chính

Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.`;

            try {
                const response = await this.callGeminiAI(generalPrompt);
                return response;
            } catch (error) {
                return 'Tôi hiểu bạn đang hỏi về vấn đề tài chính. Tuy nhiên, tôi gặp lỗi khi xử lý. Bạn có thể hỏi tôi về thu nhập, chi tiêu, đầu tư, khoản vay, hoặc bất kỳ vấn đề tài chính nào khác.';
            }
        } else {
            // Câu hỏi không liên quan đến tài chính
            return `Chào bạn! Tôi là VanLang Agent - trợ lý tài chính AI chuyên nghiệp.

Tôi chỉ có thể hỗ trợ các vấn đề liên quan đến tài chính như:
💰 Thu nhập và chi tiêu
📊 Đầu tư (cổ phiếu, vàng, bất động sản)
🏦 Khoản vay và tiết kiệm
📈 Phân tích và lập kế hoạch tài chính
💡 Lời khuyên quản lý tiền bạc

Bạn có thể hỏi tôi: "Tôi có bao nhiều tiền?", "Đầu tư vàng như thế nào?", "Chi tiêu tháng này ra sao?" hoặc bất kỳ câu hỏi tài chính nào khác.`;
        }
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
}

export default VanLangAgent;

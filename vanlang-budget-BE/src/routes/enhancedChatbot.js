import express from 'express';
import rateLimit from 'express-rate-limit';

// Import services
import authenticateToken from '../middlewares/authenticateToken.js';
import NLPService from '../services/nlpService.js';
import getCacheService from '../services/cacheService.js';
import FinancialCalculationService from '../services/financialCalculationService.js';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Import models for real data
import Income from '../models/incomeModel.js';
import Expense from '../models/expenseModel.js';
import Investment from '../models/investmentModel.js';
import Budget from '../models/budgetModel.js';
import LoanPayment from '../models/loanPaymentModel.js';

const router = express.Router();

// === LEGACY CHATBOT FUNCTIONS (từ chatbot.js) ===
// Các hàm này được giữ lại để tương thích với chatbot cơ bản

const ALLOWED_KEYWORDS_VANLANGBOT = {
    greetings: ['chào', 'xin chào', 'hello', 'hi', 'hey', 'chào bạn', 'chào bot', 'vanlangbot'],
    aboutBot: ['bạn là ai', 'bạn làm gì', 'giúp gì', 'chức năng', 'khả năng', 'thông tin về bạn'],
    generalFinance: ['tài chính', 'tiền nong', 'quản lý tiền', 'ngân sách', 'thu nhập', 'chi tiêu', 'tiết kiệm', 'nợ', 'vay', 'khoản vay', 'lãi suất', 'thẻ tín dụng', 'tài khoản', 'giao dịch'],
    investmentsApp: ['đầu tư', 'cổ phiếu', 'vàng', 'tiền điện tử', 'tiết kiệm', 'danh mục', 'lợi nhuận', 'rủi ro', 'phân tích'],
};

const BLOCKED_KEYWORDS_VANLANGBOT = {
    offTopicGeneral: ['thời tiết', 'tin tức', 'thể thao', 'phim ảnh', 'du lịch', 'nấu ăn', 'sức khỏe', 'y tế', 'giáo dục', 'lịch sử', 'khoa học'],
    sensitive: ['chính trị', 'tôn giáo', 'sex', 'bạo lực', 'chửi thề', 'xúc phạm'],
};

function isVanLangBotAllowedTopic(message) {
    const lowerMessage = message.toLowerCase().trim();

    if (!lowerMessage) return false;

    // 1. Luôn cho phép lời chào
    if (ALLOWED_KEYWORDS_VANLANGBOT.greetings.some(g => lowerMessage.includes(g))) {
        console.log(`Chatbot Intent: Detected greeting - "${lowerMessage}"`);
        return true;
    }

    // 2. Luôn cho phép câu hỏi về bot
    if (ALLOWED_KEYWORDS_VANLANGBOT.aboutBot.some(g => lowerMessage.includes(g))) {
        console.log(`Chatbot Intent: Detected question about bot - "${lowerMessage}"`);
        return true;
    }

    // 3. Kiểm tra từ khóa bị chặn
    for (const category in BLOCKED_KEYWORDS_VANLANGBOT) {
        if (BLOCKED_KEYWORDS_VANLANGBOT[category].some(keyword => lowerMessage.includes(keyword))) {
            console.log(`Chatbot Intent: Detected blocked keyword in "${lowerMessage}" (category: ${category})`);
            return false;
        }
    }

    // 4. Kiểm tra từ khóa được cho phép
    for (const category in ALLOWED_KEYWORDS_VANLANGBOT) {
        if (category === 'greetings' || category === 'aboutBot') continue;
        if (ALLOWED_KEYWORDS_VANLANGBOT[category].some(keyword => lowerMessage.includes(keyword))) {
            console.log(`Chatbot Intent: Detected allowed financial keyword in "${lowerMessage}" (category: ${category})`);
            return true;
        }
    }

    console.log(`Chatbot Intent: Message "${lowerMessage}" did not match allowed financial topics or greetings/aboutBot.`);
    return false;
}

function formatVanLangBotResponse(text) {
    if (!text || typeof text !== 'string') return "Xin lỗi, tôi chưa có phản hồi cho bạn lúc này.";

    let formattedText = text;
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '$1');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '$1');
    formattedText = formattedText.replace(/```[\s\S]*?```/g, '');

    formattedText = formattedText.split('\\n').map(line => line.trim()).filter(line => line.length > 0).join('\\n');
    formattedText = formattedText.replace(/\\n+/g, '\\n').trim();

    return formattedText;
}

// Mock data function cho legacy chatbot
async function getLegacyUserFinancialData(userId) {
    console.log(`Legacy Chatbot: Attempting to fetch financial data for userId: ${userId}`);
    const mockFinancialData = {
        incomeThisMonth: Math.floor(Math.random() * 10000000) + 20000000,
        expensesThisMonth: {
            food: Math.floor(Math.random() * 2000000) + 3000000,
            transportation: Math.floor(Math.random() * 1000000) + 500000,
            shopping: Math.floor(Math.random() * 1500000) + 1000000,
            utilities: Math.floor(Math.random() * 500000) + 500000,
        },
        totalSavings: Math.floor(Math.random() * 50000000) + 50000000,
        investments: [
            { type: 'cổ phiếu', name: 'VinGroup (VIC)', value: Math.floor(Math.random() * 10000000) + 15000000 },
            { type: 'vàng', quantity: `${Math.floor(Math.random() * 5) + 1} chỉ SJC`, value: Math.floor(Math.random() * 10000000) + 25000000 },
            { type: 'tiền điện tử', name: 'Bitcoin (BTC)', value: Math.floor(Math.random() * 5000000) + 5000000 },
        ],
        activeBudgets: [
            { category: 'Ăn uống', limit: 6000000, spent: 4500000 },
            { category: 'Giải trí', limit: 2000000, spent: 1000000 },
        ]
    };
    return mockFinancialData;
}

const legacySystemInstructionText = `Bạn là VanLangBot, một trợ lý tài chính thông minh và thân thiện của ứng dụng VanLang Budget.
Nhiệm vụ của bạn là HỖ TRỢ người dùng quản lý tài chính cá nhân của họ một cách hiệu quả ngay trong ứng dụng.
LUÔN LUÔN giữ thái độ lịch sự, tích cực và hữu ích.
CHỈ trả lời các câu hỏi liên quan trực tiếp đến:
- Tình hình thu nhập, chi tiêu, ngân sách cá nhân dựa trên dữ liệu được cung cấp (nếu có).
- Các loại hình đầu tư được quản lý trong ứng dụng VanLang Budget (ví dụ: cổ phiếu, vàng, tiền điện tử, tiết kiệm).
- Phân tích xu hướng tài chính cá nhân của người dùng.
- Đưa ra các gợi ý thông minh về cách tiết kiệm, lập ngân sách, hoặc các mẹo quản lý tài chính cá nhân nói chung.
- Trả lời các câu hỏi về chức năng của chính bạn (VanLangBot).

QUY TẮC QUAN TRỌNG:
1. TỪ CHỐI dứt khoát và lịch sự MỌI câu hỏi không liên quan đến các chủ đề trên.
2. Nếu người dùng hỏi về thông tin tài chính cá nhân của họ VÀ bạn được cung cấp dữ liệu, hãy SỬ DỤNG dữ liệu đó để trả lời một cách tự nhiên và chính xác.
3. Nếu người dùng hỏi về thông tin tài chính cá nhân mà bạn KHÔNG có dữ liệu hoặc dữ liệu không đủ, hãy thông báo rõ ràng.
4. KHÔNG đưa ra lời khuyên đầu tư mang tính chất pháp lý, cam kết lợi nhuận, hoặc các nhận định thị trường quá chi tiết và chuyên sâu.
5. KHÔNG tiết lộ bất kỳ thông tin nào về cách bạn hoạt động, công nghệ nền tảng, hoặc chi tiết kỹ thuật của ứng dụng VanLang Budget.
6. Khi trả lời, hãy cố gắng ngắn gọn, đi thẳng vào vấn đề, và dễ hiểu.
7. Nếu câu hỏi của người dùng quá mơ hồ hoặc không đủ thông tin, hãy lịch sự yêu cầu họ cung cấp thêm chi tiết.`;

// === END LEGACY CHATBOT FUNCTIONS ===

// Initialize services
const nlpService = new NLPService();
const cacheService = getCacheService();
const calculationService = new FinancialCalculationService();

// Validate Gemini API key
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY không được cấu hình trong .env file');
    throw new Error('Gemini API key is required for enhanced chatbot functionality');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('✅ Gemini AI initialized successfully');

// Rate limiting: 30 requests per minute per user
const chatbotRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per windowMs
    message: {
        success: false,
        error: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ 1 phút.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip, // Rate limit per user, not IP
});

// Analytics tracking
const analytics = {
    totalRequests: 0,
    successfulResponses: 0,
    blockedRequests: 0,
    averageResponseTime: 0,
    responseTimeSum: 0,
    intentDistribution: {},
    errorTypes: {},

    track(event, data = {}) {
        this.totalRequests++;

        if (event === 'success') {
            this.successfulResponses++;
            this.responseTimeSum += data.responseTime || 0;
            this.averageResponseTime = this.responseTimeSum / this.successfulResponses;
        }

        if (event === 'blocked') {
            this.blockedRequests++;
        }

        if (data.intent) {
            this.intentDistribution[data.intent] = (this.intentDistribution[data.intent] || 0) + 1;
        }

        if (data.error) {
            this.errorTypes[data.error] = (this.errorTypes[data.error] || 0) + 1;
        }
    },

    getStats() {
        return {
            ...this,
            successRate: this.successfulResponses / this.totalRequests || 0,
            blockRate: this.blockedRequests / this.totalRequests || 0
        };
    }
};

/**
 * Enhanced system instruction với multilingual support và calculation capabilities
 */
const getSystemInstruction = (language = 'vi') => {
    const instructions = {
        vi: `Bạn là VanLangBot, trợ lý tài chính thông minh của ứng dụng VanLang Budget.

CHỈ trả lời các câu hỏi về:
- Quản lý tài chính cá nhân (thu nhập, chi tiêu, ngân sách)
- Đầu tư (cổ phiếu, vàng, crypto, tiết kiệm)
- Phân tích và tính toán dữ liệu tài chính được cung cấp
- Dự đoán xu hướng và so sánh theo thời gian
- Gợi ý tiết kiệm và lập ngân sách thông minh
- Kế hoạch tài chính và mục tiêu tiết kiệm
- Tính toán lãi suất, ROI, và hiệu quả đầu tư
- Chức năng của VanLangBot và hướng dẫn sử dụng

KHẢ NĂNG TÍNH TOÁN:
- Phân tích thu nhập và xu hướng
- Tính toán chi tiêu theo danh mục
- Đánh giá hiệu quả đầu tư và ROI
- Phân tích ngân sách và mức độ sử dụng
- Dự đoán chi tiêu tương lai
- Tính toán mục tiêu tiết kiệm
- So sánh dữ liệu theo thời gian

QUY TẮC:
1. TỪ CHỐI lịch sự mọi chủ đề khác (thời tiết, tin tức, giải trí...)
2. KHÔNG tự bịa số liệu, chỉ dùng dữ liệu được cung cấp
3. Cung cấp tính toán chính xác và giải thích rõ ràng
4. Đưa ra gợi ý thực tế và khả thi
5. Sử dụng emoji phù hợp (💰, 📊, 💡, ⚠️, 🧮, 📈)
6. Trả lời ngắn gọn nhưng đầy đủ thông tin
7. Luôn thân thiện và hữu ích

CÁC LOẠI CÂU HỎI CÓ THỂ TRẢ LỜI:
- "Thu nhập của tôi tháng này bao nhiêu?"
- "Phân tích chi tiêu tháng này"
- "Tính toán lợi nhuận đầu tư"
- "So sánh thu chi tháng này với tháng trước"
- "Dự đoán xu hướng chi tiêu"
- "Tôi có thể tiết kiệm 100 triệu trong bao lâu?"
- "Phân tích ngân sách hiện tại"
- "Gợi ý phân bổ thu nhập"`,

        en: `You are VanLangBot, the intelligent financial assistant for VanLang Budget app.

ONLY answer questions about:
- Personal finance management (income, expenses, budgets)
- Investments (stocks, gold, crypto, savings)
- Financial data analysis and calculations
- Trend predictions and time-based comparisons
- Smart saving and budgeting suggestions
- Financial planning and savings goals
- Interest calculations, ROI, and investment efficiency
- VanLangBot features and usage guidance

CALCULATION CAPABILITIES:
- Income analysis and trends
- Expense calculations by category
- Investment efficiency and ROI assessment
- Budget analysis and usage levels
- Future expense predictions
- Savings goal calculations
- Time-based data comparisons

RULES:
1. Politely REFUSE all other topics (weather, news, entertainment...)
2. DON'T make up numbers, only use provided data
3. Provide accurate calculations with clear explanations
4. Give practical and achievable suggestions
5. Use appropriate emojis (💰, 📊, 💡, ⚠️, 🧮, 📈)
6. Keep answers concise but informative
7. Always be friendly and helpful

QUESTION TYPES YOU CAN ANSWER:
- "How much is my income this month?"
- "Analyze this month's expenses"
- "Calculate investment returns"
- "Compare this month's income vs last month"
- "Predict spending trends"
- "How long to save 100 million VND?"
- "Analyze current budget"
- "Suggest income allocation"`
    };

    return instructions[language] || instructions.vi;
};

/**
 * Lấy dữ liệu tài chính thật từ database với caching
 */
async function getUserFinancialDataCached(userId) {
    try {
        // Thử lấy từ cache trước
        let financialData = await cacheService.getUserFinancialData(userId);

        if (!financialData) {
            console.log(`Fetching real financial data for user: ${userId}`);

            // Lấy thời gian hiện tại để tính toán tháng này
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            // 1. Lấy thu nhập tháng này
            const incomes = await Income.find({
                userId: userId,
                date: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                },
                active: true
            });

            const incomeThisMonth = incomes.reduce((total, income) => total + (income.amount || 0), 0);

            // 2. Lấy chi tiêu tháng này theo category
            const expenses = await Expense.find({
                userId: userId,
                date: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                },
                active: true
            }).populate('categoryId', 'name');

            // Group expenses by category
            const expensesThisMonth = {};
            let totalExpenses = 0;

            expenses.forEach(expense => {
                const categoryName = expense.categoryId?.name || 'Khác';
                const amount = expense.amount || 0;

                if (!expensesThisMonth[categoryName]) {
                    expensesThisMonth[categoryName] = 0;
                }
                expensesThisMonth[categoryName] += amount;
                totalExpenses += amount;
            });

            // 3. Lấy thông tin đầu tư
            const investments = await Investment.find({
                userId: userId,
                active: true
            });

            const investmentData = investments.map(inv => ({
                type: inv.type || 'Khác',
                name: inv.symbol || inv.name || 'Không rõ',
                value: (inv.quantity || 0) * (inv.currentPrice || inv.purchasePrice || 0),
                quantity: inv.quantity,
                currentPrice: inv.currentPrice,
                profit: inv.totalValue - inv.totalInvested
            }));

            const totalInvestmentValue = investmentData.reduce((total, inv) => total + (inv.value || 0), 0);

            // 4. Lấy ngân sách đang hoạt động
            const budgets = await Budget.find({
                userId: userId,
                active: true,
                period: 'monthly'
            }).populate('categoryId', 'name');

            const activeBudgets = budgets.map(budget => {
                const categoryName = budget.categoryId?.name || budget.category || 'Khác';
                const spent = expensesThisMonth[categoryName] || 0;

                return {
                    category: categoryName,
                    limit: budget.amount || 0,
                    spent: spent,
                    remaining: (budget.amount || 0) - spent,
                    percentUsed: budget.amount ? Math.round((spent / budget.amount) * 100) : 0
                };
            });

            // 5. Tính tổng tiết kiệm (thu nhập - chi tiêu tích lũy)
            const allIncomes = await Income.find({ userId: userId, active: true });
            const allExpenses = await Expense.find({ userId: userId, active: true });

            const totalIncomeAllTime = allIncomes.reduce((total, income) => total + (income.amount || 0), 0);
            const totalExpenseAllTime = allExpenses.reduce((total, expense) => total + (expense.amount || 0), 0);
            const totalSavings = Math.max(0, totalIncomeAllTime - totalExpenseAllTime);

            // 6. Thống kê tháng trước để so sánh
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

            const lastMonthIncomes = await Income.find({
                userId: userId,
                date: { $gte: lastMonthStart, $lte: lastMonthEnd },
                active: true
            });

            const lastMonthExpenses = await Expense.find({
                userId: userId,
                date: { $gte: lastMonthStart, $lte: lastMonthEnd },
                active: true
            });

            const incomeLastMonth = lastMonthIncomes.reduce((total, income) => total + (income.amount || 0), 0);
            const expenseLastMonth = lastMonthExpenses.reduce((total, expense) => total + (expense.amount || 0), 0);

            // Tạo financial data object
            financialData = {
                // Thu nhập
                incomeThisMonth,
                incomeLastMonth,
                incomeChange: incomeThisMonth - incomeLastMonth,

                // Chi tiêu
                expensesThisMonth,
                totalExpensesThisMonth: totalExpenses,
                expenseLastMonth,
                expenseChange: totalExpenses - expenseLastMonth,

                // Tiết kiệm
                totalSavings,
                savingsThisMonth: incomeThisMonth - totalExpenses,

                // Đầu tư
                investments: investmentData,
                totalInvestmentValue,

                // Ngân sách
                activeBudgets,

                // Metadata
                period: {
                    startOfMonth: startOfMonth.toISOString(),
                    endOfMonth: endOfMonth.toISOString(),
                    month: now.getMonth() + 1,
                    year: now.getFullYear()
                },

                lastUpdated: new Date().toISOString(),
                dataSource: 'database'
            };

            console.log(`Financial data summary for user ${userId}:`, {
                incomeThisMonth,
                totalExpensesThisMonth: totalExpenses,
                totalSavings,
                investmentCount: investments.length,
                budgetCount: budgets.length
            });

            // Cache data for 30 minutes
            await cacheService.cacheUserFinancialData(userId, financialData);
        } else {
            console.log(`Using cached financial data for user: ${userId}`);
        }

        return financialData;

    } catch (error) {
        console.error('Error fetching user financial data:', error);

        // Return basic structure để tránh crash
        return {
            incomeThisMonth: 0,
            expensesThisMonth: {},
            totalExpensesThisMonth: 0,
            totalSavings: 0,
            investments: [],
            activeBudgets: [],
            error: 'Không thể lấy dữ liệu tài chính',
            lastUpdated: new Date().toISOString(),
            dataSource: 'error-fallback'
        };
    }
}

/**
 * Format financial context cho Gemini với dữ liệu thật
 */
function formatFinancialContext(financialData, language = 'vi') {
    if (!financialData) return '';

    const templates = {
        vi: {
            income: `💰 Thu nhập tháng này: ${financialData.incomeThisMonth?.toLocaleString('vi-VN')} VND`,
            incomeChange: financialData.incomeChange > 0 ?
                `📈 Tăng ${financialData.incomeChange.toLocaleString('vi-VN')} VND so với tháng trước` :
                `📉 Giảm ${Math.abs(financialData.incomeChange).toLocaleString('vi-VN')} VND so với tháng trước`,
            expenses: `💸 Chi tiêu tháng này: ${financialData.totalExpensesThisMonth?.toLocaleString('vi-VN')} VND`,
            expenseChange: financialData.expenseChange > 0 ?
                `📈 Tăng ${financialData.expenseChange.toLocaleString('vi-VN')} VND so với tháng trước` :
                `📉 Giảm ${Math.abs(financialData.expenseChange).toLocaleString('vi-VN')} VND so với tháng trước`,
            savings: `🏦 Tổng tiết kiệm tích lũy: ${financialData.totalSavings?.toLocaleString('vi-VN')} VND`,
            savingsThisMonth: `💎 Tiết kiệm tháng này: ${financialData.savingsThisMonth?.toLocaleString('vi-VN')} VND`,
            investments: `📊 Đầu tư hiện có:`,
            budgets: `📋 Tình hình ngân sách:`
        },
        en: {
            income: `💰 Monthly income: ${financialData.incomeThisMonth?.toLocaleString('en-US')} VND`,
            incomeChange: financialData.incomeChange > 0 ?
                `📈 Increased ${financialData.incomeChange.toLocaleString('en-US')} VND from last month` :
                `📉 Decreased ${Math.abs(financialData.incomeChange).toLocaleString('en-US')} VND from last month`,
            expenses: `💸 Monthly expenses: ${financialData.totalExpensesThisMonth?.toLocaleString('en-US')} VND`,
            expenseChange: financialData.expenseChange > 0 ?
                `📈 Increased ${financialData.expenseChange.toLocaleString('en-US')} VND from last month` :
                `📉 Decreased ${Math.abs(financialData.expenseChange).toLocaleString('en-US')} VND from last month`,
            savings: `🏦 Total accumulated savings: ${financialData.totalSavings?.toLocaleString('en-US')} VND`,
            savingsThisMonth: `💎 This month's savings: ${financialData.savingsThisMonth?.toLocaleString('en-US')} VND`,
            investments: `📊 Current investments:`,
            budgets: `📋 Budget status:`
        }
    };

    const t = templates[language] || templates.vi;
    let context = `\n\n📊 DỮ LIỆU TÀI CHÍNH THÁNG ${financialData.period?.month}/${financialData.period?.year}:\n`;

    // Thu nhập
    if (financialData.incomeThisMonth !== undefined) {
        context += `${t.income}\n`;
        if (financialData.incomeChange !== undefined && financialData.incomeLastMonth !== undefined) {
            context += `${t.incomeChange}\n`;
        }
    }

    // Chi tiêu
    if (financialData.totalExpensesThisMonth !== undefined) {
        context += `${t.expenses}\n`;
        if (financialData.expenseChange !== undefined) {
            context += `${t.expenseChange}\n`;
        }

        // Chi tiết chi tiêu theo danh mục
        if (financialData.expensesThisMonth && Object.keys(financialData.expensesThisMonth).length > 0) {
            context += `   📝 Chi tiết: `;
            const expenseDetails = Object.entries(financialData.expensesThisMonth)
                .sort(([, a], [, b]) => b - a) // Sort by amount desc
                .slice(0, 5) // Top 5 categories only
                .map(([category, amount]) => `${category}: ${amount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND`)
                .join(', ');
            context += expenseDetails + '\n';
        }
    }

    // Tiết kiệm
    if (financialData.totalSavings !== undefined) {
        context += `${t.savings}\n`;
    }

    if (financialData.savingsThisMonth !== undefined) {
        context += `${t.savingsThisMonth}\n`;
    }

    // Đầu tư
    if (financialData.investments?.length > 0) {
        context += `${t.investments}\n`;
        const investmentDetails = financialData.investments
            .slice(0, 3) // Top 3 investments only
            .map(inv => {
                const profitText = inv.profit > 0 ?
                    `(+${inv.profit.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND)` :
                    `(${inv.profit.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND)`;
                return `   • ${inv.type}: ${inv.name} - ${inv.value.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND ${profitText}`;
            })
            .join('\n');
        context += investmentDetails + '\n';

        if (financialData.totalInvestmentValue) {
            context += `   💼 Tổng giá trị đầu tư: ${financialData.totalInvestmentValue.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND\n`;
        }
    }

    // Ngân sách
    if (financialData.activeBudgets?.length > 0) {
        context += `${t.budgets}\n`;
        const budgetDetails = financialData.activeBudgets
            .slice(0, 3) // Top 3 budgets only
            .map(budget => {
                const status = budget.percentUsed > 90 ? '🔴' :
                    budget.percentUsed > 70 ? '🟡' : '🟢';
                return `   ${status} ${budget.category}: ${budget.spent.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}/${budget.limit.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND (${budget.percentUsed}%)`;
            })
            .join('\n');
        context += budgetDetails + '\n';
    }

    // Cảnh báo nếu có
    const warnings = [];

    if (financialData.savingsThisMonth < 0) {
        warnings.push('⚠️ Chi tiêu vượt thu nhập tháng này');
    }

    if (financialData.activeBudgets?.some(b => b.percentUsed > 90)) {
        warnings.push('⚠️ Có ngân sách sắp vượt giới hạn');
    }

    if (warnings.length > 0) {
        context += `\n🚨 CẢNH BÁO:\n${warnings.join('\n')}\n`;
    }

    return context;
}

/**
 * Thực hiện tính toán dựa trên intent và financial data
 */
async function performCalculation(intent, financialData, message, language = 'vi') {
    try {
        let result = null;
        const templates = {
            vi: {
                noData: 'Không có đủ dữ liệu để thực hiện tính toán.',
                error: 'Có lỗi xảy ra khi tính toán.',
                currency: 'VND'
            },
            en: {
                noData: 'Insufficient data to perform calculation.',
                error: 'Error occurred during calculation.',
                currency: 'VND'
            }
        };

        const t = templates[language] || templates.vi;

        switch (intent) {
            case 'calculate_income':
                result = calculateIncomeAnalysis(financialData, language);
                break;

            case 'calculate_expense':
                result = calculateExpenseAnalysis(financialData, language);
                break;

            case 'calculate_investment':
                result = calculateInvestmentAnalysis(financialData, language);
                break;

            case 'calculate_budget':
                result = calculateBudgetAnalysis(financialData, language);
                break;

            case 'trend_analysis':
                result = calculateTrendAnalysis(financialData, language);
                break;

            case 'financial_planning':
                result = calculateFinancialPlanning(financialData, message, language);
                break;

            case 'general_calculation':
                result = performGeneralCalculation(financialData, message, language);
                break;

            default:
                return t.noData;
        }

        return result || t.error;

    } catch (error) {
        console.error('Calculation error:', error);
        return language === 'vi' ?
            'Có lỗi xảy ra khi tính toán. Vui lòng thử lại.' :
            'Calculation error occurred. Please try again.';
    }
}

/**
 * Tính toán phân tích thu nhập
 */
function calculateIncomeAnalysis(financialData, language = 'vi') {
    if (!financialData.incomeThisMonth) {
        return language === 'vi' ?
            'Không có dữ liệu thu nhập để phân tích.' :
            'No income data available for analysis.';
    }

    const trend = calculationService.analyzeTrend(
        financialData.incomeThisMonth,
        financialData.incomeLastMonth || 0,
        'income'
    );

    const recommendedBudget = calculationService.calculateRecommendedBudget(financialData.incomeThisMonth);

    return language === 'vi' ? `
📊 **Phân tích Thu nhập:**

💰 Thu nhập hiện tại: ${financialData.incomeThisMonth.toLocaleString('vi-VN')} VND

📈 Xu hướng: ${trend.trend === 'growing' ? 'Tăng' : trend.trend === 'declining' ? 'Giảm' : 'Ổn định'}
📊 Thay đổi: ${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}% so với tháng trước

💡 **Phân bổ ngân sách khuyến nghị (50/30/20 Rule):**
• Nhu cầu thiết yếu: ${recommendedBudget.budgetAllocation.necessities.toLocaleString('vi-VN')} VND (50%)
• Chi tiêu cá nhân: ${recommendedBudget.budgetAllocation.wants.toLocaleString('vi-VN')} VND (30%)
• Tiết kiệm: ${recommendedBudget.budgetAllocation.savings.toLocaleString('vi-VN')} VND (20%)

🎯 **Gợi ý:** ${trend.analysis}
    ` : `
📊 **Income Analysis:**

💰 Current income: ${financialData.incomeThisMonth.toLocaleString('en-US')} VND

📈 Trend: ${trend.trend}
📊 Change: ${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}% from last month

💡 **Recommended Budget Allocation (50/30/20 Rule):**
• Necessities: ${recommendedBudget.budgetAllocation.necessities.toLocaleString('en-US')} VND (50%)
• Wants: ${recommendedBudget.budgetAllocation.wants.toLocaleString('en-US')} VND (30%)
• Savings: ${recommendedBudget.budgetAllocation.savings.toLocaleString('en-US')} VND (20%)

🎯 **Suggestion:** ${trend.analysis}
    `;
}

/**
 * Tính toán phân tích chi tiêu
 */
function calculateExpenseAnalysis(financialData, language = 'vi') {
    if (!financialData.totalExpensesThisMonth) {
        return language === 'vi' ?
            'Không có dữ liệu chi tiêu để phân tích.' :
            'No expense data available for analysis.';
    }

    const trend = calculationService.analyzeTrend(
        financialData.totalExpensesThisMonth,
        financialData.expenseLastMonth || 0,
        'expense'
    );

    const spendingRate = financialData.incomeThisMonth > 0 ?
        (financialData.totalExpensesThisMonth / financialData.incomeThisMonth) * 100 : 0;

    // Top expense categories
    const sortedExpenses = Object.entries(financialData.expensesThisMonth || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return language === 'vi' ? `
💸 **Phân tích Chi tiêu:**

💰 Tổng chi tiêu: ${financialData.totalExpensesThisMonth.toLocaleString('vi-VN')} VND
📊 Tỷ lệ chi tiêu: ${spendingRate.toFixed(1)}% thu nhập

📈 Xu hướng: ${trend.trend === 'increasing' ? 'Tăng' : trend.trend === 'decreasing' ? 'Giảm' : 'Ổn định'}
📊 Thay đổi: ${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}% so với tháng trước

🏆 **Top 3 danh mục chi tiêu:**
${sortedExpenses.map(([category, amount], index) =>
        `${index + 1}. ${category}: ${amount.toLocaleString('vi-VN')} VND`
    ).join('\n')}

⚠️ **Đánh giá:** ${spendingRate > 80 ? 'Chi tiêu cao, cần kiểm soát' :
            spendingRate > 60 ? 'Chi tiêu ở mức trung bình' :
                'Chi tiêu hợp lý'}

🎯 **Gợi ý:** ${trend.analysis}
    ` : `
💸 **Expense Analysis:**

💰 Total expenses: ${financialData.totalExpensesThisMonth.toLocaleString('en-US')} VND
📊 Spending rate: ${spendingRate.toFixed(1)}% of income

📈 Trend: ${trend.trend}
📊 Change: ${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}% from last month

🏆 **Top 3 expense categories:**
${sortedExpenses.map(([category, amount], index) =>
                    `${index + 1}. ${category}: ${amount.toLocaleString('en-US')} VND`
                ).join('\n')}

⚠️ **Assessment:** ${spendingRate > 80 ? 'High spending, needs control' :
        spendingRate > 60 ? 'Average spending level' :
            'Reasonable spending'}

🎯 **Suggestion:** ${trend.analysis}
    `;
}

/**
 * Tính toán phân tích đầu tư
 */
function calculateInvestmentAnalysis(financialData, language = 'vi') {
    if (!financialData.investments || financialData.investments.length === 0) {
        return language === 'vi' ?
            'Bạn chưa có khoản đầu tư nào để phân tích.' :
            'No investments available for analysis.';
    }

    const investmentData = financialData.investments.map(inv => ({
        ...inv,
        invested: inv.value - (inv.profit || 0) // Estimate invested amount
    }));

    const efficiency = calculationService.calculateInvestmentEfficiency(investmentData);

    return language === 'vi' ? `
📈 **Phân tích Đầu tư:**

💼 Tổng giá trị đầu tư: ${efficiency.summary.totalCurrentValue.toLocaleString('vi-VN')} VND
💰 Tổng lợi nhuận: ${efficiency.summary.totalProfit > 0 ? '+' : ''}${efficiency.summary.totalProfit.toLocaleString('vi-VN')} VND
📊 Tỷ suất sinh lời: ${efficiency.summary.overallReturn > 0 ? '+' : ''}${efficiency.summary.overallReturn}%

🏆 **Hiệu quả tổng thể:** ${efficiency.summary.performance === 'excellent' ? 'Xuất sắc' :
            efficiency.summary.performance === 'good' ? 'Tốt' :
                efficiency.summary.performance === 'average' ? 'Trung bình' : 'Cần cải thiện'}

📋 **Chi tiết đầu tư:**
${efficiency.investments.map(inv =>
                    `• ${inv.type}: ${inv.name} - ${inv.profitPercent > 0 ? '+' : ''}${inv.profitPercent}%`
                ).join('\n')}

🎯 **Gợi ý:** ${efficiency.summary.overallReturn > 8 ?
            'Danh mục đầu tư có hiệu quả tốt!' :
            'Cân nhắc đa dạng hóa danh mục đầu tư.'}
    ` : `
📈 **Investment Analysis:**

💼 Total investment value: ${efficiency.summary.totalCurrentValue.toLocaleString('en-US')} VND
💰 Total profit: ${efficiency.summary.totalProfit > 0 ? '+' : ''}${efficiency.summary.totalProfit.toLocaleString('en-US')} VND
📊 Return rate: ${efficiency.summary.overallReturn > 0 ? '+' : ''}${efficiency.summary.overallReturn}%

🏆 **Overall performance:** ${efficiency.summary.performance}

📋 **Investment details:**
${efficiency.investments.map(inv =>
                `• ${inv.type}: ${inv.name} - ${inv.profitPercent > 0 ? '+' : ''}${inv.profitPercent}%`
            ).join('\n')}

🎯 **Suggestion:** ${efficiency.summary.overallReturn > 8 ?
        'Your investment portfolio is performing well!' :
        'Consider diversifying your investment portfolio.'}
    `;
}

/**
 * Tính toán phân tích ngân sách
 */
function calculateBudgetAnalysis(financialData, language = 'vi') {
    if (!financialData.activeBudgets || financialData.activeBudgets.length === 0) {
        return language === 'vi' ?
            'Bạn chưa có ngân sách nào để phân tích.' :
            'No budgets available for analysis.';
    }

    const budgets = financialData.activeBudgets;
    const overBudget = budgets.filter(b => b.percentUsed > 100);
    const nearLimit = budgets.filter(b => b.percentUsed > 80 && b.percentUsed <= 100);
    const healthy = budgets.filter(b => b.percentUsed <= 80);

    return language === 'vi' ? `
📋 **Phân tích Ngân sách:**

📊 **Tổng quan:**
• Vượt ngân sách: ${overBudget.length} danh mục
• Gần giới hạn: ${nearLimit.length} danh mục
• Khỏe mạnh: ${healthy.length} danh mục

${overBudget.length > 0 ? `🔴 **Vượt ngân sách:**
${overBudget.map(b => `• ${b.category}: ${b.percentUsed}% (vượt ${b.percentUsed - 100}%)`).join('\n')}
` : ''}

${nearLimit.length > 0 ? `🟡 **Gần giới hạn:**
${nearLimit.map(b => `• ${b.category}: ${b.percentUsed}%`).join('\n')}
` : ''}

🟢 **Danh mục khỏe mạnh:**
${healthy.slice(0, 3).map(b => `• ${b.category}: ${b.percentUsed}%`).join('\n')}

🎯 **Gợi ý:** ${overBudget.length > 0 ?
            'Cần kiểm soát chi tiêu cho các danh mục vượt ngân sách.' :
            nearLimit.length > 0 ?
                'Chú ý theo dõi các danh mục gần giới hạn.' :
                'Ngân sách được quản lý tốt!'}
    ` : `
📋 **Budget Analysis:**

📊 **Overview:**
• Over budget: ${overBudget.length} categories
• Near limit: ${nearLimit.length} categories
• Healthy: ${healthy.length} categories

${overBudget.length > 0 ? `🔴 **Over budget:**
${overBudget.map(b => `• ${b.category}: ${b.percentUsed}% (over ${b.percentUsed - 100}%)`).join('\n')}
` : ''}

${nearLimit.length > 0 ? `🟡 **Near limit:**
${nearLimit.map(b => `• ${b.category}: ${b.percentUsed}%`).join('\n')}
` : ''}

🟢 **Healthy categories:**
${healthy.slice(0, 3).map(b => `• ${b.category}: ${b.percentUsed}%`).join('\n')}

🎯 **Suggestion:** ${overBudget.length > 0 ?
        'Need to control spending for over-budget categories.' :
        nearLimit.length > 0 ?
            'Monitor categories approaching limits.' :
            'Budget is well managed!'}
    `;
}

/**
 * Tính toán xu hướng tài chính
 */
function calculateTrendAnalysis(financialData, language = 'vi') {
    const incomeTrend = calculationService.analyzeTrend(
        financialData.incomeThisMonth || 0,
        financialData.incomeLastMonth || 0,
        'income'
    );

    const expenseTrend = calculationService.analyzeTrend(
        financialData.totalExpensesThisMonth || 0,
        financialData.expenseLastMonth || 0,
        'expense'
    );

    const savingsTrend = {
        current: financialData.savingsThisMonth || 0,
        previous: (financialData.incomeLastMonth || 0) - (financialData.expenseLastMonth || 0)
    };

    return language === 'vi' ? `
📈 **Phân tích Xu hướng Tài chính:**

💰 **Thu nhập:**
${incomeTrend.changePercent > 0 ? '📈' : incomeTrend.changePercent < 0 ? '📉' : '➡️'} ${incomeTrend.changePercent > 0 ? '+' : ''}${incomeTrend.changePercent}% so với tháng trước
💡 ${incomeTrend.analysis}

💸 **Chi tiêu:**
${expenseTrend.changePercent > 0 ? '📈' : expenseTrend.changePercent < 0 ? '📉' : '➡️'} ${expenseTrend.changePercent > 0 ? '+' : ''}${expenseTrend.changePercent}% so với tháng trước
💡 ${expenseTrend.analysis}

💎 **Tiết kiệm:**
Tháng này: ${savingsTrend.current.toLocaleString('vi-VN')} VND
Tháng trước: ${savingsTrend.previous.toLocaleString('vi-VN')} VND

🎯 **Tổng kết:** ${savingsTrend.current > savingsTrend.previous ?
            'Tình hình tài chính cải thiện!' :
            savingsTrend.current < 0 ?
                'Cần chú ý kiểm soát chi tiêu.' :
                'Tình hình tài chính ổn định.'}
    ` : `
📈 **Financial Trend Analysis:**

💰 **Income:**
${incomeTrend.changePercent > 0 ? '📈' : incomeTrend.changePercent < 0 ? '📉' : '➡️'} ${incomeTrend.changePercent > 0 ? '+' : ''}${incomeTrend.changePercent}% from last month
💡 ${incomeTrend.analysis}

💸 **Expenses:**
${expenseTrend.changePercent > 0 ? '📈' : expenseTrend.changePercent < 0 ? '📉' : '➡️'} ${expenseTrend.changePercent > 0 ? '+' : ''}${expenseTrend.changePercent}% from last month
💡 ${expenseTrend.analysis}

💎 **Savings:**
This month: ${savingsTrend.current.toLocaleString('en-US')} VND
Last month: ${savingsTrend.previous.toLocaleString('en-US')} VND

🎯 **Summary:** ${savingsTrend.current > savingsTrend.previous ?
        'Financial situation is improving!' :
        savingsTrend.current < 0 ?
            'Need to monitor spending carefully.' :
            'Financial situation is stable.'}
    `;
}

/**
 * Tính toán kế hoạch tài chính
 */
function calculateFinancialPlanning(financialData, message, language = 'vi') {
    // Extract goal amount from message if possible
    const numberMatch = message.match(/(\d{1,3}(?:[,\.]\d{3})*)/);
    const goalAmount = numberMatch ? parseInt(numberMatch[1].replace(/[,\.]/g, '')) * 1000 : 50000000; // Default 50M

    const savingsGoal = calculationService.calculateSavingsGoal(
        goalAmount,
        financialData.totalSavings || 0,
        financialData.incomeThisMonth || 0,
        financialData.totalExpensesThisMonth || 0,
        12 // 1 year timeframe
    );

    const emergencyFund = calculationService.calculateEmergencyFund(
        financialData.totalExpensesThisMonth || 0,
        6
    );

    return language === 'vi' ? `
🎯 **Kế hoạch Tài chính:**

💰 **Mục tiêu tiết kiệm:** ${goalAmount.toLocaleString('vi-VN')} VND

📊 **Phân tích khả năng:**
• Có thể đạt được: ${savingsGoal.canReach ? '✅ Có' : '❌ Khó'}
• Thời gian cần: ${savingsGoal.monthsNeeded} tháng
• Tiết kiệm hàng tháng hiện tại: ${savingsGoal.currentMonthlySavings.toLocaleString('vi-VN')} VND
• Cần tiết kiệm hàng tháng: ${savingsGoal.monthlySavingsRequired.toLocaleString('vi-VN')} VND
• Tỷ lệ tiết kiệm: ${savingsGoal.savingsRate}%

🚨 **Quỹ khẩn cấp:**
${emergencyFund.recommendation}

💡 **Khuyến nghị:** ${savingsGoal.recommendation}

🎯 **Bước tiếp theo:** ${savingsGoal.canReach ?
            'Duy trì kế hoạch tiết kiệm hiện tại.' :
            savingsGoal.currentMonthlySavings <= 0 ?
                'Cần giảm chi tiêu hoặc tăng thu nhập trước.' :
                'Cân nhắc tăng mức tiết kiệm hàng tháng.'}
    ` : `
🎯 **Financial Planning:**

💰 **Savings goal:** ${goalAmount.toLocaleString('en-US')} VND

📊 **Feasibility analysis:**
• Can achieve: ${savingsGoal.canReach ? '✅ Yes' : '❌ Difficult'}
• Time needed: ${savingsGoal.monthsNeeded} months
• Current monthly savings: ${savingsGoal.currentMonthlySavings.toLocaleString('en-US')} VND
• Required monthly savings: ${savingsGoal.monthlySavingsRequired.toLocaleString('en-US')} VND
• Savings rate: ${savingsGoal.savingsRate}%

🚨 **Emergency fund:**
${emergencyFund.recommendation}

💡 **Recommendation:** ${savingsGoal.recommendation}

🎯 **Next steps:** ${savingsGoal.canReach ?
        'Maintain current savings plan.' :
        savingsGoal.currentMonthlySavings <= 0 ?
            'Need to reduce expenses or increase income first.' :
            'Consider increasing monthly savings amount.'}
    `;
}

/**
 * Tính toán chung
 */
function performGeneralCalculation(financialData, message, language = 'vi') {
    // Simple calculation based on available data
    const summary = {
        totalIncome: financialData.incomeThisMonth || 0,
        totalExpenses: financialData.totalExpensesThisMonth || 0,
        netSavings: (financialData.incomeThisMonth || 0) - (financialData.totalExpensesThisMonth || 0),
        savingsRate: financialData.incomeThisMonth > 0 ?
            (((financialData.incomeThisMonth || 0) - (financialData.totalExpensesThisMonth || 0)) / financialData.incomeThisMonth) * 100 : 0
    };

    return language === 'vi' ? `
🧮 **Tính toán Tài chính Tổng quan:**

💰 Thu nhập tháng này: ${summary.totalIncome.toLocaleString('vi-VN')} VND
💸 Chi tiêu tháng này: ${summary.totalExpenses.toLocaleString('vi-VN')} VND
💎 Tiết kiệm ròng: ${summary.netSavings.toLocaleString('vi-VN')} VND
📊 Tỷ lệ tiết kiệm: ${summary.savingsRate.toFixed(1)}%

📈 **Đánh giá:**
${summary.netSavings > 0 ?
            summary.savingsRate > 20 ? '🟢 Tuyệt vời! Bạn tiết kiệm được nhiều.' :
                summary.savingsRate > 10 ? '🟡 Tốt, nhưng có thể cải thiện thêm.' :
                    '🟠 Tiết kiệm ít, cần tăng cường.' :
            '🔴 Cảnh báo: Chi tiêu vượt thu nhập!'}

💡 **Gợi ý:** ${summary.savingsRate > 20 ? 'Cân nhắc đầu tư để tăng lợi nhuận.' :
            summary.savingsRate > 0 ? 'Tìm cách giảm chi tiêu không cần thiết.' :
                'Cần xem xét lại kế hoạch tài chính ngay.'}
    ` : `
🧮 **General Financial Calculation:**

💰 Monthly income: ${summary.totalIncome.toLocaleString('en-US')} VND
💸 Monthly expenses: ${summary.totalExpenses.toLocaleString('en-US')} VND
💎 Net savings: ${summary.netSavings.toLocaleString('en-US')} VND
📊 Savings rate: ${summary.savingsRate.toFixed(1)}%

📈 **Assessment:**
${summary.netSavings > 0 ?
        summary.savingsRate > 20 ? '🟢 Excellent! You\'re saving well.' :
            summary.savingsRate > 10 ? '🟡 Good, but can be improved.' :
                '🟠 Low savings, need improvement.' :
        '🔴 Warning: Expenses exceed income!'}

💡 **Suggestion:** ${summary.savingsRate > 20 ? 'Consider investing to increase returns.' :
        summary.savingsRate > 0 ? 'Look for ways to reduce unnecessary expenses.' :
            'Need to review financial plan immediately.'}
    `;
}

/**
 * Enhanced chatbot route
 */
router.post('/enhanced', chatbotRateLimit, authenticateToken, async (req, res) => {
    const startTime = Date.now();

    try {
        const { message, language = 'vi' } = req.body;
        const userId = req.user?.id || req.user?._id;

        // Validation
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            analytics.track('error', { error: 'invalid_message' });
            return res.status(400).json({
                success: false,
                error: language === 'vi' ?
                    'Tin nhắn không hợp lệ.' :
                    'Invalid message.'
            });
        }

        if (!userId) {
            analytics.track('error', { error: 'auth_failed' });
            return res.status(401).json({
                success: false,
                error: language === 'vi' ?
                    'Xác thực thất bại.' :
                    'Authentication failed.'
            });
        }

        // 1. Intent Analysis với caching
        let intentAnalysis = await cacheService.getIntentAnalysis(message);
        if (!intentAnalysis) {
            intentAnalysis = nlpService.analyzeIntent(message);
            await cacheService.cacheIntentAnalysis(message, intentAnalysis);
        }

        analytics.track('request', { intent: intentAnalysis.intent });

        // 2. Block inappropriate content
        if (intentAnalysis.intent === 'blocked_topic') {
            analytics.track('blocked');
            const response = language === 'vi' ?
                "❗ Tôi xin lỗi, tôi chỉ có thể hỗ trợ các câu hỏi về quản lý tài chính cá nhân trong ứng dụng VanLang Budget." :
                "❗ I apologize, I can only help with personal finance questions in the VanLang Budget app.";

            return res.json({ success: true, response });
        }

        // 3. Handle low confidence queries
        if (intentAnalysis.intent === 'unknown' || intentAnalysis.confidence < 0.3) {
            const response = language === 'vi' ?
                "🤔 Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về thu nhập, chi tiêu, ngân sách, hoặc đầu tư được không?" :
                "🤔 I don't quite understand your question. Could you ask about income, expenses, budgets, or investments?";

            return res.json({ success: true, response });
        }

        // 4. Prepare context và check for calculations
        let financialContext = '';
        let calculationResult = '';
        const needsFinancialData = /của tôi|my|hiện tại|current|tháng này|this month|tài khoản|account|tính|calculate|phân tích|analyze/.test(message.toLowerCase());

        if (needsFinancialData) {
            try {
                const financialData = await getUserFinancialDataCached(userId);
                financialContext = formatFinancialContext(financialData, language);

                // Thực hiện calculations nếu được yêu cầu
                if (intentAnalysis.details.needsCalculation ||
                    ['calculate_income', 'calculate_expense', 'calculate_investment', 'calculate_budget',
                        'trend_analysis', 'financial_planning', 'general_calculation'].includes(intentAnalysis.intent)) {

                    console.log(`Performing calculation for intent: ${intentAnalysis.intent}`);
                    calculationResult = await performCalculation(intentAnalysis.intent, financialData, message, language);

                    // Nếu có calculation result, return trực tiếp
                    if (calculationResult && calculationResult.length > 50) {
                        const responseTime = Date.now() - startTime;
                        analytics.track('success', { responseTime, calculation: true });

                        // Cache calculation result
                        await cacheService.cacheGeminiResponse(`calc_${message}`, calculationResult);

                        // Update conversation history
                        await cacheService.addMessageToConversation(userId, { role: 'user', content: message });
                        await cacheService.addMessageToConversation(userId, { role: 'bot', content: calculationResult });

                        return res.json({
                            success: true,
                            response: calculationResult,
                            metadata: {
                                intent: intentAnalysis.intent,
                                confidence: intentAnalysis.confidence,
                                language: intentAnalysis.details.language,
                                calculation: true,
                                responseTime
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching financial data:', error);
            }
        }

        // 5. Check cache for similar Gemini responses
        const prompt = `${message}${financialContext}`;
        let cachedResponse = await cacheService.getGeminiResponse(prompt);

        if (cachedResponse) {
            const responseTime = Date.now() - startTime;
            analytics.track('success', { responseTime, cached: true });

            return res.json({
                success: true,
                response: cachedResponse,
                metadata: {
                    intent: intentAnalysis.intent,
                    confidence: intentAnalysis.confidence,
                    cached: true,
                    responseTime
                }
            });
        }

        // 6. Generate Gemini response
        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash",
            systemInstruction: { parts: [{ text: getSystemInstruction(language) }] },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            },
        });

        const chat = model.startChat({ history: [] });

        // Add conversation context from cache
        const conversationHistory = await cacheService.getConversation(userId);
        let fullPrompt = prompt;
        if (conversationHistory?.length > 0) {
            // Use last 5 messages for context
            const recentMessages = conversationHistory.slice(-5);
            const contextPrompt = `Context từ cuộc trò chuyện gần đây:\n${recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`;
            fullPrompt = contextPrompt + prompt;
        }

        const result = await chat.sendMessage(fullPrompt);
        const response = await result.response;
        let responseText = response.text();

        // 7. Enhanced response formatting
        responseText = responseText
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1')     // Remove italic
            .trim();

        // Add smart suggestions based on analysis
        const suggestions = nlpService.enhanceResponse(responseText, {
            preferredLanguage: language,
            hasHighSpending: financialContext.includes('chi tiêu') && /[5-9]\d{6,}/.test(financialContext)
        });

        // 8. Cache response
        await cacheService.cacheGeminiResponse(fullPrompt, suggestions);

        // 9. Update conversation history
        await cacheService.addMessageToConversation(userId, { role: 'user', content: message });
        await cacheService.addMessageToConversation(userId, { role: 'bot', content: suggestions });

        const responseTime = Date.now() - startTime;
        analytics.track('success', { responseTime, cached: false });

        res.json({
            success: true,
            response: suggestions,
            metadata: {
                intent: intentAnalysis.intent,
                confidence: intentAnalysis.confidence,
                language: intentAnalysis.details.language,
                cached: false,
                responseTime
            }
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error('Enhanced Chatbot Error:', error);

        let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

        if (error.message?.includes('API key')) {
            errorMessage = 'Lỗi cấu hình hệ thống.';
            analytics.track('error', { error: 'api_key_invalid' });
        } else if (error.message?.includes('quota')) {
            errorMessage = 'Hệ thống đang quá tải. Vui lòng thử lại sau.';
            analytics.track('error', { error: 'quota_exceeded' });
        } else {
            analytics.track('error', { error: 'internal_error' });
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            metadata: {
                responseTime,
                ...(process.env.NODE_ENV === 'development' && { detail: error.message })
            }
        });
    }
});

/**
 * Analytics endpoint
 */
router.get('/analytics', authenticateToken, (req, res) => {
    // Chỉ admin mới xem được analytics
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const cacheStats = cacheService.getStats();

    res.json({
        analytics: analytics.getStats(),
        cache: cacheStats,
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            nlp: !!nlpService,
            cache: !!cacheService,
            gemini: !!process.env.GEMINI_API_KEY
        }
    });
});

/**
 * Legacy chatbot route (từ chatbot.js cũ)
 * Giữ lại để tương thích với frontend cũ
 */
router.post('/chatbot', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Message is required and must be a non-empty string.' });
        }
        if (!userId) {
            console.error('Chatbot API: User ID not found after authentication.', { user: req.user });
            return res.status(401).json({ success: false, error: 'User authentication failed.' });
        }

        // --- Intent Classification ---
        if (!isVanLangBotAllowedTopic(message)) {
            return res.json({
                success: true,
                response: "Tôi xin lỗi, tôi chỉ có thể hỗ trợ các câu hỏi liên quan đến quản lý tài chính cá nhân trong ứng dụng VanLang Budget."
            });
        }
        // --- End Intent Classification ---

        let financialContext = "";
        try {
            const financialData = await getLegacyUserFinancialData(userId);
            if (financialData && Object.keys(financialData).length > 0) {
                let summaryParts = [];
                if (financialData.incomeThisMonth) summaryParts.push(`- Thu nhập tháng này của người dùng là: ${financialData.incomeThisMonth.toLocaleString('vi-VN')} VND.`);
                if (financialData.expensesThisMonth && Object.keys(financialData.expensesThisMonth).length > 0) {
                    let expenseDetails = Object.entries(financialData.expensesThisMonth)
                        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.toLocaleString('vi-VN')} VND`)
                        .join(', ');
                    if (expenseDetails) summaryParts.push(`- Chi tiêu tháng này (một số hạng mục): ${expenseDetails}.`);
                }
                if (financialData.totalSavings) summaryParts.push(`- Tổng tiết kiệm hiện có: ${financialData.totalSavings.toLocaleString('vi-VN')} VND.`);
                if (financialData.investments && financialData.investments.length > 0) {
                    let investmentDetails = financialData.investments
                        .map(inv => `${inv.type} (${inv.name || inv.quantity}): khoảng ${inv.value.toLocaleString('vi-VN')} VND`)
                        .join('; ');
                    if (investmentDetails) summaryParts.push(`- Các khoản đầu tư chính: ${investmentDetails}.`);
                }
                if (financialData.activeBudgets && financialData.activeBudgets.length > 0) {
                    let budgetDetails = financialData.activeBudgets
                        .map(b => `Ngân sách ${b.category}: đã chi ${b.spent.toLocaleString('vi-VN')}/${b.limit.toLocaleString('vi-VN')} VND`)
                        .join('; ');
                    if (budgetDetails) summaryParts.push(`- Tình hình một số ngân sách: ${budgetDetails}.`);
                }

                if (summaryParts.length > 0) {
                    financialContext = `\\n\\nThông tin tài chính hiện tại của người dùng (dùng để tham khảo nếu câu hỏi có liên quan trực tiếp):\n${summaryParts.join('\\n')}`;
                } else {
                    financialContext = "\\n\\n(Không có dữ liệu tài chính chi tiết nào của người dùng được cung cấp cho phiên chat này.)";
                }
            } else {
                financialContext = "\\n\\n(Không tìm thấy dữ liệu tài chính của người dùng cho phiên chat này.)";
            }
        } catch (dbError) {
            console.error(`Chatbot API: Error fetching user financial data for userId ${userId}:`, dbError);
            financialContext = "\\n\\n(Lưu ý: Đã có lỗi khi truy xuất dữ liệu tài chính. Câu trả lời có thể không dựa trên thông tin cá nhân của bạn.)";
        }

        const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: { parts: [{ text: legacySystemInstructionText }] },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
            generationConfig: {
                temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
                topK: parseInt(process.env.GEMINI_TOP_K) || undefined,
                topP: parseInt(process.env.GEMINI_TOP_P) || undefined,
                maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 1024,
            },
        });

        const chat = model.startChat({
            history: [],
        });

        let userMessageForGemini = `Câu hỏi từ người dùng: "${message}"`;
        const financialKeywordsInQuery = ['của tôi', 'của bạn', 'tôi có', 'hiện tại', 'tháng này', 'tháng trước', 'tài khoản', 'thu nhập', 'chi tiêu', 'tiết kiệm', 'đầu tư', 'ngân sách'];
        if (financialKeywordsInQuery.some(kw => message.toLowerCase().includes(kw))) {
            userMessageForGemini += financialContext;
        } else {
            userMessageForGemini += "\\n\\n(Nếu câu hỏi không yêu cầu thông tin tài chính cá nhân cụ thể, không cần tham chiếu đến dữ liệu người dùng đã cung cấp ở trên.)"
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`Legacy Chatbot API: Sending to Gemini for userId ${userId}. Model: ${modelName}. Payload:`, userMessageForGemini);
        }

        const result = await chat.sendMessageStream(userMessageForGemini);

        let accumulatedText = "";
        for await (const chunk of result.stream) {
            if (chunk && typeof chunk.text === 'function') {
                accumulatedText += chunk.text();
            } else {
                console.warn("Legacy Chatbot API: Received a chunk without a text function or undefined chunk.", chunk);
            }
        }

        const fullResponse = await result.response;
        if (fullResponse.promptFeedback && fullResponse.promptFeedback.blockReason) {
            console.warn('Legacy Chatbot API: Prompt was blocked by Gemini.', {
                reason: fullResponse.promptFeedback.blockReason,
                ratings: fullResponse.promptFeedback.safetyRatings,
            });
            const blockMessage = `Yêu cầu của bạn không thể được xử lý vì lý do an toàn nội dung (${fullResponse.promptFeedback.blockReason}). Vui lòng thử lại với một câu hỏi khác.`;
            return res.json({ success: true, response: blockMessage });
        }

        if (!accumulatedText && (!fullResponse.candidates || fullResponse.candidates.length === 0 || !fullResponse.candidates[0].content)) {
            console.warn('Legacy Chatbot API: Gemini did not return any content.', { response: fullResponse });
            accumulatedText = "Xin lỗi, tôi chưa thể đưa ra câu trả lời cho câu hỏi này. Bạn có thể thử hỏi cách khác được không?";
        }

        const formattedResponse = formatVanLangBotResponse(accumulatedText);

        if (process.env.NODE_ENV === 'development') {
            console.log(`Legacy Chatbot API: Received from Gemini for userId ${userId}. Formatted response:`, formattedResponse);
        }

        res.json({ success: true, response: formattedResponse });

    } catch (error) {
        console.error('Legacy Chatbot API: Unhandled error in POST /chatbot route:', error);
        let errorMessage = 'Đã có lỗi xảy ra từ phía máy chủ khi xử lý yêu cầu chatbot của bạn.';
        if (error.message) {
            if (error.message.includes('API key not valid')) {
                errorMessage = 'Lỗi cấu hình hệ thống: API key không hợp lệ.';
            } else if (error.message.toLowerCase().includes('model') && error.message.toLowerCase().includes('not found')) {
                errorMessage = `Lỗi cấu hình: Model Gemini được yêu cầu không tồn tại hoặc không thể truy cập. (${modelName || 'Model không xác định'})`;
            } else if (error.message.toLowerCase().includes('deadline exceeded') || error.message.toLowerCase().includes('timeout')) {
                errorMessage = 'Yêu cầu xử lý mất quá nhiều thời gian và đã bị hủy. Vui lòng thử lại.';
            }
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

export default router;
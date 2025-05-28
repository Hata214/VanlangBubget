import express from 'express';
import rateLimit from 'express-rate-limit';

// Import services
import authenticateToken from '../middlewares/authenticateToken.js';

// Temporarily comment out problematic imports for debugging
// import NLPService from '../services/nlpService.js';
// import getCacheService from '../services/cacheService.js';
// import FinancialCalculationService from '../services/financialCalculationService.js';
// import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Import models for real data
import Income from '../models/incomeModel.js';
import Expense from '../models/expenseModel.js';
import Investment from '../models/investmentModel.js';
import Budget from '../models/budgetModel.js';
import Loan from '../models/loanModel.js';

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

// XÓA MOCK DATA - CHỈ SỬ DỤNG DỮ LIỆU THẬT TỪ DATABASE

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

// Temporarily disable service initialization for debugging
// const nlpService = new NLPService();
// const cacheService = getCacheService();
// const calculationService = new FinancialCalculationService();

// Temporarily disable Gemini for debugging
// if (!process.env.GEMINI_API_KEY) {
//     console.error('❌ GEMINI_API_KEY không được cấu hình trong .env file');
//     throw new Error('Gemini API key is required for enhanced chatbot functionality');
// }

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('✅ Enhanced chatbot routes loaded (debugging mode)');

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
- Chào hỏi và giới thiệu bản thân
- Thông tin thời gian và ngày tháng hiện tại
- Hướng dẫn sử dụng và khả năng của VanLangBot
- Quản lý tài chính cá nhân (thu nhập, chi tiêu, ngân sách)
- Đầu tư (cổ phiếu, vàng, crypto, tiết kiệm)
- Khoản vay và nợ (tổng khoản vay, lãi suất, phân tích nợ)
- Phân tích và tính toán dữ liệu tài chính được cung cấp
- Dự đoán xu hướng và so sánh theo thời gian
- Gợi ý tiết kiệm và lập ngân sách thông minh
- Kế hoạch tài chính và mục tiêu tiết kiệm
- Tính toán lãi suất, ROI, và hiệu quả đầu tư
- Lời cảm ơn và tạm biệt

KHẢ NĂNG TÍNH TOÁN:
- Phân tích thu nhập và xu hướng
- Tính toán chi tiêu theo danh mục
- Đánh giá hiệu quả đầu tư và ROI
- Phân tích ngân sách và mức độ sử dụng
- Tính toán khoản vay và lãi suất
- Dự đoán chi tiêu tương lai
- Tính toán mục tiêu tiết kiệm
- So sánh dữ liệu theo thời gian

QUY TẮC QUAN TRỌNG:
1. TỪ CHỐI lịch sự mọi chủ đề khác (thời tiết, tin tức, giải trí...)
2. KHÔNG tự bịa số liệu, CHỈ dùng dữ liệu được cung cấp trong context
3. KHI người dùng hỏi về số liệu cụ thể (tổng khoản vay, thu nhập, chi tiêu), LUÔN trả lời TRỰC TIẾP với số tiền chính xác từ dữ liệu
4. HIỂU ĐÚNG Ý ĐỊNH:
   - "Chi tiết" = Liệt kê từng khoản cụ thể với số liệu
   - "Tổng" = Hiển thị số tiền tổng hợp
   - "Phân tích" = Đưa ra nhận xét và gợi ý
5. KHÔNG BAO GIỜ nói "câu hỏi không rõ ràng" - hãy đoán ý định và trả lời
6. Cung cấp tính toán chính xác và giải thích rõ ràng
7. Đưa ra gợi ý thực tế và khả thi
8. Sử dụng emoji phù hợp (💰, 📊, 💡, ⚠️, 🧮, 📈, 🏦)
9. Trả lời ngắn gọn nhưng đầy đủ thông tin
10. Luôn thân thiện và hữu ích

CÁC LOẠI CÂU HỎI CÓ THỂ TRẢ LỜI:
- "Thu nhập của tôi tháng này bao nhiêu?"
- "Tổng khoản vay của tôi là bao nhiêu?" → Trả lời TRỰC TIẾP số tiền từ dữ liệu
- "Tổng chi tiết của tôi là bao nhiêu?" → Hiểu là hỏi về CHI TIẾT KHOẢN VAY, trả lời với danh sách từng khoản
- "Chi tiết khoản vay của tôi" → Liệt kê từng khoản vay với số tiền cụ thể
- "Phân tích chi tiêu tháng này"
- "Tính toán lợi nhuận đầu tư"
- "So sánh thu chi tháng này với tháng trước"
- "Dự đoán xu hướng chi tiêu"
- "Tôi có thể tiết kiệm 100 triệu trong bao lâu?"
- "Phân tích ngân sách hiện tại"
- "Gợi ý phân bổ thu nhập"
- "Phân tích khoản vay của tôi"`,

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
        console.log('🔍 getUserFinancialDataCached - Starting for userId:', userId);

        // Thử lấy từ cache trước
        let financialData = await cacheService.getUserFinancialData(userId);

        if (!financialData) {
            console.log(`📊 Fetching real financial data for user: ${userId}`);

            // Lấy thời gian hiện tại để tính toán tháng này
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            console.log('📅 Date range for current month:');
            console.log('- Start of month:', startOfMonth.toISOString());
            console.log('- End of month:', endOfMonth.toISOString());

            // 1. Lấy thu nhập tháng này
            console.log('💰 Querying incomes with filter:', {
                userId: userId,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });
            const incomes = await Income.find({
                userId: userId,
                date: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            });
            console.log('💰 Found incomes:', incomes.length, 'records');
            if (incomes.length > 0) {
                console.log('💰 Income data sample:', incomes.slice(0, 2).map(inc => ({
                    amount: inc.amount,
                    date: inc.date,
                    description: inc.description
                })));
            }

            const incomeThisMonth = incomes.reduce((total, income) => total + (income.amount || 0), 0);
            console.log('💰 Total income this month:', incomeThisMonth);

            // 2. Lấy chi tiêu tháng này theo category
            console.log('💸 Querying expenses with filter:', {
                userId: userId,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });
            const expenses = await Expense.find({
                userId: userId,
                date: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            });
            console.log('💸 Found expenses:', expenses.length, 'records');
            if (expenses.length > 0) {
                console.log('💸 Expense data sample:', expenses.slice(0, 2).map(exp => ({
                    amount: exp.amount,
                    date: exp.date,
                    description: exp.description,
                    category: exp.category
                })));
            }

            // Group expenses by category
            const expensesThisMonth = {};
            let totalExpenses = 0;

            expenses.forEach(expense => {
                const categoryName = expense.category || 'Khác';
                const amount = expense.amount || 0;

                if (!expensesThisMonth[categoryName]) {
                    expensesThisMonth[categoryName] = 0;
                }
                expensesThisMonth[categoryName] += amount;
                totalExpenses += amount;
            });
            console.log('💸 Total expenses this month:', totalExpenses);
            console.log('💸 Expenses by category:', expensesThisMonth);

            // 3. Lấy thông tin đầu tư
            console.log('📈 Querying investments with filter:', { userId: userId });
            const investments = await Investment.find({
                userId: userId
            });
            console.log('📈 Found investments:', investments.length, 'records');
            if (investments.length > 0) {
                console.log('📈 Investment data sample:', investments.slice(0, 2).map(inv => ({
                    type: inv.type,
                    name: inv.symbol || inv.name,
                    quantity: inv.quantity,
                    currentPrice: inv.currentPrice,
                    totalValue: inv.totalValue,
                    totalInvested: inv.totalInvested
                })));
            }

            const investmentData = investments.map(inv => ({
                type: inv.type || 'Khác',
                name: inv.symbol || inv.name || 'Không rõ',
                value: (inv.quantity || 0) * (inv.currentPrice || inv.purchasePrice || 0),
                quantity: inv.quantity,
                currentPrice: inv.currentPrice,
                profit: inv.totalValue - inv.totalInvested
            }));

            const totalInvestmentValue = investmentData.reduce((total, inv) => total + (inv.value || 0), 0);
            console.log('📈 Total investment value:', totalInvestmentValue);

            // 4. Lấy ngân sách đang hoạt động
            const budgets = await Budget.find({
                userId: userId
            });

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
            const allIncomes = await Income.find({ userId: userId });
            const allExpenses = await Expense.find({ userId: userId });

            console.log(`🔍 RAW DATABASE DATA for userId ${userId}:`);
            console.log(`📊 Income records: ${allIncomes.length}`);
            allIncomes.forEach((income, index) => {
                console.log(`  ${index + 1}. ${income.category}: ${income.amount.toLocaleString('vi-VN')} VND (${income.date})`);
            });

            console.log(`📊 Expense records: ${allExpenses.length}`);
            allExpenses.forEach((expense, index) => {
                console.log(`  ${index + 1}. ${expense.category}: ${expense.amount.toLocaleString('vi-VN')} VND (${expense.date})`);
            });

            const totalIncomeAllTime = allIncomes.reduce((total, income) => total + (income.amount || 0), 0);
            const totalExpenseAllTime = allExpenses.reduce((total, expense) => total + (expense.amount || 0), 0);
            const totalSavings = totalIncomeAllTime - totalExpenseAllTime; // Cho phép số âm

            console.log(`🧮 CALCULATION RESULTS:`);
            console.log(`💰 Total Income All Time: ${totalIncomeAllTime.toLocaleString('vi-VN')} VND`);
            console.log(`💸 Total Expense All Time: ${totalExpenseAllTime.toLocaleString('vi-VN')} VND`);
            console.log(`💎 Total Savings: ${totalSavings.toLocaleString('vi-VN')} VND`);

            // 6. Thống kê tháng trước để so sánh
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

            const lastMonthIncomes = await Income.find({
                userId: userId,
                date: { $gte: lastMonthStart, $lte: lastMonthEnd }
            });

            const lastMonthExpenses = await Expense.find({
                userId: userId,
                date: { $gte: lastMonthStart, $lte: lastMonthEnd }
            });

            const incomeLastMonth = lastMonthIncomes.reduce((total, income) => total + (income.amount || 0), 0);
            const expenseLastMonth = lastMonthExpenses.reduce((total, expense) => total + (expense.amount || 0), 0);

            // 7. Lấy TỔNG khoản vay (như dashboard) với chi tiết - CHỈ ACTIVE
            console.log(`🔍 FETCHING LOANS for userId: ${userId}`);
            const allLoans = await Loan.find({
                userId: userId,
                status: 'ACTIVE' // CHỈ lấy khoản vay đang hoạt động như frontend
            }).populate('payments'); // Populate payments để tính remainingAmount
            console.log(`🏦 Found ${allLoans.length} ACTIVE loans for user ${userId}`);

            // DEBUG: Log raw loan data
            if (allLoans.length > 0) {
                console.log('🔍 RAW LOAN DATA:');
                allLoans.forEach((loan, index) => {
                    console.log(`  Loan ${index + 1}:`);
                    console.log(`    - ID: ${loan._id}`);
                    console.log(`    - Description: ${loan.description}`);
                    console.log(`    - Amount: ${loan.amount}`);
                    console.log(`    - Interest Rate: ${loan.interestRate}%`);
                    console.log(`    - Interest Rate Type: ${loan.interestRateType}`);
                    console.log(`    - Start Date: ${loan.startDate}`);
                    console.log(`    - Due Date: ${loan.dueDate}`);
                    console.log(`    - Status: ${loan.status}`);
                });
            } else {
                console.log('❌ NO LOANS FOUND - This might be why chatbot cannot access loan data');
            }

            let totalLoanAmount = 0;
            const loanDetails = allLoans
                .filter(loan => {
                    // Chỉ tính những khoản vay có trạng thái ACTIVE hoặc OVERDUE
                    const loanStatus = loan.status?.toUpperCase() || '';
                    return loanStatus === 'ACTIVE' || loanStatus === 'OVERDUE';
                })
                .map(loan => {
                    // Tính tổng nợ bao gồm lãi suất GIỐNG DASHBOARD CHÍNH XÁC
                    const principal = loan.amount || 0;
                    const interestRate = loan.interestRate || 0;

                    // Tính số tiền còn lại sau khi trừ tiền trả trước (giống frontend)
                    const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                    const remainingAmount = Math.max(0, principal - totalPaid);

                    // Tính số ngày giữa ngày vay và ngày đáo hạn (giống dashboard)
                    const startDate = new Date(loan.startDate);
                    const dueDate = new Date(loan.dueDate);
                    const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // Tính interestMultiplier dựa trên interestRateType (giống dashboard)
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

                    // Tính lãi trên số tiền còn lại (giống frontend)
                    const interestAmount = Math.round(remainingAmount * (interestRate / 100) * interestMultiplier);
                    const totalWithInterest = remainingAmount + interestAmount;

                    totalLoanAmount += totalWithInterest;

                    console.log(`  - Loan: ${loan.description || loan.purpose || 'Unknown'}, Principal: ${principal}, Paid: ${totalPaid}, Remaining: ${remainingAmount}, Interest: ${interestRate}% (${loan.interestRateType}), Days: ${diffDays}, Multiplier: ${interestMultiplier}, InterestAmount: ${interestAmount}, Total: ${totalWithInterest}`);

                    return {
                        id: loan._id,
                        purpose: loan.description || loan.purpose || 'Khoản vay', // Sử dụng description từ model
                        principal: principal,
                        totalPaid: totalPaid,
                        remainingAmount: remainingAmount,
                        interestRate: interestRate,
                        interestRateType: loan.interestRateType,
                        diffDays: diffDays,
                        interestAmount: interestAmount,
                        totalAmount: totalWithInterest,
                        monthlyPayment: totalWithInterest / Math.max(1, diffDays / 30) // Ước tính trả hàng tháng
                    };
                });

            console.log(`🏦 Total loan amount with interest: ${totalLoanAmount} (from ${loanDetails.length} active/overdue loans out of ${allLoans.length} total loans)`);

            // Tạo financial data object với dữ liệu TỔNG QUAN như dashboard
            financialData = {
                // Dữ liệu tổng quan (như dashboard)
                totalBalance: totalSavings, // Số dư = Thu nhập - Chi tiêu tích lũy
                totalIncomeAllTime, // Tổng thu nhập tích lũy
                totalExpenseAllTime, // Tổng chi tiêu tích lũy
                totalLoanAmount, // Tổng khoản vay
                loanDetails, // Chi tiết khoản vay
                totalSavings, // Tổng tiết kiệm

                // Dữ liệu tháng hiện tại (để so sánh)
                incomeThisMonth,
                incomeLastMonth,
                incomeChange: incomeThisMonth - incomeLastMonth,
                expensesThisMonth,
                totalExpensesThisMonth: totalExpenses,
                expenseLastMonth,
                expenseChange: totalExpenses - expenseLastMonth,
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

            console.log('📊 FINAL FINANCIAL DATA SUMMARY (DASHBOARD OVERVIEW):');
            console.log(`👤 User ID: ${userId}`);
            console.log(`💎 Total Balance: ${totalSavings}`);
            console.log(`💰 Total Income All Time: ${totalIncomeAllTime}`);
            console.log(`💸 Total Expenses All Time: ${totalExpenseAllTime}`);
            console.log(`🏦 Total Loan Amount: ${totalLoanAmount}`);
            console.log(`📈 Investment count: ${investments.length}`);
            console.log(`📋 Budget count: ${budgets.length}`);
            console.log('📊 Complete dashboard overview data:', JSON.stringify({
                totalBalance: totalSavings,
                totalIncomeAllTime,
                totalExpenseAllTime,
                totalLoanAmount,
                totalInvestmentValue,
                incomeThisMonth,
                totalExpensesThisMonth: totalExpenses
            }, null, 2));

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
            // Dữ liệu tổng quan (như dashboard) - hỗ trợ số âm
            totalBalance: `💎 Số dư hiện tại: ${financialData.totalBalance >= 0 ? '' : '-'}${Math.abs(financialData.totalBalance || 0).toLocaleString('vi-VN')} VND${financialData.totalBalance < 0 ? ' (Âm)' : ''}`,
            totalIncome: `💰 Tổng thu nhập tích lũy: ${financialData.totalIncomeAllTime?.toLocaleString('vi-VN')} VND`,
            totalExpense: `💸 Tổng chi tiêu tích lũy: ${financialData.totalExpenseAllTime?.toLocaleString('vi-VN')} VND`,
            totalLoan: `🏦 Tổng khoản vay: ${financialData.totalLoanAmount?.toLocaleString('vi-VN')} VND`,

            // Dữ liệu tháng hiện tại
            incomeThisMonth: `💰 Thu nhập tháng này: ${financialData.incomeThisMonth?.toLocaleString('vi-VN')} VND`,
            expensesThisMonth: `💸 Chi tiêu tháng này: ${financialData.totalExpensesThisMonth?.toLocaleString('vi-VN')} VND`,
            savingsThisMonth: `💎 Tiết kiệm tháng này: ${financialData.savingsThisMonth >= 0 ? '' : '-'}${Math.abs(financialData.savingsThisMonth || 0).toLocaleString('vi-VN')} VND${financialData.savingsThisMonth < 0 ? ' (Âm)' : ''}`,

            investments: `📊 Đầu tư hiện có:`,
            budgets: `📋 Tình hình ngân sách:`
        },
        en: {
            // Dashboard overview data - support negative numbers
            totalBalance: `💎 Current balance: ${financialData.totalBalance >= 0 ? '' : '-'}${Math.abs(financialData.totalBalance || 0).toLocaleString('en-US')} VND${financialData.totalBalance < 0 ? ' (Negative)' : ''}`,
            totalIncome: `💰 Total accumulated income: ${financialData.totalIncomeAllTime?.toLocaleString('en-US')} VND`,
            totalExpense: `💸 Total accumulated expenses: ${financialData.totalExpenseAllTime?.toLocaleString('en-US')} VND`,
            totalLoan: `🏦 Total loans: ${financialData.totalLoanAmount?.toLocaleString('en-US')} VND`,

            // Current month data
            incomeThisMonth: `💰 This month's income: ${financialData.incomeThisMonth?.toLocaleString('en-US')} VND`,
            expensesThisMonth: `💸 This month's expenses: ${financialData.totalExpensesThisMonth?.toLocaleString('en-US')} VND`,
            savingsThisMonth: `💎 This month's savings: ${financialData.savingsThisMonth >= 0 ? '' : '-'}${Math.abs(financialData.savingsThisMonth || 0).toLocaleString('en-US')} VND${financialData.savingsThisMonth < 0 ? ' (Negative)' : ''}`,

            investments: `📊 Current investments:`,
            budgets: `📋 Budget status:`
        }
    };

    const t = templates[language] || templates.vi;
    let context = `\n\n📊 TỔNG QUAN TÀI CHÍNH CỦA BẠN:\n`;

    // Dữ liệu tổng quan (như dashboard)
    if (financialData.totalBalance !== undefined) {
        context += `${t.totalBalance}\n`;
    }

    if (financialData.totalIncomeAllTime !== undefined) {
        context += `${t.totalIncome}\n`;
    }

    if (financialData.totalExpenseAllTime !== undefined) {
        context += `${t.totalExpense}\n`;
    }

    // Luôn hiển thị thông tin khoản vay (kể cả khi = 0) - QUAN TRỌNG
    if (financialData.totalLoanAmount !== undefined) {
        context += `${t.totalLoan}\n`;

        // Thêm chi tiết khoản vay nếu có - HIỂN THỊ RÕ RÀNG
        if (financialData.loanDetails && financialData.loanDetails.length > 0) {
            context += `   📝 Chi tiết khoản vay:\n`;
            financialData.loanDetails
                .slice(0, 5) // Top 5 loans
                .forEach((loan, index) => {
                    context += `   ${index + 1}. ${loan.purpose || 'Khoản vay'}: ${loan.totalAmount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND (Còn lại: ${loan.remainingAmount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND, Lãi: ${loan.interestAmount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VND)\n`;
                });
        } else if (financialData.totalLoanAmount === 0) {
            context += `   ✅ Bạn hiện tại không có khoản vay nào.\n`;
        }
    }

    // Thêm dữ liệu tháng hiện tại
    context += `\n📅 DỮ LIỆU THÁNG ${financialData.period?.month}/${financialData.period?.year}:\n`;

    if (financialData.incomeThisMonth !== undefined) {
        context += `${t.incomeThisMonth}\n`;
    }

    if (financialData.totalExpensesThisMonth !== undefined) {
        context += `${t.expensesThisMonth}\n`;

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

            case 'calculate_loan':
                result = calculateLoanAnalysis(financialData, language);
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
 * Tính toán phân tích khoản vay
 */
function calculateLoanAnalysis(financialData, language = 'vi') {
    if (!financialData.loanDetails || financialData.loanDetails.length === 0) {
        return language === 'vi' ?
            'Bạn hiện tại không có khoản vay nào.' :
            'You currently have no loans.';
    }

    const loans = financialData.loanDetails;
    const totalPrincipal = loans.reduce((total, loan) => total + loan.principal, 0);
    const totalInterest = loans.reduce((total, loan) => total + (loan.totalAmount - loan.principal), 0);
    const totalMonthlyPayment = loans.reduce((total, loan) => total + loan.monthlyPayment, 0);

    // Phân loại khoản vay theo lãi suất
    const highInterestLoans = loans.filter(loan => loan.interestRate > 15);
    const mediumInterestLoans = loans.filter(loan => loan.interestRate > 8 && loan.interestRate <= 15);
    const lowInterestLoans = loans.filter(loan => loan.interestRate <= 8);

    return language === 'vi' ? `
🏦 **Phân tích Khoản vay:**

💰 **Tổng quan:**
• Tổng số khoản vay: ${loans.length}
• Tổng gốc: ${totalPrincipal.toLocaleString('vi-VN')} VND
• Tổng lãi: ${totalInterest.toLocaleString('vi-VN')} VND
• Tổng phải trả: ${financialData.totalLoanAmount.toLocaleString('vi-VN')} VND
• Trả hàng tháng: ${totalMonthlyPayment.toLocaleString('vi-VN')} VND

📊 **Phân loại theo lãi suất:**
${highInterestLoans.length > 0 ? `🔴 Lãi suất cao (>15%): ${highInterestLoans.length} khoản` : ''}
${mediumInterestLoans.length > 0 ? `🟡 Lãi suất trung bình (8-15%): ${mediumInterestLoans.length} khoản` : ''}
${lowInterestLoans.length > 0 ? `🟢 Lãi suất thấp (≤8%): ${lowInterestLoans.length} khoản` : ''}

📋 **Chi tiết khoản vay:**
${loans.slice(0, 3).map(loan =>
        `• ${loan.purpose}: ${loan.totalAmount.toLocaleString('vi-VN')} VND (${loan.interestRate}%/năm)`
    ).join('\n')}

⚠️ **Đánh giá:** ${totalInterest > totalPrincipal * 0.3 ?
            'Tổng lãi cao, cần ưu tiên trả nợ' :
            totalInterest > totalPrincipal * 0.1 ?
                'Mức lãi ở mức trung bình' :
                'Mức lãi hợp lý'}

🎯 **Gợi ý:** ${highInterestLoans.length > 0 ?
            'Ưu tiên trả các khoản vay lãi suất cao trước.' :
            'Duy trì kế hoạch trả nợ đều đặn.'}
    ` : `
🏦 **Loan Analysis:**

💰 **Overview:**
• Total loans: ${loans.length}
• Total principal: ${totalPrincipal.toLocaleString('en-US')} VND
• Total interest: ${totalInterest.toLocaleString('en-US')} VND
• Total payable: ${financialData.totalLoanAmount.toLocaleString('en-US')} VND
• Monthly payment: ${totalMonthlyPayment.toLocaleString('en-US')} VND

📊 **Classification by interest rate:**
${highInterestLoans.length > 0 ? `🔴 High interest (>15%): ${highInterestLoans.length} loans` : ''}
${mediumInterestLoans.length > 0 ? `🟡 Medium interest (8-15%): ${mediumInterestLoans.length} loans` : ''}
${lowInterestLoans.length > 0 ? `🟢 Low interest (≤8%): ${lowInterestLoans.length} loans` : ''}

📋 **Loan details:**
${loans.slice(0, 3).map(loan =>
                `• ${loan.purpose}: ${loan.totalAmount.toLocaleString('en-US')} VND (${loan.interestRate}%/year)`
            ).join('\n')}

⚠️ **Assessment:** ${totalInterest > totalPrincipal * 0.3 ?
        'High total interest, prioritize debt repayment' :
        totalInterest > totalPrincipal * 0.1 ?
            'Interest level is moderate' :
            'Interest level is reasonable'}

🎯 **Suggestion:** ${highInterestLoans.length > 0 ?
        'Prioritize paying off high-interest loans first.' :
        'Maintain regular debt repayment schedule.'}
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
 * Tạo response cho lời chào
 */
function generateGreetingResponse(language = 'vi') {
    const currentHour = new Date().getHours();
    let timeGreeting = '';

    if (language === 'vi') {
        if (currentHour < 12) {
            timeGreeting = 'Chào buổi sáng! ☀️';
        } else if (currentHour < 18) {
            timeGreeting = 'Chào buổi chiều! 🌤️';
        } else {
            timeGreeting = 'Chào buổi tối! 🌙';
        }

        return `${timeGreeting}\n\nTôi là **VanLangBot** 🤖, trợ lý tài chính thông minh của bạn!\n\n💡 Tôi có thể giúp bạn:\n• Kiểm tra số dư và tài chính\n• Phân tích thu chi\n• Quản lý khoản vay\n• Theo dõi đầu tư\n• Lập kế hoạch ngân sách\n\nHãy hỏi tôi bất cứ điều gì về tài chính nhé! 💰`;
    } else {
        if (currentHour < 12) {
            timeGreeting = 'Good morning! ☀️';
        } else if (currentHour < 18) {
            timeGreeting = 'Good afternoon! 🌤️';
        } else {
            timeGreeting = 'Good evening! 🌙';
        }

        return `${timeGreeting}\n\nI'm **VanLangBot** 🤖, your smart financial assistant!\n\n💡 I can help you with:\n• Check balance and finances\n• Analyze income and expenses\n• Manage loans\n• Track investments\n• Budget planning\n\nFeel free to ask me anything about finance! 💰`;
    }
}

/**
 * Tạo response cho giới thiệu bot
 */
function generateBotIntroductionResponse(language = 'vi') {
    if (language === 'vi') {
        return `🤖 **Xin chào! Tôi là VanLangBot**\n\n✨ **Về tôi:**\n• Trợ lý tài chính thông minh được phát triển bởi VanLang Budget\n• Sử dụng công nghệ AI tiên tiến để hỗ trợ quản lý tài chính\n• Hiểu được tiếng Việt và tiếng Anh\n\n🎯 **Chuyên môn của tôi:**\n• 📊 Phân tích dữ liệu tài chính cá nhân\n• 💰 Tư vấn quản lý thu chi\n• 🏦 Hỗ trợ quản lý khoản vay\n• 📈 Theo dõi đầu tư và tiết kiệm\n• 🧮 Tính toán và dự báo tài chính\n\n💡 **Tôi luôn sẵn sàng giúp bạn đạt được mục tiêu tài chính!**\n\nHãy hỏi tôi về tình hình tài chính của bạn nhé! 🚀`;
    } else {
        return `🤖 **Hello! I'm VanLangBot**\n\n✨ **About me:**\n• Smart financial assistant developed by VanLang Budget\n• Using advanced AI technology to support financial management\n• Understanding both Vietnamese and English\n\n🎯 **My expertise:**\n• 📊 Personal financial data analysis\n• 💰 Income and expense management consulting\n• 🏦 Loan management support\n• 📈 Investment and savings tracking\n• 🧮 Financial calculations and forecasting\n\n💡 **I'm always ready to help you achieve your financial goals!**\n\nFeel free to ask me about your finances! 🚀`;
    }
}

/**
 * Tạo response cho thời gian hiện tại
 */
function generateTimeResponse(language = 'vi') {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));

    const timeString = vietnamTime.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const dateString = vietnamTime.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (language === 'vi') {
        return `🕐 **Thời gian hiện tại:**\n\n⏰ **Giờ:** ${timeString}\n📅 **Ngày:** ${dateString}\n🌏 **Múi giờ:** Việt Nam (UTC+7)\n\nCó gì tôi có thể giúp bạn về tài chính không? 💰`;
    } else {
        return `🕐 **Current time:**\n\n⏰ **Time:** ${timeString}\n📅 **Date:** ${dateString}\n🌏 **Timezone:** Vietnam (UTC+7)\n\nIs there anything I can help you with regarding your finances? 💰`;
    }
}

/**
 * Tạo response cho khả năng của bot
 */
function generateCapabilityResponse(language = 'vi') {
    if (language === 'vi') {
        return `🚀 **Tôi có thể giúp bạn những gì:**\n\n💰 **Quản lý tài chính:**\n• Kiểm tra số dư tài khoản\n• Xem tổng thu nhập và chi tiêu\n• Phân tích xu hướng tài chính\n\n🏦 **Quản lý khoản vay:**\n• Xem chi tiết từng khoản vay\n• Tính toán lãi suất và tổng nợ\n• Lập kế hoạch trả nợ\n\n📈 **Đầu tư & Tiết kiệm:**\n• Theo dõi danh mục đầu tư\n• Tính toán lợi nhuận\n• Đề xuất chiến lược tiết kiệm\n\n📊 **Phân tích & Báo cáo:**\n• So sánh thu chi theo thời gian\n• Dự báo xu hướng chi tiêu\n• Tạo báo cáo tài chính\n\n🧮 **Tính toán thông minh:**\n• Tính lãi suất kép\n• Ước tính thời gian đạt mục tiêu\n• Phân tích hiệu quả đầu tư\n\n💡 **Hãy thử hỏi tôi:**\n• "Tổng khoản vay của tôi là bao nhiêu?"\n• "Phân tích chi tiêu tháng này"\n• "Thu nhập của tôi thế nào?"\n• "Chi tiết đầu tư của tôi"`;
    } else {
        return `🚀 **What I can help you with:**\n\n💰 **Financial Management:**\n• Check account balance\n• View total income and expenses\n• Analyze financial trends\n\n🏦 **Loan Management:**\n• View detailed loan information\n• Calculate interest and total debt\n• Create debt repayment plans\n\n📈 **Investment & Savings:**\n• Track investment portfolio\n• Calculate returns\n• Suggest savings strategies\n\n📊 **Analysis & Reports:**\n• Compare income/expenses over time\n• Forecast spending trends\n• Generate financial reports\n\n🧮 **Smart Calculations:**\n• Calculate compound interest\n• Estimate time to reach goals\n• Analyze investment efficiency\n\n💡 **Try asking me:**\n• "What's my total loan amount?"\n• "Analyze this month's expenses"\n• "How's my income?"\n• "Show my investment details"`;
    }
}

/**
 * Tạo response cho lời tạm biệt
 */
function generateFarewellResponse(language = 'vi') {
    if (language === 'vi') {
        return `👋 **Cảm ơn bạn đã sử dụng VanLangBot!**\n\n✨ Hy vọng tôi đã giúp ích được cho việc quản lý tài chính của bạn.\n\n💡 **Nhớ rằng:**\n• Quản lý tài chính tốt là chìa khóa thành công\n• Hãy tiết kiệm và đầu tư thông minh\n• Tôi luôn sẵn sàng hỗ trợ bạn 24/7\n\n🚀 **Hẹn gặp lại bạn sớm!**\n\nChúc bạn có một ngày tuyệt vời! 🌟`;
    } else {
        return `👋 **Thank you for using VanLangBot!**\n\n✨ I hope I've been helpful with your financial management.\n\n💡 **Remember:**\n• Good financial management is the key to success\n• Save and invest wisely\n• I'm always here to help you 24/7\n\n🚀 **See you soon!**\n\nHave a wonderful day! 🌟`;
    }
}

/**
 * Tạo response chi tiết cho khoản vay
 */
function generateLoanDetailResponse(financialData, language = 'vi') {
    const t = language === 'vi' ? {
        title: '🏦 Chi tiết khoản vay của bạn:',
        noLoans: '✅ Bạn hiện tại không có khoản vay nào.',
        total: 'Tổng cộng:',
        principal: 'Gốc:',
        remaining: 'Còn lại:',
        interest: 'Lãi:',
        rate: 'Lãi suất:',
        per: 'mỗi',
        day: 'ngày',
        week: 'tuần',
        month: 'tháng',
        quarter: 'quý',
        year: 'năm'
    } : {
        title: '🏦 Your loan details:',
        noLoans: '✅ You currently have no loans.',
        total: 'Total:',
        principal: 'Principal:',
        remaining: 'Remaining:',
        interest: 'Interest:',
        rate: 'Interest rate:',
        per: 'per',
        day: 'day',
        week: 'week',
        month: 'month',
        quarter: 'quarter',
        year: 'year'
    };

    if (!financialData.loanDetails || financialData.loanDetails.length === 0) {
        return t.noLoans;
    }

    let response = t.title + '\n\n';

    financialData.loanDetails.forEach((loan, index) => {
        const rateTypeText = {
            'DAY': t.day,
            'WEEK': t.week,
            'MONTH': t.month,
            'QUARTER': t.quarter,
            'YEAR': t.year
        }[loan.interestRateType] || t.year;

        response += `${index + 1}. **${loan.purpose}**\n`;
        response += `   • ${t.principal} ${loan.principal.toLocaleString('vi-VN')} VND\n`;
        response += `   • ${t.remaining} ${loan.remainingAmount.toLocaleString('vi-VN')} VND\n`;
        response += `   • ${t.interest} ${loan.interestAmount.toLocaleString('vi-VN')} VND\n`;
        response += `   • ${t.rate} ${loan.interestRate}% ${t.per} ${rateTypeText}\n`;
        response += `   • ${t.total} ${loan.totalAmount.toLocaleString('vi-VN')} VND\n\n`;
    });

    response += `💰 **${t.total} ${financialData.totalLoanAmount.toLocaleString('vi-VN')} VND**`;

    return response;
}

/**
 * Tạo response tổng hợp cho khoản vay
 */
function generateLoanSummaryResponse(financialData, language = 'vi') {
    const t = language === 'vi' ? {
        title: '🏦 Tổng hợp khoản vay:',
        noLoans: '✅ Bạn hiện tại không có khoản vay nào.',
        totalAmount: 'Tổng số tiền vay:',
        totalLoans: 'Số khoản vay:',
        avgInterest: 'Lãi suất trung bình:',
        loans: 'khoản'
    } : {
        title: '🏦 Loan summary:',
        noLoans: '✅ You currently have no loans.',
        totalAmount: 'Total loan amount:',
        totalLoans: 'Number of loans:',
        avgInterest: 'Average interest rate:',
        loans: 'loans'
    };

    if (!financialData.loanDetails || financialData.loanDetails.length === 0) {
        return t.noLoans;
    }

    const avgInterest = financialData.loanDetails.reduce((sum, loan) => sum + loan.interestRate, 0) / financialData.loanDetails.length;

    let response = t.title + '\n\n';
    response += `💰 ${t.totalAmount} **${financialData.totalLoanAmount.toLocaleString('vi-VN')} VND**\n`;
    response += `📊 ${t.totalLoans} **${financialData.loanDetails.length} ${t.loans}**\n`;
    response += `📈 ${t.avgInterest} **${avgInterest.toFixed(1)}%**\n`;

    return response;
}

/**
 * Tạo response chi tiết tài chính tổng quát
 */
function generateFinancialDetailResponse(financialData, language = 'vi') {
    const t = language === 'vi' ? {
        title: '📊 Chi tiết tài chính của bạn:',
        balance: 'Số dư hiện tại:',
        income: 'Thu nhập tích lũy:',
        expense: 'Chi tiêu tích lũy:',
        loans: 'Tổng khoản vay:',
        investments: 'Tổng đầu tư:',
        thisMonth: 'Tháng này:',
        incomeMonth: 'Thu nhập:',
        expenseMonth: 'Chi tiêu:'
    } : {
        title: '📊 Your financial details:',
        balance: 'Current balance:',
        income: 'Total income:',
        expense: 'Total expenses:',
        loans: 'Total loans:',
        investments: 'Total investments:',
        thisMonth: 'This month:',
        incomeMonth: 'Income:',
        expenseMonth: 'Expenses:'
    };

    let response = t.title + '\n\n';

    // Tổng quan
    response += `💎 ${t.balance} **${financialData.totalBalance.toLocaleString('vi-VN')} VND**\n`;
    response += `💰 ${t.income} **${financialData.totalIncomeAllTime.toLocaleString('vi-VN')} VND**\n`;
    response += `💸 ${t.expense} **${financialData.totalExpenseAllTime.toLocaleString('vi-VN')} VND**\n`;

    if (financialData.totalLoanAmount > 0) {
        response += `🏦 ${t.loans} **${financialData.totalLoanAmount.toLocaleString('vi-VN')} VND**\n`;
    }

    if (financialData.totalInvestmentValue > 0) {
        response += `📈 ${t.investments} **${financialData.totalInvestmentValue.toLocaleString('vi-VN')} VND**\n`;
    }

    // Tháng này
    response += `\n📅 ${t.thisMonth}\n`;
    response += `   • ${t.incomeMonth} ${financialData.incomeThisMonth.toLocaleString('vi-VN')} VND\n`;
    response += `   • ${t.expenseMonth} ${financialData.totalExpensesThisMonth.toLocaleString('vi-VN')} VND\n`;

    return response;
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

        // Debug: Log authentication info
        console.log('🔍 Chatbot Debug - Authentication Info:');
        console.log('- req.user:', JSON.stringify(req.user, null, 2));
        console.log('- userId extracted:', userId);
        console.log('- userId type:', typeof userId);

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
            console.error('❌ Chatbot Error: No userId found in request');
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
        const needsFinancialData = /của tôi|cua toi|my|hiện tại|hien tai|current|tháng này|thang nay|this month|tài khoản|tai khoan|account|tính|tinh|calculate|phân tích|phan tich|analyze|tài chính|tai chinh|financial|thu nhập|thu nhap|income|chi tiêu|chi tieu|expense|đầu tư|dau tu|investment|ngân sách|ngan sach|budget|chi tiết|chi tiet|detail|cụ thể|cu the|specific|tổng|tong|total|số dư|so du|balance|khoản vay|khoan vay|loan|vay|nợ|no|debt/.test(message.toLowerCase());

        console.log('🔍 Checking if financial data is needed:');
        console.log('- Message:', message);
        console.log('- Message lowercase:', message.toLowerCase());
        console.log('- needsFinancialData:', needsFinancialData);

        if (needsFinancialData) {
            console.log('✅ Financial data is needed, fetching from database...');
            try {
                const financialData = await getUserFinancialDataCached(userId);
                financialContext = formatFinancialContext(financialData, language);

                // Thực hiện calculations hoặc xử lý yêu cầu đặc biệt
                if (intentAnalysis.details.needsCalculation ||
                    ['calculate_income', 'calculate_expense', 'calculate_investment', 'calculate_budget',
                        'trend_analysis', 'financial_planning', 'general_calculation',
                        'loan_detail_query', 'loan_summary_query', 'financial_detail_query', 'financial_summary_query',
                        'income_detail_query', 'expense_detail_query', 'investment_detail_query',
                        'greeting', 'bot_introduction', 'time_date_query', 'capability_inquiry', 'farewell'].includes(intentAnalysis.intent)) {

                    console.log(`🎯 Processing special intent: ${intentAnalysis.intent} with queryType: ${intentAnalysis.queryType}`);

                    // Xử lý các intent cơ bản trước
                    if (intentAnalysis.intent === 'greeting') {
                        calculationResult = generateGreetingResponse(language);
                    }
                    else if (intentAnalysis.intent === 'bot_introduction') {
                        calculationResult = generateBotIntroductionResponse(language);
                    }
                    else if (intentAnalysis.intent === 'time_date_query') {
                        calculationResult = generateTimeResponse(language);
                    }
                    else if (intentAnalysis.intent === 'capability_inquiry') {
                        calculationResult = generateCapabilityResponse(language);
                    }
                    else if (intentAnalysis.intent === 'farewell') {
                        calculationResult = generateFarewellResponse(language);
                    }
                    // Xử lý yêu cầu chi tiết khoản vay
                    else if (intentAnalysis.intent === 'loan_detail_query' || intentAnalysis.queryType === 'loan_detail') {
                        calculationResult = generateLoanDetailResponse(financialData, language);
                    }
                    // Xử lý yêu cầu tổng hợp khoản vay
                    else if (intentAnalysis.intent === 'loan_summary_query' || intentAnalysis.queryType === 'loan_summary') {
                        calculationResult = generateLoanSummaryResponse(financialData, language);
                    }
                    // Xử lý yêu cầu chi tiết tài chính tổng quát
                    else if (intentAnalysis.intent === 'financial_detail_query' || intentAnalysis.queryType === 'general_detail') {
                        calculationResult = generateFinancialDetailResponse(financialData, language);
                    }
                    // Xử lý calculations thông thường
                    else {
                        calculationResult = await performCalculation(intentAnalysis.intent, financialData, message, language);
                    }

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
        } else {
            console.log('❌ Financial data not needed based on message content');
        }

        // 5. Check cache for similar Gemini responses
        const prompt = `${message}${financialContext}`;

        // DEBUG: Log the complete prompt being sent to Gemini
        console.log('🔍 DEBUG - Complete prompt being sent to Gemini:');
        console.log('📝 Original message:', message);
        console.log('💰 Financial context length:', financialContext.length);
        console.log('📊 Financial context preview:', financialContext.substring(0, 200) + '...');
        console.log('🎯 Full prompt length:', prompt.length);

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
 * Clear cache endpoint
 */
router.delete('/cache', authenticateToken, async (req, res) => {
    try {
        // Clear all cache
        await cacheService.clear();

        console.log('🧹 CACHE CLEARED - All financial data cache has been cleared');

        res.json({
            success: true,
            message: 'Cache cleared successfully - Financial data will be refreshed on next request'
        });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear cache'
        });
    }
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
            // SỬ DỤNG DỮ LIỆU THẬT TỪ DATABASE (GIỐNG ENHANCED CHATBOT)
            const financialData = await getUserFinancialDataCached(userId);
            if (financialData && Object.keys(financialData).length > 0) {
                let summaryParts = [];

                // Dữ liệu tổng quan (như dashboard)
                if (financialData.totalBalance !== undefined) {
                    summaryParts.push(`- Số dư hiện tại: ${financialData.totalBalance.toLocaleString('vi-VN')} VND.`);
                }
                if (financialData.totalIncomeAllTime) {
                    summaryParts.push(`- Tổng thu nhập tích lũy: ${financialData.totalIncomeAllTime.toLocaleString('vi-VN')} VND.`);
                }
                if (financialData.totalExpenseAllTime) {
                    summaryParts.push(`- Tổng chi tiêu tích lũy: ${financialData.totalExpenseAllTime.toLocaleString('vi-VN')} VND.`);
                }
                if (financialData.totalLoanAmount && financialData.totalLoanAmount > 0) {
                    summaryParts.push(`- Tổng khoản vay: ${financialData.totalLoanAmount.toLocaleString('vi-VN')} VND.`);
                }

                // Dữ liệu tháng hiện tại
                if (financialData.incomeThisMonth) {
                    summaryParts.push(`- Thu nhập tháng này: ${financialData.incomeThisMonth.toLocaleString('vi-VN')} VND.`);
                }
                if (financialData.expensesThisMonth && Object.keys(financialData.expensesThisMonth).length > 0) {
                    let expenseDetails = Object.entries(financialData.expensesThisMonth)
                        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.toLocaleString('vi-VN')} VND`)
                        .join(', ');
                    if (expenseDetails) summaryParts.push(`- Chi tiêu tháng này: ${expenseDetails}.`);
                }

                if (financialData.investments && financialData.investments.length > 0) {
                    let investmentDetails = financialData.investments
                        .map(inv => `${inv.type} (${inv.name}): ${inv.value.toLocaleString('vi-VN')} VND`)
                        .join('; ');
                    if (investmentDetails) summaryParts.push(`- Các khoản đầu tư: ${investmentDetails}.`);
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

// Simple test route for debugging
router.post('/test', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Enhanced chatbot route is working!',
            timestamp: new Date().toISOString(),
            user: req.user?.id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Test route error: ' + error.message
        });
    }
});

export default router;
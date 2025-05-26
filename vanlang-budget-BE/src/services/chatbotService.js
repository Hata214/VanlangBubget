import Income from '../models/incomeModel.js';
import Expense from '../models/expenseModel.js';
import Investment from '../models/investmentModel.js';
import Budget from '../models/budgetModel.js';
import Loan from '../models/loanModel.js';

/**
 * Chatbot Service - Centralized business logic for chatbot operations
 */
class ChatbotService {
    constructor(cacheService, calculationService) {
        this.cacheService = cacheService;
        this.calculationService = calculationService;
    }

    /**
     * Lấy dữ liệu tài chính thật từ database với caching
     */
    async getUserFinancialData(userId) {
        try {
            console.log('🔍 ChatbotService.getUserFinancialData - Starting for userId:', userId);

            // Thử lấy từ cache trước
            let financialData = await this.cacheService.getUserFinancialData(userId);

            if (!financialData) {
                console.log('Cache miss - Fetching fresh financial data from database');

                // Lấy dữ liệu từ database
                const [incomes, expenses, investments, budgets, loans] = await Promise.all([
                    Income.find({ userId: userId }),
                    Expense.find({ userId: userId }),
                    Investment.find({ userId: userId }),
                    Budget.find({ userId: userId }),
                    Loan.find({ userId: userId })
                ]);

                // Tính toán các metrics tổng quan
                const totalIncomeAllTime = incomes.reduce((total, income) => total + (income.amount || 0), 0);
                const totalExpenseAllTime = expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
                const totalSavings = Math.max(0, totalIncomeAllTime - totalExpenseAllTime);

                // Tính tổng khoản vay
                const totalLoanAmount = loans.reduce((total, loan) => {
                    const principal = loan.amount || 0;
                    const interestAmount = this.calculationService.calculateLoanInterest(
                        principal,
                        loan.interestRate || 0,
                        loan.term || 1
                    );
                    return total + principal + interestAmount;
                }, 0);

                // Tính dữ liệu tháng hiện tại
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

                const incomesThisMonth = incomes.filter(income => {
                    const incomeDate = new Date(income.date);
                    return incomeDate >= startOfMonth && incomeDate <= endOfMonth;
                });

                const expensesThisMonth = expenses.filter(expense => {
                    const expenseDate = new Date(expense.date);
                    return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
                });

                const incomeThisMonth = incomesThisMonth.reduce((total, income) => total + (income.amount || 0), 0);
                const totalExpenses = expensesThisMonth.reduce((total, expense) => total + (expense.amount || 0), 0);

                // Nhóm chi tiêu theo category
                const expensesThisMonthByCategory = expensesThisMonth.reduce((acc, expense) => {
                    const category = expense.category || 'Other';
                    acc[category] = (acc[category] || 0) + expense.amount;
                    return acc;
                }, {});

                // Xử lý đầu tư
                const investmentData = investments.map(inv => ({
                    type: inv.type || 'Unknown',
                    name: inv.name || inv.symbol || 'Unnamed',
                    value: inv.currentValue || inv.amount || 0,
                    invested: inv.amount || 0,
                    profit: (inv.currentValue || inv.amount || 0) - (inv.amount || 0)
                }));

                const totalInvestmentValue = investmentData.reduce((total, inv) => total + inv.value, 0);

                // Xử lý ngân sách
                const activeBudgets = budgets.map(budget => {
                    const spent = expensesThisMonth
                        .filter(expense => expense.category === budget.category)
                        .reduce((total, expense) => total + expense.amount, 0);

                    return {
                        category: budget.category,
                        limit: budget.amount,
                        spent: spent,
                        remaining: Math.max(0, budget.amount - spent),
                        percentUsed: budget.amount ? Math.round((spent / budget.amount) * 100) : 0
                    };
                });

                // Tạo financial data object
                financialData = {
                    // Dữ liệu tổng quan (như dashboard)
                    totalBalance: totalSavings,
                    totalIncomeAllTime,
                    totalExpenseAllTime,
                    totalLoanAmount,
                    totalSavings,

                    // Dữ liệu tháng hiện tại
                    incomeThisMonth,
                    totalExpensesThisMonth: totalExpenses,
                    expensesThisMonth: expensesThisMonthByCategory,
                    savingsThisMonth: incomeThisMonth - totalExpenses,

                    // Đầu tư
                    investments: investmentData,
                    totalInvestmentValue,

                    // Ngân sách
                    activeBudgets,

                    // Metadata
                    lastUpdated: new Date().toISOString(),
                    dataSource: 'database',
                    period: {
                        month: now.getMonth() + 1,
                        year: now.getFullYear()
                    }
                };

                console.log('📊 ChatbotService - Financial data calculated:', {
                    totalBalance: totalSavings,
                    totalIncomeAllTime,
                    totalExpenseAllTime,
                    totalLoanAmount,
                    incomeThisMonth,
                    totalExpensesThisMonth: totalExpenses
                });

                // Cache data for 30 minutes
                await this.cacheService.cacheUserFinancialData(userId, financialData);
            } else {
                console.log(`Using cached financial data for user: ${userId}`);
            }

            return financialData;

        } catch (error) {
            console.error('ChatbotService.getUserFinancialData error:', error);

            // Return basic structure để tránh crash
            return {
                totalBalance: 0,
                totalIncomeAllTime: 0,
                totalExpenseAllTime: 0,
                totalLoanAmount: 0,
                incomeThisMonth: 0,
                totalExpensesThisMonth: 0,
                expensesThisMonth: {},
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
     * Format financial context cho Gemini
     */
    formatFinancialContext(financialData, language = 'vi') {
        if (!financialData) return '';

        const templates = {
            vi: {
                totalBalance: `💎 Số dư hiện tại: ${financialData.totalBalance?.toLocaleString('vi-VN')} VND`,
                totalIncome: `💰 Tổng thu nhập tích lũy: ${financialData.totalIncomeAllTime?.toLocaleString('vi-VN')} VND`,
                totalExpense: `💸 Tổng chi tiêu tích lũy: ${financialData.totalExpenseAllTime?.toLocaleString('vi-VN')} VND`,
                totalLoan: `🏦 Tổng khoản vay: ${financialData.totalLoanAmount?.toLocaleString('vi-VN')} VND`,
                incomeThisMonth: `📈 Thu nhập tháng ${financialData.period?.month}: ${financialData.incomeThisMonth?.toLocaleString('vi-VN')} VND`,
                expenseThisMonth: `📉 Chi tiêu tháng ${financialData.period?.month}: ${financialData.totalExpensesThisMonth?.toLocaleString('vi-VN')} VND`,
                investments: `🎯 Tổng giá trị đầu tư: ${financialData.totalInvestmentValue?.toLocaleString('vi-VN')} VND`,
                budgets: `📋 Ngân sách đang hoạt động: ${financialData.activeBudgets?.length || 0} ngân sách`
            },
            en: {
                totalBalance: `💎 Current balance: ${financialData.totalBalance?.toLocaleString('en-US')} VND`,
                totalIncome: `💰 Total accumulated income: ${financialData.totalIncomeAllTime?.toLocaleString('en-US')} VND`,
                totalExpense: `💸 Total accumulated expenses: ${financialData.totalExpenseAllTime?.toLocaleString('en-US')} VND`,
                totalLoan: `🏦 Total loans: ${financialData.totalLoanAmount?.toLocaleString('en-US')} VND`,
                incomeThisMonth: `📈 Income this month: ${financialData.incomeThisMonth?.toLocaleString('en-US')} VND`,
                expenseThisMonth: `📉 Expenses this month: ${financialData.totalExpensesThisMonth?.toLocaleString('en-US')} VND`,
                investments: `🎯 Total investment value: ${financialData.totalInvestmentValue?.toLocaleString('en-US')} VND`,
                budgets: `📋 Active budgets: ${financialData.activeBudgets?.length || 0} budgets`
            }
        };

        const t = templates[language] || templates.vi;
        let context = `\n📊 THÔNG TIN TÀI CHÍNH HIỆN TẠI:\n`;

        // Dữ liệu tổng quan
        if (financialData.totalBalance !== undefined) {
            context += `${t.totalBalance}\n`;
        }

        if (financialData.totalIncomeAllTime !== undefined) {
            context += `${t.totalIncome}\n`;
        }

        if (financialData.totalExpenseAllTime !== undefined) {
            context += `${t.totalExpense}\n`;
        }

        if (financialData.totalLoanAmount !== undefined && financialData.totalLoanAmount > 0) {
            context += `${t.totalLoan}\n`;
        }

        // Dữ liệu tháng hiện tại
        context += `\n📅 DỮ LIỆU THÁNG ${financialData.period?.month}/${financialData.period?.year}:\n`;

        if (financialData.incomeThisMonth !== undefined) {
            context += `${t.incomeThisMonth}\n`;
        }

        if (financialData.totalExpensesThisMonth !== undefined) {
            context += `${t.expenseThisMonth}\n`;
        }

        // Đầu tư
        if (financialData.investments?.length > 0) {
            context += `${t.investments}\n`;
        }

        // Ngân sách
        if (financialData.activeBudgets?.length > 0) {
            context += `${t.budgets}\n`;
        }

        return context;
    }

    /**
     * Validate user input
     */
    validateInput(message, language = 'vi') {
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return {
                isValid: false,
                error: language === 'vi' ? 'Tin nhắn không hợp lệ.' : 'Invalid message.'
            };
        }

        if (message.length > 1000) {
            return {
                isValid: false,
                error: language === 'vi' ? 'Tin nhắn quá dài.' : 'Message too long.'
            };
        }

        return { isValid: true };
    }

    /**
     * Check if financial data is needed for the query
     */
    needsFinancialData(message, intentAnalysis) {
        const financialKeywords = [
            'thu nhập', 'chi tiêu', 'tiết kiệm', 'đầu tư', 'ngân sách', 'số dư', 'balance',
            'income', 'expense', 'saving', 'investment', 'budget', 'money', 'tiền',
            'của tôi', 'my', 'hiện tại', 'current', 'tổng', 'total'
        ];

        const messageContainsFinancialKeywords = financialKeywords.some(keyword =>
            message.toLowerCase().includes(keyword.toLowerCase())
        );

        const intentRequiresFinancialData = [
            'expense.query', 'expense.summary', 'expense.detail',
            'income.query', 'income.summary', 'income.detail',
            'loan.query', 'loan.summary', 'loan.detail',
            'balance.query',
            'budget.check', 'budget.calculate',
            'investment.query', 'investment.analyze',
            'saving.goal',
            'financial.analyze',
        ].includes(intentAnalysis?.intent);

        return intentRequiresFinancialData || messageContainsFinancialKeywords;
    }

    // Method to generate simple responses based on intent
    getGreetingResponse(language = 'vi') {
        const responses = {
            vi: 'Chào bạn! Tôi là VanLangBot, trợ lý tài chính AI của bạn. Tôi có thể giúp gì cho bạn hôm nay? 💰',
            en: 'Hello! I am VanLangBot, your AI financial assistant. How can I help you today? 💰'
        };
        return responses[language] || responses.vi;
    }

    getFarewellResponse(language = 'vi') {
        const responses = {
            vi: 'Tạm biệt! Chúc bạn một ngày tốt lành. Hẹn gặp lại! 👋',
            en: 'Goodbye! Have a great day. See you later! 👋'
        };
        return responses[language] || responses.vi;
    }

    getBotIntroductionResponse(language = 'vi') {
        const responses = {
            vi: 'Tôi là VanLangBot, trợ lý tài chính AI được thiết kế để giúp bạn quản lý tài chính cá nhân, theo dõi thu chi, phân tích đầu tư và lập kế hoạch cho tương lai. Hãy hỏi tôi bất cứ điều gì liên quan đến tài chính của bạn!',
            en: 'I am VanLangBot, an AI financial assistant designed to help you manage your personal finances, track income and expenses, analyze investments, and plan for the future. Feel free to ask me anything about your finances!'
        };
        return responses[language] || responses.vi;
    }

    getTimeDateResponse(language = 'vi') {
        const now = new Date();
        const timeString = now.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US');
        const dateString = now.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
        const responses = {
            vi: `Bây giờ là ${timeString} ngày ${dateString}.`,
            en: `The current time is ${timeString} on ${dateString}.`
        };
        return responses[language] || responses.vi;
    }

    getCapabilityResponse(language = 'vi') {
        const responses = {
            vi: 'Tôi có thể giúp bạn: theo dõi thu nhập và chi tiêu, phân tích các khoản đầu tư, xem xét các khoản vay, đặt mục tiêu tiết kiệm, và đưa ra các gợi ý tài chính thông minh. Bạn muốn tôi giúp gì cụ thể?',
            en: 'I can help you with: tracking income and expenses, analyzing investments, reviewing loans, setting savings goals, and providing smart financial suggestions. What can I help you with specifically?'
        };
        return responses[language] || responses.vi;
    }

    getBlockedTopicResponse(language = 'vi') {
        const responses = {
            vi: 'Xin lỗi, tôi chỉ được lập trình để hỗ trợ các vấn đề liên quan đến tài chính cá nhân trong ứng dụng VanLang Budget. Bạn có câu hỏi nào khác về tài chính không?',
            en: 'Sorry, I am only programmed to assist with personal finance matters within the VanLang Budget application. Do you have any other finance-related questions?'
        };
        return responses[language] || responses.vi;
    }
}

export default ChatbotService;

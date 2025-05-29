/**
 * 📊 Enhanced Statistics Engine - Thống kê nâng cao cho VanLang Agent
 * Xử lý các câu hỏi phân tích dữ liệu tài chính phức tạp với insights và recommendations
 */

import logger from '../utils/logger.js';

class EnhancedStatisticsEngine {
    constructor() {
        this.statisticsKeywords = {
            average: ['trung bình', 'trung binh', 'average', 'mean', 'tb'],
            comparison: ['so sánh', 'so sanh', 'compare', 'comparison', 'vs', 'versus'],
            overview: ['tổng quan', 'tong quan', 'overview', 'summary', 'thống kê', 'thong ke'],
            analysis: ['phân tích', 'phan tich', 'analyze', 'analysis', 'insight', 'breakdown'],
            trend: ['xu hướng', 'xu huong', 'trend', 'pattern', 'biến động', 'bien dong'],
            category: ['danh mục', 'danh muc', 'category', 'loại', 'loai', 'type']
        };

        this.timePeriods = {
            daily: ['ngày', 'hàng ngày', 'daily', 'per day'],
            weekly: ['tuần', 'hàng tuần', 'weekly', 'per week'],
            monthly: ['tháng', 'hàng tháng', 'monthly', 'per month'],
            yearly: ['năm', 'hàng năm', 'yearly', 'per year']
        };
    }

    /**
     * 🎯 Main Detection - Kiểm tra xem có phải statistics query không
     */
    detectStatisticsQuery(message) {
        const normalizedMessage = message.toLowerCase().trim();

        // Pattern 1: Statistics keywords
        const hasStatisticsKeywords = Object.values(this.statisticsKeywords)
            .flat()
            .some(keyword => normalizedMessage.includes(keyword));

        // Pattern 2: Time-based analysis
        const hasTimePeriodKeywords = Object.values(this.timePeriods)
            .flat()
            .some(keyword => normalizedMessage.includes(keyword));

        // Pattern 3: Specific statistics patterns
        const statisticsPatterns = [
            /trung bình.*chi tiêu/i,
            /chi tiêu.*trung bình/i,
            /trung bình.*thu nhập/i,
            /thu nhập.*trung bình/i,
            /so sánh.*thu.*chi/i,
            /so sánh.*chi.*thu/i,
            /thống kê.*tổng quan/i,
            /tổng quan.*thống kê/i,
            /phân tích.*chi tiêu/i,
            /chi tiêu.*phân tích/i,
            /xu hướng.*tài chính/i,
            /breakdown.*category/i,
            /average.*spending/i,
            /spending.*average/i
        ];

        const hasStatisticsPatterns = statisticsPatterns.some(pattern =>
            pattern.test(normalizedMessage)
        );

        const confidence = this.calculateConfidence({
            hasStatisticsKeywords,
            hasTimePeriodKeywords,
            hasStatisticsPatterns
        });

        const isStatistics = confidence > 0.3;

        logger.info('Statistics detection', {
            message: normalizedMessage,
            patterns: {
                hasStatisticsKeywords,
                hasTimePeriodKeywords,
                hasStatisticsPatterns
            },
            confidence,
            isStatistics
        });

        return {
            isStatistics,
            confidence,
            type: this.determineStatisticsType(normalizedMessage)
        };
    }

    /**
     * 📊 Tính confidence score
     */
    calculateConfidence(patterns) {
        let score = 0;
        const weights = {
            hasStatisticsKeywords: 0.4,
            hasTimePeriodKeywords: 0.3,
            hasStatisticsPatterns: 0.5
        };

        Object.entries(patterns).forEach(([key, value]) => {
            if (value && weights[key]) {
                score += weights[key];
            }
        });

        return Math.min(score, 1.0);
    }

    /**
     * 🔍 Xác định loại thống kê
     */
    determineStatisticsType(message) {
        if (this.statisticsKeywords.average.some(k => message.includes(k))) {
            return 'average_analysis';
        }
        if (this.statisticsKeywords.comparison.some(k => message.includes(k))) {
            return 'comparison_analysis';
        }
        if (this.statisticsKeywords.overview.some(k => message.includes(k))) {
            return 'overview_analysis';
        }
        if (this.statisticsKeywords.analysis.some(k => message.includes(k))) {
            return 'spending_analysis';
        }
        return 'general_statistics';
    }

    /**
     * 📊 Main Processing - Xử lý thống kê nâng cao
     */
    async processStatistics(message, financialData, timeFilter = null) {
        try {
            const statisticsType = this.determineStatisticsType(message.toLowerCase());

            logger.info('Processing enhanced statistics', {
                statisticsType,
                message,
                dataAvailable: {
                    incomes: financialData.incomes?.length || 0,
                    expenses: financialData.expenses?.length || 0,
                    loans: financialData.loans?.length || 0,
                    investments: financialData.investments?.length || 0
                }
            });

            switch (statisticsType) {
                case 'average_analysis':
                    return this.processAverageAnalysis(financialData, timeFilter);
                case 'comparison_analysis':
                    return this.processComparisonAnalysis(financialData, timeFilter);
                case 'overview_analysis':
                    return this.processOverviewAnalysis(financialData, timeFilter);
                case 'spending_analysis':
                    return this.processSpendingAnalysis(financialData, timeFilter);
                default:
                    return this.processGeneralStatistics(financialData, timeFilter);
            }

        } catch (error) {
            logger.error('Error processing enhanced statistics:', error);
            return this.getErrorResponse();
        }
    }

    /**
     * 📈 Xử lý phân tích trung bình
     */
    processAverageAnalysis(financialData, timeFilter) {
        const { incomes, expenses, summary } = financialData;

        // Tính trung bình theo giao dịch
        const avgIncomePerTransaction = incomes.length > 0 ?
            summary.totalIncomes / incomes.length : 0;
        const avgExpensePerTransaction = expenses.length > 0 ?
            summary.totalExpenses / expenses.length : 0;

        // Tính trung bình theo thời gian
        const timeStats = this.calculateTimeBasedAverages(financialData, timeFilter);

        // Phân tích xu hướng
        const trends = this.analyzeTrends(financialData);

        return `📊 **Phân tích trung bình chi tiêu:**

💰 **Trung bình theo giao dịch:**
• Thu nhập: ${this.formatCurrency(avgIncomePerTransaction)}/giao dịch
• Chi tiêu: ${this.formatCurrency(avgExpensePerTransaction)}/giao dịch
• Tỷ lệ tiết kiệm: ${this.calculateSavingsRate(summary)}%

📅 **Trung bình theo thời gian:**
${timeStats}

📈 **Xu hướng:**
${trends}

💡 **Insights:**
${this.generateAverageInsights(avgIncomePerTransaction, avgExpensePerTransaction, summary)}

🎯 **Recommendations:**
${this.generateAverageRecommendations(avgIncomePerTransaction, avgExpensePerTransaction)}`;
    }

    /**
     * ⚖️ Xử lý so sánh thu chi
     */
    processComparisonAnalysis(financialData, timeFilter) {
        const { summary } = financialData;
        const balance = summary.totalIncomes - summary.totalExpenses;
        const incomeExpenseRatio = summary.totalExpenses > 0 ?
            (summary.totalIncomes / summary.totalExpenses) : 0;

        // So sánh theo thời gian
        const timeComparison = this.calculateTimeComparison(financialData, timeFilter);

        // So sánh theo danh mục
        const categoryComparison = this.calculateCategoryComparison(financialData);

        return `📊 **So sánh thu nhập vs chi tiêu:**

💰 **Tổng quan:**
• Thu nhập: ${this.formatCurrency(summary.totalIncomes)}
• Chi tiêu: ${this.formatCurrency(summary.totalExpenses)}
• Số dư: ${this.formatCurrency(balance)} ${balance >= 0 ? '✅' : '⚠️'}
• Tỷ lệ thu/chi: ${incomeExpenseRatio.toFixed(2)}:1

📈 **Phân tích tỷ lệ:**
• Chi tiêu chiếm ${((summary.totalExpenses / summary.totalIncomes) * 100).toFixed(1)}% thu nhập
• Tiết kiệm được ${this.calculateSavingsRate(summary)}% thu nhập
• ${this.getFinancialHealthStatus(incomeExpenseRatio)}

📅 **So sánh theo thời gian:**
${timeComparison}

📂 **So sánh theo danh mục:**
${categoryComparison}

💡 **Insights:**
${this.generateComparisonInsights(summary, incomeExpenseRatio)}

🎯 **Recommendations:**
${this.generateComparisonRecommendations(incomeExpenseRatio, balance)}`;
    }

    /**
     * 📋 Xử lý thống kê tổng quan
     */
    processOverviewAnalysis(financialData, timeFilter) {
        const { summary, incomes, expenses, loans, investments } = financialData;

        // Key metrics
        const keyMetrics = this.calculateKeyMetrics(financialData);

        // Distribution analysis
        const distribution = this.calculateDistribution(financialData);

        // Performance indicators
        const performance = this.calculatePerformanceIndicators(financialData);

        return `📊 **Thống kê tổng quan tài chính:**

🎯 **Key Metrics:**
${keyMetrics}

📈 **Phân bổ tài sản:**
${distribution}

⚡ **Chỉ số hiệu suất:**
${performance}

📊 **Thống kê chi tiết:**
• Tổng giao dịch: ${summary.totalTransactions}
• Số danh mục chi tiêu: ${this.getUniqueCategories(expenses).length}
• Khoản vay đang hoạt động: ${summary.activeLoans}/${loans.length}
• Số khoản đầu tư: ${investments.length}

💡 **Financial Health Score:**
${this.calculateFinancialHealthScore(financialData)}

🎯 **Strategic Recommendations:**
${this.generateOverviewRecommendations(financialData)}`;
    }

    /**
     * 🔍 Xử lý phân tích chi tiêu
     */
    processSpendingAnalysis(financialData, timeFilter) {
        const { expenses } = financialData;

        // Category breakdown
        const categoryBreakdown = this.calculateCategoryBreakdown(expenses);

        // Spending patterns
        const patterns = this.analyzeSpendingPatterns(expenses);

        // Top expenses
        const topExpenses = this.getTopExpenses(expenses, 5);

        return `📊 **Phân tích chi tiêu chi tiết:**

📂 **Breakdown theo danh mục:**
${categoryBreakdown}

📈 **Patterns & Trends:**
${patterns}

🔝 **Top 5 khoản chi tiêu lớn nhất:**
${topExpenses}

💡 **Spending Insights:**
${this.generateSpendingInsights(expenses)}

🎯 **Optimization Recommendations:**
${this.generateSpendingRecommendations(expenses)}`;
    }

    /**
     * 🔧 Helper Methods
     */
    calculateTimeBasedAverages(financialData, timeFilter) {
        const { incomes, expenses } = financialData;

        // Group by time periods
        const dailyAvg = this.calculateDailyAverage(expenses);
        const weeklyAvg = this.calculateWeeklyAverage(expenses);
        const monthlyAvg = this.calculateMonthlyAverage(expenses);

        return `• Hàng ngày: ${this.formatCurrency(dailyAvg)}
• Hàng tuần: ${this.formatCurrency(weeklyAvg)}
• Hàng tháng: ${this.formatCurrency(monthlyAvg)}`;
    }

    calculateDailyAverage(expenses) {
        if (expenses.length === 0) return 0;

        const dates = expenses.map(e => new Date(e.date).toDateString());
        const uniqueDates = [...new Set(dates)];
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        return uniqueDates.length > 0 ? totalExpenses / uniqueDates.length : 0;
    }

    calculateWeeklyAverage(expenses) {
        return this.calculateDailyAverage(expenses) * 7;
    }

    calculateMonthlyAverage(expenses) {
        return this.calculateDailyAverage(expenses) * 30;
    }

    analyzeTrends(financialData) {
        const { expenses } = financialData;

        if (expenses.length < 2) {
            return '• Cần thêm dữ liệu để phân tích xu hướng';
        }

        // Sort by date
        const sortedExpenses = expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
        const recentExpenses = sortedExpenses.slice(-10); // Last 10 transactions
        const olderExpenses = sortedExpenses.slice(0, 10); // First 10 transactions

        const recentAvg = recentExpenses.reduce((sum, e) => sum + e.amount, 0) / recentExpenses.length;
        const olderAvg = olderExpenses.reduce((sum, e) => sum + e.amount, 0) / olderExpenses.length;

        const trendPercentage = ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1);
        const trendDirection = recentAvg > olderAvg ? '📈 Tăng' : '📉 Giảm';

        return `• ${trendDirection} ${Math.abs(trendPercentage)}% so với trước
• Giao dịch gần đây: ${this.formatCurrency(recentAvg)}/giao dịch
• Xu hướng: ${this.getTrendDescription(parseFloat(trendPercentage))}`;
    }

    calculateSavingsRate(summary) {
        if (summary.totalIncomes === 0) return 0;
        return (((summary.totalIncomes - summary.totalExpenses) / summary.totalIncomes) * 100).toFixed(1);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
    }

    getTrendDescription(percentage) {
        if (Math.abs(percentage) < 5) return 'Ổn định';
        if (percentage > 20) return 'Tăng mạnh';
        if (percentage > 5) return 'Tăng nhẹ';
        if (percentage < -20) return 'Giảm mạnh';
        if (percentage < -5) return 'Giảm nhẹ';
        return 'Biến động nhẹ';
    }

    getFinancialHealthStatus(ratio) {
        if (ratio >= 1.5) return '🟢 Tình hình tài chính tốt';
        if (ratio >= 1.2) return '🟡 Tình hình tài chính ổn định';
        if (ratio >= 1.0) return '🟠 Cần cân nhắc chi tiêu';
        return '🔴 Cần cải thiện tài chính';
    }

    generateAverageInsights(avgIncome, avgExpense, summary) {
        const insights = [];

        if (avgExpense > avgIncome) {
            insights.push('• Chi tiêu trung bình cao hơn thu nhập trung bình');
        }

        const savingsRate = this.calculateSavingsRate(summary);
        if (savingsRate < 10) {
            insights.push('• Tỷ lệ tiết kiệm thấp, nên tăng cường');
        } else if (savingsRate > 30) {
            insights.push('• Tỷ lệ tiết kiệm tốt, có thể cân nhắc đầu tư');
        }

        return insights.length > 0 ? insights.join('\n') : '• Tình hình tài chính cân bằng';
    }

    generateAverageRecommendations(avgIncome, avgExpense) {
        const recommendations = [];

        if (avgExpense > avgIncome * 0.8) {
            recommendations.push('• Giảm chi tiêu không cần thiết');
            recommendations.push('• Tìm cách tăng thu nhập');
        }

        recommendations.push('• Thiết lập ngân sách hàng tháng');
        recommendations.push('• Theo dõi chi tiêu định kỳ');

        return recommendations.join('\n');
    }

    /**
     * 📊 Additional Helper Methods
     */
    calculateTimeComparison(financialData, timeFilter) {
        // Simplified time comparison - can be enhanced with historical data
        const { summary } = financialData;
        const currentPeriod = timeFilter ? 'kỳ này' : 'tổng cộng';

        return `• ${currentPeriod}: Thu ${this.formatCurrency(summary.totalIncomes)}, Chi ${this.formatCurrency(summary.totalExpenses)}
• Cần dữ liệu lịch sử để so sánh chi tiết
• Xu hướng: ${summary.totalIncomes > summary.totalExpenses ? 'Tích cực' : 'Cần cải thiện'}`;
    }

    calculateCategoryComparison(financialData) {
        const { expenses } = financialData;
        const categoryTotals = {};

        expenses.forEach(expense => {
            const category = expense.category || 'Khác';
            categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        if (sortedCategories.length === 0) {
            return '• Chưa có dữ liệu chi tiêu theo danh mục';
        }

        return sortedCategories.map(([category, amount], index) =>
            `• ${index + 1}. ${category}: ${this.formatCurrency(amount)}`
        ).join('\n');
    }

    calculateKeyMetrics(financialData) {
        const { summary } = financialData;
        const netWorth = summary.totalIncomes - summary.totalExpenses + summary.totalInvestments - summary.totalLoans;
        const liquidityRatio = summary.totalExpenses > 0 ? (summary.totalIncomes / summary.totalExpenses) : 0;

        return `• Tài sản ròng: ${this.formatCurrency(netWorth)}
• Tỷ lệ thanh khoản: ${liquidityRatio.toFixed(2)}
• Tỷ lệ nợ: ${summary.totalIncomes > 0 ? ((summary.totalLoans / summary.totalIncomes) * 100).toFixed(1) : 0}%
• ROI đầu tư: ${this.calculateInvestmentROI(financialData)}%`;
    }

    calculateDistribution(financialData) {
        const { summary } = financialData;
        const total = summary.totalIncomes + summary.totalInvestments;

        if (total === 0) return '• Chưa có dữ liệu để phân tích phân bổ';

        const expensePercent = ((summary.totalExpenses / total) * 100).toFixed(1);
        const investmentPercent = ((summary.totalInvestments / total) * 100).toFixed(1);
        const savingsPercent = (100 - parseFloat(expensePercent) - parseFloat(investmentPercent)).toFixed(1);

        return `• Chi tiêu: ${expensePercent}%
• Đầu tư: ${investmentPercent}%
• Tiết kiệm: ${savingsPercent}%`;
    }

    calculatePerformanceIndicators(financialData) {
        const { expenses, incomes } = financialData;
        const avgTransactionSize = expenses.length > 0 ?
            expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length : 0;
        const transactionFrequency = this.calculateTransactionFrequency(expenses);

        return `• Kích thước giao dịch TB: ${this.formatCurrency(avgTransactionSize)}
• Tần suất giao dịch: ${transactionFrequency}
• Hiệu quả chi tiêu: ${this.calculateSpendingEfficiency(financialData)}
• Điểm tài chính: ${this.calculateFinancialScore(financialData)}/100`;
    }

    calculateCategoryBreakdown(expenses) {
        const categoryTotals = {};
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        expenses.forEach(expense => {
            const category = expense.category || 'Khác';
            categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a);

        if (sortedCategories.length === 0) {
            return '• Chưa có dữ liệu chi tiêu';
        }

        return sortedCategories.map(([category, amount]) => {
            const percentage = ((amount / totalExpenses) * 100).toFixed(1);
            return `• ${category}: ${this.formatCurrency(amount)} (${percentage}%)`;
        }).join('\n');
    }

    analyzeSpendingPatterns(expenses) {
        if (expenses.length < 5) {
            return '• Cần thêm dữ liệu để phân tích patterns';
        }

        const patterns = [];

        // Analyze by day of week
        const dayPattern = this.analyzeDayOfWeekPattern(expenses);
        patterns.push(`• Ngày chi tiêu nhiều nhất: ${dayPattern}`);

        // Analyze amount ranges
        const amountPattern = this.analyzeAmountPattern(expenses);
        patterns.push(`• Khoảng tiền thường chi: ${amountPattern}`);

        // Analyze frequency
        const frequency = this.calculateTransactionFrequency(expenses);
        patterns.push(`• Tần suất: ${frequency}`);

        return patterns.join('\n');
    }

    getTopExpenses(expenses, limit = 5) {
        const sortedExpenses = expenses
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);

        if (sortedExpenses.length === 0) {
            return '• Chưa có dữ liệu chi tiêu';
        }

        return sortedExpenses.map((expense, index) => {
            const date = new Date(expense.date).toLocaleDateString('vi-VN');
            return `${index + 1}. ${expense.description || 'Chi tiêu'}: ${this.formatCurrency(expense.amount)} (${date})`;
        }).join('\n');
    }

    // Additional calculation methods
    calculateInvestmentROI(financialData) {
        // Simplified ROI calculation
        return '0.0'; // Placeholder - would need more complex calculation
    }

    calculateTransactionFrequency(expenses) {
        if (expenses.length < 2) return 'Không đủ dữ liệu';

        const dates = expenses.map(e => new Date(e.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) return 'Cùng ngày';

        const frequency = expenses.length / daysDiff;
        if (frequency >= 1) return `${frequency.toFixed(1)} giao dịch/ngày`;
        if (frequency >= 0.14) return `${(frequency * 7).toFixed(1)} giao dịch/tuần`;
        return `${(frequency * 30).toFixed(1)} giao dịch/tháng`;
    }

    calculateSpendingEfficiency(financialData) {
        // Simplified efficiency score
        const { summary } = financialData;
        const efficiency = summary.totalIncomes > 0 ?
            ((summary.totalIncomes - summary.totalExpenses) / summary.totalIncomes * 100) : 0;
        return `${efficiency.toFixed(1)}%`;
    }

    calculateFinancialScore(financialData) {
        const { summary } = financialData;
        let score = 50; // Base score

        // Income vs expense ratio
        if (summary.totalIncomes > summary.totalExpenses) score += 20;

        // Savings rate
        const savingsRate = parseFloat(this.calculateSavingsRate(summary));
        if (savingsRate > 20) score += 15;
        else if (savingsRate > 10) score += 10;

        // Investment presence
        if (summary.totalInvestments > 0) score += 10;

        // Loan management
        if (summary.totalLoans < summary.totalIncomes * 0.3) score += 5;

        return Math.min(score, 100);
    }

    analyzeDayOfWeekPattern(expenses) {
        const dayTotals = {};
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

        expenses.forEach(expense => {
            const day = new Date(expense.date).getDay();
            dayTotals[day] = (dayTotals[day] || 0) + expense.amount;
        });

        const maxDay = Object.entries(dayTotals)
            .reduce((max, [day, amount]) => amount > max.amount ? { day, amount } : max, { day: 0, amount: 0 });

        return dayNames[maxDay.day] || 'Không xác định';
    }

    analyzeAmountPattern(expenses) {
        const amounts = expenses.map(e => e.amount).sort((a, b) => a - b);
        const median = amounts[Math.floor(amounts.length / 2)];
        const q1 = amounts[Math.floor(amounts.length * 0.25)];
        const q3 = amounts[Math.floor(amounts.length * 0.75)];

        return `${this.formatCurrency(q1)} - ${this.formatCurrency(q3)} (median: ${this.formatCurrency(median)})`;
    }

    generateComparisonInsights(summary, ratio) {
        const insights = [];

        if (ratio < 1) {
            insights.push('• Chi tiêu vượt thu nhập - cần điều chỉnh ngay');
        } else if (ratio < 1.2) {
            insights.push('• Thu chi cân bằng nhưng ít dư dả');
        } else {
            insights.push('• Tình hình thu chi tích cực');
        }

        const savingsRate = parseFloat(this.calculateSavingsRate(summary));
        if (savingsRate < 10) {
            insights.push('• Tỷ lệ tiết kiệm thấp, cần cải thiện');
        }

        return insights.join('\n');
    }

    generateComparisonRecommendations(ratio, balance) {
        const recommendations = [];

        if (ratio < 1) {
            recommendations.push('• Cắt giảm chi tiêu không cần thiết ngay lập tức');
            recommendations.push('• Tìm nguồn thu nhập bổ sung');
        } else if (ratio < 1.3) {
            recommendations.push('• Tăng cường tiết kiệm');
            recommendations.push('• Xây dựng quỹ dự phòng');
        } else {
            recommendations.push('• Cân nhắc đầu tư để tăng thu nhập thụ động');
            recommendations.push('• Duy trì thói quen tài chính tốt');
        }

        return recommendations.join('\n');
    }

    generateOverviewRecommendations(financialData) {
        const score = this.calculateFinancialScore(financialData);
        const recommendations = [];

        if (score < 60) {
            recommendations.push('• Ưu tiên cân bằng thu chi');
            recommendations.push('• Xây dựng kế hoạch tài chính cơ bản');
        } else if (score < 80) {
            recommendations.push('• Tăng cường đầu tư và tiết kiệm');
            recommendations.push('• Đa dạng hóa nguồn thu nhập');
        } else {
            recommendations.push('• Tối ưu hóa danh mục đầu tư');
            recommendations.push('• Lập kế hoạch tài chính dài hạn');
        }

        return recommendations.join('\n');
    }

    generateSpendingInsights(expenses) {
        const insights = [];
        const categoryCount = this.getUniqueCategories(expenses).length;

        if (categoryCount > 10) {
            insights.push('• Chi tiêu phân tán nhiều danh mục');
        } else if (categoryCount < 3) {
            insights.push('• Chi tiêu tập trung vào ít danh mục');
        }

        const avgAmount = expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length;
        if (avgAmount > 1000000) {
            insights.push('• Có xu hướng chi tiêu lớn');
        }

        return insights.length > 0 ? insights.join('\n') : '• Thói quen chi tiêu cân bằng';
    }

    generateSpendingRecommendations(expenses) {
        const recommendations = [];
        const categoryTotals = {};

        expenses.forEach(expense => {
            const category = expense.category || 'Khác';
            categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
        });

        const topCategory = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)[0];

        if (topCategory) {
            recommendations.push(`• Kiểm soát chi tiêu "${topCategory[0]}" - danh mục lớn nhất`);
        }

        recommendations.push('• Thiết lập ngân sách cho từng danh mục');
        recommendations.push('• Theo dõi chi tiêu hàng tuần');

        return recommendations.join('\n');
    }

    getUniqueCategories(expenses) {
        return [...new Set(expenses.map(e => e.category || 'Khác'))];
    }

    calculateFinancialHealthScore(financialData) {
        const score = this.calculateFinancialScore(financialData);
        let status = '';

        if (score >= 80) status = '🟢 Xuất sắc';
        else if (score >= 70) status = '🟡 Tốt';
        else if (score >= 60) status = '🟠 Trung bình';
        else status = '🔴 Cần cải thiện';

        return `${score}/100 - ${status}`;
    }

    processGeneralStatistics(financialData, timeFilter) {
        return this.processOverviewAnalysis(financialData, timeFilter);
    }

    getErrorResponse() {
        return `❌ **Không thể tạo thống kê nâng cao**

💡 **Các loại thống kê được hỗ trợ:**
• Trung bình chi tiêu: "Trung bình chi tiêu của tôi"
• So sánh thu chi: "So sánh thu nhập và chi tiêu"
• Thống kê tổng quan: "Thống kê tổng quan tài chính"
• Phân tích chi tiêu: "Phân tích chi tiêu theo danh mục"

🔍 **Ví dụ:**
• "Trung bình chi tiêu hàng tháng của tôi"
• "So sánh thu chi tháng này"
• "Thống kê tổng quan năm nay"`;
    }
}

export default EnhancedStatisticsEngine;

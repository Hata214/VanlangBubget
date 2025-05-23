class FinancialCalculationService {
    constructor() {
        console.log('✅ Financial Calculation Service initialized');
    }

    /**
     * Tính toán tiết kiệm theo mục tiêu
     * @param {number} targetAmount - Số tiền mục tiêu
     * @param {number} currentSavings - Tiết kiệm hiện tại
     * @param {number} monthlyIncome - Thu nhập hàng tháng
     * @param {number} monthlyExpense - Chi tiêu hàng tháng
     * @param {number} timeframe - Thời gian (tháng)
     */
    calculateSavingsGoal(targetAmount, currentSavings, monthlyIncome, monthlyExpense, timeframe = 12) {
        const monthlySavings = monthlyIncome - monthlyExpense;
        const remainingAmount = targetAmount - currentSavings;

        if (monthlySavings <= 0) {
            return {
                canReach: false,
                message: 'Không thể đạt mục tiêu với chi tiêu hiện tại',
                suggestion: 'Cần giảm chi tiêu hoặc tăng thu nhập'
            };
        }

        const monthsNeeded = Math.ceil(remainingAmount / monthlySavings);
        const savingsRate = (monthlySavings / monthlyIncome) * 100;

        return {
            canReach: monthsNeeded <= timeframe,
            monthsNeeded,
            monthlySavingsRequired: Math.ceil(remainingAmount / timeframe),
            currentMonthlySavings: monthlySavings,
            savingsRate: Math.round(savingsRate * 100) / 100,
            remainingAmount,
            recommendation: this.getSavingsRecommendation(savingsRate, monthsNeeded, timeframe)
        };
    }

    /**
     * Tính toán lãi suất đầu tư
     */
    calculateInvestmentReturn(principal, rate, time, compound = 'monthly') {
        const compounds = {
            'yearly': 1,
            'monthly': 12,
            'daily': 365
        };

        const n = compounds[compound] || 12;
        const amount = principal * Math.pow((1 + rate / n), n * time);
        const totalReturn = amount - principal;
        const returnRate = (totalReturn / principal) * 100;

        return {
            principal,
            finalAmount: Math.round(amount),
            totalReturn: Math.round(totalReturn),
            returnRate: Math.round(returnRate * 100) / 100,
            timeFrame: time,
            compoundFrequency: compound
        };
    }

    /**
     * Phân tích xu hướng chi tiêu
     */
    analyzeTrend(currentData, previousData, type = 'expense') {
        const change = currentData - previousData;
        const changePercent = previousData !== 0 ? (change / previousData) * 100 : 0;

        let trend = 'stable';
        if (Math.abs(changePercent) < 5) {
            trend = 'stable';
        } else if (changePercent > 0) {
            trend = type === 'expense' ? 'increasing' : 'growing';
        } else {
            trend = type === 'expense' ? 'decreasing' : 'declining';
        }

        return {
            current: currentData,
            previous: previousData,
            change: Math.round(change),
            changePercent: Math.round(changePercent * 100) / 100,
            trend,
            analysis: this.getTrendAnalysis(changePercent, type)
        };
    }

    /**
     * Tính toán ngân sách khuyến nghị
     */
    calculateRecommendedBudget(monthlyIncome) {
        const budgetAllocation = {
            necessities: Math.round(monthlyIncome * 0.50), // 50%
            wants: Math.round(monthlyIncome * 0.30),       // 30%
            savings: Math.round(monthlyIncome * 0.20),     // 20%
        };

        const categoryBreakdown = {
            food: Math.round(monthlyIncome * 0.15),        // 15%
            housing: Math.round(monthlyIncome * 0.25),     // 25%
            transportation: Math.round(monthlyIncome * 0.10), // 10%
            entertainment: Math.round(monthlyIncome * 0.10),  // 10%
            healthcare: Math.round(monthlyIncome * 0.05),     // 5%
            other: Math.round(monthlyIncome * 0.15)           // 15%
        };

        return {
            totalIncome: monthlyIncome,
            budgetAllocation,
            categoryBreakdown,
            rule: '50/30/20 Rule'
        };
    }

    /**
     * Tính toán hiệu quả đầu tư
     */
    calculateInvestmentEfficiency(investments) {
        let totalInvested = 0;
        let totalCurrentValue = 0;
        let totalProfit = 0;

        const analysis = investments.map(inv => {
            const profit = inv.value - inv.invested;
            const profitPercent = inv.invested > 0 ? (profit / inv.invested) * 100 : 0;

            totalInvested += inv.invested;
            totalCurrentValue += inv.value;
            totalProfit += profit;

            return {
                ...inv,
                profit,
                profitPercent: Math.round(profitPercent * 100) / 100,
                performance: this.getPerformanceRating(profitPercent)
            };
        });

        const overallReturn = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

        return {
            investments: analysis,
            summary: {
                totalInvested,
                totalCurrentValue,
                totalProfit,
                overallReturn: Math.round(overallReturn * 100) / 100,
                performance: this.getPerformanceRating(overallReturn)
            }
        };
    }

    /**
     * Dự đoán chi tiêu tương lai
     */
    predictFutureExpenses(monthlyExpenses, months = 6) {
        const averageExpense = monthlyExpenses.reduce((sum, exp) => sum + exp, 0) / monthlyExpenses.length;

        // Tính trend từ dữ liệu lịch sử
        let trend = 0;
        if (monthlyExpenses.length >= 2) {
            const recent = monthlyExpenses.slice(-3).reduce((sum, exp) => sum + exp, 0) / Math.min(3, monthlyExpenses.length);
            const older = monthlyExpenses.slice(0, -3).reduce((sum, exp) => sum + exp, 0) / Math.max(1, monthlyExpenses.length - 3);
            trend = older > 0 ? (recent - older) / older : 0;
        }

        const predictions = [];
        for (let i = 1; i <= months; i++) {
            const predicted = averageExpense * (1 + trend * i * 0.1); // Gentle trend application
            predictions.push({
                month: i,
                predictedExpense: Math.round(predicted),
                confidence: Math.max(60 - i * 5, 30) // Confidence decreases over time
            });
        }

        return {
            currentAverage: Math.round(averageExpense),
            trend: Math.round(trend * 100 * 100) / 100, // Percentage
            predictions,
            recommendation: this.getExpensePredictionAdvice(trend)
        };
    }

    /**
     * Tính toán emergency fund
     */
    calculateEmergencyFund(monthlyExpenses, targetMonths = 6) {
        const requiredAmount = monthlyExpenses * targetMonths;

        return {
            monthlyExpenses,
            targetMonths,
            requiredAmount,
            recommendation: `Nên có ${requiredAmount.toLocaleString('vi-VN')} VND để đối phó với ${targetMonths} tháng khẩn cấp`
        };
    }

    // Helper methods
    getSavingsRecommendation(savingsRate, monthsNeeded, targetTimeframe) {
        if (savingsRate < 10) {
            return 'Tỷ lệ tiết kiệm thấp. Cân nhắc giảm chi tiêu không cần thiết.';
        } else if (savingsRate > 30) {
            return 'Tỷ lệ tiết kiệm tốt! Có thể đầu tư để tăng lợi nhuận.';
        } else if (monthsNeeded > targetTimeframe) {
            return 'Cần tăng mức tiết kiệm hàng tháng để đạt mục tiêu đúng hạn.';
        } else {
            return 'Kế hoạch tiết kiệm phù hợp với mục tiêu.';
        }
    }

    getTrendAnalysis(changePercent, type) {
        const absChange = Math.abs(changePercent);

        if (absChange < 5) {
            return 'Xu hướng ổn định, không có thay đổi đáng kể.';
        } else if (absChange < 15) {
            return changePercent > 0 ?
                (type === 'expense' ? 'Chi tiêu tăng nhẹ, cần theo dõi.' : 'Thu nhập tăng tốt.') :
                (type === 'expense' ? 'Chi tiêu giảm tích cực.' : 'Thu nhập giảm, cần chú ý.');
        } else {
            return changePercent > 0 ?
                (type === 'expense' ? 'Chi tiêu tăng mạnh, cần kiểm soát ngay.' : 'Thu nhập tăng đáng kể.') :
                (type === 'expense' ? 'Chi tiêu giảm đáng kể.' : 'Thu nhập giảm mạnh, cần hành động.');
        }
    }

    getPerformanceRating(returnPercent) {
        if (returnPercent > 15) return 'excellent';
        if (returnPercent > 8) return 'good';
        if (returnPercent > 0) return 'average';
        return 'poor';
    }

    getExpensePredictionAdvice(trend) {
        if (trend > 0.05) {
            return 'Chi tiêu có xu hướng tăng. Cân nhắc kiểm soát ngân sách chặt chẽ hơn.';
        } else if (trend < -0.05) {
            return 'Chi tiêu có xu hướng giảm. Đây là tín hiệu tích cực.';
        } else {
            return 'Chi tiêu tương đối ổn định.';
        }
    }

    /**
     * Format currency for display
     */
    formatCurrency(amount, locale = 'vi-VN') {
        return new Intl.NumberFormat(locale).format(amount) + ' VND';
    }
}

export default FinancialCalculationService; 
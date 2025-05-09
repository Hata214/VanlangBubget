'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';
import StockIcon from '@/components/icons/StockIcon';
import CurrencyStockIcon from '@/components/icons/CurrencyStockIcon';

interface InvestmentSummaryCardProps {
    investments: Array<any>;
}

export default function InvestmentSummaryCard({ investments }: InvestmentSummaryCardProps) {
    const t = useTranslations('Investments');

    // Tính toán tổng quan
    const summary = useMemo(() => {
        let totalInitialInvestment = 0;
        let totalCurrentValue = 0;
        let totalProfit = 0;

        // Tính tổng các giá trị
        investments.forEach(investment => {
            const initialInvestment = investment.initialInvestment || 0;
            const currentValue = investment.currentValue || 0;

            totalInitialInvestment += initialInvestment;
            totalCurrentValue += currentValue;
        });

        totalProfit = totalCurrentValue - totalInitialInvestment;
        const roi = totalInitialInvestment > 0
            ? (totalProfit / totalInitialInvestment) * 100
            : 0;

        return {
            totalInitialInvestment,
            totalCurrentValue,
            totalProfit,
            roi,
            isProfit: totalProfit >= 0
        };
    }, [investments]);

    return (
        <Card className="w-full mb-6">
            <CardHeader className="pb-2">
                <CardTitle>{t('portfolioSummary')}</CardTitle>
                <CardDescription>
                    {t('totalInvestments', { count: investments.length })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col p-4 rounded-lg shadow-sm border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <span className="text-sm text-blue-700 font-medium">{t('totalInvested')}</span>
                        <div className="flex items-center mt-1">
                            <StockIcon className="h-5 w-5 text-blue-600 mr-1" />
                            <span className="text-xl font-bold text-blue-800">
                                {formatCurrency(summary.totalInitialInvestment)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col p-4 rounded-lg shadow-sm border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                        <span className="text-sm text-purple-700 font-medium">{t('totalValue')}</span>
                        <div className="flex items-center mt-1">
                            <CurrencyStockIcon className="h-5 w-5 text-purple-600 mr-1" />
                            <span className="text-xl font-bold text-purple-800">
                                {formatCurrency(summary.totalCurrentValue)}
                            </span>
                        </div>
                    </div>

                    <div className={`flex flex-col p-4 rounded-lg shadow-sm border ${summary.isProfit
                        ? 'border-green-100 bg-gradient-to-br from-green-50 to-emerald-50'
                        : 'border-red-100 bg-gradient-to-br from-red-50 to-orange-50'}`}>
                        <span className={`text-sm font-medium ${summary.isProfit ? 'text-green-700' : 'text-red-700'}`}>
                            {t('totalProfitLoss')}
                        </span>
                        <div className="flex items-center mt-1">
                            {summary.isProfit
                                ? <TrendingUp className="h-5 w-5 text-green-600 mr-1" />
                                : <TrendingDown className="h-5 w-5 text-red-600 mr-1" />
                            }
                            <span className={`text-xl font-bold ${summary.isProfit ? 'text-green-800' : 'text-red-800'}`}>
                                {formatCurrency(summary.totalProfit)}
                                <span className="text-sm ml-1">({summary.roi.toFixed(2)}%)</span>
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 
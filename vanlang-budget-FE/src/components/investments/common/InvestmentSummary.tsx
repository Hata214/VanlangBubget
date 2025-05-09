'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface InvestmentType {
    count: number;
    investment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
}

interface SummaryData {
    totalInvestment: number;
    totalCurrentValue: number;
    totalProfitLoss: number;
    overallROI: number;
    byType: {
        stock: InvestmentType;
        gold: InvestmentType;
        crypto: InvestmentType;
    };
}

interface InvestmentSummaryProps {
    summary: SummaryData | null;
}

export default function InvestmentSummary({ summary }: InvestmentSummaryProps) {
    const t = useTranslations('Investments');

    if (!summary) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">{t('noDataAvailable')}</p>
            </div>
        );
    }

    // Data for pie chart
    const pieData = [
        { name: t('stock'), value: summary.byType.stock.currentValue },
        { name: t('gold.title'), value: summary.byType.gold.currentValue },
        { name: t('crypto'), value: summary.byType.crypto.currentValue },
    ].filter(item => item.value > 0);

    const COLORS = ['#0088FE', '#FFBB28', '#8884d8'];

    // Data for type-specific cards
    const typeData = [
        {
            name: t('stock'),
            data: summary.byType.stock,
            color: '#0088FE',
            bgColor: 'bg-blue-50',
        },
        {
            name: t('gold'),
            data: summary.byType.gold,
            color: '#FFBB28',
            bgColor: 'bg-yellow-50',
        },
        {
            name: t('crypto'),
            data: summary.byType.crypto,
            color: '#8884d8',
            bgColor: 'bg-purple-50',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">{t('totalInvestment')}</span>
                            <span className="text-2xl font-bold">{formatCurrency(summary.totalInvestment)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">{t('currentValue')}</span>
                            <span className="text-2xl font-bold">{formatCurrency(summary.totalCurrentValue)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">{t('totalProfitLoss')}</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-bold ${summary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(summary.totalProfitLoss)}
                                </span>
                                <span className={`text-sm px-2 py-0.5 rounded-full flex items-center ${summary.totalProfitLoss >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {summary.totalProfitLoss >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                    {summary.overallROI.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Distribution Chart */}
            {pieData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('portfolioDistribution')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Investment Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {typeData.map((type) => (
                    type.data.count > 0 ? (
                        <Card key={type.name} className={`border-l-4`} style={{ borderLeftColor: type.color }}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: type.color }}></div>
                                    {type.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">{t('assets')}</span>
                                        <span>{type.data.count}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">{t('invested')}</span>
                                        <span>{formatCurrency(type.data.investment)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">{t('currentValue')}</span>
                                        <span>{formatCurrency(type.data.currentValue)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">{t('profitLoss')}</span>
                                        <div className="flex items-center gap-1">
                                            <span className={type.data.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(type.data.profitLoss)}
                                            </span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${type.data.profitLoss >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {type.data.roi.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : null
                ))}
            </div>
        </div>
    );
} 
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ToastProvider';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Plus, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import StockIcon from '@/components/icons/StockIcon';

import { StockPriceWidget } from './StockPriceWidget';
import { StockInvestForm } from './StockInvestForm';
import { StockInvestHistory } from './StockInvestHistory';
import { formatCurrency } from '@/utils/formatters';
import { getUserStockSummary } from '@/services/investmentService';

interface StockSummary {
    totalInvestment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
    industries: {
        name: string;
        value: number;
        percentage: number;
    }[];
}

export function StocksPanelDashboard() {
    const t = useTranslations('Investments');
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [showAddForm, setShowAddForm] = useState(false);
    const [summary, setSummary] = useState<StockSummary | null>(null);
    const [loading, setLoading] = useState(true);

    // Màu sắc cho biểu đồ
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    useEffect(() => {
        fetchStockSummary();
    }, []);

    const fetchStockSummary = async () => {
        setLoading(true);
        try {
            const data = await getUserStockSummary();
            setSummary(data);
        } catch (error) {
            toast({
                title: t('errorFetchingSummary'),
                description: String(error),
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInvestSuccess = () => {
        toast({
            title: t('investSuccess'),
            description: t('stockInvestSuccessDescription'),
            type: 'success',
        });
        setShowAddForm(false);
        setActiveTab("history");
        fetchStockSummary(); // Cập nhật lại thông tin tổng quan
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('stockInvestments')}</h2>
                    <p className="text-muted-foreground">
                        {t('stockInvestmentsDescription')}
                    </p>
                </div>
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="md:self-start"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {showAddForm ? t('hideAddForm') : t('addNewStock')}
                </Button>
            </div>

            {showAddForm && (
                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle>{t('addNewStockInvestment')}</CardTitle>
                        <CardDescription>
                            {t('addNewStockInvestmentDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StockInvestForm
                            onSuccess={handleInvestSuccess}
                            onCancel={() => setShowAddForm(false)}
                        />
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('totalInvestment')}
                        </CardTitle>
                        <StockIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : formatCurrency(summary?.totalInvestment || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('totalInvestedCapital')}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('currentValue')}
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : formatCurrency(summary?.currentValue || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('currentMarketValue')}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('profitLoss')}
                        </CardTitle>
                        {summary && summary.profitLoss >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary && summary.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {loading ? '...' : formatCurrency(summary?.profitLoss || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('totalProfitLoss')}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('returnOnInvestment')}
                        </CardTitle>
                        {summary && summary.roi >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary && summary.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {loading ? '...' : `${(summary?.roi || 0).toFixed(2)}%`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('percentageReturn')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
                    <TabsTrigger value="search">{t('searchStock')}</TabsTrigger>
                    <TabsTrigger value="history">{t('transactionHistory')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('portfolioDistribution')}</CardTitle>
                            <CardDescription>{t('industryAllocation')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center h-[300px]">
                                    {t('loading')}...
                                </div>
                            ) : summary && summary.industries && summary.industries.length > 0 ? (
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            {/* @ts-ignore */}
                                            <Pie
                                                data={summary.industries}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name, percentage }: { name: string, percentage: number }) => `${name}: ${percentage.toFixed(1)}%`}
                                            >
                                                {summary.industries.map((entry, index) => (
                                                    /* @ts-ignore */
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            {/* @ts-ignore */}
                                            <Tooltip
                                                formatter={(value: any) => formatCurrency(Number(value))}
                                            />
                                            {/* @ts-ignore */}
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-[300px]">
                                    {t('noData')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="search">
                    <StockPriceWidget />
                </TabsContent>

                <TabsContent value="history">
                    {/* @ts-ignore */}
                    <StockInvestHistory onTransactionChanged={fetchStockSummary} />
                </TabsContent>
            </Tabs>
        </div>
    );
} 
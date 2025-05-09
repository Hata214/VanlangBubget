'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toaster';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { format } from "date-fns";
import axios from 'axios';
import { cn } from "@/lib/utils";

import { StockPriceWidget } from './StockPriceWidget';
import { Skeleton } from '@/components/ui/Skeleton';

// Định nghĩa cấu trúc dữ liệu cho các ngành nghề
type Industry = {
    name: string;
    value: number;
    percentage: number;
};

// Định nghĩa cấu trúc dữ liệu cho biểu đồ hiệu suất
type PerformancePoint = {
    date: string;
    value: number;
};

// Định nghĩa cấu trúc dữ liệu cho cổ phiếu tốt nhất
type TopStock = {
    symbol: string;
    purchasePrice: number;
    currentPrice: number;
    quantity: number;
    investment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
};

// Định nghĩa dữ liệu tổng hợp đầu tư
type StockSummary = {
    totalInvestment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
    industries: Industry[];
    performanceHistory: PerformancePoint[];
    topStocks: TopStock[];
};

// Màu sắc cho biểu đồ
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6B66FF'];

export function StockPortfolioDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [summary, setSummary] = useState<StockSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStockSummary();
    }, []);

    const fetchStockSummary = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/investments/stocks/summary');
            if (response.data && response.data.success) {
                setSummary(response.data.summary);
            } else {
                throw new Error("Dữ liệu không hợp lệ");
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu tổng hợp đầu tư cổ phiếu:', error);
            toast.error(
                "Lỗi",
                "Không thể lấy dữ liệu tổng hợp đầu tư cổ phiếu"
            );
        } finally {
            setLoading(false);
        }
    };

    // Format số tiền VND
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Hiển thị phần trăm với dấu + hoặc -
    const formatPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    // Hiển thị màu dựa trên giá trị tăng/giảm
    const getProfitLossColor = (value: number) => {
        return value >= 0 ? 'text-green-600' : 'text-red-600';
    };

    // Định dạng phần trăm
    const formatPercent = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value / 100);
    };

    // Định dạng dữ liệu lịch sử hiệu suất cho biểu đồ
    const formattedPerformanceHistory = summary?.performanceHistory.map(item => ({
        ...item,
        date: format(new Date(item.date), 'MM/yyyy'),
        formattedValue: formatCurrency(item.value)
    })) || [];

    // Custom label cho biểu đồ Pie
    const renderCustomLabel = (props: any) => {
        const { name, percent } = props;
        return `${name}: ${(percent * 100).toFixed(1)}%`;
    };

    // Custom tooltip formatter
    const pieTooltipFormatter = (value: number) => formatCurrency(value);
    const pieTooltipLabelFormatter = (name: string) => `Ngành: ${name}`;

    // Hiển thị skeleton loader khi đang tải
    if (loading) {
        return (
            <Card className="w-full">
                <CardContent className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg">Đang tải dữ liệu...</span>
                </CardContent>
            </Card>
        );
    }

    // Hiển thị lỗi nếu có
    if (error) {
        return (
            <Card className="w-full">
                <CardContent className="py-10">
                    <div className="text-center text-destructive">
                        <p className="text-lg font-medium">Không thể tải dữ liệu</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Hiển thị khi không có dữ liệu
    if (!summary || summary.totalInvestment === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Tổng quan đầu tư cổ phiếu</CardTitle>
                    <CardDescription>Chưa có dữ liệu đầu tư</CardDescription>
                </CardHeader>
                <CardContent className="py-5 text-center">
                    <p className="text-lg text-muted-foreground">
                        Bạn chưa có giao dịch đầu tư cổ phiếu nào. Hãy thêm giao dịch mới để xem thông tin tổng quan.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Custom tooltip cho biểu đồ đường
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border p-2 rounded-md shadow-sm">
                    <p className="font-medium">{label}</p>
                    <p className="text-primary">Giá trị: {formatCurrency(payload[0].value)} VND</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                        {/* Removed "Cổ phiếu" and "Phân tích" tabs */}
                    </TabsList>
                    {/* Removed "Thêm đầu tư" button */}
                </div>

                <TabsContent value="overview" className="space-y-6">
                    {/* Removed the three summary cards */}

                    {/* Biểu đồ phân bổ ngành */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Phân bổ theo ngành</CardTitle>
                            <CardDescription>Tỷ trọng đầu tư vào các ngành</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {summary && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={summary.industries}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={100}
                                                fill={COLORS[0]}
                                                dataKey="value"
                                                nameKey="name"
                                                label={renderCustomLabel}
                                            >
                                                {summary.industries.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={pieTooltipFormatter}
                                                labelFormatter={pieTooltipLabelFormatter}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top cổ phiếu sinh lời/lỗ */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top cổ phiếu</CardTitle>
                            <CardDescription>Cổ phiếu có hiệu suất tốt nhất và kém nhất</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {summary && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={summary.topStocks}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="symbol" />
                                            <YAxis tickFormatter={(value) => `${value}%`} />
                                            <Tooltip formatter={(value) => [`${value}%`, "Lợi nhuận"]} />
                                            <Bar dataKey="roi" name="Lợi nhuận (%)" radius={[5, 5, 0, 0]}>
                                                {summary.topStocks.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.roi >= 0 ? "#4ade80" : "#f87171"}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Removed "Cổ phiếu" and "Phân tích" TabsContent */}
            </Tabs>

            {/* Removed Form đầu tư cổ phiếu */}
        </div>
    );
}

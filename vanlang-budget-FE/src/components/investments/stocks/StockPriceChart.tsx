'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/formatters';

interface HistoricalDataItem {
    date: string; // ISO date string
    price: number; // Close price
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
    change?: number;
    pct_change?: number;
}

interface StockPriceChartProps {
    data: HistoricalDataItem[];
    isLoading?: boolean;
    error?: string | null;
}

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        try {
            const date = parseISO(label);
            const formattedDate = format(date, 'dd/MM/yyyy');
            const price = formatCurrency(payload[0].value);

            // Lấy thêm thông tin khác nếu có
            const dataPoint = payload[0].payload;
            const open = dataPoint.open !== undefined ? formatCurrency(dataPoint.open) : null;
            const high = dataPoint.high !== undefined ? formatCurrency(dataPoint.high) : null;
            const low = dataPoint.low !== undefined ? formatCurrency(dataPoint.low) : null;
            const change = dataPoint.change !== undefined ? formatCurrency(dataPoint.change) : null;
            const pctChange = dataPoint.pct_change !== undefined ? `${dataPoint.pct_change > 0 ? '+' : ''}${dataPoint.pct_change.toFixed(2)}%` : null;

            return (
                <div className="bg-background border p-2 rounded-md shadow-sm text-sm">
                    <p className="font-medium">{formattedDate}</p>
                    <div className="grid grid-cols-2 gap-x-4 mt-1">
                        <p className="text-primary">Giá đóng: {price}</p>
                        {open && <p>Giá mở: {open}</p>}
                        {high && <p>Cao nhất: {high}</p>}
                        {low && <p>Thấp nhất: {low}</p>}
                        {change && <p className={dataPoint.change > 0 ? 'text-green-600' : dataPoint.change < 0 ? 'text-red-600' : ''}>
                            Thay đổi: {change}
                        </p>}
                        {pctChange && <p className={dataPoint.pct_change > 0 ? 'text-green-600' : dataPoint.pct_change < 0 ? 'text-red-600' : ''}>
                            % Thay đổi: {pctChange}
                        </p>}
                    </div>
                </div>
            );
        } catch (error) {
            // Fallback nếu có lỗi khi parse ngày tháng
            return (
                <div className="bg-background border p-2 rounded-md shadow-sm text-sm">
                    <p className="font-medium">{label}</p>
                    <p className="text-primary">Giá: {formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
    }
    return null;
};

export function StockPriceChart({ data, isLoading = false, error = null }: StockPriceChartProps) {

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Đang tải dữ liệu biểu đồ...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-destructive">
                Lỗi khi tải dữ liệu biểu đồ: {error}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Không có dữ liệu để hiển thị biểu đồ.
            </div>
        );
    }

    // Format date for X-axis
    const formatXAxis = (tickItem: string) => {
        try {
            return format(parseISO(tickItem), 'dd/MM');
        } catch (error) {
            return tickItem;
        }
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
                    tickFormatter={formatXAxis}
                    tickCount={7}
                />
                <YAxis
                    tickFormatter={(value) => formatCurrency(value)}
                    domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#8884d8"
                    dot={false}
                    activeDot={{ r: 6 }}
                    strokeWidth={2}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

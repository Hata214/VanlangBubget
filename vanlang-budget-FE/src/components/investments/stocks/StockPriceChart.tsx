'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/formatters';

interface HistoricalDataItem {
    date: string; // Or number (timestamp)
    price: number;
}

interface StockPriceChartProps {
    data: HistoricalDataItem[];
    isLoading?: boolean;
    error?: string | null;
}

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const date = new Date(label);
        const formattedDate = format(date, 'dd/MM/yyyy');
        const price = formatCurrency(payload[0].value);
        return (
            <div className="bg-background border p-2 rounded-md shadow-sm text-sm">
                <p className="font-medium">{formattedDate}</p>
                <p className="text-primary">Giá: {price}</p>
            </div>
        );
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
        return format(new Date(tickItem), 'dd/MM');
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatXAxis} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}

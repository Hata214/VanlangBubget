'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react'; // Thêm icon TrendingUp và TrendingDown

export interface MarketStockItem {
    symbol: string;
    name: string;
    industry: string;
    price: number;
    change?: number; // Thêm trường biến động giá
    pct_change?: number; // Thêm trường phần trăm biến động
    volume?: number; // Thêm trường khối lượng giao dịch
}

interface MarketStockTableProps {
    stocks: MarketStockItem[];
    isLoading?: boolean;
    onSort?: (column: keyof MarketStockItem) => void; // Add sorting handler prop
    sortColumn?: keyof MarketStockItem | null; // Add current sort column prop
    sortDirection?: 'asc' | 'desc' | null; // Add current sort direction prop
}

export function MarketStockTable({
    stocks,
    isLoading = false,
    onSort,
    sortColumn,
    sortDirection,
}: MarketStockTableProps) {

    // Hiển thị skeleton loader khi đang tải
    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    // Hàm định dạng phần trăm biến động
    const formatPercentChange = (value: number | undefined) => {
        if (value === undefined) return '-';
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    // Hàm xác định màu sắc dựa trên biến động giá
    const getPriceChangeColor = (value: number | undefined) => {
        if (value === undefined) return '';
        return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : '';
    };

    // Hàm định dạng khối lượng giao dịch
    const formatVolume = (volume: number | undefined) => {
        if (volume === undefined) return '-';
        if (volume >= 1000000) {
            return `${(volume / 1000000).toFixed(2)}M`;
        } else if (volume >= 1000) {
            return `${(volume / 1000).toFixed(2)}K`;
        }
        return volume.toString();
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Mã CP</TableHead>
                        <TableHead>Tên công ty</TableHead>
                        <TableHead>Ngành</TableHead>
                        <TableHead className="text-right">
                            <button
                                className="flex items-center justify-end w-full"
                                onClick={() => onSort && onSort('price')}
                            >
                                Giá hiện tại
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </button>
                        </TableHead>
                        <TableHead className="text-right">
                            <button
                                className="flex items-center justify-end w-full"
                                onClick={() => onSort && onSort('change')}
                            >
                                Thay đổi
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </button>
                        </TableHead>
                        <TableHead className="text-right">
                            <button
                                className="flex items-center justify-end w-full"
                                onClick={() => onSort && onSort('pct_change')}
                            >
                                % Thay đổi
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </button>
                        </TableHead>
                        <TableHead className="text-right">
                            <button
                                className="flex items-center justify-end w-full"
                                onClick={() => onSort && onSort('volume')}
                            >
                                Khối lượng
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </button>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stocks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                Không tìm thấy cổ phiếu nào.
                            </TableCell>
                        </TableRow>
                    ) : (
                        stocks.map((stock) => (
                            <TableRow key={stock.symbol}>
                                <TableCell>
                                    <span className="font-medium">{stock.symbol}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{stock.name}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{stock.industry}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(stock.price)}
                                </TableCell>
                                <TableCell className={`text-right ${getPriceChangeColor(stock.change)}`}>
                                    <div className="flex items-center justify-end">
                                        {stock.change !== undefined && stock.change !== 0 && (
                                            stock.change > 0 ?
                                                <TrendingUp className="h-4 w-4 mr-1 text-green-600" /> :
                                                <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
                                        )}
                                        {stock.change !== undefined ? formatCurrency(stock.change) : '-'}
                                    </div>
                                </TableCell>
                                <TableCell className={`text-right ${getPriceChangeColor(stock.pct_change)}`}>
                                    {formatPercentChange(stock.pct_change)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatVolume(stock.volume)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

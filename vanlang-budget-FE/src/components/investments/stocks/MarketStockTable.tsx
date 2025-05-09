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
import { ArrowUpDown } from 'lucide-react'; // Import icon for sorting

export interface MarketStockItem {
    symbol: string;
    name: string;
    industry: string;
    price: number;
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
                                onClick={() => onSort && onSort('price')} // Make header clickable for sorting
                            >
                                Giá hiện tại
                                <ArrowUpDown className="ml-2 h-4 w-4" /> {/* Add sorting icon */}
                            </button>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stocks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
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
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

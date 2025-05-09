'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/Button';
import { ArrowUpIcon, ArrowDownIcon, ExternalLink, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import Link from 'next/link';

export interface StockPortfolioItem {
    id: string;
    symbol: string;
    name: string;
    industry: string;
    quantity: number;
    purchasePrice: number;
    currentPrice: number;
    totalCost: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    lastUpdated: string;
}

interface StockPortfolioTableProps {
    stocks: StockPortfolioItem[];
    isLoading?: boolean;
    onViewDetails?: (stockId: string) => void;
    onDeleteStock?: (stockId: string) => void;
}

export function StockPortfolioTable({
    stocks,
    isLoading = false,
    onViewDetails,
    onDeleteStock
}: StockPortfolioTableProps) {
    const t = useTranslations('Investments');
    const [stockToDelete, setStockToDelete] = useState<string | null>(null);

    // Xử lý xóa cổ phiếu
    const handleDelete = () => {
        if (stockToDelete && onDeleteStock) {
            onDeleteStock(stockToDelete);
            setStockToDelete(null);
        }
    };

    // Hàm lấy màu dựa trên giá trị tăng/giảm
    const getProfitLossColor = (value: number) => {
        return value > 0
            ? 'text-green-600'
            : value < 0
                ? 'text-red-600'
                : 'text-gray-600';
    };

    // Hiển thị biểu tượng tăng/giảm
    const getProfitLossIcon = (value: number) => {
        return value > 0
            ? <ArrowUpIcon className="h-4 w-4 text-green-600" />
            : value < 0
                ? <ArrowDownIcon className="h-4 w-4 text-red-600" />
                : null;
    };

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
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('stock')}</TableHead>
                            <TableHead>{t('industry')}</TableHead>
                            <TableHead className="text-right">{t('quantity')}</TableHead>
                            <TableHead className="text-right">{t('averagePrice')}</TableHead>
                            <TableHead className="text-right">{t('currentPrice')}</TableHead>
                            <TableHead className="text-right">{t('investment')}</TableHead>
                            <TableHead className="text-right">{t('marketValue')}</TableHead>
                            <TableHead className="text-right">{t('profitLoss')}</TableHead>
                            <TableHead className="text-center">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stocks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                                    {t('noStocksFound')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            stocks.map((stock) => (
                                <TableRow key={stock.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{stock.symbol}</span>
                                            <span className="text-xs text-muted-foreground">{stock.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{stock.industry}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {stock.quantity.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(stock.purchasePrice)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(stock.currentPrice)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(stock.totalCost)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(stock.currentValue)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end space-x-1">
                                            {getProfitLossIcon(stock.profitLoss)}
                                            <span className={getProfitLossColor(stock.profitLoss)}>
                                                {formatCurrency(stock.profitLoss)} ({stock.profitLossPercentage.toFixed(2)}%)
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">{t('openMenu')}</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => onViewDetails && onViewDetails(stock.id)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        {t('viewDetails')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Link
                                                            href={`https://finance.vietstock.vn/search/${stock.symbol}`}
                                                            target="_blank"
                                                            className="flex items-center w-full"
                                                        >
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            {t('viewOnVietstock')}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => setStockToDelete(stock.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t('delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Xác nhận xóa cổ phiếu */}
            <Dialog open={!!stockToDelete} onOpenChange={(open) => !open && setStockToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('confirmDelete')}</DialogTitle>
                        <DialogDescription>
                            {t('deleteStockConfirmation')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStockToDelete(null)}>
                            {t('cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            {t('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
} 
'use client';

import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/Badge';
import { ArrowUpCircle, ArrowDownCircle, Calendar, Hash, Clock } from 'lucide-react';
import CurrencyStockIcon from '@/components/icons/CurrencyStockIcon';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { getUserStockTransactions } from '@/services/investmentService';

interface Transaction {
    _id: string;
    type: 'buy' | 'sell';
    assetName: string;
    symbol: string;
    price: number;
    quantity: number;
    fee: number;
    date: string;
    broker?: string;
    notes?: string;
}

export function StockInvestHistory() {
    const t = useTranslations('Investments');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTransactions() {
            setIsLoading(true);
            try {
                const response = await getUserStockTransactions();
                setTransactions(response || []);
                setError(null);
            } catch (err) {
                setError(t('errorFetchingTransactions'));
                console.error('Failed to fetch transactions:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchTransactions();
    }, [t]);

    // Tính tổng giá trị mua và bán
    const totalBuyValue = transactions
        .filter(transaction => transaction.type === 'buy')
        .reduce((total, transaction) => total + (transaction.price * transaction.quantity + transaction.fee), 0);

    const totalSellValue = transactions
        .filter(transaction => transaction.type === 'sell')
        .reduce((total, transaction) => total + (transaction.price * transaction.quantity - transaction.fee), 0);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                    {t('retry')}
                </Button>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">{t('noTransactions')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('totalTransactions')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {transactions.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('totalBought')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalBuyValue)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('totalSold')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(totalSellValue)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead>{t('type')}</TableHead>
                            <TableHead>{t('asset')}</TableHead>
                            <TableHead className="text-right">{t('quantity')}</TableHead>
                            <TableHead className="text-right">{t('price')}</TableHead>
                            <TableHead className="text-right">{t('fee')}</TableHead>
                            <TableHead className="text-right">{t('total')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((transaction) => {
                                const totalValue = transaction.type === 'buy'
                                    ? (transaction.price * transaction.quantity) + transaction.fee
                                    : (transaction.price * transaction.quantity) - transaction.fee;

                                return (
                                    <TableRow key={transaction._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {format(new Date(transaction.date), 'PPP')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={transaction.type === 'buy' ? 'default' : 'destructive'} className="flex items-center gap-1">
                                                {transaction.type === 'buy'
                                                    ? <><ArrowUpCircle className="h-3 w-3" /> {t('buy')}</>
                                                    : <><ArrowDownCircle className="h-3 w-3" /> {t('sell')}</>}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{transaction.assetName}</span>
                                                <span className="text-xs text-muted-foreground">{transaction.symbol}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Hash className="h-3 w-3 text-muted-foreground" />
                                                {transaction.quantity.toFixed(4)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <CurrencyStockIcon className="h-3 w-3 text-muted-foreground" />
                                                {formatCurrency(transaction.price)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(transaction.fee)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            <span className={transaction.type === 'buy' ? 'text-red-600' : 'text-green-600'}>
                                                {transaction.type === 'buy' ? '-' : '+'}{formatCurrency(totalValue)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default StockInvestHistory; 
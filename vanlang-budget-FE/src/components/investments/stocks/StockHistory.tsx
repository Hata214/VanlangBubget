'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { format } from 'date-fns';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getUserStockTransactions } from '@/services/investmentService';
import { formatCurrency } from '@/utils/formatters';
import { vi } from 'date-fns/locale';

interface StockTransaction {
    id: string;
    date: string;
    type: 'buy' | 'sell';
    symbol: string;
    quantity: number;
    price: number;
    fee: number;
    total: number;
    notes?: string;
}

export default function StockHistory() {
    const [transactions, setTransactions] = useState<StockTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTransactions() {
            try {
                setIsLoading(true);
                const data = await getUserStockTransactions();
                setTransactions(data);
                setError(null);
            } catch (err) {
                setError('Không thể tải lịch sử giao dịch');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchTransactions();
    }, []);

    const getTransactionTypeLabel = (type: 'buy' | 'sell') => {
        return type === 'buy' ? (
            <Badge className="bg-green-500 hover:bg-green-600">
                <ArrowDownCircle className="mr-1 h-3 w-3" /> Mua vào
            </Badge>
        ) : (
            <Badge className="bg-red-500 hover:bg-red-600">
                <ArrowUpCircle className="mr-1 h-3 w-3" /> Bán ra
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử giao dịch cổ phiếu</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử giao dịch cổ phiếu</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-red-500">{error}</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold">Lịch sử giao dịch cổ phiếu</CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                        setIsLoading(true);
                        setError(null);
                        try {
                            const data = await getUserStockTransactions();
                            setTransactions(data);
                        } catch (err) {
                            console.error('Lỗi khi tải dữ liệu giao dịch:', err);
                            setError('Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.');
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    disabled={isLoading}
                >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Làm mới</span>
                </Button>
            </CardHeader>

            <CardContent>
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Chưa có giao dịch nào
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ngày</TableHead>
                                <TableHead>Loại GD</TableHead>
                                <TableHead>Mã CK</TableHead>
                                <TableHead className="text-right">SL</TableHead>
                                <TableHead className="text-right">Giá</TableHead>
                                <TableHead className="text-right">Phí GD</TableHead>
                                <TableHead className="text-right">Tổng</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: vi })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getTransactionTypeLabel(transaction.type)}
                                    </TableCell>
                                    <TableCell className="font-medium">{transaction.symbol}</TableCell>
                                    <TableCell className="text-right">{transaction.quantity.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(transaction.price)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(transaction.fee)}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(transaction.total)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

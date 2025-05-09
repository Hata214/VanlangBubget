'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatters';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { format } from 'date-fns';
import { deleteTransaction } from '@/services/investmentService';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
// Tạm thời bỏ recharts vì cần cài đặt
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Tạm thời sử dụng Dialog từ InvestmentList
const Dialog = ({ open, onOpenChange, children }: { open?: boolean, onOpenChange?: (open: boolean) => void, children: React.ReactNode }) => {
    if (!open) return null;
    return <div className="fixed inset-0 z-50 flex items-center justify-center">{children}</div>;
};

const DialogContent = ({ className, children }: { className?: string, children: React.ReactNode }) => {
    return <div className={`bg-white rounded-lg shadow-lg p-6 max-w-[600px] max-h-[90vh] overflow-y-auto ${className || ''}`}>{children}</div>;
};

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
    return <div className="mb-6">{children}</div>;
};

const DialogTitle = ({ className, children }: { className?: string, children: React.ReactNode }) => {
    return <h2 className={`text-xl font-semibold ${className || ''}`}>{children}</h2>;
};

const DialogDescription = ({ children }: { children: React.ReactNode }) => {
    return <p className="text-sm text-gray-500 mt-1">{children}</p>;
};

// Tạm thời sử dụng Tabs từ ứng dụng
const Tabs = ({ value, onValueChange, children }: { value: string, onValueChange: (value: string) => void, children: React.ReactNode }) => {
    return <div>{children}</div>;
};

const TabsList = ({ className, children }: { className?: string, children: React.ReactNode }) => {
    return <div className={`flex space-x-2 mb-4 ${className || ''}`}>{children}</div>;
};

const TabsTrigger = ({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) => {
    return <button className={`px-4 py-2 rounded ${className || ''}`}>{children}</button>;
};

const TabsContent = ({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) => {
    return <div className={className}>{children}</div>;
};

interface Transaction {
    _id: string;
    type: 'buy' | 'sell';
    price: number;
    quantity: number;
    fee: number;
    date: string;
    notes?: string;
}

interface Investment {
    _id: string;
    type: 'stock' | 'gold' | 'crypto';
    assetName: string;
    symbol: string;
    currentPrice: number;
    totalQuantity: number;
    initialInvestment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
    transactions: Transaction[];
    lastUpdated: string;
    notes?: string;
}

interface InvestmentDetailsDialogProps {
    investment: Investment;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

// Component đơn giản hiển thị dữ liệu giá
const SimpleChartView = ({ data }: { data: Array<{ date: number; price: number; }> }) => {
    const formattedData = data.map(item => ({
        ...item,
        formattedDate: format(new Date(item.date), 'dd/MM/yyyy')
    }));

    return (
        <div className="h-[200px] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead className="text-right">Giá</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {formattedData.map((point, index) => (
                        <TableRow key={index}>
                            <TableCell>{point.formattedDate}</TableCell>
                            <TableCell className="text-right">{formatCurrency(point.price)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default function InvestmentDetailsDialog({
    investment,
    isOpen,
    onClose,
    onRefresh,
}: InvestmentDetailsDialogProps) {
    const t = useTranslations('Investments');
    const { toast } = useToast();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const handleDeleteTransaction = async () => {
        if (!selectedTransaction) return;

        setLoading(true);
        try {
            await deleteTransaction(investment._id, selectedTransaction);
            toast({
                title: t('transactionDeletedTitle'),
                description: t('transactionDeletedDescription'),
                type: 'success'
            });
            onRefresh();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast({
                title: t('transactionDeleteErrorTitle'),
                description: t('transactionDeleteErrorDescription'),
                type: 'error'
            });
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'stock':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t('stock')}</Badge>;
            case 'gold':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t('gold.title')}</Badge>;
            case 'crypto':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{t('crypto')}</Badge>;
            default:
                return null;
        }
    };

    // Tạo dữ liệu cho biểu đồ từ transactions
    const chartData = investment.transactions
        .filter(transaction => transaction.type === 'buy')
        .map(transaction => ({
            date: new Date(transaction.date).getTime(),
            price: transaction.price,
        }))
        .sort((a, b) => a.date - b.date);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            <div className="flex items-center gap-2">
                                {investment.assetName} <span className="text-muted-foreground">({investment.symbol})</span>
                                {getTypeIcon(investment.type)}
                            </div>
                        </DialogTitle>
                        <DialogDescription>{`${t('lastUpdated')}: ${format(new Date(investment.lastUpdated), 'PPP')}`}</DialogDescription>
                    </DialogHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
                            <TabsTrigger value="transactions">{t('transactions')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-muted-foreground">{t('currentPrice')}</span>
                                            <span className="text-xl font-medium">{formatCurrency(investment.currentPrice)}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-muted-foreground">{t('totalQuantity')}</span>
                                            <span className="text-xl font-medium">{investment.totalQuantity.toFixed(4)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-muted-foreground">{t('invested')}</span>
                                            <span className="text-xl font-medium">{formatCurrency(investment.initialInvestment)}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-muted-foreground">{t('currentValue')}</span>
                                            <span className="text-xl font-medium">{formatCurrency(investment.currentValue)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-muted-foreground">{t('profitLoss')}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xl font-medium ${investment.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(investment.profitLoss)}
                                            </span>
                                            <Badge variant="outline" className={investment.profitLoss >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                                                {typeof investment.roi === 'number' ? investment.roi.toFixed(2) : '0.00'}%
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {investment.notes && (
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-muted-foreground">{t('notes')}</span>
                                            <p className="text-sm">{investment.notes}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {chartData.length > 1 && (
                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="text-sm font-medium mb-2">{t('priceHistory')}</h3>
                                        <SimpleChartView data={chartData} />
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="transactions" className="mt-4">
                            {investment.transactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6">{t('noTransactions')}</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('date')}</TableHead>
                                            <TableHead>{t('type')}</TableHead>
                                            <TableHead className="text-right">{t('price')}</TableHead>
                                            <TableHead className="text-right">{t('quantity')}</TableHead>
                                            <TableHead className="text-right">{t('total')}</TableHead>
                                            <TableHead className="text-right">{t('fee')}</TableHead>
                                            <TableHead className="text-right">{t('actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {investment.transactions
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date (newest first)
                                            .map((transaction) => (
                                                <TableRow key={transaction._id}>
                                                    <TableCell>
                                                        {format(new Date(transaction.date), 'PPP')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={transaction.type === 'buy' ? 'default' : 'destructive'}>
                                                            {transaction.type === 'buy' ? t('buy') : t('sell')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(transaction.price)}</TableCell>
                                                    <TableCell className="text-right">{transaction.quantity.toFixed(4)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(transaction.price * transaction.quantity)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(transaction.fee)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setSelectedTransaction(transaction._id);
                                                                setIsDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="px-6"
                        >
                            {t('common.close', { ns: 'common' })}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {isDeleteDialogOpen && (
                <Dialog open={isDeleteDialogOpen} onOpenChange={() => setIsDeleteDialogOpen(false)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('confirmDeleteTransaction')}</DialogTitle>
                            <DialogDescription>{t('deleteTransactionWarning')}</DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsDeleteDialogOpen(false)}
                                disabled={loading}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteTransaction}
                                disabled={loading}
                            >
                                {loading ? t('deleting') : t('delete')}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
} 
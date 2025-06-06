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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    MoreHorizontal,
    Edit2,
    Trash2,
    TrendingUp,
    Plus,
    ExternalLink,
    Coins,
    RefreshCw,
    Home
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { deleteInvestment } from '@/services/investmentService';
import { useToast } from '@/components/ToastProvider';
import AddTransactionDialog from './AddTransactionDialog';
import InvestmentDetailsDialog from './InvestmentDetailsDialog';
import UpdatePriceDialog from './UpdatePriceDialog';
import SavingsDetailsDialog, { type SavingsInvestment, type SavingsTransaction } from '../savings/SavingsDetailsDialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';

const Dialog = ({ children, open, onOpenChange }: { children: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) => {
    return (
        <Alert>
            {children}
        </Alert>
    );
};

const DialogContent = ({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>;
};

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>;
};

const DialogTitle = ({ children }: { children: React.ReactNode }) => {
    return <AlertTitle>{children}</AlertTitle>;
};

const DialogDescription = ({ children }: { children: React.ReactNode }) => {
    return <AlertDescription>{children}</AlertDescription>;
};

const DialogFooter = ({ children }: { children: React.ReactNode }) => {
    return <div className="mt-4 flex justify-end">{children}</div>;
};

interface Transaction {
    id: string;
    type: 'buy' | 'sell' | 'deposit' | 'withdraw' | 'dividend' | 'interest';
    amount?: number;
    price?: number;
    quantity?: number;
    fee?: number;
    date: string;
    notes?: string;
}

// Định nghĩa riêng cho AddTransactionDialog
interface AddTransactionInvestment {
    _id: string;
    assetName: string;
    symbol: string;
    currentPrice: number;
    type: 'stock' | 'gold' | 'realestate' | 'savings' | 'fund' | 'other' | 'crypto';
}

// Định nghĩa riêng cho InvestmentDetailsDialog
interface DetailTransactionType {
    _id: string;
    type: 'buy' | 'sell';
    price: number;
    quantity: number;
    fee: number;
    date: string;
    notes?: string;
}

interface DetailInvestment {
    _id: string;
    type: 'stock' | 'gold' | 'realestate' | 'savings' | 'fund' | 'other' | 'crypto';
    assetName: string;
    symbol: string;
    currentPrice: number;
    totalQuantity: number;
    initialInvestment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
    transactions: DetailTransactionType[];
    lastUpdated: string;
    notes?: string;
}

interface Investment {
    id: string;
    userId: string;
    name: string;
    type: 'stock' | 'gold' | 'realestate' | 'savings' | 'fund' | 'other';
    symbol?: string;
    category?: string;
    initialInvestment: number;
    currentValue: number;
    totalQuantity?: number;
    currentPrice?: number;
    startDate?: string;
    profitLoss?: number;
    roi?: number;
    transactions?: Transaction[];
    createdAt: string;
    updatedAt: string;
    notes?: string;
    _id: string;
    assetName?: string;
    lastUpdated?: string;
}

interface InvestmentListProps {
    investments: Investment[];
    onRefresh: (switchToAddTab?: boolean) => void;
}

export default function InvestmentList({ investments, onRefresh }: InvestmentListProps) {
    const t = useTranslations('Investments');
    const { toast } = useToast();

    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isSavingsDetailsOpen, setIsSavingsDetailsOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false);

    const allInvestments = investments;



    const handleDelete = async () => {
        if (!selectedInvestment) return;

        try {
            // Xác định ID chính xác, ưu tiên _id trước id vì có thể là MongoDB ObjectId
            const investmentId = selectedInvestment._id || selectedInvestment.id;



            if (!investmentId) {
                console.error('Không tìm thấy ID hợp lệ cho khoản đầu tư');
                toast({
                    title: t('deleteError'),
                    description: t('deleteErrorDescription'),
                    type: 'error',
                });
                setIsDeleteDialogOpen(false);
                return;
            }

            // Gọi API xóa
            const result = await deleteInvestment(investmentId);



            toast({
                title: t('deleteSuccess'),
                description: t('deleteSuccessDescription'),
                type: 'success',
            });
            onRefresh();
        } catch (error) {
            console.error('Error deleting investment:', error);
            toast({
                title: t('deleteError'),
                description: t('deleteErrorDescription'),
                type: 'error',
            });
        } finally {
            setIsDeleteDialogOpen(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'stock':
                return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">{t('stock')}</Badge>;
            case 'gold':
                return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">{t('gold.title')}</Badge>;
            case 'realestate':
                return <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700">{t('realestate.title')}</Badge>;
            case 'savings':
                return <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">{t('savings')}</Badge>;
            case 'crypto':
                return <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">{t('crypto')}</Badge>;
            case 'fund':
                return <Badge variant="outline" className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700">{t('fund')}</Badge>;
            case 'other':
                return <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">{t('other')}</Badge>;
            default:
                return <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">{type}</Badge>;
        }
    };

    if (!allInvestments || allInvestments.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">{t('noInvestments')}</p>
                <Button onClick={() => onRefresh(true)}>{t('addYourFirst')}</Button>
            </div>
        );
    }

    // Chuyển đổi Investment từ danh sách sang định dạng phù hợp với AddTransactionDialog
    const mapToAddTransactionInvestment = (investment: Investment): AddTransactionInvestment => {
        return {
            _id: investment._id,
            assetName: investment.name || investment.assetName || '',
            symbol: investment.symbol || '',
            currentPrice: investment.currentPrice || 0,
            type: investment.type as AddTransactionInvestment['type']
        };
    };

    // Chuyển đổi Investment từ danh sách sang định dạng phù hợp cho SavingsDetailsDialog
    const mapToSavingsDetailProps = (investment: Investment): SavingsInvestment => {
        const mappedTransactions = (investment.transactions || []).map(t => ({
            ...t,
            _id: t.id,
            type: t.type as SavingsTransaction['type']
        }));

        let effectiveCurrentValue = investment.currentValue;
        let effectiveProfitLoss = investment.profitLoss;
        let effectiveRoi = investment.roi;

        if (investment.type === 'savings') {
            // Nếu currentValue từ API là không xác định hoặc 0, và có initialInvestment,
            // thì coi currentValue bằng initialInvestment cho mục đích hiển thị ban đầu.
            if ((effectiveCurrentValue === undefined || effectiveCurrentValue === 0) && investment.initialInvestment > 0) {
                effectiveCurrentValue = investment.initialInvestment;
            }

            // Luôn tính lại profitLoss và ROI cho savings dựa trên effectiveCurrentValue và initialInvestment
            // để đảm bảo sự nhất quán, bất kể giá trị profitLoss/roi từ API là gì.
            if (effectiveCurrentValue !== undefined && investment.initialInvestment !== undefined) {
                effectiveProfitLoss = effectiveCurrentValue - investment.initialInvestment;
                if (investment.initialInvestment > 0) {
                    effectiveRoi = (effectiveProfitLoss / investment.initialInvestment) * 100;
                } else {
                    effectiveRoi = 0; // Tránh chia cho 0 nếu initialInvestment là 0
                }
            } else {
                // Fallback nếu không đủ thông tin để tính
                effectiveProfitLoss = 0;
                effectiveRoi = 0;
            }
        }
        // Đối với các loại không phải savings, vẫn có thể sử dụng profitLoss/roi từ API nếu có,
        // hoặc tính toán nếu không có (logic này có thể đã tồn tại trong mapToDetailInvestment)

        return {
            _id: investment._id,
            name: investment.name || investment.assetName || 'Khoản tiết kiệm',
            symbol: investment.symbol,
            bankName: (investment as any).bankName || 'N/A',
            accountNumber: (investment as any).accountNumber || 'N/A',
            initialInvestment: investment.initialInvestment || 0,
            currentValue: effectiveCurrentValue === undefined ? (investment.initialInvestment || 0) : effectiveCurrentValue,
            interestRate: (investment as any).interestRate,
            term: (investment as any).term,
            startDate: investment.startDate,
            endDate: (investment as any).endDate,
            interestPaymentType: (investment as any).interestPaymentType,
            interestCalculationType: (investment as any).interestCalculationType,
            estimatedInterest: (investment as any).estimatedInterest,
            totalAmountAtMaturity: (investment as any).totalAmount,
            autoRenewal: (investment as any).autoRenewal,
            notes: investment.notes,
            transactions: mappedTransactions as SavingsTransaction[],
            profitLoss: Number(effectiveProfitLoss) || 0,
            roi: Number(effectiveRoi) || 0,
            lastUpdated: investment.lastUpdated || investment.updatedAt,
        } as SavingsInvestment;
    };

    // Chuyển đổi Investment từ danh sách sang định dạng phù hợp với InvestmentDetailsDialog (cho các loại khác)
    const mapToDetailInvestment = (investment: Investment): DetailInvestment => {
        const validTypesForDetail: Array<DetailInvestment['type']> = ['stock', 'gold', 'crypto', 'savings', 'realestate', 'fund', 'other'];
        let detailType: DetailInvestment['type'] = 'other';
        if (validTypesForDetail.includes(investment.type as DetailInvestment['type'])) {
            detailType = investment.type as DetailInvestment['type'];
        }

        let displayedCurrentValue = investment.currentValue;
        let displayedProfitLoss = investment.profitLoss !== undefined ? investment.profitLoss : 0;
        let displayedRoi = investment.roi !== undefined ? investment.roi : 0;

        if (detailType === 'savings') {
            displayedCurrentValue = investment.initialInvestment;
            displayedProfitLoss = 0;
            displayedRoi = 0;
        } else if (displayedCurrentValue !== undefined) {
            displayedProfitLoss = displayedCurrentValue - investment.initialInvestment;
            if (investment.initialInvestment !== 0 && investment.initialInvestment !== undefined) {
                displayedRoi = (displayedProfitLoss / investment.initialInvestment) * 100;
            }
        } else if (displayedCurrentValue === undefined) {
            displayedCurrentValue = investment.initialInvestment;
            displayedProfitLoss = 0;
            displayedRoi = 0;
        }

        return {
            _id: investment._id,
            type: detailType,
            assetName: investment.name || investment.assetName || '',
            symbol: investment.symbol || '',
            currentPrice: investment.currentPrice || 0,
            totalQuantity: investment.totalQuantity || 0,
            initialInvestment: investment.initialInvestment,
            currentValue: displayedCurrentValue === undefined ? 0 : displayedCurrentValue,
            profitLoss: displayedProfitLoss,
            roi: displayedRoi,
            transactions: (investment.transactions || []).map(t => ({
                _id: t.id,
                type: t.type as DetailTransactionType['type'],
                price: t.price || 0,
                quantity: t.quantity || 0,
                fee: t.fee || 0,
                date: t.date,
                notes: t.notes
            })),
            lastUpdated: investment.lastUpdated || investment.updatedAt,
            notes: investment.notes
        };
    };

    // Chuyển đổi Investment từ danh sách sang định dạng phù hợp với UpdatePriceDialog
    const mapToUpdatePriceInvestment = (investment: Investment): any => {
        return {
            _id: investment._id || investment.id,
            assetName: investment.name || investment.assetName || 'Khoản đầu tư',
            symbol: investment.symbol || '',
            currentPrice: investment.currentPrice || 0
        };
    };

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('asset')}</TableHead>
                        <TableHead>{t('type')}</TableHead>
                        <TableHead className="text-right">{t('quantity')}</TableHead>
                        <TableHead className="text-right">{t('currentPrice')}</TableHead>
                        <TableHead className="text-right">{t('invested')}</TableHead>
                        <TableHead className="text-right">{t('currentValue')}</TableHead>
                        <TableHead className="text-right">{t('profitLoss')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allInvestments.map((investment) => {
                        const investmentId = investment.id || investment._id;
                        const assetName = investment.name || investment.assetName || '';
                        const symbol = investment.symbol || '';
                        const assetDisplay = symbol ? `${assetName} (${symbol})` : assetName;
                        const investmentType = investment.type || 'other';
                        const totalQuantity = investment.totalQuantity || 0;
                        const currentPrice = investment.currentPrice || 0;
                        const initialInvestment = investment.initialInvestment || 0;

                        let currentValue = investment.currentValue === undefined ? initialInvestment : investment.currentValue;
                        let profitLoss = investment.profitLoss;
                        let roi = investment.roi !== undefined ? investment.roi : 0;

                        if (investmentType === 'savings') {
                            if ((currentValue === 0 || currentValue === undefined) && initialInvestment > 0) {
                                currentValue = initialInvestment;
                                profitLoss = 0;
                                roi = 0;
                            } else if (currentValue !== undefined) {
                                profitLoss = currentValue - initialInvestment;
                                if (initialInvestment > 0) {
                                    roi = (profitLoss / initialInvestment) * 100;
                                } else {
                                    roi = 0;
                                }
                            }
                        } else {
                            if (profitLoss === undefined) {
                                profitLoss = currentValue - initialInvestment;
                            }
                            if (investment.roi === undefined && initialInvestment > 0) {
                                roi = (profitLoss / initialInvestment) * 100;
                            } else if (investment.roi !== undefined) {
                                roi = Number(investment.roi);
                            } else {
                                roi = 0;
                            }
                        }
                        profitLoss = Number(profitLoss) || 0;
                        roi = Number(roi) || 0;

                        return (
                            <TableRow key={investmentId}>
                                <TableCell>{assetDisplay}</TableCell>
                                <TableCell>{getTypeIcon(investmentType)}</TableCell>
                                <TableCell className="text-right">{totalQuantity.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(currentPrice)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(initialInvestment)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(currentValue)}</TableCell>
                                <TableCell className="text-right">
                                    <span className={profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatCurrency(profitLoss)}
                                        ({((profitLoss / (initialInvestment || 1)) * 100).toFixed(2)}%)
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">{t('openMenu')}</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedInvestment(investment);
                                                if (investment.type === 'savings') {
                                                    setIsSavingsDetailsOpen(true);
                                                } else {
                                                    setIsDetailsOpen(true);
                                                }
                                            }}>
                                                <TrendingUp className="mr-2 h-4 w-4" />
                                                {t('viewDetails')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedInvestment(investment);
                                                setIsAddTransactionOpen(true);
                                            }}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                {t('addTransaction')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedInvestment(investment);
                                                    setIsUpdatePriceOpen(true);
                                                }}
                                                disabled={investmentType === 'savings'}
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                {t('updatePrice')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedInvestment(investment);
                                                    setIsDeleteDialogOpen(true);
                                                }}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t('delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {selectedInvestment && (
                <>
                    <AddTransactionDialog
                        investment={mapToAddTransactionInvestment(selectedInvestment)}
                        isOpen={isAddTransactionOpen}
                        onClose={() => setIsAddTransactionOpen(false)}
                        onSuccess={onRefresh}
                    />

                    {selectedInvestment.type === 'savings' ? (
                        <SavingsDetailsDialog
                            investment={mapToSavingsDetailProps(selectedInvestment)}
                            isOpen={isSavingsDetailsOpen}
                            onClose={() => setIsSavingsDetailsOpen(false)}
                            onRefresh={onRefresh}
                        />
                    ) : (
                        <InvestmentDetailsDialog
                            investment={mapToDetailInvestment(selectedInvestment)}
                            isOpen={isDetailsOpen}
                            onClose={() => setIsDetailsOpen(false)}
                            onRefresh={onRefresh}
                        />
                    )}

                    <UpdatePriceDialog
                        investment={mapToUpdatePriceInvestment(selectedInvestment)}
                        isOpen={isUpdatePriceOpen}
                        onClose={() => setIsUpdatePriceOpen(false)}
                        onSuccess={onRefresh}
                    />

                    {isDeleteDialogOpen && (
                        <Alert>
                            <AlertTitle>{t('confirmDelete')}</AlertTitle>
                            <AlertDescription>
                                {t('deleteWarning', { asset: String(selectedInvestment.name || selectedInvestment.assetName || 'Khoản đầu tư') })}
                            </AlertDescription>
                            <div className="mt-4 flex justify-end space-x-2">
                                <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(false)}>
                                    {t('cancel')}
                                </Button>
                                <Button variant="destructive" size="sm" onClick={handleDelete}>
                                    {t('delete')}
                                </Button>
                            </div>
                        </Alert>
                    )}
                </>
            )}
        </div>
    );
}
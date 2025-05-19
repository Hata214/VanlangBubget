'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
    Dialog as ShadDialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/Dialog';

export interface SavingsTransaction {
    _id: string;
    type: 'deposit' | 'withdraw' | 'interest'; // Gửi tiền, Rút tiền, Nhận lãi
    amount: number;
    date: string;
    notes?: string;
}

export interface SavingsInvestment {
    _id: string;
    name: string; // VD: Tiết kiệm Agribank
    symbol?: string; // VD: SAVE-AGRIBANK
    bankName?: string;
    accountNumber?: string;
    initialInvestment: number; // Số tiền gốc ban đầu
    currentValue: number; // Giá trị hiện tại (Gốc + lãi đã ghi nhận)
    interestRate?: number; // Lãi suất %/năm
    term?: number; // Kỳ hạn (tháng)
    startDate?: string;
    endDate?: string; // Ngày đáo hạn
    interestPaymentType?: 'end' | 'monthly' | 'prepaid'; // Hình thức trả lãi
    interestCalculationType?: 'simple' | 'compound'; // Cách tính lãi
    estimatedInterest?: number; // Tổng lãi dự kiến của kỳ hạn này (nếu có)
    totalAmountAtMaturity?: number; // Tổng tiền nhận được khi đáo hạn (Gốc + estimatedInterest)
    autoRenewal?: boolean;
    notes?: string;
    transactions?: SavingsTransaction[]; // Lịch sử giao dịch của sổ tiết kiệm này
    // Các trường này có thể cần tính toán lại hoặc lấy từ logic chung
    profitLoss: number;
    roi: number;
    lastUpdated?: string;
}

interface SavingsDetailsDialogProps {
    investment: SavingsInvestment;
    isOpen: boolean;
    onClose: () => void;
    onRefresh?: () => void; // Optional: nếu có hành động làm mới dữ liệu
}

export default function SavingsDetailsDialog({
    investment,
    isOpen,
    onClose,
    onRefresh,
}: SavingsDetailsDialogProps) {
    const t = useTranslations('Investments');
    const common_t = useTranslations('common');

    if (!isOpen || !investment) {
        return null;
    }

    // Helper để hiển thị text dựa trên key dịch
    const getInterestPaymentTypeLabel = (type?: string) => {
        if (!type) return 'N/A';
        switch (type) {
            case 'end': return t('savingsForm.interestPaymentType.end', { defaultValue: 'Cuối kỳ' });
            case 'monthly': return t('savingsForm.interestPaymentType.monthly', { defaultValue: 'Hàng tháng' });
            case 'prepaid': return t('savingsForm.interestPaymentType.prepaid', { defaultValue: 'Trả trước' });
            default: return type;
        }
    };

    const getInterestCalculationTypeLabel = (type?: string) => {
        if (!type) return 'N/A';
        switch (type) {
            case 'simple': return t('savingsForm.interestCalculationType.simple', { defaultValue: 'Lãi đơn' });
            case 'compound': return t('savingsForm.interestCalculationType.compound', { defaultValue: 'Lãi kép' });
            default: return type;
        }
    };


    return (
        <ShadDialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl dark:bg-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-green-700 dark:text-green-400">
                        {investment.name}
                        {investment.symbol && <span className="text-sm text-muted-foreground ml-2">({investment.symbol})</span>}
                    </DialogTitle>
                    {investment.lastUpdated && (
                        <DialogDescription>
                            {t('lastUpdated')}: {formatDate(investment.lastUpdated)}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mb-6 text-sm dark:text-gray-200">
                    <div>
                        <h4 className="font-semibold mb-2 text-base text-gray-700 dark:text-gray-100">Thông tin cơ bản</h4>
                        <p><strong>Ngân hàng:</strong> {investment.bankName || 'N/A'}</p>
                        <p><strong>Số tài khoản/sổ:</strong> {investment.accountNumber || 'N/A'}</p>
                        <p><strong>Số tiền gốc:</strong> {formatCurrency(investment.initialInvestment)}</p>
                        <p><strong>Giá trị hiện tại:</strong> {formatCurrency(investment.currentValue)}</p>
                        <p><strong>Tiền lãi đã ghi nhận:</strong>
                            <span className={investment.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(investment.profitLoss)} ({investment.roi.toFixed(2)}%)
                            </span>
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-base text-gray-700 dark:text-gray-100">Chi tiết Lãi suất & Kỳ hạn</h4>
                        <p><strong>Lãi suất:</strong> {investment.interestRate?.toFixed(2) || 'N/A'} %/năm</p>
                        <p><strong>Kỳ hạn:</strong> {investment.term || 'N/A'} tháng</p>
                        <p><strong>Ngày gửi:</strong> {investment.startDate ? formatDate(investment.startDate) : 'N/A'}</p>
                        <p><strong>Ngày đáo hạn:</strong> {investment.endDate ? formatDate(investment.endDate) : 'N/A'}</p>
                        <p><strong>Hình thức trả lãi:</strong> {getInterestPaymentTypeLabel(investment.interestPaymentType)}</p>
                        <p><strong>Phương thức tính lãi:</strong> {getInterestCalculationTypeLabel(investment.interestCalculationType)}</p>
                        <p><strong>Tự động tái tục:</strong> {investment.autoRenewal ? common_t('yes', { defaultValue: 'Có' }) : common_t('no', { defaultValue: 'Không' })}</p>
                    </div>
                </div>

                {investment.estimatedInterest !== undefined && (
                    <div className="mb-6 p-4 border rounded-md bg-blue-50 dark:bg-blue-900 dark:border-blue-700">
                        <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Thông tin dự kiến cuối kỳ hạn</h4>
                        <p className="dark:text-blue-200"><strong>Tiền lãi dự kiến (toàn kỳ hạn):</strong> {formatCurrency(investment.estimatedInterest)}</p>
                        <p className="dark:text-blue-200"><strong>Tổng tiền nhận được khi đáo hạn:</strong> {formatCurrency(investment.totalAmountAtMaturity || (investment.initialInvestment + (investment.estimatedInterest || 0)))}</p>
                    </div>
                )}

                {investment.notes && (
                    <div className="mb-6">
                        <h4 className="font-semibold mb-1 text-gray-700 dark:text-gray-100">Ghi chú</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{investment.notes}</p>
                    </div>
                )}

                {/* TODO: Hiển thị lịch sử giao dịch (transactions) nếu có */}

                <DialogFooter className="mt-8">
                    <DialogClose asChild>
                        <Button variant="outline" className="dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">{t('close')}</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </ShadDialog>
    );
} 
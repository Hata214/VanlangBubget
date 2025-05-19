'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ToastProvider';
import { addTransaction } from '@/services/investmentService';
import { Textarea } from '@/components/ui/Textarea';
import { CalendarIcon, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/Switch';
import { formatCurrency } from '@/utils/formatters';
import { CurrencyInput } from '@/components/ui/currency-input';

// Định nghĩa interface cho hàm tính phí
interface TransactionCostParams {
    price: number;
    quantity: number;
    feeRatePercent: number;
}

// Hàm tính phí và tổng giá trị giao dịch
const calculateTransactionCost = ({ price, quantity, feeRatePercent }: TransactionCostParams) => {
    const total = price * quantity;
    const fee = total * (feeRatePercent / 100);
    const totalWithFee = total + fee;
    return { total, fee, totalWithFee };
};

// Interface định nghĩa
interface Investment {
    _id: string;
    assetName: string;
    symbol: string;
    currentPrice: number;
    type: 'stock' | 'gold' | 'realestate' | 'savings' | 'fund' | 'other' | 'crypto';
}

interface AddTransactionDialogProps {
    investment: Investment;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddTransactionDialog({
    investment,
    isOpen,
    onClose,
    onSuccess,
}: AddTransactionDialogProps) {
    const t = useTranslations('Investments');
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [autoCalculateFee, setAutoCalculateFee] = useState(true);
    const [feeRate, setFeeRate] = useState(0.25); // Tỷ lệ phí mặc định
    const [calculationResult, setCalculationResult] = useState({
        total: 0,
        fee: 0,
        totalWithFee: 0
    });

    const isSavings = investment.type === 'savings';

    // Định nghĩa schema xác thực
    const formSchema = z.object({
        type: isSavings
            ? z.enum(['deposit', 'withdraw', 'interest'], { required_error: t('typeRequired') })
            : z.enum(['buy', 'sell'], { required_error: t('typeRequired') }),
        amount: isSavings
            ? z.coerce.number().min(0.01, t('pricePositive')).max(100000000000, 'Số tiền tối đa là 100 tỷ')
            : z.optional(z.coerce.number().max(100000000000, 'Số tiền tối đa là 100 tỷ')),
        price: !isSavings
            ? z.coerce.number().min(0, t('pricePositive')).max(100000000000, 'Giá tối đa là 100 tỷ').default(investment.currentPrice)
            : z.optional(z.coerce.number().max(100000000000, 'Giá tối đa là 100 tỷ')),
        quantity: !isSavings
            ? z.coerce.number().min(0, t('quantityPositive')).max(10000000000, 'Số lượng tối đa là 10 tỷ') // Giả sử quantity cũng có giới hạn lớn, nhưng có thể khác amount/price
            : z.optional(z.coerce.number().max(10000000000, 'Số lượng tối đa là 10 tỷ')),
        fee: z.coerce.number().min(0, t('feePositive')).max(100000000000, 'Phí tối đa là 100 tỷ').default(0),
        date: z.date().default(() => new Date()),
        notes: z.string().max(500, t('notesTooLong')).optional(),
    });

    // Khởi tạo form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: isSavings ? 'deposit' : 'buy',
            amount: 0,
            price: !isSavings ? investment.currentPrice : undefined,
            quantity: !isSavings ? 0 : undefined,
            fee: 0,
            date: new Date(),
            notes: '',
        },
    });

    // Lấy giá trị hiện tại của form
    const price = form.watch('price');
    const quantity = form.watch('quantity');

    // Cập nhật tính toán phí khi giá trị thay đổi
    useEffect(() => {
        if (!isSavings && autoCalculateFee && price && quantity) {
            const { total, fee, totalWithFee } = calculateTransactionCost({
                price,
                quantity,
                feeRatePercent: feeRate
            });

            setCalculationResult({ total, fee, totalWithFee });
            form.setValue('fee', Math.round(fee));
        }
    }, [price, quantity, feeRate, autoCalculateFee, form]);

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            let transactionPayload: any = {
                ...values,
                date: format(values.date, 'yyyy-MM-dd'),
            };

            if (isSavings) {
                // Đối với tiết kiệm, chúng ta chỉ quan tâm đến type, amount, date, notes, fee
                transactionPayload = {
                    type: values.type,
                    amount: values.amount,
                    date: format(values.date, 'yyyy-MM-dd'),
                    notes: values.notes,
                    fee: values.fee, // Giữ lại fee nếu có
                };
            } else {
                // Đối với các loại khác, giữ nguyên payload hiện tại (price, quantity, fee, etc.)
                transactionPayload = {
                    ...values,
                    date: format(values.date, 'yyyy-MM-dd'),
                };
            }

            await addTransaction(investment._id, transactionPayload);

            toast({
                title: t('transactionAddedTitle'),
                description: t('transactionAddedDescription'),
                type: 'success'
            });

            onSuccess();
            onClose();
            form.reset();
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast({
                title: t('transactionErrorTitle'),
                description: t('transactionErrorDescription'),
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('addTransaction')}
            description={`${investment.assetName} (${investment.symbol})`}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('transactionType')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectTransactionType')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {isSavings ? (
                                            <>
                                                <SelectItem value="deposit">{t('common.deposit', { ns: 'common', defaultValue: 'Gửi tiền' })}</SelectItem>
                                                <SelectItem value="withdraw">{t('common.withdraw', { ns: 'common', defaultValue: 'Rút tiền' })}</SelectItem>
                                                <SelectItem value="interest">{t('common.interest', { ns: 'common', defaultValue: 'Nhận lãi' })}</SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="buy">{t('buy')}</SelectItem>
                                                <SelectItem value="sell">{t('sell')}</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {isSavings ? (
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field, fieldState: { error } }) => (
                                <FormItem>
                                    <FormLabel>{t('common.amount', { ns: 'common' })}</FormLabel>
                                    <FormControl>
                                        <CurrencyInput
                                            placeholder="0"
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            onBlur={field.onBlur}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel>{t('price')}</FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder="0"
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                onBlur={field.onBlur}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel>{t('quantity')}</FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder="0"
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                onBlur={field.onBlur}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    {/* Khu vực tính phí - Ẩn nếu là savings */}
                    {!isSavings && (
                        <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Calculator className="h-4 w-4" />
                                    <span className="font-medium">{t('transactionValue')}</span>
                                </div>
                                <span className="font-medium">
                                    {formatCurrency(calculationResult.total)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between space-x-2">
                                <div className="flex items-center space-x-3">
                                    <FormLabel className="m-0 cursor-pointer">
                                        {t('autoCalculate')}
                                    </FormLabel>
                                    <Switch
                                        checked={autoCalculateFee}
                                        onCheckedChange={setAutoCalculateFee}
                                    />
                                </div>
                            </div>

                            {autoCalculateFee ? (
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <FormLabel className="w-36 m-0">
                                            {t('feeRate')}:
                                        </FormLabel>
                                        <Input
                                            type="number"
                                            value={feeRate}
                                            onChange={(e) => setFeeRate(parseFloat(e.target.value))}
                                            step="0.01"
                                            min="0"
                                            disabled={isLoading}
                                            className="max-w-28"
                                        />
                                        <span>%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('feeRateDescription')}
                                    </p>
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <FormField
                                    control={form.control}
                                    name="fee"
                                    render={({ field, fieldState: { error } }) => (
                                        <FormItem className="w-full">
                                            <div className="flex items-center justify-between">
                                                <FormLabel>{t('fee')}</FormLabel>
                                                <FormControl>
                                                    <CurrencyInput
                                                        placeholder="0"
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        disabled={isLoading || (autoCalculateFee && !isSavings)}
                                                        className={(autoCalculateFee && !isSavings) ? "bg-muted text-right" : "text-right"}
                                                    />
                                                </FormControl>
                                            </div>
                                            {!isSavings && autoCalculateFee && <FormDescription>{t('feeRateDescription')}</FormDescription>}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className="font-medium">{t('totalWithFee')}</span>
                                <span className="font-medium text-lg">
                                    {formatCurrency(autoCalculateFee ? calculationResult.totalWithFee : calculationResult.total + form.watch('fee'))}
                                </span>
                            </div>
                        </div>
                    )}

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('date')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                                        onChange={(e) => {
                                            const date = e.target.value
                                                ? new Date(e.target.value)
                                                : new Date();
                                            field.onChange(date);
                                        }}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('notes')}</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder={t('notesPlaceholder')}
                                        {...field}
                                        disabled={isLoading}
                                        rows={3}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end space-x-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {t('cancelAndClose')}
                        </Button>
                        <Button type="submit" disabled={isLoading} isLoading={isLoading}>
                            {t('addTransaction')}
                        </Button>
                    </div>
                </form>
            </Form>
        </Modal>
    );
} 
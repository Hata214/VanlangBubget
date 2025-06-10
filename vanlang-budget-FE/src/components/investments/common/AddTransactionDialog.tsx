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
            : z.coerce.number().max(100000000000, 'Số tiền tối đa là 100 tỷ').optional(), // amount is optional if not savings
        price: !isSavings
            ? z.coerce.number().min(0, t('pricePositive')).max(100000000000, 'Giá tối đa là 100 tỷ').optional() // price is optional
            : z.coerce.number().max(100000000000, 'Giá tối đa là 100 tỷ').optional(), // price is optional
        quantity: !isSavings
            ? z.coerce.number().min(0, t('quantityPositive')).max(10000000000, 'Số lượng tối đa là 10 tỷ').optional() // quantity is optional
            : z.coerce.number().max(10000000000, 'Số lượng tối đa là 10 tỷ').optional(), // quantity is optional
        fee: z.coerce.number().min(0, t('feePositive')).max(100000000000, 'Phí tối đa là 100 tỷ').optional(), // fee is optional
        date: z.date().optional(), // date is optional
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
        const currentPrice = price ?? 0;
        const currentQuantity = quantity ?? 0;

        if (!isSavings && autoCalculateFee && currentPrice > 0 && currentQuantity > 0) {
            const { total, fee, totalWithFee } = calculateTransactionCost({
                price: currentPrice,
                quantity: currentQuantity,
                feeRatePercent: feeRate
            });

            setCalculationResult({ total, fee, totalWithFee });
            form.setValue('fee', Math.round(fee));
        } else if (!isSavings && !autoCalculateFee) {
            // Nếu không tự động tính phí, cập nhật total dựa trên price và quantity
            // và fee sẽ được lấy từ form.watch('fee') hoặc giá trị mặc định
            const currentFee = form.getValues('fee') ?? 0;
            const calculatedTotal = currentPrice * currentQuantity;
            setCalculationResult({
                total: calculatedTotal,
                fee: currentFee,
                totalWithFee: calculatedTotal + currentFee
            });
        }
    }, [price, quantity, feeRate, autoCalculateFee, form, isSavings]);

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            const transactionDate = values.date ?? new Date(); // Default to now if undefined
            let transactionPayload: any;

            if (isSavings) {
                transactionPayload = {
                    type: values.type,
                    amount: values.amount ?? 0, // Default amount if undefined
                    date: format(transactionDate, 'yyyy-MM-dd'),
                    notes: values.notes,
                    fee: values.fee ?? 0, // Default fee if undefined
                };
            } else {
                transactionPayload = {
                    type: values.type, // type is always defined based on schema logic
                    price: values.price ?? 0, // Default price if undefined
                    quantity: values.quantity ?? 0, // Default quantity if undefined
                    fee: values.fee ?? 0, // Default fee if undefined
                    date: format(transactionDate, 'yyyy-MM-dd'),
                    notes: values.notes,
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
                                            value={field.value ?? 0}
                                            onChange={field.onChange}
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
                                                value={field.value ?? investment.currentPrice}
                                                onChange={field.onChange}
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
                                                value={field.value ?? 0}
                                                onChange={field.onChange}
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
                                                        value={field.value ?? 0}
                                                        onChange={field.onChange}
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
                                    {formatCurrency(autoCalculateFee ? calculationResult.totalWithFee : calculationResult.total + (form.watch('fee') ?? 0))}
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
                                        value={field.value ? format(field.value, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                                        onChange={(e) => {
                                            const dateValue = e.target.value ? new Date(e.target.value) : new Date();
                                            // Đảm bảo rằng chúng ta đang truyền một đối tượng Date hợp lệ
                                            if (!isNaN(dateValue.getTime())) {
                                                field.onChange(dateValue);
                                            } else {
                                                // Xử lý trường hợp ngày không hợp lệ, ví dụ: đặt lại về ngày hiện tại
                                                field.onChange(new Date());
                                            }
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
                                        value={field.value ?? ''}
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

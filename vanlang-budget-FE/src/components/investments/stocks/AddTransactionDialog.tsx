'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import {
    Form,
    FormControl,
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
import { toast } from '@/components/ui/Toaster';
import { addTransaction } from '@/services/investmentService';
import { Textarea } from '@/components/ui/Textarea';
import { format } from 'date-fns';

// Interface định nghĩa
interface Investment {
    _id: string;
    assetName: string;
    symbol: string;
    currentPrice: number;
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
    const [isLoading, setIsLoading] = useState(false);

    // Định nghĩa schema xác thực
    const formSchema = z.object({
        type: z.enum(['buy', 'sell'], {
            required_error: t('typeRequired'),
        }),
        price: z.coerce.number()
            .min(0, t('pricePositive'))
            .default(investment.currentPrice),
        quantity: z.coerce.number()
            .min(0, t('quantityPositive')),
        fee: z.coerce.number()
            .min(0, t('feePositive'))
            .default(0),
        date: z.date().default(() => new Date()),
        notes: z.string().max(500, t('notesTooLong')).optional(),
    });

    // Khởi tạo form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'buy',
            price: investment.currentPrice,
            quantity: 0,
            fee: 0,
            date: new Date(),
            notes: '',
        },
    });

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        const transactionData = {
            ...values,
            date: values.date.toISOString(), // Chuyển đổi Date object thành ISO string
        };

        try {
            await addTransaction(investment._id, transactionData);

            toast.success(
                t('transactionAddedTitle'),
                t('transactionAddedDescription')
            );

            onSuccess();
            onClose();
            form.reset();
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast.error(
                t('transactionErrorTitle'),
                t('transactionErrorDescription')
            );
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
                                        <SelectItem value="buy">{t('buy')}</SelectItem>
                                        <SelectItem value="sell">{t('sell')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('price')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            {...field}
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
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('quantity')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="fee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('fee')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                    </div>

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

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? t('adding') : t('addTransaction')}
                        </Button>
                    </div>
                </form>
            </Form>
        </Modal>
    );
}

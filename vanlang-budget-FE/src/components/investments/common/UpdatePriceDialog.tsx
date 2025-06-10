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
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ToastProvider';
import { updateCurrentPrice } from '@/services/investmentService';
import { formatCurrency } from '@/utils/formatters';

interface Investment {
    _id: string;
    assetName: string;
    symbol: string;
    currentPrice: number;
}

interface UpdatePriceDialogProps {
    investment: Investment;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UpdatePriceDialog({
    investment,
    isOpen,
    onClose,
    onSuccess,
}: UpdatePriceDialogProps) {
    const t = useTranslations('Investments');
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Định nghĩa schema xác thực
    const formSchema = z.object({
        currentPrice: z.coerce.number()
            .min(0, t('pricePositive'))
            .max(100000000000, 'Giá tối đa là 100 tỷ'),
    });

    // Khởi tạo form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            currentPrice: investment.currentPrice,
        },
    });

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            await updateCurrentPrice(investment._id, values.currentPrice);

            toast({
                title: t('updatePriceSuccess'),
                description: t('updatePriceSuccessDescription'),
                type: 'success'
            });

            onSuccess();
            onClose();
            form.reset();
        } catch (error) {
            console.error('Error updating price:', error);
            toast({
                title: t('updatePriceError'),
                description: t('updatePriceErrorDescription'),
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
            title={t('updatePrice')}
            description={`${investment.assetName} (${investment.symbol}) - ${t('currentPrice')}: ${formatCurrency(investment.currentPrice)}`}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="currentPrice"
                        render={({ field, fieldState: { error } }) => (
                            <FormItem>
                                <FormLabel>{t('enterPrice')}</FormLabel>
                                <FormControl>
                                    <CurrencyInput
                                        placeholder="0"
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        disabled={isLoading}
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
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={isLoading} isLoading={isLoading}>
                            {t('update')}
                        </Button>
                    </div>
                </form>
            </Form>
        </Modal>
    );
}

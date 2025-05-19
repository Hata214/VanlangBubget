'use client'

import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/Select'
import {
    useFormField,
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    FormField,
} from '@/components/ui/Form'
import { Budget } from '@/types'

const budgetSchema = (t: any) => z.object({
    category: z.string().min(1, t('budget.categoryError')),
    amount: z.number().min(1, t('budget.amountError')).max(100000000000, 'Số tiền tối đa là 100 tỷ'),
    month: z.number().min(1, t('budget.monthError')),
    year: z.number().min(2024, t('budget.yearError')),
})

type BudgetFormValues = z.infer<ReturnType<typeof budgetSchema>>

interface BudgetFormProps {
    initialData?: Budget
    onSubmit: (data: BudgetFormValues) => void
    onCancel?: () => void
    isSubmitting?: boolean
    categories: string[]
}

export function BudgetForm({ initialData, onSubmit, onCancel, isSubmitting, categories }: BudgetFormProps) {
    const t = useTranslations();

    const form = useForm<BudgetFormValues>({
        resolver: zodResolver(budgetSchema(t)),
        defaultValues: initialData || {
            category: '',
            amount: 0,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('budget.category')}</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('budget.selectCategory')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field, fieldState: { error } }) => (
                        <FormItem>
                            <FormLabel>{t('budget.amount')}</FormLabel>
                            <FormControl>
                                <CurrencyInput
                                    placeholder={t('budget.enterAmount')}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    onBlur={field.onBlur}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('budget.month')}</FormLabel>
                            <FormControl>
                                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString() || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('budget.selectMonth')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                Tháng {i + 1}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('budget.year')}</FormLabel>
                            <FormControl>
                                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString() || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('budget.selectYear')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const year = new Date().getFullYear() + i
                                            return (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {initialData ? t('budget.edit') : t('budget.add')}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
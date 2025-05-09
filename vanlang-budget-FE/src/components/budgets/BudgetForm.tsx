'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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

const budgetSchema = z.object({
    category: z.string().min(1, 'Vui lòng chọn danh mục'),
    amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
    month: z.number().min(1, 'Vui lòng chọn tháng'),
    year: z.number().min(2024, 'Vui lòng chọn năm'),
})

type BudgetFormValues = z.infer<typeof budgetSchema>

interface BudgetFormProps {
    initialData?: Budget
    onSubmit: (data: BudgetFormValues) => void
    onCancel?: () => void
    isSubmitting?: boolean
    categories: string[]
}

export function BudgetForm({ initialData, onSubmit, onCancel, isSubmitting, categories }: BudgetFormProps) {
    const form = useForm<BudgetFormValues>({
        resolver: zodResolver(budgetSchema),
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
                            <FormLabel>Danh mục</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn danh mục" />
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
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Số tiền</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Nhập số tiền"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
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
                            <FormLabel>Tháng</FormLabel>
                            <FormControl>
                                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString() || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn tháng" />
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
                            <FormLabel>Năm</FormLabel>
                            <FormControl>
                                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString() || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn năm" />
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
                        Hủy
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {initialData ? 'Cập nhật' : 'Thêm'} ngân sách
                    </Button>
                </div>
            </form>
        </Form>
    )
} 
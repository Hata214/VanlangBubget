'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
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
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ToastProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { getToken } from '@/services/api';
import { Switch } from '@/components/ui/Switch';
import axios from '@/lib/axios';
import { BankCombobox } from './BankCombobox';
import { CurrencyInput } from '@/components/ui/currency-input';

interface AddSavingsInvestmentProps {
    onSuccess: () => void;
}

export default function AddSavingsInvestment({ onSuccess }: AddSavingsInvestmentProps) {
    const t = useTranslations('Investments');
    const tSavings = useTranslations('Investments.savings');
    const tValidation = useTranslations('Investments.validation');
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Định nghĩa schema xác thực cho tiết kiệm
    const formSchema = z.object({
        bankName: z.string().min(1, tSavings('bankNameDescription')),
        otherBankName: z.string().optional(),
        accountNumber: z.string().optional(),
        amount: z.coerce.number().min(1, t('pricePositive')).max(100000000000, tValidation('maxPriceLimit')),
        startDate: z.string().min(1, t('purchaseDateRequired')),
        term: z.string().min(1, tSavings('termDescription')),
        interestRate: z.coerce.number().min(0, t('pricePositive')),
        interestPaymentType: z.string().min(1, tSavings('interestPaymentTypeDescription')),
        interestCalculationType: z.enum(['simple', 'compound']),
        autoRenewal: z.boolean(),
        depositMethod: z.string().min(1, tSavings('depositMethodDescription')),
        notes: z.string().max(500, t('notesTooLong')).optional(),
    }).refine(data => {
        if (data.bankName === 'Khác' && (!data.otherBankName || data.otherBankName.trim() === '')) {
            return false;
        }
        return true;
    }, {
        message: tSavings('otherBankPlaceholder'),
        path: ['otherBankName'],
    });

    // Khởi tạo form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bankName: '',
            otherBankName: '',
            accountNumber: '',
            amount: 0,
            startDate: new Date().toISOString().slice(0, 10),
            term: tSavings('terms.12'),
            interestRate: 0,
            interestPaymentType: tSavings('interestPaymentTypes.end'),
            interestCalculationType: 'simple',
            autoRenewal: false,
            depositMethod: tSavings('depositMethods.online'),
            notes: '',
        },
    });

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            // Xác định tên ngân hàng thực tế
            const actualBankName = values.bankName === 'Khác' ? values.otherBankName?.trim() : values.bankName;

            if (values.bankName === 'Khác' && !actualBankName) {
                form.setError('otherBankName', { type: 'manual', message: tSavings('otherBankPlaceholder') });
                setIsLoading(false);
                return;
            }

            // Tính ngày đáo hạn dựa trên kỳ hạn
            const startDate = new Date(values.startDate);
            let endDate = new Date(startDate);

            // Xử lý kỳ hạn
            const termMonths = parseInt(values.term);
            endDate.setMonth(endDate.getMonth() + termMonths);

            // Tính lãi dự kiến
            const principal = values.amount;
            const annualRate = values.interestRate / 100;
            const termYears = termMonths / 12;
            let estimatedInterest = 0;
            let totalAmount = 0; // Tổng tiền (gốc + lãi)

            // Tính lãi dựa trên phương thức tính lãi và hình thức nhận lãi
            try {
                if (values.interestCalculationType === 'simple') {
                    // Tính lãi đơn
                    if (values.interestPaymentType === 'end') {
                        // Lãi cuối kỳ - lãi đơn
                        estimatedInterest = principal * annualRate * termYears;
                        totalAmount = principal + estimatedInterest;
                    } else if (values.interestPaymentType === 'monthly') {
                        // Lãi hàng tháng - lãi đơn
                        estimatedInterest = principal * annualRate * termYears;
                        totalAmount = principal + estimatedInterest;
                    } else if (values.interestPaymentType === 'prepaid') {
                        // Lãi trả trước - lãi đơn
                        estimatedInterest = principal * annualRate * termYears;
                        totalAmount = principal; // Lãi đã trả trước nên tổng tiền chỉ còn tiền gốc
                    }
                } else {
                    // Tính lãi kép
                    if (values.interestPaymentType === 'end') {
                        // Lãi cuối kỳ - lãi kép
                        estimatedInterest = principal * (Math.pow(1 + annualRate, termYears) - 1);
                        totalAmount = principal + estimatedInterest;
                    } else if (values.interestPaymentType === 'monthly') {
                        // Lãi hàng tháng - lãi kép (công thức chính xác)
                        estimatedInterest = principal * (Math.pow(1 + annualRate / 12, termMonths) - 1);
                        totalAmount = principal + estimatedInterest;
                    } else if (values.interestPaymentType === 'prepaid') {
                        // Lãi trả trước - lãi kép (tính gần đúng)
                        estimatedInterest = principal * annualRate * termYears;
                        totalAmount = principal; // Lãi đã trả trước nên tổng tiền chỉ còn tiền gốc
                    }
                }

                // Đảm bảo các giá trị là số hợp lệ
                estimatedInterest = isNaN(estimatedInterest) ? 0 : Math.round(estimatedInterest);
                totalAmount = isNaN(totalAmount) ? principal : Math.round(totalAmount);
            } catch (error) {
                console.error("Lỗi tính toán:", error);
                estimatedInterest = 0;
                totalAmount = principal;
            }

            // Chuẩn bị dữ liệu
            const investmentData = {
                type: 'savings',
                name: `${tSavings('buyTransaction')} ${actualBankName}`,
                symbol: `SAVE-${actualBankName}`,
                category: 'Tiết kiệm ngân hàng',
                initialInvestment: principal,    // Vốn ban đầu
                currentValue: principal,        // Giá trị hiện tại ban đầu bằng vốn gốc
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                notes: values.notes || "",
                bankName: actualBankName,
                accountNumber: values.accountNumber || "",
                interestRate: values.interestRate,
                term: termMonths,
                interestPaymentType: values.interestPaymentType,
                interestCalculationType: values.interestCalculationType,
                autoRenewal: values.autoRenewal,
                depositMethod: values.depositMethod,
                estimatedInterest: estimatedInterest, // Lãi dự kiến (để tham khảo)
                totalAmount: totalAmount,             // Tổng tiền dự kiến khi đáo hạn (để tham khảo)
                profitLoss: 0,                    // Lợi nhuận/lỗ ban đầu là 0
                roi: 0                            // ROI ban đầu là 0
            };

            // Gửi yêu cầu đến API
            const response = await axios.post('/api/investments', investmentData);

            // Xử lý kết quả từ API
            if (response.status === 201 || response.status === 200) {
                toast({
                    type: 'success',
                    title: t('addSuccess'),
                    description: t('addSuccessDescription'),
                    duration: 5000
                });

                // Gọi callback onSuccess để cập nhật danh sách đầu tư
                setTimeout(() => {
                    onSuccess();
                }, 500);
            } else {
                throw new Error(tValidation('dataError'));
            }
        } catch (error: any) {
            console.error('Error creating savings investment:', error);

            if (error.response?.status === 401) {
                toast({
                    type: 'error',
                    title: tValidation('authError'),
                    description: tValidation('loginAgain'),
                    duration: 5000
                });
                router.push('/login');
            } else {
                toast({
                    type: 'error',
                    title: t('addError'),
                    description: t('addErrorDescription'),
                    duration: 5000
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Danh sách ngân hàng
    const banks = [
        { value: 'Agribank', label: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)' },
        { value: 'Vietcombank', label: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)' },
        { value: 'VietinBank', label: 'Ngân hàng TMCP Công thương Việt Nam (VietinBank)' },
        { value: 'BIDV', label: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)' },
        { value: 'Techcombank', label: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)' },
        { value: 'MB Bank', label: 'Ngân hàng TMCP Quân đội (MB Bank)' },
        { value: 'VPBank', label: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)' },
        { value: 'ACB', label: 'Ngân hàng TMCP Á Châu (ACB)' },
        { value: 'TPBank', label: 'Ngân hàng TMCP Tiên Phong (TPBank)' },
        { value: 'VIB', label: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)' },
        { value: 'Sacombank', label: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)' },
        { value: 'HDBank', label: 'Ngân hàng TMCP Phát triển TP.HCM (HDBank)' },
        { value: 'SHB', label: 'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)' },
        { value: 'Eximbank', label: 'Ngân hàng TMCP Xuất nhập khẩu Việt Nam (Eximbank)' },
        { value: 'OCB', label: 'Ngân hàng TMCP Phương Đông (OCB)' },
        { value: 'Nam A Bank', label: 'Ngân hàng TMCP Nam Á (Nam A Bank)' },
        { value: 'ABBank', label: 'Ngân hàng TMCP An Bình (ABBank)' },
        { value: 'Viet A Bank', label: 'Ngân hàng TMCP Việt Á (Viet A Bank)' },
        { value: 'NCB', label: 'Ngân hàng TMCP Quốc dân (NCB)' },
        { value: 'Kienlongbank', label: 'Ngân hàng TMCP Kiến Long (Kienlongbank)' },
        { value: 'VietBank', label: 'Ngân hàng TMCP Việt Nam Thương Tín (VietBank)' },
        { value: 'Saigonbank', label: 'Ngân hàng TMCP Sài Gòn Công thương (Saigonbank)' },
        { value: 'SeABank', label: 'Ngân hàng TMCP Đông Nam Á (SeABank)' },
        { value: 'Bac A Bank', label: 'Ngân hàng TMCP Bắc Á (Bac A Bank)' },
        { value: 'BaoViet Bank', label: 'Ngân hàng TMCP Bảo Việt (BaoViet Bank)' },
        { value: 'PVcomBank', label: 'Ngân hàng TMCP Đại chúng Việt Nam (PVcomBank)' },
        { value: 'BVBank', label: 'Ngân hàng TMCP Bản Việt (BVBank)' },
        { value: 'MSB', label: 'Ngân hàng TMCP Hàng hải Việt Nam (MSB)' },
        { value: 'LienVietPostBank', label: 'Ngân hàng TMCP Liên Việt (LienVietPostBank)' },
        { value: 'PG Bank', label: 'Ngân hàng TMCP PGD (PG Bank)' },
        { value: 'HSBC', label: 'HSBC Việt Nam' },
        { value: 'Standard Chartered', label: 'Standard Chartered Việt Nam' },
        { value: 'Shinhan Bank', label: 'Shinhan Bank Việt Nam' },
        { value: 'UOB', label: 'UOB Việt Nam' },
        { value: 'CIMB', label: 'CIMB Việt Nam' },
        { value: 'SCB', label: 'Ngân hàng TMCP Sài Gòn (SCB)' },
        { value: 'Khác', label: 'Ngân hàng khác' }
    ];

    // Danh sách kỳ hạn
    const terms = [
        { value: '1', label: tSavings('terms.1') },
        { value: '3', label: tSavings('terms.3') },
        { value: '6', label: tSavings('terms.6') },
        { value: '9', label: tSavings('terms.9') },
        { value: '12', label: tSavings('terms.12') },
        { value: '18', label: tSavings('terms.18') },
        { value: '24', label: tSavings('terms.24') },
        { value: '36', label: tSavings('terms.36') }
    ];

    // Danh sách hình thức nhận lãi
    const interestPaymentTypes = [
        { value: tSavings('interestPaymentTypes.end'), label: tSavings('interestPaymentTypes.end') },
        { value: tSavings('interestPaymentTypes.monthly'), label: tSavings('interestPaymentTypes.monthly') },
        { value: tSavings('interestPaymentTypes.prepaid'), label: tSavings('interestPaymentTypes.prepaid') }
    ];

    // Danh sách hình thức gửi
    const depositMethods = [
        { value: tSavings('depositMethods.online'), label: tSavings('depositMethods.online') },
        { value: tSavings('depositMethods.counter'), label: tSavings('depositMethods.counter') },
        { value: tSavings('depositMethods.atm'), label: tSavings('depositMethods.atm') },
        { value: tSavings('depositMethods.transfer'), label: tSavings('depositMethods.transfer') }
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl text-green-700 dark:text-green-400">{tSavings('savingsInfo')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="info" className="mb-4 bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200">
                            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertTitle className="font-semibold">{tSavings('noteInterest')}</AlertTitle>
                            <AlertDescription>
                                {tSavings('noteInterest')}
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tSavings('bankName')}</FormLabel>
                                        <FormControl>
                                            <BankCombobox
                                                banks={banks}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder={tSavings('selectBank')}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tSavings('bankNameDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.watch('bankName') === 'Khác' && (
                                <FormField
                                    control={form.control}
                                    name="otherBankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">{tSavings('otherBankLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tSavings('otherBankPlaceholder')} {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="accountNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tSavings('accountNumber')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={tSavings('accountNumberPlaceholder')} {...field} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tSavings('accountNumberDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tSavings('amount')} (VNĐ)</FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder={tSavings('amountDescription')}
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                className="text-right bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tSavings('amountDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tSavings('startDate')}</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tSavings('startDateDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="term"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tSavings('term')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tSavings('selectTerm')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {terms.map((term) => (
                                                    <SelectItem key={term.value} value={term.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {term.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tSavings('termDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="interestRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tSavings('interestRate')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={tSavings('interestRateDescription')}
                                                {...field}
                                                min="0"
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '' || parseFloat(value) >= 0) {
                                                        field.onChange(value === '' ? undefined : parseFloat(value));
                                                    } else if (parseFloat(value) < 0) {
                                                    }
                                                }}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tSavings('interestRateDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="interestPaymentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tSavings('interestPaymentType')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tSavings('selectInterestPaymentType')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {interestPaymentTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tSavings('interestPaymentTypeDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="interestCalculationType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tSavings('interestCalculationType')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tSavings('interestCalculationTypeDescription')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                <SelectItem value="simple" className="hover:bg-accent dark:hover:bg-accent-dark">{tSavings('calculationTypes.simple')}</SelectItem>
                                                <SelectItem value="compound" className="hover:bg-accent dark:hover:bg-accent-dark">{tSavings('calculationTypes.compound')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tSavings('interestCalculationTypeDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="depositMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tSavings('depositMethod')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tSavings('selectDepositMethod')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {depositMethods.map((method) => (
                                                    <SelectItem key={method.value} value={method.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {method.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tSavings('depositMethodDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="autoRenewal"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background dark:bg-background-dark border-border dark:border-border-dark">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base text-foreground dark:text-foreground-dark">{tSavings('autoRenewal')}</FormLabel>
                                            <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                                {tSavings('autoRenewalDescription')}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-primary dark:data-[state=checked]:bg-primary-dark data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input-dark"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{t('notes')}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('notesPlaceholder')}
                                                className="resize-none bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {t('notesDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-4 mt-6">
                            <div className="p-4 border rounded-lg bg-green-50 dark:bg-gray-800 border-green-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">{tSavings('estimatedProfit')}</h3>

                                {(() => {
                                    const principalInput = form.watch('amount');
                                    const interestRateInput = form.watch('interestRate');
                                    const termInput = form.watch('term');

                                    const principal = Number(principalInput) || 0;
                                    const rate = (Number(interestRateInput) || 0) / 100;
                                    const termMonths = parseInt(termInput || '0', 10);
                                    const termYears = termMonths / 12;
                                    const calculationType = form.watch('interestCalculationType');
                                    const paymentType = form.watch('interestPaymentType');

                                    let interest = 0;
                                    let total = principal; // Khởi tạo total bằng principal

                                    if (principal > 0 && rate > 0 && termYears > 0) { // Đảm bảo các giá trị hợp lệ để tính lãi
                                        try {
                                            if (calculationType === 'simple') {
                                                interest = principal * rate * termYears;
                                            } else if (calculationType === 'compound') {
                                                if (paymentType === 'end') {
                                                    interest = principal * (Math.pow(1 + rate, termYears) - 1);
                                                } else if (paymentType === 'monthly') {
                                                    // Lãi hàng tháng - lãi kép (công thức chính xác)
                                                    interest = principal * (Math.pow(1 + rate / 12, termMonths) - 1);
                                                } else { // Mặc định cho lãi kép nếu không phải 'end' hoặc 'monthly' (ví dụ: trả trước)
                                                    interest = principal * rate * termYears; // Hoặc một cách tính khác phù hợp
                                                }
                                            }

                                            // Xử lý trường hợp trả lãi trước
                                            if (paymentType === 'prepaid') {
                                                total = principal; // Nếu trả lãi trước, tổng nhận cuối kỳ là gốc
                                                // Lãi (interest) đã tính ở trên vẫn có thể hiển thị riêng
                                            } else {
                                                total = principal + interest;
                                            }

                                            // Đảm bảo các giá trị là số hợp lệ và làm tròn lãi trước khi cộng vào tổng
                                            interest = isNaN(interest) ? 0 : Math.round(interest);
                                            // Tổng tiền sẽ được làm tròn trong formatCurrency, không cần làm tròn ở đây nữa để tránh làm tròn hai lần.
                                            // total = principal + interest; (Đã tính ở trên)
                                            if (paymentType !== 'prepaid') {
                                                total = principal + interest; // Re-calculate total with rounded interest if not prepaid
                                            } else {
                                                total = principal; // For prepaid, total remains principal
                                            }
                                            // Ensure total is a number if something went wrong
                                            total = isNaN(total) ? principal : total;


                                        } catch (error) {
                                            console.error("Lỗi tính toán lãi:", error);
                                            interest = 0;
                                            total = principal;
                                        }
                                    } else {
                                        // Nếu không đủ thông tin để tính lãi, lãi bằng 0, tổng bằng gốc
                                        interest = 0;
                                        total = principal;
                                    }


                                    // Hàm định dạng tiền tệ với xử lý làm tròn số
                                    const formatCurrency = (amount: number) => {
                                        // Làm tròn số để tránh lỗi số thập phân
                                        const roundedAmount = Math.round(amount);
                                        return new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                            maximumFractionDigits: 0
                                        }).format(roundedAmount);
                                    };

                                    return (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                                                <div className="font-medium text-gray-700 dark:text-gray-200">{tSavings('amount')}:</div>
                                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(principal)}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                                                <div className="font-medium text-gray-700 dark:text-gray-200">{t('common.interestEarned')}:</div>
                                                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                    {formatCurrency(interest)}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm border-2 border-green-200 dark:border-green-500">
                                                <div className="font-medium text-gray-700 dark:text-gray-200">{tSavings('maturityAmount')}:</div>
                                                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                    {formatCurrency(total)}
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                * {tSavings('noteInterest')}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="flex justify-end items-center mt-6">
                            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 text-primary-foreground dark:text-primary-foreground-dark">
                                {isLoading ? t('adding') : tSavings('addNewSavings')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}

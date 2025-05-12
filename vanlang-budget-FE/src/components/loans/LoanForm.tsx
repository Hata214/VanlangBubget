'use client'

import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NumberInput } from '@/components/ui/NumberInput'
import { Textarea } from '@/components/ui/Textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/Form'
import { formatCurrency } from '@/lib/utils'
import type { Loan } from '@/types'

const loanSchema = z.object({
    amount: z.number().min(1000, 'Số tiền phải lớn hơn 1,000đ').max(10000000000, 'Số tiền tối đa là 10 tỷ'),
    prepaymentAmount: z.number().min(0, 'Số tiền trả trước không được âm').max(10000000000, 'Số tiền tối đa là 10 tỷ').default(0),
    description: z.string().min(1, 'Mô tả là bắt buộc'),
    lender: z.string().min(1, 'Người cho vay là bắt buộc'),
    interestRate: z.number().min(0, 'Lãi suất không được âm').max(100, 'Lãi suất không được vượt quá 100%'),
    interestRateType: z.enum(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR']).default('YEAR'),
    startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
    dueDate: z.string().min(1, 'Ngày đáo hạn là bắt buộc'),
    status: z.enum(['ACTIVE', 'PAID', 'OVERDUE']).default('ACTIVE'),
}).refine((data) => {
    const startDate = new Date(data.startDate);
    const dueDate = new Date(data.dueDate);
    return dueDate > startDate;
}, {
    message: 'Ngày đáo hạn phải sau ngày bắt đầu',
    path: ['dueDate'], // Gắn lỗi vào trường dueDate
});

type LoanFormData = z.infer<typeof loanSchema>

interface LoanFormProps {
    initialData?: Partial<LoanFormData>
    onSubmit: (data: LoanFormData) => Promise<void>
    isSubmitting?: boolean
    mode: 'add' | 'edit'
}

export function LoanForm({ initialData, onSubmit, isSubmitting, mode }: LoanFormProps) {
    const t = useTranslations();

    // Danh sách người cho vay
    const LOAN_LENDERS = [
        { value: 'individual', label: t('loan.lenderTypes.individual') },
        { value: 'bank', label: t('loan.lenderTypes.bank') },
        { value: 'credit', label: t('loan.lenderTypes.credit') },
        { value: 'other', label: t('loan.lenderTypes.other') },
    ];

    // Hàm để lấy màu sắc tương ứng với trạng thái
    const getStatusColor = (status: string) => {
        // Chuyển đổi status về uppercase để dễ so sánh
        const statusUpper = status?.toUpperCase() || '';

        switch (statusUpper) {
            case 'ACTIVE':
                return 'bg-blue-100 text-blue-800'; // Đang vay: màu xanh lam
            case 'PAID':
                return 'bg-green-100 text-green-800'; // Đã trả: màu lục
            case 'OVERDUE':
                return 'bg-red-100 text-red-800'; // Quá hạn: màu đỏ
            default:
                return '';
        }
    };

    // Danh sách đơn vị thời gian cho lãi suất
    const INTEREST_RATE_TYPES = [
        { value: 'DAY', label: t('loan.interestRateTypes.day') },
        { value: 'WEEK', label: t('loan.interestRateTypes.week') },
        { value: 'MONTH', label: t('loan.interestRateTypes.month') },
        { value: 'QUARTER', label: t('loan.interestRateTypes.quarter') },
        { value: 'YEAR', label: t('loan.interestRateTypes.year') },
    ]

    // Danh sách trạng thái khoản vay
    const LOAN_STATUSES = [
        { value: 'ACTIVE', label: t('loan.active') },
        { value: 'PAID', label: t('loan.paid') },
        { value: 'OVERDUE', label: t('loan.overdue') },
    ]

    const [selectedLenderType, setSelectedLenderType] = useState<string>(
        initialData?.lender
            ? (LOAN_LENDERS.some(l => l.value === initialData.lender) ? initialData.lender : 'other')
            : 'individual'
    );
    const [customLender, setCustomLender] = useState<string>('');
    const [interestAmount, setInterestAmount] = useState<number>(0);
    const [autoUpdateStatus, setAutoUpdateStatus] = useState<boolean>(true);
    const [interestCalculationMethodDescription, setInterestCalculationMethodDescription] = useState<string>('');

    // Thêm state để theo dõi trạng thái hiện tại và chuẩn hóa trạng thái
    const [currentStatus, setCurrentStatus] = useState<string>(() => {
        // Chuẩn hóa trạng thái từ initialData (nếu có)
        if (initialData?.status) {
            const statusUpper = initialData.status.toUpperCase();
            if (['ACTIVE', 'PAID', 'OVERDUE'].includes(statusUpper)) {
                return statusUpper;
            }
        }
        return 'ACTIVE'; // Giá trị mặc định
    });

    const form = useForm<z.infer<typeof loanSchema>>({
        resolver: zodResolver(loanSchema),
        defaultValues: {
            amount: initialData?.amount || 0,
            prepaymentAmount: initialData?.prepaymentAmount || 0,
            description: initialData?.description || '',
            lender: initialData?.lender || '',
            interestRate: initialData?.interestRate || 0,
            interestRateType: initialData?.interestRateType || 'YEAR',
            startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
            dueDate: initialData?.dueDate || new Date().toISOString().split('T')[0],
            status: (initialData?.status?.toUpperCase() as 'ACTIVE' | 'PAID' | 'OVERDUE') || 'ACTIVE',
        },
    });

    // Thêm effect để theo dõi thay đổi trạng thái
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'status' && value.status) {
                setCurrentStatus(value.status);
            }
        });
        return () => subscription.unsubscribe();
    }, [form.watch]);

    // Thêm effect để tự động cập nhật trạng thái khi ngày đáo hạn thay đổi
    useEffect(() => {
        if (autoUpdateStatus) {
            const dueDate = form.watch('dueDate');
            const today = new Date();
            const dueDateObj = new Date(dueDate);

            if (dueDateObj < today) {
                form.setValue('status', 'OVERDUE');
                setCurrentStatus('OVERDUE');
            } else {
                form.setValue('status', 'ACTIVE');
                setCurrentStatus('ACTIVE');
            }
        }
    }, [form.watch('dueDate'), autoUpdateStatus, form]);

    // Thêm effect để tự động cập nhật trạng thái khi người cho vay thay đổi
    useEffect(() => {
        // Nếu có sự thay đổi trong initialData, cập nhật lại form
        if (initialData) {
            console.log('InitialData cho form:', initialData);

            // Reset form với giá trị mới
            form.reset({
                amount: initialData.amount || 0,
                description: initialData.description || '',
                lender: initialData.lender || '',
                interestRate: initialData.interestRate || 0,
                interestRateType: initialData.interestRateType || 'YEAR',
                startDate: initialData.startDate || new Date().toISOString().split('T')[0],
                dueDate: initialData.dueDate || new Date().toISOString().split('T')[0],
                status: initialData.status || 'ACTIVE',
            });

            // Cập nhật selectedLenderType và customLender
            if (initialData.lender) {
                if (LOAN_LENDERS.some(l => l.value === initialData.lender)) {
                    setSelectedLenderType(initialData.lender);
                    setCustomLender('');
                } else {
                    setSelectedLenderType('other');
                    setCustomLender(initialData.lender);
                }
            }
        }
    }, [initialData, form]);

    // Cập nhật giá trị lender khi thay đổi loại người cho vay hoặc tên tùy chỉnh
    useEffect(() => {
        if (selectedLenderType === 'other') {
            form.setValue('lender', customLender);
        } else {
            form.setValue('lender', selectedLenderType);
        }
    }, [selectedLenderType, customLender, form]);

    // Tính số tiền lãi dựa vào số tiền, lãi suất, loại thời gian và mô hình khoản vay (người cho vay)
    useEffect(() => {
        const amount = form.watch('amount') || 0;
        const prepayment = form.watch('prepaymentAmount') || 0;
        const rate = form.watch('interestRate') || 0;
        const rateType = form.watch('interestRateType');
        const startDate = form.watch('startDate');
        const dueDate = form.watch('dueDate');
        const lenderType = selectedLenderType;

        // Số tiền thực tế để tính lãi là số tiền gốc trừ đi số tiền trả trước (nếu hợp lệ)
        const principal = Math.max(amount - prepayment, 0);

        if (principal > 0 && rate > 0 && startDate && dueDate) { // Sử dụng principal và startDate, dueDate (là string)
            try {
                const startObj = new Date(startDate); // Đổi tên biến để rõ ràng là object Date
                const endObj = new Date(dueDate);   // Đổi tên biến

                if (isNaN(startObj.getTime()) || isNaN(endObj.getTime()) || endObj <= startObj) {
                    setInterestAmount(0);
                    return;
                }

                const diffTime = endObj.getTime() - startObj.getTime(); // Không dùng Math.abs, vì đã kiểm tra endObj > startObj
                const loanDurationInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let calculatedInterest = 0;
                let methodDescriptionKey = '';

                // Phân biệt rõ ràng hai phương pháp tính lãi dựa vào loại thời gian
                if (rateType === 'DAY' || rateType === 'WEEK') {
                    // Phương pháp tính lãi theo ngày cho ngày và tuần
                    methodDescriptionKey = 'loan.interestCalculationMethod.dailyForBank';

                    // Áp dụng công thức lãi theo ngày
                    if (lenderType === 'bank') {
                        // Quy đổi rate từ form về lãi suất tháng tương đương
                        let r_monthly_equivalent_percent = 0;
                        switch (rateType) {
                            case 'DAY':
                                r_monthly_equivalent_percent = rate * 30; // Ước tính 30 ngày/tháng
                                break;
                            case 'WEEK':
                                r_monthly_equivalent_percent = rate * (30 / 7); // Ước tính (30/7) tuần/tháng
                                break;
                            default:
                                r_monthly_equivalent_percent = 0;
                        }
                        calculatedInterest = principal * (r_monthly_equivalent_percent / 100) * (loanDurationInDays / 30);
                    } else {
                        // Áp dụng lãi đơn giản cho các loại người cho vay khác với ngày và tuần
                        let interestMultiplier = 0;
                        switch (rateType) {
                            case 'DAY':
                                interestMultiplier = loanDurationInDays;
                                break;
                            case 'WEEK':
                                interestMultiplier = loanDurationInDays / 7;
                                break;
                            default:
                                interestMultiplier = 0;
                        }
                        calculatedInterest = principal * (rate / 100) * interestMultiplier;
                    }
                } else {
                    // Phương pháp tính lãi đơn cho tháng, quý, năm
                    methodDescriptionKey = 'loan.interestCalculationMethod.simple';

                    // Tính số kỳ lãi suất dựa trên loại thời gian
                    let periodCount = 0;
                    const startYear = startObj.getFullYear();
                    const startMonth = startObj.getMonth();
                    const endYear = endObj.getFullYear();
                    const endMonth = endObj.getMonth();

                    switch (rateType) {
                        case 'MONTH':
                            // Cách tính đơn giản hơn và chính xác cho lãi suất theo tháng
                            // Tính số tháng nguyên giữa 2 ngày
                            let months = (endYear - startYear) * 12 + (endMonth - startMonth);
                            const startDayOfMonth = startObj.getDate();
                            const endDayOfMonth = endObj.getDate();

                            if (endDayOfMonth >= startDayOfMonth) {
                                // Nếu ngày kết thúc ≥ ngày bắt đầu, tính đủ tháng
                                periodCount = months;
                            } else {
                                // Nếu ngày kết thúc < ngày bắt đầu, giảm đi một chút
                                const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
                                periodCount = months - ((startDayOfMonth - endDayOfMonth) / daysInEndMonth);
                            }

                            // Điều chỉnh phần lẻ của tháng nếu cần
                            if (months === 0) {
                                // Nếu cùng tháng, kiểm tra số ngày
                                const daysInMonth = new Date(startYear, startMonth + 1, 0).getDate();
                                periodCount = Math.max(1 / 30, (endDayOfMonth - startDayOfMonth + 1) / daysInMonth);
                            }
                            break;

                        case 'QUARTER':
                            // Cách tính chính xác cho quý
                            // Tính số quý hoàn chỉnh
                            const startQuarter = Math.floor(startMonth / 3);
                            const endQuarter = Math.floor(endMonth / 3);
                            let quarters = (endYear - startYear) * 4 + (endQuarter - startQuarter);

                            // Tháng đầu tiên trong quý
                            const startMonthInQuarter = startMonth % 3;
                            const endMonthInQuarter = endMonth % 3;

                            // Số ngày trong tháng đầu, tháng cuối
                            const startDay_q = startObj.getDate();
                            const endDay_q = endObj.getDate();
                            const daysInStartMonth_q = new Date(startYear, startMonth + 1, 0).getDate();
                            const daysInEndMonth_q = new Date(endYear, endMonth + 1, 0).getDate();

                            // Ngày trong quý - một quý có khoảng 90 hoặc 91 ngày (tùy thuộc vào quý và năm)
                            const daysInQuarter = 91;

                            if (quarters === 0) {
                                // Nếu cùng quý, tính chênh lệch ngày
                                if (startMonthInQuarter === endMonthInQuarter) {
                                    // Cùng tháng trong quý
                                    periodCount = (endDay_q - startDay_q + 1) / (daysInQuarter);
                                } else {
                                    // Khác tháng trong cùng quý
                                    const daysFromStartToEndOfMonth = daysInStartMonth_q - startDay_q + 1;
                                    const daysInMiddleMonths = 0; // Sẽ cần điều chỉnh nếu khác tháng hơn 1 tháng
                                    const daysInEndMonth = endDay_q;

                                    periodCount = (daysFromStartToEndOfMonth + daysInMiddleMonths + daysInEndMonth) / daysInQuarter;
                                }
                            } else {
                                // Tính phần lẻ của quý đầu và quý cuối
                                const startQuarterFraction = ((3 - startMonthInQuarter) * 30 - startDay_q + 1) / daysInQuarter;
                                const endQuarterFraction = (endMonthInQuarter * 30 + endDay_q) / daysInQuarter;

                                periodCount = quarters - 1 + startQuarterFraction + endQuarterFraction;
                            }
                            break;

                        case 'YEAR':
                            // Cách tính chính xác cho năm
                            // Tính số năm hoàn chỉnh
                            let years = endYear - startYear;

                            // Tính phần lẻ của năm theo ngày
                            const startDayOfYear = startObj.getTime();
                            const startYearLastDay = new Date(startYear, 11, 31).getTime();
                            const endYearFirstDay = new Date(endYear, 0, 1).getTime();
                            const endDayOfYear = endObj.getTime();

                            // Tính tổng số mili giây trong một năm
                            const msInYear = 365.25 * 24 * 60 * 60 * 1000; // Tính cả năm nhuận

                            if (years === 0) {
                                // Nếu cùng năm, tính theo tỷ lệ ngày
                                const msInCurrentYear = new Date(startYear, 11, 31).getTime() - new Date(startYear, 0, 1).getTime() + 24 * 60 * 60 * 1000;
                                periodCount = (endDayOfYear - startDayOfYear) / msInCurrentYear;
                            } else {
                                // Nếu khác năm, tính phần lẻ đầu và cuối
                                const startYearFraction = (startYearLastDay - startDayOfYear) / msInYear;
                                const endYearFraction = (endDayOfYear - endYearFirstDay) / msInYear;

                                periodCount = years - 1 + startYearFraction + endYearFraction;
                            }
                            break;

                        default:
                            periodCount = 0;
                    }

                    // Đảm bảo periodCount không âm
                    periodCount = Math.max(0, periodCount);

                    // Tính lãi dựa trên số kỳ lãi suất
                    calculatedInterest = principal * (rate / 100) * periodCount;
                }

                setInterestAmount(Math.round(calculatedInterest));
                setInterestCalculationMethodDescription(t(methodDescriptionKey));
            } catch (error) {
                console.error(t('loan.errorCalculatingInterest'), error); // Sử dụng t() cho thông báo lỗi
                setInterestAmount(0);
                setInterestCalculationMethodDescription('');
            }
        } else {
            setInterestAmount(0);
            setInterestCalculationMethodDescription('');
        }
    }, [form.watch('amount'), form.watch('prepaymentAmount'), form.watch('interestRate'), form.watch('interestRateType'), form.watch('startDate'), form.watch('dueDate'), selectedLenderType, t]); // Thêm t vào dependency array


    const handleSubmit = async (data: z.infer<typeof loanSchema>) => {
        try {
            // Tạo một bản sao của dữ liệu để tránh mutate trực tiếp
            const formData = { ...data };

            // Chuẩn hóa trạng thái thành chữ hoa nếu có
            if (formData.status) {
                formData.status = formData.status.toUpperCase() as 'ACTIVE' | 'PAID' | 'OVERDUE';
                console.log('Form submit - normalized status:', formData.status);
            } else {
                // Nếu không có trạng thái, đặt giá trị mặc định
                formData.status = 'ACTIVE';
                console.log('Form submit - set default status: ACTIVE');
            }

            // Xử lý chuyển đổi lender dựa trên selectedLenderType
            let completeData = { ...formData };

            if (selectedLenderType === 'other' && customLender) {
                completeData.lender = customLender;
            } else {
                completeData.lender = selectedLenderType;
            }

            if (mode === 'edit' && initialData) {
                completeData = {
                    ...initialData,
                    ...completeData
                };

                // Bỏ các trường không cần thiết khi gửi lên API
                delete (completeData as any).id;
                delete (completeData as any).userId;
                delete (completeData as any).createdAt;
                delete (completeData as any).updatedAt;
            }

            console.log('Sending complete data:', completeData);
            await onSubmit(completeData);

            // Reset form chỉ khi thêm mới
            if (mode === 'add') {
                form.reset();
                setSelectedLenderType('individual');
                setCustomLender('');
            }
        } catch (error) {
            console.error('Submit error:', error);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('loan.amount')}</FormLabel>
                            <FormControl>
                                <NumberInput
                                    placeholder={t('loan.enterAmount')}
                                    currency="đ"
                                    initialValue={field.value}
                                    onChange={field.onChange}
                                    allowClear={true}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Trường số tiền trả trước, chỉ hiện khi là ngân hàng hoặc tín dụng */}
                {(selectedLenderType === 'bank' || selectedLenderType === 'credit') && (
                    <FormField
                        control={form.control}
                        name="prepaymentAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('loan.prepaymentAmount')}</FormLabel>
                                <FormControl>
                                    <NumberInput
                                        placeholder={t('loan.enterPrepaymentAmount')}
                                        currency="đ"
                                        initialValue={field.value}
                                        onChange={field.onChange}
                                        allowClear={true}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('loan.description')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t('loan.enterDescription')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lender"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('loan.lender')}</FormLabel>
                            <div className="space-y-3">
                                <Select
                                    value={selectedLenderType}
                                    onValueChange={(value) => setSelectedLenderType(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('loan.selectLender')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LOAN_LENDERS.map((lender) => (
                                            <SelectItem key={lender.value} value={lender.value}>
                                                {lender.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedLenderType === 'other' && (
                                    <Input
                                        placeholder={t('loan.enterCustomLender')}
                                        value={customLender}
                                        onChange={(e) => setCustomLender(e.target.value)}
                                    />
                                )}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="interestRate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('loan.interestRate')}</FormLabel>
                                <FormControl>
                                    <NumberInput
                                        placeholder={t('loan.enterInterestRate')}
                                        currency="%"
                                        initialValue={field.value}
                                        onChange={field.onChange}
                                        allowClear={true}
                                        showSuggestions={false}
                                        allowDecimal={true}
                                        decimalPlaces={2}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="interestRateType"
                        render={({ field }) => {
                            // Lấy label phù hợp với giá trị hiện tại
                            const getInterestRateLabel = (value: string) => {
                                const type = INTEREST_RATE_TYPES.find(type => type.value === value);
                                return type ? type.label : t('common.type');
                            };

                            return (
                                <FormItem>
                                    <FormLabel>{t('common.type')}</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue>
                                                    {getInterestRateLabel(field.value)}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {INTEREST_RATE_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                </div>

                {/* Hiển thị thông tin tạm tính */}
                {(form.watch('amount') > 0 && form.watch('interestRate') > 0 && form.watch('startDate') && form.watch('dueDate')) && (
                    <div className="p-4 bg-blue-50 rounded-md space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-blue-700">{t('loan.principalToRepay')}</span>
                            <span className="text-lg font-bold text-blue-700">
                                {formatCurrency(Math.max((form.watch('amount') || 0) - (form.watch('prepaymentAmount') || 0), 0))}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-blue-700">{t('loan.estimatedInterest')}</span>
                            <span className="text-lg font-bold text-blue-700">{formatCurrency(interestAmount)}</span>
                        </div>
                        {interestCalculationMethodDescription && (
                            <div className="text-sm text-blue-600">
                                {t('loan.interestCalculationMethodLabel')}: {interestCalculationMethodDescription}
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-1 border-t border-blue-200">
                            <span className="font-medium text-blue-700">{t('loan.totalRepayment')}</span>
                            <span className="text-lg font-bold text-blue-700">
                                {formatCurrency(Math.max((form.watch('amount') || 0) - (form.watch('prepaymentAmount') || 0), 0) + interestAmount)}
                            </span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('loan.startDate')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('loan.dueDate')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Chỉ hiển thị trạng thái và checkbox khi đang chỉnh sửa */}
                {mode === 'edit' && (
                    <>
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => {
                                const getStatusLabel = (value: string) => {
                                    // Chuẩn hóa value thành chữ hoa để tìm trong LOAN_STATUSES
                                    const upperValue = value?.toUpperCase() || 'ACTIVE';
                                    const status = LOAN_STATUSES.find(status => status.value === upperValue);
                                    return status ? status.label : t('loan.status');
                                };

                                // Đảm bảo luôn có giá trị status
                                const currentValue = field.value || 'ACTIVE';

                                return (
                                    <FormItem>
                                        <FormLabel>{t('loan.status')}</FormLabel>
                                        <Select
                                            value={currentValue}
                                            onValueChange={(value) => {
                                                console.log('Status selected:', value);
                                                // Chuẩn hóa thành chữ hoa và cập nhật form
                                                const upperValue = value.toUpperCase();
                                                field.onChange(upperValue);
                                                setCurrentStatus(upperValue);

                                                // Nếu người dùng thay đổi trạng thái thủ công, tắt tự động cập nhật
                                                if (autoUpdateStatus) {
                                                    setAutoUpdateStatus(false);
                                                }
                                            }}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={`${getStatusColor(currentValue)}`}>
                                                    <SelectValue>
                                                        {getStatusLabel(currentValue)}
                                                    </SelectValue>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {LOAN_STATUSES.map((status) => (
                                                    <SelectItem
                                                        key={status.value}
                                                        value={status.value}
                                                        className={`${getStatusColor(status.value)}`}
                                                    >
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />

                        {/* Switch tự động cập nhật trạng thái */}
                        <div className="flex items-center space-x-2 mt-2">
                            <input
                                type="checkbox"
                                id="autoUpdateStatus"
                                checked={autoUpdateStatus}
                                onChange={(e) => {
                                    setAutoUpdateStatus(e.target.checked);
                                    if (e.target.checked) {
                                        // Nếu bật tự động cập nhật, cập nhật ngay trạng thái dựa trên ngày đáo hạn
                                        const dueDate = form.watch('dueDate');
                                        const today = new Date();
                                        const dueDateObj = new Date(dueDate);

                                        if (dueDateObj < today) {
                                            form.setValue('status', 'OVERDUE');
                                        } else {
                                            form.setValue('status', 'ACTIVE');
                                        }
                                    }
                                }}
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            />
                            <label htmlFor="autoUpdateStatus" className="text-sm text-gray-600">
                                {t('loan.autoUpdateStatus')}
                            </label>
                        </div>
                    </>
                )}

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                    >
                        {mode === 'edit' ? t('common.update') : t('loan.add')}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { AlertCircle, Home } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { getToken, getAuthHeader } from '@/services/api';
import axios from '@/lib/axios';

interface AddRealEstateInvestmentProps {
    onSuccess: () => void;
}

export default function AddRealEstateInvestment({ onSuccess }: AddRealEstateInvestmentProps) {
    const t = useTranslations('Investments');
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Định nghĩa schema xác thực cho đất đai
    const formSchema = z.object({
        assetName: z.string()
            .min(1, t('assetNameRequired'))
            .max(100, t('assetNameTooLong')),
        propertyType: z.string().min(1, "Loại đất là bắt buộc"),
        otherPropertyType: z.string().optional(),
        address: z.string().min(1, "Địa chỉ là bắt buộc"),
        legalStatus: z.string().min(1, "Tình trạng pháp lý là bắt buộc"),
        otherLegalStatus: z.string().optional(),
        area: z.coerce.number().min(0, "Diện tích phải là số dương"),
        frontWidth: z.coerce.number().min(0, "Mặt tiền phải là số dương").optional(),
        depth: z.coerce.number().min(0, "Chiều sâu phải là số dương").optional(),
        purchasePrice: z.coerce.number().min(0, "Giá mua phải là số dương"),
        additionalFees: z.coerce.number().min(0, "Phí phát sinh phải là số dương").optional().default(0),
        purchaseDate: z.string().min(1, "Ngày mua là bắt buộc"),
        ownershipType: z.string().min(1, "Hình thức sở hữu là bắt buộc"),
        otherOwnershipType: z.string().optional(),
        investmentPurpose: z.string().optional(),
        otherInvestmentPurpose: z.string().optional(),
        currentStatus: z.string().optional(),
        otherCurrentStatus: z.string().optional(),
        notes: z.string().max(500, t('notesTooLong')).optional(),
    }).refine(data => !(data.propertyType === 'other' && (!data.otherPropertyType || data.otherPropertyType.trim() === '')), {
        message: "Vui lòng nhập loại đất khác",
        path: ['otherPropertyType'],
    }).refine(data => !(data.legalStatus === 'other' && (!data.otherLegalStatus || data.otherLegalStatus.trim() === '')), {
        message: "Vui lòng nhập tình trạng pháp lý khác",
        path: ['otherLegalStatus'],
    }).refine(data => !(data.ownershipType === 'other' && (!data.otherOwnershipType || data.otherOwnershipType.trim() === '')), {
        message: "Vui lòng nhập hình thức sở hữu khác",
        path: ['otherOwnershipType'],
    }).refine(data => !(data.investmentPurpose === 'other' && (!data.otherInvestmentPurpose || data.otherInvestmentPurpose.trim() === '')), {
        message: "Vui lòng nhập mục đích đầu tư khác",
        path: ['otherInvestmentPurpose'],
    }).refine(data => !(data.currentStatus === 'other' && (!data.otherCurrentStatus || data.otherCurrentStatus.trim() === '')), {
        message: "Vui lòng nhập tình trạng hiện tại khác",
        path: ['otherCurrentStatus'],
    });

    // Khởi tạo form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            assetName: '',
            propertyType: 'residential',
            otherPropertyType: '',
            address: '',
            legalStatus: 'redbook',
            otherLegalStatus: '',
            area: 0,
            frontWidth: undefined,
            depth: undefined,
            purchasePrice: 0,
            additionalFees: 0,
            purchaseDate: new Date().toISOString().slice(0, 10),
            ownershipType: 'personal',
            otherOwnershipType: '',
            investmentPurpose: 'holding',
            otherInvestmentPurpose: '',
            currentStatus: 'holding',
            otherCurrentStatus: '',
            notes: '',
        },
    });

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        const actualPropertyType = values.propertyType === 'other' ? values.otherPropertyType?.trim() : values.propertyType;
        const actualLegalStatus = values.legalStatus === 'other' ? values.otherLegalStatus?.trim() : values.legalStatus;
        const actualOwnershipType = values.ownershipType === 'other' ? values.otherOwnershipType?.trim() : values.ownershipType;
        const actualInvestmentPurpose = values.investmentPurpose === 'other' ? values.otherInvestmentPurpose?.trim() : values.investmentPurpose;
        const actualCurrentStatus = values.currentStatus === 'other' ? values.otherCurrentStatus?.trim() : values.currentStatus;

        // Validate other fields if 'other' is selected
        let hasError = false;
        if (values.propertyType === 'other' && !actualPropertyType) {
            form.setError('otherPropertyType', { type: 'manual', message: 'Vui lòng nhập loại đất khác.' });
            hasError = true;
        }
        if (values.legalStatus === 'other' && !actualLegalStatus) {
            form.setError('otherLegalStatus', { type: 'manual', message: 'Vui lòng nhập tình trạng pháp lý khác.' });
            hasError = true;
        }
        if (values.ownershipType === 'other' && !actualOwnershipType) {
            form.setError('otherOwnershipType', { type: 'manual', message: 'Vui lòng nhập hình thức sở hữu khác.' });
            hasError = true;
        }
        if (values.investmentPurpose === 'other' && !actualInvestmentPurpose) {
            form.setError('otherInvestmentPurpose', { type: 'manual', message: 'Vui lòng nhập mục đích đầu tư khác.' });
            hasError = true;
        }
        if (values.currentStatus === 'other' && !actualCurrentStatus) {
            form.setError('otherCurrentStatus', { type: 'manual', message: 'Vui lòng nhập tình trạng hiện tại khác.' });
            hasError = true;
        }

        if (hasError) {
            setIsLoading(false);
            return;
        }

        try {
            // Chuẩn bị dữ liệu
            const investmentData = {
                type: 'realestate',
                name: values.assetName,
                symbol: 'LAND',
                category: 'Đất đai',
                currentPrice: Number(values.purchasePrice),
                initialInvestment: Number(values.purchasePrice) + Number(values.additionalFees || 0),
                startDate: new Date(values.purchaseDate).toISOString(),
                notes: values.notes || "",
                propertyType: actualPropertyType,
                address: values.address,
                legalStatus: actualLegalStatus,
                area: values.area,
                frontWidth: values.frontWidth,
                depth: values.depth,
                additionalFees: values.additionalFees,
                ownershipType: actualOwnershipType,
                investmentPurpose: actualInvestmentPurpose,
                currentStatus: actualCurrentStatus,
                transaction: {
                    type: 'buy',
                    price: Number(values.purchasePrice),
                    quantity: 1,
                    fee: Number(values.additionalFees || 0),
                    date: new Date(values.purchaseDate).toISOString(),
                    notes: `Mua bất động sản: ${values.assetName}`
                }
            };

            // Gửi dữ liệu đến API
            const response = await axios.post('/api/investments', investmentData);

            if (response.status === 201 || response.status === 200) {
                toast({
                    type: 'success',
                    title: t('addSuccess'),
                    description: t('addSuccessDescription')
                });
                onSuccess();
            } else {
                throw new Error('Lỗi khi thêm khoản đầu tư đất đai');
            }
        } catch (error) {
            console.error('Lỗi khi thêm khoản đầu tư đất đai:', error);
            toast({
                type: 'error',
                title: t('addError'),
                description: t('addErrorDescription')
            });
        } finally {
            setIsLoading(false);
        }
    };

    const propertyTypes = [
        { label: 'Đất thổ cư', value: 'residential' },
        { label: 'Đất nông nghiệp', value: 'agricultural' },
        { label: 'Đất thương mại/dịch vụ', value: 'commercial' },
        { label: 'Đất dự án', value: 'project' },
        { label: 'Khác', value: 'other' },
    ];

    const legalStatuses = [
        { label: 'Sổ đỏ chính chủ', value: 'redbook' },
        { label: 'Sổ hồng', value: 'pinkbook' },
        { label: 'Giấy tay', value: 'handwritten' },
        { label: 'Đang chờ cấp sổ', value: 'pending' },
        { label: 'Khác', value: 'other' },
    ];

    const ownershipTypes = [
        { label: 'Cá nhân', value: 'personal' },
        { label: 'Đồng sở hữu', value: 'shared' },
        { label: 'Doanh nghiệp', value: 'business' },
        { label: 'Khác', value: 'other' },
    ];

    const investmentPurposes = [
        { label: 'Giữ tài sản', value: 'holding' },
        { label: 'Chờ tăng giá', value: 'appreciation' },
        { label: 'Xây nhà/cho thuê', value: 'development' },
        { label: 'Khác', value: 'other' },
    ];

    const currentStatuses = [
        { label: 'Đang giữ', value: 'holding' },
        { label: 'Đã bán', value: 'sold' },
        { label: 'Đang cho thuê', value: 'renting' },
        { label: 'Khác', value: 'other' },
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-orange-800 dark:text-orange-400">Thông tin bất động sản</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="assetName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Tên bất động sản
                                            <HelpTooltip text="Tên mô tả bất động sản của bạn" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ví dụ: Đất nền khu dân cư An Phú, Lô B5..."
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Tên để nhận diện khoản đầu tư</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="propertyType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Loại đất
                                            <HelpTooltip text="Loại bất động sản đầu tư" />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder="Chọn loại đất" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {propertyTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Loại bất động sản bạn đầu tư</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('propertyType') === 'other' && (
                                <FormField
                                    control={form.control}
                                    name="otherPropertyType"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-foreground dark:text-foreground-dark">Loại đất khác</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nhập loại đất" {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <div className="mt-4">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Địa chỉ cụ thể
                                            <HelpTooltip text="Địa chỉ đầy đủ của bất động sản" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Số, đường, phường/xã, quận/huyện, tỉnh/thành"
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Địa chỉ đầy đủ của bất động sản</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-orange-800 dark:text-orange-400">Pháp lý và diện tích</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="legalStatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Tình trạng pháp lý
                                            <HelpTooltip text="Tình trạng giấy tờ pháp lý của bất động sản" />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder="Chọn tình trạng pháp lý" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {legalStatuses.map(status => (
                                                    <SelectItem key={status.value} value={status.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Tình trạng giấy tờ pháp lý</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('legalStatus') === 'other' && (
                                <FormField
                                    control={form.control}
                                    name="otherLegalStatus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">Tình trạng pháp lý khác</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nhập tình trạng pháp lý" {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="area"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Diện tích (m²)
                                            <HelpTooltip text="Diện tích đất tính bằng mét vuông" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Diện tích đất tính bằng mét vuông</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <FormField
                                control={form.control}
                                name="frontWidth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Mặt tiền (m)
                                            <HelpTooltip text="Chiều rộng mặt tiền tính bằng mét" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                value={field.value === undefined ? '' : field.value}
                                                onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Chiều rộng mặt tiền (tùy chọn)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="depth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Chiều sâu (m)
                                            <HelpTooltip text="Chiều sâu của lô đất tính bằng mét" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                value={field.value === undefined ? '' : field.value}
                                                onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Chiều sâu của lô đất (tùy chọn)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-orange-800 dark:text-orange-400">Tài chính và giao dịch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="purchasePrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Giá mua (VNĐ)
                                            <HelpTooltip text="Giá mua bất động sản" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Giá mua bất động sản</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="additionalFees"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Phí phát sinh
                                            <HelpTooltip text="Các khoản phí phát sinh như công chứng, môi giới..." />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Phí công chứng, môi giới, thuế...</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <FormField
                                control={form.control}
                                name="purchaseDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Ngày mua
                                            <HelpTooltip text="Ngày mua bất động sản" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Ngày mua bất động sản</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="ownershipType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Hình thức sở hữu
                                            <HelpTooltip text="Hình thức sở hữu bất động sản" />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder="Chọn hình thức sở hữu" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {ownershipTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Hình thức sở hữu bất động sản</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('ownershipType') === 'other' && (
                                <FormField
                                    control={form.control}
                                    name="otherOwnershipType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">Hình thức sở hữu khác</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nhập hình thức sở hữu" {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-orange-800 dark:text-orange-400">Thông tin khác</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="investmentPurpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Mục đích đầu tư
                                            <HelpTooltip text="Mục đích đầu tư bất động sản" />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder="Chọn mục đích đầu tư" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {investmentPurposes.map(purpose => (
                                                    <SelectItem key={purpose.value} value={purpose.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {purpose.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Mục đích đầu tư bất động sản</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('investmentPurpose') === 'other' && (
                                <FormField
                                    control={form.control}
                                    name="otherInvestmentPurpose"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">Mục đích đầu tư khác</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nhập mục đích đầu tư" {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="currentStatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Tình trạng hiện tại
                                            <HelpTooltip text="Tình trạng hiện tại của bất động sản" />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder="Chọn tình trạng hiện tại" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {currentStatuses.map(status => (
                                                    <SelectItem key={status.value} value={status.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Tình trạng hiện tại của bất động sản</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('currentStatus') === 'other' && (
                                <FormField
                                    control={form.control}
                                    name="otherCurrentStatus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">Tình trạng hiện tại khác</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nhập tình trạng hiện tại" {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <div className="mt-4">
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            Ghi chú
                                            <HelpTooltip text="Ghi chú thêm về khoản đầu tư bất động sản" />
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Nhập ghi chú về khoản đầu tư này..."
                                                {...field}
                                                disabled={isLoading}
                                                rows={3}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark resize-none"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">Thông tin bổ sung về khoản đầu tư</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 text-primary-foreground dark:text-primary-foreground-dark" disabled={isLoading}>
                    {isLoading ? "Đang thêm..." : "Thêm đầu tư đất đai"}
                </Button>
            </form>
        </Form>
    );
}

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
import { CurrencyInput } from '@/components/ui/currency-input';

interface AddRealEstateInvestmentProps {
    onSuccess: () => void;
}

export default function AddRealEstateInvestment({ onSuccess }: AddRealEstateInvestmentProps) {
    const t = useTranslations('Investments');
    const tRealEstate = useTranslations('Investments.realestate');
    const tValidation = useTranslations('Investments.validation');
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Định nghĩa schema xác thực cho đất đai
    const formSchema = z.object({
        assetName: z.string()
            .min(1, t('assetNameRequired'))
            .max(100, t('assetNameTooLong')),
        propertyType: z.string().min(1, tValidation('enterOtherAssetType')),
        otherPropertyType: z.string().optional(),
        address: z.string().min(1, tRealEstate('addressDescription')),
        legalStatus: z.string().min(1, tRealEstate('legalStatusDescription')),
        otherLegalStatus: z.string().optional(),
        area: z.coerce.number().min(0, t('quantityPositive')),
        frontWidth: z.coerce.number().min(0, t('quantityPositive')).optional(),
        depth: z.coerce.number().min(0, t('quantityPositive')).optional(),
        purchasePrice: z.coerce.number().min(0, t('pricePositive')).max(100000000000, tValidation('maxPriceLimit')),
        additionalFees: z.coerce.number().min(0, t('feePositive')).max(100000000000, tValidation('maxFeeLimit')).optional(),
        purchaseDate: z.string().min(1, t('purchaseDateRequired')),
        ownershipType: z.string().min(1, tRealEstate('ownershipTypeDescription')),
        otherOwnershipType: z.string().optional(),
        investmentPurpose: z.string().optional(),
        otherInvestmentPurpose: z.string().optional(),
        currentStatus: z.string().optional(),
        otherCurrentStatus: z.string().optional(),
        notes: z.string().max(500, t('notesTooLong')).optional(),
    }).refine(data => !(data.propertyType === tRealEstate('propertyTypes.other') && (!data.otherPropertyType || data.otherPropertyType.trim() === '')), {
        message: tRealEstate('otherPropertyTypePlaceholder'),
        path: ['otherPropertyType'],
    }).refine(data => !(data.legalStatus === tRealEstate('legalStatuses.other') && (!data.otherLegalStatus || data.otherLegalStatus.trim() === '')), {
        message: tRealEstate('otherLegalStatusPlaceholder'),
        path: ['otherLegalStatus'],
    }).refine(data => !(data.ownershipType === tRealEstate('ownershipTypes.other') && (!data.otherOwnershipType || data.otherOwnershipType.trim() === '')), {
        message: tRealEstate('otherOwnershipTypePlaceholder'),
        path: ['otherOwnershipType'],
    }).refine(data => !(data.investmentPurpose === tRealEstate('investmentPurposes.other') && (!data.otherInvestmentPurpose || data.otherInvestmentPurpose.trim() === '')), {
        message: tRealEstate('otherInvestmentPurposePlaceholder'),
        path: ['otherInvestmentPurpose'],
    }).refine(data => !(data.currentStatus === tRealEstate('currentStatuses.other') && (!data.otherCurrentStatus || data.otherCurrentStatus.trim() === '')), {
        message: tRealEstate('otherCurrentStatusPlaceholder'),
        path: ['otherCurrentStatus'],
    });

    // Khởi tạo form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            assetName: '',
            propertyType: tRealEstate('propertyTypes.residential'),
            otherPropertyType: '',
            address: '',
            legalStatus: tRealEstate('legalStatuses.redbook'),
            otherLegalStatus: '',
            area: 0,
            frontWidth: undefined,
            depth: undefined,
            purchasePrice: 0,
            additionalFees: 0,
            purchaseDate: new Date().toISOString().slice(0, 10),
            ownershipType: tRealEstate('ownershipTypes.personal'),
            otherOwnershipType: '',
            investmentPurpose: tRealEstate('investmentPurposes.holding'),
            otherInvestmentPurpose: '',
            currentStatus: tRealEstate('currentStatuses.holding'),
            otherCurrentStatus: '',
            notes: '',
        },
    });

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        const actualPropertyType = values.propertyType === tRealEstate('propertyTypes.other') ? values.otherPropertyType?.trim() : values.propertyType;
        const actualLegalStatus = values.legalStatus === tRealEstate('legalStatuses.other') ? values.otherLegalStatus?.trim() : values.legalStatus;
        const actualOwnershipType = values.ownershipType === tRealEstate('ownershipTypes.other') ? values.otherOwnershipType?.trim() : values.ownershipType;
        const actualInvestmentPurpose = values.investmentPurpose === tRealEstate('investmentPurposes.other') ? values.otherInvestmentPurpose?.trim() : values.investmentPurpose;
        const actualCurrentStatus = values.currentStatus === tRealEstate('currentStatuses.other') ? values.otherCurrentStatus?.trim() : values.currentStatus;

        // Validate other fields if 'other' is selected
        let hasError = false;
        if (values.propertyType === tRealEstate('propertyTypes.other') && !actualPropertyType) {
            form.setError('otherPropertyType', { type: 'manual', message: tRealEstate('otherPropertyTypePlaceholder') });
            hasError = true;
        }
        if (values.legalStatus === tRealEstate('legalStatuses.other') && !actualLegalStatus) {
            form.setError('otherLegalStatus', { type: 'manual', message: tRealEstate('otherLegalStatusPlaceholder') });
            hasError = true;
        }
        if (values.ownershipType === tRealEstate('ownershipTypes.other') && !actualOwnershipType) {
            form.setError('otherOwnershipType', { type: 'manual', message: tRealEstate('otherOwnershipTypePlaceholder') });
            hasError = true;
        }
        if (values.investmentPurpose === tRealEstate('investmentPurposes.other') && !actualInvestmentPurpose) {
            form.setError('otherInvestmentPurpose', { type: 'manual', message: tRealEstate('otherInvestmentPurposePlaceholder') });
            hasError = true;
        }
        if (values.currentStatus === tRealEstate('currentStatuses.other') && !actualCurrentStatus) {
            form.setError('otherCurrentStatus', { type: 'manual', message: tRealEstate('otherCurrentStatusPlaceholder') });
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
                category: tRealEstate('category'),
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
                    notes: `${tRealEstate('buyTransaction')}: ${values.assetName}`
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
                throw new Error(tValidation('dataError'));
            }
        } catch (error: any) {
            console.error(tRealEstate('realEstateError'), error);

            if (error.response?.status === 401) {
                toast({
                    type: 'error',
                    title: tValidation('authError'),
                    description: tValidation('loginAgain')
                });
                router.push('/login');
            } else {
                toast({
                    type: 'error',
                    title: t('addError'),
                    description: t('addErrorDescription')
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const propertyTypes = [
        { label: tRealEstate('propertyTypes.residential'), value: tRealEstate('propertyTypes.residential') },
        { label: tRealEstate('propertyTypes.agricultural'), value: tRealEstate('propertyTypes.agricultural') },
        { label: tRealEstate('propertyTypes.commercial'), value: tRealEstate('propertyTypes.commercial') },
        { label: tRealEstate('propertyTypes.project'), value: tRealEstate('propertyTypes.project') },
        { label: tRealEstate('propertyTypes.other'), value: tRealEstate('propertyTypes.other') },
    ];

    const legalStatuses = [
        { label: tRealEstate('legalStatuses.redbook'), value: tRealEstate('legalStatuses.redbook') },
        { label: tRealEstate('legalStatuses.pinkbook'), value: tRealEstate('legalStatuses.pinkbook') },
        { label: tRealEstate('legalStatuses.handwritten'), value: tRealEstate('legalStatuses.handwritten') },
        { label: tRealEstate('legalStatuses.pending'), value: tRealEstate('legalStatuses.pending') },
        { label: tRealEstate('legalStatuses.other'), value: tRealEstate('legalStatuses.other') },
    ];

    const ownershipTypes = [
        { label: tRealEstate('ownershipTypes.personal'), value: tRealEstate('ownershipTypes.personal') },
        { label: tRealEstate('ownershipTypes.shared'), value: tRealEstate('ownershipTypes.shared') },
        { label: tRealEstate('ownershipTypes.business'), value: tRealEstate('ownershipTypes.business') },
        { label: tRealEstate('ownershipTypes.other'), value: tRealEstate('ownershipTypes.other') },
    ];

    const investmentPurposes = [
        { label: tRealEstate('investmentPurposes.holding'), value: tRealEstate('investmentPurposes.holding') },
        { label: tRealEstate('investmentPurposes.appreciation'), value: tRealEstate('investmentPurposes.appreciation') },
        { label: tRealEstate('investmentPurposes.development'), value: tRealEstate('investmentPurposes.development') },
        { label: tRealEstate('investmentPurposes.other'), value: tRealEstate('investmentPurposes.other') },
    ];

    const currentStatuses = [
        { label: tRealEstate('currentStatuses.holding'), value: tRealEstate('currentStatuses.holding') },
        { label: tRealEstate('currentStatuses.sold'), value: tRealEstate('currentStatuses.sold') },
        { label: tRealEstate('currentStatuses.renting'), value: tRealEstate('currentStatuses.renting') },
        { label: tRealEstate('currentStatuses.other'), value: tRealEstate('currentStatuses.other') },
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-orange-800 dark:text-orange-400">{tRealEstate('realEstateInfo')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="assetName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            {tRealEstate('assetName')}
                                            <HelpTooltip text={tRealEstate('assetNameDescription')} />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={tRealEstate('assetNamePlaceholder')}
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{tRealEstate('assetNameDescription')}</FormDescription>
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
                                            {tRealEstate('propertyType')}
                                            <HelpTooltip text={tRealEstate('propertyTypeDescription')} />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tRealEstate('selectPropertyType')} />
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
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{tRealEstate('propertyTypeDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('propertyType') === tRealEstate('propertyTypes.other') && (
                                <FormField
                                    control={form.control}
                                    name="otherPropertyType"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-foreground dark:text-foreground-dark">{tRealEstate('otherPropertyTypeLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tRealEstate('otherPropertyTypePlaceholder')} {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
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
                                            {tRealEstate('address')}
                                            <HelpTooltip text={tRealEstate('addressDescription')} />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={tRealEstate('addressPlaceholder')}
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{tRealEstate('addressDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-orange-800 dark:text-orange-400">{tRealEstate('legalAndArea')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="legalStatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            {tRealEstate('legalStatus')}
                                            <HelpTooltip text={tRealEstate('legalStatusDescription')} />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tRealEstate('selectLegalStatus')} />
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
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{tRealEstate('legalStatusDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('legalStatus') === tRealEstate('legalStatuses.other') && (
                                <FormField
                                    control={form.control}
                                    name="otherLegalStatus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">{tRealEstate('otherLegalStatusLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tRealEstate('otherLegalStatusPlaceholder')} {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
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
                                            {tRealEstate('area')}
                                            <HelpTooltip text={tRealEstate('areaDescription')} />
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
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{tRealEstate('areaDescription')}</FormDescription>
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
                                            {tRealEstate('frontWidth')}
                                            <HelpTooltip text={tRealEstate('frontWidthDescription')} />
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
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{tRealEstate('frontWidthDescription')}</FormDescription>
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
                                            {tRealEstate('depth')}
                                            <HelpTooltip text={tRealEstate('depthDescription')} />
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
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{tRealEstate('depthDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-orange-800 dark:text-orange-400">{tRealEstate('financialAndTransaction')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="purchasePrice"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            {t('purchasePrice')}
                                            <HelpTooltip text={t('purchasePriceDescription')} />
                                        </FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder="0"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                disabled={isLoading}
                                                className="text-right bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{t('purchasePriceDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="additionalFees"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            {t('additionalFees')}
                                            <HelpTooltip text={t('additionalFeesDescription')} />
                                        </FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder="0"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                disabled={isLoading}
                                                className="text-right bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{t('additionalFeesDescription')}</FormDescription>
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
                                            {t('purchaseDate')}
                                            <HelpTooltip text={t('purchaseDateDescription')} />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{t('purchaseDateDescription')}</FormDescription>
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
                                            {tRealEstate('ownershipType')}
                                            <HelpTooltip text={tRealEstate('ownershipTypeDescription')} />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tRealEstate('selectOwnershipType')} />
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
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{tRealEstate('ownershipTypeDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('ownershipType') === tRealEstate('ownershipTypes.other') && (
                                <FormField
                                    control={form.control}
                                    name="otherOwnershipType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">{tRealEstate('otherOwnershipTypeLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tRealEstate('otherOwnershipTypePlaceholder')} {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
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
                        <CardTitle className="text-xl text-orange-800 dark:text-orange-400">{tRealEstate('otherInfo')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="investmentPurpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center text-foreground dark:text-foreground-dark">
                                            {tRealEstate('investmentPurpose')}
                                            <HelpTooltip text={tRealEstate('investmentPurposeDescription')} />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tRealEstate('selectInvestmentPurpose')} />
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
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{tRealEstate('investmentPurposeDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('investmentPurpose') === tRealEstate('investmentPurposes.other') && (
                                <FormField
                                    control={form.control}
                                    name="otherInvestmentPurpose"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">{tRealEstate('otherInvestmentPurposeLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tRealEstate('otherInvestmentPurposePlaceholder')} {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
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
                                            {tRealEstate('currentStatus')}
                                            <HelpTooltip text={tRealEstate('currentStatusDescription')} />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tRealEstate('selectCurrentStatus')} />
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
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{tRealEstate('currentStatusDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('currentStatus') === tRealEstate('currentStatuses.other') && (
                                <FormField
                                    control={form.control}
                                    name="otherCurrentStatus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">{tRealEstate('otherCurrentStatusLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tRealEstate('otherCurrentStatusPlaceholder')} {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
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
                                            {t('notes')}
                                            <HelpTooltip text={t('notesDescription')} />
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('notesPlaceholder')}
                                                {...field}
                                                disabled={isLoading}
                                                rows={3}
                                                className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark resize-none"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">{t('notesDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end items-center mt-6">
                    <Button type="submit" className="bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 text-primary-foreground dark:text-primary-foreground-dark" disabled={isLoading}>
                        {isLoading ? t('adding') : tRealEstate('addNewRealEstate')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

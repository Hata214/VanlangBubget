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
import { getToken, getAuthHeader } from '@/services/api';
import { CurrencyInput } from '@/components/ui/currency-input';

interface AddGoldInvestmentProps {
    onSuccess: () => void;
}

export default function AddGoldInvestment({ onSuccess }: AddGoldInvestmentProps) {
    const t = useTranslations('Investments');
    const tGold = useTranslations('Investments.goldInvestment.addGold');
    const tValidation = useTranslations('Investments.validation');
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // API URL for fetch requests
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vanlangbubget.onrender.com';
    // Đảm bảo URL kết thúc với /api để phù hợp với cấu hình API server
    const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

    // Định nghĩa schema xác thực cho vàng
    const formSchema = z.object({
        assetName: z.string()
            .min(1, t('assetNameRequired'))
            .max(100, t('assetNameTooLong')),
        otherAssetName: z.string().optional(),
        symbol: z.string()
            .min(1, t('symbolRequired'))
            .max(20, t('symbolTooLong')),
        currentPrice: z.coerce.number()
            .min(0, t('pricePositive'))
            .max(100000000000, tValidation('maxPriceLimit')),
        quantity: z.coerce.number()
            .min(0, t('quantityPositive'))
            .max(1000000000, tValidation('maxQuantityLimit')),
        fee: z.coerce.number()
            .min(0, t('feePositive'))
            .max(100000000000, tValidation('maxFeeLimit'))
            .optional(), // Bỏ .default(0)
        notes: z.string().max(500, t('notesTooLong')).optional(),
        purchaseDate: z.string().min(1, t('purchaseDateRequired')),
        purity: z.string().optional(),
        otherPurity: z.string().optional(),
        brand: z.string().optional(),
        otherBrand: z.string().optional(),
        weightUnit: z.string(), // Made weightUnit a required string
    }).refine(data => {
        if (data.brand === tGold('brands.other') && (!data.otherBrand || data.otherBrand.trim() === '')) {
            return false;
        }
        return true;
    }, {
        message: tValidation('enterOtherBrand'),
        path: ['otherBrand'],
    }).refine(data => {
        if (data.assetName === tGold('assetTypes.other') && (!data.otherAssetName || data.otherAssetName.trim() === '')) {
            return false;
        }
        return true;
    }, {
        message: tValidation('enterOtherAssetType'),
        path: ['otherAssetName'],
    }).refine(data => {
        if (data.purity === tGold('purities.other') && (!data.otherPurity || data.otherPurity.trim() === '')) {
            return false;
        }
        return true;
    }, {
        message: tValidation('enterOtherPurity'),
        path: ['otherPurity'],
    });

    // Khởi tạo form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            assetName: tGold('assetTypes.goldBar'),
            otherAssetName: '',
            symbol: '',
            currentPrice: 0,
            quantity: 0,
            fee: 0,
            notes: '',
            purchaseDate: new Date().toISOString().slice(0, 10),
            purity: '9999',
            otherPurity: '',
            brand: tGold('brands.SJC'),
            otherBrand: '',
            weightUnit: tGold('gram'),
        },
    });

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            const actualBrand = values.brand === tGold('brands.other') ? values.otherBrand?.trim() : values.brand;
            const actualAssetName = values.assetName === tGold('assetTypes.other') ? values.otherAssetName?.trim() : values.assetName;
            const actualPurity = values.purity === tGold('purities.other') ? values.otherPurity?.trim() : values.purity;

            if (values.brand === tGold('brands.other') && !actualBrand) {
                form.setError('otherBrand', { type: 'manual', message: tValidation('enterOtherBrand') });
                setIsLoading(false);
                return;
            }
            if (values.assetName === tGold('assetTypes.other') && !actualAssetName) {
                form.setError('otherAssetName', { type: 'manual', message: tValidation('enterOtherAssetType') });
                setIsLoading(false);
                return;
            }
            if (values.purity === tGold('purities.other') && !actualPurity) {
                form.setError('otherPurity', { type: 'manual', message: tValidation('enterOtherPurity') });
                setIsLoading(false);
                return;
            }

            // Chuẩn bị dữ liệu
            const investmentData = {
                type: 'gold',
                name: actualAssetName || 'Vàng',
                symbol: values.symbol || 'GOLD',
                category: 'Vàng',
                currentPrice: Number(values.currentPrice),
                initialInvestment: Number(values.currentPrice) * Number(values.quantity),
                startDate: new Date(values.purchaseDate).toISOString(),
                notes: values.notes || "",
                purity: actualPurity || "9999",
                brand: actualBrand || "SJC",
                weightUnit: values.weightUnit || "gram",
                transaction: {
                    type: 'buy',
                    price: Number(values.currentPrice),
                    quantity: Number(values.quantity),
                    fee: Number(values.fee ?? 0), // Sử dụng ?? 0
                    date: new Date(values.purchaseDate).toISOString(),
                    notes: `Mua vàng ${actualBrand || 'SJC'} ${actualPurity || '9999'}`
                }
            };

            console.log('Gửi yêu cầu đến API:', `${API_URL}/investments`);
            console.log('Dữ liệu gửi đi:', JSON.stringify(investmentData, null, 2));

            // Lấy token xác thực từ utility function
            const token = getToken();
            console.log('Token xác thực:', token ? 'Đã có token' : 'Không có token');

            if (!token) {
                toast({
                    title: tValidation('authError'),
                    description: tValidation('loginAgain'),
                    type: 'error',
                    duration: 5000
                });

                // Redirect to login page after a short delay
                setTimeout(() => {
                    router.push('/login');
                }, 1500);

                return;
            }

            // Gọi API
            const response = await fetch(`${API_URL}/investments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
                body: JSON.stringify(investmentData),
            });

            console.log('API response status:', response.status);
            const result = await response.json();
            console.log('Kết quả từ API:', result);

            // Log chi tiết hơn nếu có lỗi
            if (result.errors) {
                console.error('Chi tiết lỗi xác thực:', result.errors);
            }

            // Xử lý kết quả từ API
            if (response.ok) {
                toast({
                    title: t('addSuccess'),
                    description: `${t('addSuccessDescription')} - ${values.assetName} ${values.purity}`,
                    type: 'success',
                    duration: 5000
                });

                // Gọi callback onSuccess để cập nhật danh sách đầu tư
                setTimeout(() => {
                    onSuccess();
                }, 500);
            } else if (response.status === 401) {
                // Xử lý lỗi xác thực
                toast({
                    title: tValidation('authError'),
                    description: tValidation('sessionExpired'),
                    type: 'error',
                    duration: 5000
                });

                // Redirect to login page after a short delay
                setTimeout(() => {
                    router.push('/login');
                }, 1500);
            } else if (response.status === 400) {
                // Xử lý lỗi Bad Request
                let errorMessage = result.message || tValidation('invalidData');

                // Hiển thị thông tin chi tiết về lỗi nếu có
                if (result.errors && typeof result.errors === 'object') {
                    const errorDetails = Object.entries(result.errors)
                        .map(([field, msg]) => `${field}: ${msg}`)
                        .join(', ');

                    if (errorDetails) {
                        errorMessage += `: ${errorDetails}`;
                    }
                }

                toast({
                    title: tValidation('dataError'),
                    description: errorMessage,
                    type: 'error',
                    duration: 7000
                });
            } else {
                toast({
                    title: t('addError'),
                    description: result.message || `${t('addErrorDescription')} - ${response.status}`,
                    type: 'error',
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Error creating investment:', error);
            let errorMessage = t('addErrorDescription');

            if (error instanceof Error) {
                errorMessage = `${errorMessage}: ${error.message}`;
            }

            toast({
                title: t('addError'),
                description: errorMessage,
                type: 'error',
                duration: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    const goldBrands = [
        { label: tGold('brands.SJC'), value: tGold('brands.SJC') },
        { label: tGold('brands.DOJI'), value: tGold('brands.DOJI') },
        { label: tGold('brands.PNJ'), value: tGold('brands.PNJ') },
        { label: tGold('brands.BTMC'), value: tGold('brands.BTMC') },
        { label: 'Mi Hồng', value: 'Mi Hồng' },
        { label: 'Phú Quý', value: 'Phú Quý' },
        { label: tGold('brands.other'), value: tGold('brands.other') },
    ];

    const goldTypes = [
        { label: tGold('assetTypes.goldBar'), value: tGold('assetTypes.goldBar') },
        { label: tGold('assetTypes.goldJewelry'), value: tGold('assetTypes.goldJewelry') },
        { label: tGold('assetTypes.goldCoin'), value: tGold('assetTypes.goldCoin') },
        { label: tGold('assetTypes.other'), value: tGold('assetTypes.other') },
    ];

    const goldPurities = [
        { label: tGold('purities.9999'), value: '9999' },
        { label: tGold('purities.999'), value: '999' },
        { label: tGold('purities.916'), value: '916' },
        { label: tGold('purities.750'), value: '750' },
        { label: tGold('purities.585'), value: '585' },
        { label: tGold('purities.417'), value: '417' },
        { label: tGold('purities.other'), value: tGold('purities.other') },
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl text-yellow-800 dark:text-yellow-300">{tGold('goldInfo')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="info" className="mb-4 bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertTitle className="font-semibold">{t('notes')}</AlertTitle>
                            <AlertDescription>
                                {tGold('notePrice')}
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tGold('brand')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tGold('selectBrand')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {goldBrands.map((brand) => (
                                                    <SelectItem key={brand.value} value={brand.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {brand.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tGold('brandDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('brand') === tGold('brands.other') && (
                                <FormField
                                    control={form.control}
                                    name="otherBrand"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">{tGold('otherBrandLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tGold('otherBrandPlaceholder')} {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="assetName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tGold('goldType')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tGold('selectAssetType')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {goldTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tGold('assetTypeDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('assetName') === tGold('assetTypes.other') && (
                                <FormField
                                    control={form.control}
                                    name="otherAssetName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">{tGold('otherAssetLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tGold('otherAssetPlaceholder')} {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="purity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tGold('purity')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tGold('selectPurity')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {goldPurities.map((purity) => (
                                                    <SelectItem key={purity.value} value={purity.value} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {purity.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tGold('purityDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch('purity') === tGold('purities.other') && (
                                <FormField
                                    control={form.control}
                                    name="otherPurity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground dark:text-foreground-dark">{tGold('otherPurityLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={tGold('otherPurityPlaceholder')} {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="symbol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tGold('symbolLabel')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={tGold('symbolPlaceholder')} {...field} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {t('symbolDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tGold('quantityLabel')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={tGold('quantityPlaceholder')}
                                                value={field.value}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                onBlur={field.onBlur}
                                                className="text-right bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tGold('quantityDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="weightUnit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tGold('weightUnitLabel')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tGold('selectWeightUnit')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                <SelectItem value={tGold('gram')} className="hover:bg-accent dark:hover:bg-accent-dark">{tGold('gram')}</SelectItem>
                                                <SelectItem value="chỉ" className="hover:bg-accent dark:hover:bg-accent-dark">Chỉ (3.75g)</SelectItem>
                                                <SelectItem value={tGold('tael')} className="hover:bg-accent dark:hover:bg-accent-dark">{tGold('tael')}</SelectItem>
                                                <SelectItem value="cây" className="hover:bg-accent dark:hover:bg-accent-dark">Cây (37.5g)</SelectItem>
                                                <SelectItem value="phân" className="hover:bg-accent dark:hover:bg-accent-dark">Phân (0.375g)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tGold('weightUnitDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="currentPrice"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{tGold('purchasePriceLabel')}</FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder={t('pricePlaceholder')}
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                className="text-right bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {t('currentPriceDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fee"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{t('fee')}</FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder={t('feeDescription')}
                                                value={field.value ?? 0}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                className="text-right bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {t('feeDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="purchaseDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground dark:text-foreground-dark">{t('date')}</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tValidation('selectDate')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                            {tGold('goldInfo')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end items-center mt-6">
                            <Button type="submit" disabled={isLoading} className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white dark:text-gray-900">
                                {isLoading ? t('adding') : tGold('addNewGold')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
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
import { createInvestment } from '@/services/investmentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { InfoIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';

interface AddInvestmentProps {
    onSuccess: () => void;
}

export default function AddInvestment({ onSuccess }: AddInvestmentProps) {
    const t = useTranslations('Investments');
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<string | undefined>(undefined);

    // API URL for fetch requests
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';
    // Đảm bảo URL kết thúc với /api để phù hợp với cấu hình API server
    const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

    // Định nghĩa schema xác thực
    const formSchema = z.object({
        type: z.enum(['stock', 'gold', 'crypto'], {
            required_error: t('typeRequired'),
        }),
        assetName: z.string()
            .min(1, t('assetNameRequired'))
            .max(100, t('assetNameTooLong')),
        symbol: z.string()
            .min(1, t('symbolRequired'))
            .max(20, t('symbolTooLong'))
            .optional(),
        currentPrice: z.coerce.number()
            .min(0, t('pricePositive')),
        quantity: z.coerce.number()
            .min(0, t('quantityPositive')),
        fee: z.coerce.number()
            .min(0, t('feePositive')), // Made fee a required number
        notes: z.string().max(500, t('notesTooLong')).optional(),
        purchaseDate: z.string().min(1, t('purchaseDateRequired')),
        // Trường bổ sung cho từng loại đầu tư
        purity: z.string().optional(), // cho gold
        network: z.string().optional(), // cho crypto
        sector: z.string().optional(), // cho stock
    });

    // Khởi tạo form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'stock',
            assetName: '',
            symbol: '',
            currentPrice: 0,
            quantity: 0,
            fee: 0,
            notes: '',
            purchaseDate: new Date().toISOString().slice(0, 10),
        },
    });

    // Theo dõi thay đổi loại đầu tư
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'type') {
                setSelectedType(value.type);
            }
        });
        return () => subscription.unsubscribe();
    }, [form.watch]);

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            // Kiểm tra dữ liệu đầu vào
            if (!values.type || !values.assetName || !values.currentPrice || values.quantity === undefined) {
                throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
            }

            // Chuẩn bị dữ liệu
            const investmentData = {
                type: values.type,
                assetName: values.assetName,
                symbol: values.symbol || null,
                currentPrice: values.currentPrice,
                quantity: values.quantity,
                totalValue: values.currentPrice * values.quantity,
                purchaseDate: new Date(values.purchaseDate).toISOString(),
                fee: values.fee || 0,
                notes: values.notes || null,
                // Thêm các trường bổ sung tùy theo loại đầu tư
                purity: values.purity || null,
                network: values.network || null,
                sector: values.sector || null,
            };

            console.log('Gửi yêu cầu đến API:', `${API_URL}/investments`);
            console.log('Dữ liệu gửi đi:', JSON.stringify(investmentData));

            // Gọi API
            const response = await fetch(`${API_URL}/investments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(investmentData),
            });

            const result = await response.json();
            console.log('Kết quả từ API:', response.status, result);

            // Xử lý kết quả từ API
            if (response.ok) {
                toast({
                    title: t('addSuccess'),
                    description: `${t('addSuccessDescription')} - ${values.assetName} (${values.type})`,
                    type: 'success',
                    duration: 5000
                });

                // Chuyển đến trang đầu tư sau khi thêm thành công
                setTimeout(() => {
                    // Gọi callback onSuccess để cập nhật danh sách đầu tư
                    onSuccess();
                    router.push('/investments');
                    router.refresh();
                }, 500);
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

    // Hiển thị các trường form tùy thuộc vào loại đầu tư đã chọn
    const renderTypeSpecificFields = () => {
        switch (selectedType) {
            case 'stock':
                return (
                    <>
                        <FormField
                            control={form.control}
                            name="sector"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lĩnh vực</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn lĩnh vực kinh doanh" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="technology">Công nghệ</SelectItem>
                                            <SelectItem value="financial">Tài chính & Ngân hàng</SelectItem>
                                            <SelectItem value="healthcare">Y tế & Dược phẩm</SelectItem>
                                            <SelectItem value="consumer">Hàng tiêu dùng</SelectItem>
                                            <SelectItem value="industrial">Công nghiệp</SelectItem>
                                            <SelectItem value="telecom">Viễn thông</SelectItem>
                                            <SelectItem value="energy">Năng lượng</SelectItem>
                                            <SelectItem value="materials">Vật liệu</SelectItem>
                                            <SelectItem value="realestate">Bất động sản</SelectItem>
                                            <SelectItem value="other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>Lĩnh vực kinh doanh của công ty</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Alert variant="default" className="bg-blue-50 text-blue-700 border-blue-200 mt-4">
                            <InfoIcon className="h-4 w-4" />
                            <AlertTitle>Lời khuyên</AlertTitle>
                            <AlertDescription>
                                Với cổ phiếu, nên cập nhật giá hiện tại thường xuyên để theo dõi chính xác hiệu suất đầu tư
                            </AlertDescription>
                        </Alert>
                    </>
                );
            case 'gold':
                return (
                    <>
                        <FormField
                            control={form.control}
                            name="purity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Độ tinh khiết</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn độ tinh khiết" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="9999">Vàng SJC (9999)</SelectItem>
                                            <SelectItem value="999">Vàng 999 (24K)</SelectItem>
                                            <SelectItem value="958">Vàng 958 (23K)</SelectItem>
                                            <SelectItem value="916">Vàng 916 (22K)</SelectItem>
                                            <SelectItem value="750">Vàng 750 (18K)</SelectItem>
                                            <SelectItem value="585">Vàng 585 (14K)</SelectItem>
                                            <SelectItem value="417">Vàng 417 (10K)</SelectItem>
                                            <SelectItem value="other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>Độ tinh khiết của vàng bạn đầu tư</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Alert variant="default" className="bg-yellow-50 text-yellow-700 border-yellow-200 mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Lưu ý</AlertTitle>
                            <AlertDescription>
                                Giá vàng có thể thay đổi hàng ngày. Nhớ cập nhật giá hiện tại từ nguồn đáng tin cậy như SJC, PNJ, DOJI...
                            </AlertDescription>
                        </Alert>
                    </>
                );
            case 'crypto':
                return (
                    <>
                        <FormField
                            control={form.control}
                            name="network"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mạng lưới</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn mạng lưới" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                                            <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                                            <SelectItem value="binance">Binance Smart Chain (BSC)</SelectItem>
                                            <SelectItem value="solana">Solana (SOL)</SelectItem>
                                            <SelectItem value="polygon">Polygon (MATIC)</SelectItem>
                                            <SelectItem value="avalanche">Avalanche (AVAX)</SelectItem>
                                            <SelectItem value="other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>Mạng lưới blockchain của đồng tiền điện tử</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-sm text-purple-600 border-purple-200 hover:bg-purple-50"
                                onClick={() => window.open('/investments/crypto', '_blank')}
                            >
                                Xem trang crypto chuyên dụng
                            </Button>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-blue-100 bg-blue-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-blue-800">Thông tin cơ bản</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            {t('investmentType')}
                                            <HelpTooltip text="Chọn loại tài sản đầu tư để hiển thị các trường phù hợp" size="md" />
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('selectType')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="stock">{t('stock')}</SelectItem>
                                                <SelectItem value="gold">{t('gold.title')}</SelectItem>
                                                <SelectItem value="crypto">{t('crypto')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>{t('typeDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="assetName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            {t('assetName')}
                                            <HelpTooltip text="Tên đầy đủ của tài sản đầu tư" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('assetNamePlaceholder')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>{t('assetNameDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <FormField
                                control={form.control}
                                name="symbol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            {t('symbol')}
                                            <HelpTooltip text="Mã ký hiệu của tài sản đầu tư (nếu có)" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('symbolPlaceholder')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>{t('symbolDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="currentPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            {t('currentPrice')}
                                            <HelpTooltip text={t('currentPriceTooltip')} />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder={t('priceInputPlaceholder')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>{t('currentPriceDescription')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {selectedType && renderTypeSpecificFields()}
                    </CardContent>
                </Card>

                <Card className="border-green-100 bg-green-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-green-800">Thông tin giao dịch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            {t('quantity')}
                                            <HelpTooltip text={t('quantityTooltip')} />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder={t('priceInputPlaceholder')}
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
                                name="fee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            {t('fee')}
                                            <HelpTooltip text={t('feeTooltip')} />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder={t('priceInputPlaceholder')}
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
                                name="purchaseDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            {t('purchaseDate')}
                                            <HelpTooltip text="Ngày mua tài sản" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="mt-4">
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            {t('notes')}
                                            <HelpTooltip text="Ghi chú thêm về khoản đầu tư" />
                                        </FormLabel>
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
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end items-center mt-6">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? t('adding') : t('addInvestment')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

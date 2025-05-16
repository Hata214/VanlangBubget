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

interface AddGoldInvestmentProps {
    onSuccess: () => void;
}

export default function AddGoldInvestment({ onSuccess }: AddGoldInvestmentProps) {
    const t = useTranslations('Investments');
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // API URL for fetch requests
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Đảm bảo URL kết thúc với /api để phù hợp với cấu hình API server
    const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

    // Định nghĩa schema xác thực cho vàng
    const formSchema = z.object({
        assetName: z.string()
            .min(1, t('assetNameRequired'))
            .max(100, t('assetNameTooLong')),
        symbol: z.string()
            .min(1, t('symbolRequired'))
            .max(20, t('symbolTooLong')),
        currentPrice: z.coerce.number()
            .min(0, t('pricePositive')),
        quantity: z.coerce.number()
            .min(0, t('quantityPositive')),
        fee: z.coerce.number()
            .min(0, t('feePositive'))
            .optional()
            .default(0),
        notes: z.string().max(500, t('notesTooLong')).optional(),
        purchaseDate: z.string().min(1, t('purchaseDateRequired')),
        purity: z.string().optional(),
        brand: z.string().optional(),
        weightUnit: z.string().default('gram'),
    });

    // Khởi tạo form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            assetName: 'Vàng',
            symbol: '',
            currentPrice: 0,
            quantity: 0,
            fee: 0,
            notes: '',
            purchaseDate: new Date().toISOString().slice(0, 10),
            purity: '',
            brand: '',
            weightUnit: 'gram',
        },
    });

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            // Chuẩn bị dữ liệu
            const investmentData = {
                type: 'gold',
                name: values.assetName,
                symbol: values.symbol || 'GOLD',
                category: 'Vàng',
                currentPrice: Number(values.currentPrice),
                initialInvestment: Number(values.currentPrice) * Number(values.quantity),
                startDate: new Date(values.purchaseDate).toISOString(),
                notes: values.notes || "",
                purity: values.purity || "9999",
                brand: values.brand || "SJC",
                weightUnit: values.weightUnit || "gram",
                transaction: {
                    type: 'buy',
                    price: Number(values.currentPrice),
                    quantity: Number(values.quantity),
                    fee: Number(values.fee || 0),
                    date: new Date(values.purchaseDate).toISOString(),
                    notes: `Mua vàng ${values.brand || 'SJC'} ${values.purity || '9999'}`
                }
            };

            console.log('Gửi yêu cầu đến API:', `${API_URL}/investments`);
            console.log('Dữ liệu gửi đi:', JSON.stringify(investmentData, null, 2));

            // Lấy token xác thực từ utility function
            const token = getToken();
            console.log('Token xác thực:', token ? 'Đã có token' : 'Không có token');

            if (!token) {
                toast({
                    title: 'Lỗi xác thực',
                    description: 'Vui lòng đăng nhập lại để thêm khoản đầu tư',
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
                    title: 'Lỗi xác thực',
                    description: 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.',
                    type: 'error',
                    duration: 5000
                });

                // Redirect to login page after a short delay
                setTimeout(() => {
                    router.push('/login');
                }, 1500);
            } else if (response.status === 400) {
                // Xử lý lỗi Bad Request
                let errorMessage = result.message || 'Dữ liệu không hợp lệ';

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
                    title: 'Lỗi dữ liệu',
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
        { label: 'SJC', value: 'SJC' },
        { label: 'DOJI', value: 'DOJI' },
        { label: 'PNJ', value: 'PNJ' },
        { label: 'Bảo Tín Minh Châu', value: 'Bảo Tín Minh Châu' },
        { label: 'Mi Hồng', value: 'Mi Hồng' },
        { label: 'Phú Quý', value: 'Phú Quý' },
        { label: 'Khác', value: 'Khác' },
    ];

    const goldTypes = [
        { label: 'Vàng miếng', value: 'Vàng miếng' },
        { label: 'Vàng nhẫn', value: 'Vàng nhẫn' },
        { label: 'Vàng trang sức', value: 'Vàng trang sức' },
        { label: 'Khác', value: 'Khác' },
    ];

    const goldPurities = [
        { label: '9999 (24K)', value: '9999' },
        { label: '999 (23.9K)', value: '999' },
        { label: '916 (22K)', value: '916' },
        { label: '750 (18K)', value: '750' },
        { label: '585 (14K)', value: '585' },
        { label: '417 (10K)', value: '417' },
        { label: 'Khác', value: 'Khác' },
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-yellow-100 bg-yellow-50/30">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl text-yellow-800">Thông tin vàng</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="info" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Lưu ý</AlertTitle>
                            <AlertDescription>
                                Vui lòng nhập thông tin chính xác về khoản đầu tư vàng của bạn để theo dõi hiệu quả hơn.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thương hiệu</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn thương hiệu vàng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {goldBrands.map((brand) => (
                                                    <SelectItem key={brand.value} value={brand.value}>
                                                        {brand.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Thương hiệu vàng bạn đã mua
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="assetName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại vàng</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn loại vàng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {goldTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Loại vàng bạn đã mua
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="purity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Độ tinh khiết</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn độ tinh khiết" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {goldPurities.map((purity) => (
                                                    <SelectItem key={purity.value} value={purity.value}>
                                                        {purity.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Độ tinh khiết của vàng
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="symbol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mã định danh</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ví dụ: SJC1L" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Mã hoặc ký hiệu của sản phẩm vàng (không bắt buộc)
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
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số lượng</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="Nhập số lượng" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Số lượng vàng bạn đã mua (gam, chỉ, lượng,...)
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
                                        <FormLabel>Đơn vị</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn đơn vị" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="gram">Gram</SelectItem>
                                                <SelectItem value="chỉ">Chỉ (3.75g)</SelectItem>
                                                <SelectItem value="lượng">Lượng (37.5g)</SelectItem>
                                                <SelectItem value="cây">Cây (37.5g)</SelectItem>
                                                <SelectItem value="phân">Phân (0.375g)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Đơn vị khối lượng vàng
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="currentPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giá mua (đồng/đơn vị)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1000" placeholder="Nhập giá mua" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Giá vàng khi bạn mua (VND)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phí giao dịch</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1000" placeholder="Nhập phí giao dịch" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Phí mua vàng (nếu có)
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
                                        <FormLabel>Ngày mua</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Ngày bạn mua vàng
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
                                        <FormLabel>Ghi chú</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Thêm ghi chú về khoản đầu tư vàng này"
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Thông tin bổ sung về khoản đầu tư vàng của bạn
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end items-center mt-6">
                            <Button type="submit" disabled={isLoading} className="bg-amber-500 hover:bg-amber-600">
                                {isLoading ? 'Đang xử lý...' : 'Thêm khoản đầu tư vàng'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}
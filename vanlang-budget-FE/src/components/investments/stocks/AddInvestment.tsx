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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toaster';
import { format } from 'date-fns';
import { StockAutoComplete } from './StockAutoComplete';

// Form schema using zod
const formSchema = z.object({
    type: z.enum(['stock', 'gold', 'crypto'], {
        required_error: "Vui lòng chọn loại đầu tư",
    }),
    assetName: z.string().min(2, {
        message: "Tên tài sản phải có ít nhất 2 ký tự",
    }),
    symbol: z.string().min(1, {
        message: "Vui lòng nhập mã ký hiệu",
    }),
    price: z.coerce.number().positive({
        message: "Giá phải lớn hơn 0",
    }),
    quantity: z.coerce.number().positive({
        message: "Số lượng phải lớn hơn 0",
    }),
    purchaseDate: z.string().min(1, {
        message: "Vui lòng chọn ngày",
    }),
    fee: z.coerce.number().min(0, {
        message: "Phí không được âm",
    }).optional(),
    broker: z.string().optional(),
    notes: z.string().max(500, {
        message: "Ghi chú không được quá 500 ký tự",
    }).optional(),
    industry: z.string().optional(),
});

interface AddInvestmentProps {
    onSuccess: () => void;
}

export default function AddInvestment({ onSuccess }: AddInvestmentProps) {
    const t = useTranslations('Investments');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('stock');

    // Initialize form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'stock',
            assetName: '',
            symbol: '',
            price: 0,
            quantity: 0,
            purchaseDate: format(new Date(), 'yyyy-MM-dd'),
            fee: 0,
            broker: '',
            notes: '',
            industry: '',
        },
    });

    // Handle form submission
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            const payload = {
                ...values,
                purchaseDate: values.purchaseDate,
            };

            const response = await fetch('/api/investments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Không thể thêm đầu tư');
            }

            toast.success(
                "Thêm đầu tư thành công",
                "Đầu tư của bạn đã được thêm vào danh mục"
            );

            // Reset form
            form.reset({
                type: 'stock',
                assetName: '',
                symbol: '',
                price: 0,
                quantity: 0,
                purchaseDate: format(new Date(), 'yyyy-MM-dd'),
                fee: 0,
                broker: '',
                notes: '',
                industry: '',
            });

            // Call success callback
            onSuccess();
        } catch (error) {
            console.error('Error adding investment:', error);
            toast.error(
                "Lỗi",
                "Không thể thêm đầu tư. Vui lòng thử lại sau."
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Listen for type changes to update UI or fields
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'type') {
                setSelectedType(value.type as string);
            }
        });
        return () => subscription.unsubscribe();
    }, [form.watch]);

    // Handle selection from StockAutocomplete
    const handleStockSelect = (symbol: string) => {
        // Cập nhật giá trị mã cổ phiếu vào form
        form.setValue('symbol', symbol);

        // Ở đây có thể thêm logic để tự động điền thêm thông tin của cổ phiếu
        // ví dụ: gọi API để lấy tên công ty và cập nhật vào assetName
        fetchStockInfo(symbol);
    };

    // Lấy thông tin cổ phiếu từ API
    const fetchStockInfo = async (symbol: string) => {
        try {
            // Giả lập gọi API - trong thực tế sẽ thay bằng API thực
            // const response = await fetch(`/api/stocks/${symbol}`);
            // const data = await response.json();

            // Giả lập dữ liệu
            const stockInfo = {
                name: symbol === 'VCB' ? 'Vietcombank' :
                    symbol === 'FPT' ? 'FPT Corporation' :
                        symbol === 'VNM' ? 'Vinamilk' :
                            `${symbol} Corp`,
                currentPrice: Math.floor(Math.random() * 100000) + 10000,
                industry: symbol === 'VCB' ? 'Ngân hàng' :
                    symbol === 'FPT' ? 'Công nghệ' :
                        symbol === 'VNM' ? 'Hàng tiêu dùng' :
                            'Khác'
            };

            form.setValue('assetName', stockInfo.name);
            form.setValue('price', stockInfo.currentPrice);
            form.setValue('industry', stockInfo.industry);
        } catch (error) {
            console.error('Error fetching stock info:', error);
        }
    };

    // Render form fields based on investment type
    const renderTypeSpecificFields = () => {
        switch (selectedType) {
            case 'stock':
                return (
                    <>
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mã cổ phiếu</FormLabel>
                                    <StockAutoComplete
                                        onStockSelect={handleStockSelect}
                                        defaultValue={field.value}
                                    />
                                    <FormDescription>
                                        Mã cổ phiếu trên sàn chứng khoán (VD: VCB, FPT)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="broker"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Công ty chứng khoán</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn công ty chứng khoán" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="SSI">SSI</SelectItem>
                                            <SelectItem value="VPS">VPS</SelectItem>
                                            <SelectItem value="VCBS">VCBS</SelectItem>
                                            <SelectItem value="VNDS">VNDS</SelectItem>
                                            <SelectItem value="MBS">MBS</SelectItem>
                                            <SelectItem value="other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="industry"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngành</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn ngành" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Ngân hàng">Ngân hàng</SelectItem>
                                            <SelectItem value="Chứng khoán">Chứng khoán</SelectItem>
                                            <SelectItem value="Bất động sản">Bất động sản</SelectItem>
                                            <SelectItem value="Công nghệ">Công nghệ</SelectItem>
                                            <SelectItem value="Hàng tiêu dùng">Hàng tiêu dùng</SelectItem>
                                            <SelectItem value="Năng lượng">Năng lượng</SelectItem>
                                            <SelectItem value="Khác">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                );
            case 'gold':
                return (
                    <FormField
                        control={form.control}
                        name="symbol"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Loại vàng</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn loại vàng" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="SJC">Vàng SJC</SelectItem>
                                        <SelectItem value="DOJI">Vàng DOJI</SelectItem>
                                        <SelectItem value="PNJ">Vàng PNJ</SelectItem>
                                        <SelectItem value="999.9">Vàng 999.9</SelectItem>
                                        <SelectItem value="other">Khác</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case 'crypto':
                return (
                    <>
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mã tiền điện tử</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn loại tiền điện tử" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                                            <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                                            <SelectItem value="SOL">Solana (SOL)</SelectItem>
                                            <SelectItem value="USDT">Tether (USDT)</SelectItem>
                                            <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                                            <SelectItem value="other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="broker"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sàn giao dịch</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn sàn giao dịch" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Binance">Binance</SelectItem>
                                            <SelectItem value="Coinbase">Coinbase</SelectItem>
                                            <SelectItem value="OKX">OKX</SelectItem>
                                            <SelectItem value="Bybit">Bybit</SelectItem>
                                            <SelectItem value="Kraken">Kraken</SelectItem>
                                            <SelectItem value="other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('addInvestment')}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('investmentType')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                    <FormDescription>
                                        {t('selectInvestmentType')}
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
                                    <FormLabel>{t('assetName')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('enterAssetName')} {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        {t('fullNameDescription')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {renderTypeSpecificFields()}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('price')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('pricePerUnit')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('quantity')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('quantityDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="purchaseDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('purchaseDate')}</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
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
                                        <FormLabel>{t('fee')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                value={field.value === undefined ? '' : field.value}
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                    field.onChange(value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('feeDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('notes')}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('notesPlaceholder')}
                                            {...field}
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? t('adding') : t('addInvestment')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
} 
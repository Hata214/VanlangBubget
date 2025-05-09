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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { ExternalLink, Search, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import Link from 'next/link';

interface AddCryptoInvestmentProps {
    onSuccess: () => void;
}

export default function AddCryptoInvestment({ onSuccess }: AddCryptoInvestmentProps) {
    const t = useTranslations('Investments');
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [cryptoData, setCryptoData] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [topCryptos, setTopCryptos] = useState<any[]>([]);

    // API URL for fetch requests
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Đảm bảo URL kết thúc với /api để phù hợp với cấu hình API server
    const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

    // Định nghĩa schema xác thực cho tiền điện tử
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
        network: z.string().optional(),
        exchange: z.string().optional(),
        wallet: z.string().optional(),
    });

    // Khởi tạo form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            assetName: '',
            symbol: '',
            currentPrice: 0,
            quantity: 0,
            fee: 0,
            notes: '',
            purchaseDate: new Date().toISOString().slice(0, 10),
            network: '',
            exchange: '',
            wallet: '',
        },
    });

    // Hàm tải dữ liệu top crypto
    const loadTopCryptos = async () => {
        try {
            // Trong môi trường thực tế, đây sẽ là API call
            // const response = await fetch(`${API_URL}/crypto/top`);
            // const data = await response.json();

            // Dữ liệu mẫu
            const mockData = [
                { name: 'Bitcoin', symbol: 'BTC', price_usd: 45678.52, change_24h: 2.34 },
                { name: 'Ethereum', symbol: 'ETH', price_usd: 2543.18, change_24h: 1.56 },
                { name: 'Binance Coin', symbol: 'BNB', price_usd: 321.45, change_24h: -0.72 },
                { name: 'Solana', symbol: 'SOL', price_usd: 102.78, change_24h: 5.23 },
                { name: 'XRP', symbol: 'XRP', price_usd: 0.52, change_24h: -1.89 }
            ];
            setTopCryptos(mockData);
        } catch (error) {
            console.error('Lỗi khi tải thông tin crypto:', error);
        }
    };

    // Hàm tìm kiếm thông tin một loại tiền điện tử
    const searchCrypto = async (symbol: string) => {
        if (!symbol || symbol.length < 2) return;

        setIsSearching(true);
        try {
            // Trong môi trường thực tế, đây sẽ là API call
            // const response = await fetch(`${API_URL}/crypto/price/${symbol}`);
            // const data = await response.json();

            // Giả lập dữ liệu
            setTimeout(() => {
                const mockData = {
                    name: symbol.length <= 3 ? symbol.toUpperCase() : symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase(),
                    symbol: symbol.toUpperCase(),
                    price_usd: Math.random() * (symbol.toUpperCase() === 'BTC' ? 50000 : 5000),
                    change_24h: (Math.random() * 10) - 5,
                    market_cap: Math.random() * 1000000000000,
                    volume_24h: Math.random() * 50000000000,
                    circulating_supply: Math.random() * 1000000000
                };
                setCryptoData(mockData);
                setIsSearching(false);

                // Cập nhật giá vào form
                form.setValue('currentPrice', mockData.price_usd);
                form.setValue('assetName', mockData.name);
            }, 500);
        } catch (error) {
            console.error('Lỗi khi tìm kiếm crypto:', error);
            setIsSearching(false);
        }
    };

    // Tải dữ liệu top crypto khi component mount
    useEffect(() => {
        loadTopCryptos();
    }, []);

    // Theo dõi sự thay đổi của mã tiền điện tử
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'symbol' && value.symbol && value.symbol.length >= 2) {
                searchCrypto(value.symbol);
            }
        });
        return () => subscription.unsubscribe();
    }, [form.watch]);

    // Giúp chọn một crypto từ danh sách top crypto
    const selectCrypto = (crypto: any) => {
        form.setValue('assetName', crypto.name);
        form.setValue('symbol', crypto.symbol);
        form.setValue('currentPrice', crypto.price_usd);
        setCryptoData(crypto);
    };

    // Xử lý submit form
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            // Chuẩn bị dữ liệu
            const investmentData = {
                type: 'crypto',
                assetName: values.assetName,
                symbol: values.symbol,
                currentPrice: values.currentPrice,
                quantity: values.quantity,
                totalValue: values.currentPrice * values.quantity,
                purchaseDate: new Date(values.purchaseDate).toISOString(),
                fee: values.fee || 0,
                notes: values.notes || null,
                network: values.network || null,
                exchange: values.exchange || null,
                wallet: values.wallet || null,
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
                    description: `${t('addSuccessDescription')} - ${values.assetName} (${values.symbol})`,
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-purple-100 bg-purple-50/30">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl text-purple-800">Thông tin tiền điện tử</CardTitle>
                            <Link href="/investments/crypto" passHref>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Xem thị trường Crypto
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="assetName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            Tên tiền điện tử
                                            <HelpTooltip text="Tên đầy đủ của tiền điện tử" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ví dụ: Bitcoin"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>Tên đầy đủ của đồng tiền điện tử</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="symbol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            Mã ký hiệu
                                            <HelpTooltip text="Mã ký hiệu của tiền điện tử" />
                                        </FormLabel>
                                        <div className="flex items-center space-x-2">
                                            <FormControl>
                                                <Input
                                                    placeholder="Ví dụ: BTC"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={isLoading || isSearching || !field.value || field.value.length < 2}
                                                onClick={() => searchCrypto(field.value)}
                                            >
                                                {isSearching ? (
                                                    <span className="animate-spin">
                                                        <RefreshCw className="h-4 w-4" />
                                                    </span>
                                                ) : (
                                                    <Search className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <FormDescription>Mã giao dịch trên sàn (BTC, ETH, BNB...)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {cryptoData && (
                            <div className="mt-4 p-3 bg-white rounded-md border border-purple-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-purple-800">
                                        {cryptoData.name} ({cryptoData.symbol})
                                    </h4>
                                    <Link href={`/investments/crypto?symbol=${cryptoData.symbol}`} passHref>
                                        <Button variant="ghost" size="sm" className="flex items-center text-sm text-purple-600">
                                            Phân tích thêm <ExternalLink className="h-3 w-3 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Giá hiện tại (USD)</span>
                                        <span className="font-medium">{cryptoData.price_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Thay đổi 24h</span>
                                        <span className={cryptoData.change_24h >= 0 ? "text-green-600 font-medium flex items-center" : "text-red-600 font-medium flex items-center"}>
                                            {cryptoData.change_24h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                            {cryptoData.change_24h.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Vốn hóa</span>
                                        <span className="font-medium">{(cryptoData.market_cap / 1000000000).toFixed(2)}B</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Volume 24h</span>
                                        <span className="font-medium">{(cryptoData.volume_24h / 1000000000).toFixed(2)}B</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!cryptoData && topCryptos.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2 text-purple-800">Top tiền điện tử - Nhấp để chọn</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {topCryptos.map((crypto, index) => (
                                        <div
                                            key={index}
                                            className="p-2 border border-purple-100 rounded-md hover:bg-purple-50 cursor-pointer flex justify-between items-center"
                                            onClick={() => selectCrypto(crypto)}
                                        >
                                            <div>
                                                <div className="font-medium">{crypto.name}</div>
                                                <div className="text-xs text-gray-500">{crypto.symbol}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{crypto.price_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                                <div className={crypto.change_24h >= 0 ? "text-xs text-green-600" : "text-xs text-red-600"}>
                                                    {crypto.change_24h >= 0 ? '+' : ''}{crypto.change_24h.toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                                                    <SelectValue placeholder="Chọn mạng lưới blockchain" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                                                <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                                                <SelectItem value="binance">Binance Smart Chain (BSC)</SelectItem>
                                                <SelectItem value="solana">Solana (SOL)</SelectItem>
                                                <SelectItem value="polygon">Polygon (MATIC)</SelectItem>
                                                <SelectItem value="avalanche">Avalanche (AVAX)</SelectItem>
                                                <SelectItem value="tron">Tron (TRX)</SelectItem>
                                                <SelectItem value="cardano">Cardano (ADA)</SelectItem>
                                                <SelectItem value="other">Khác</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>Mạng lưới blockchain của đồng tiền</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="exchange"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sàn giao dịch</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn sàn giao dịch" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="binance">Binance</SelectItem>
                                                <SelectItem value="coinbase">Coinbase</SelectItem>
                                                <SelectItem value="ftx">FTX</SelectItem>
                                                <SelectItem value="kraken">Kraken</SelectItem>
                                                <SelectItem value="kucoin">KuCoin</SelectItem>
                                                <SelectItem value="okx">OKX</SelectItem>
                                                <SelectItem value="bybit">Bybit</SelectItem>
                                                <SelectItem value="mexc">MEXC</SelectItem>
                                                <SelectItem value="gateio">Gate.io</SelectItem>
                                                <SelectItem value="other">Khác</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>Sàn giao dịch nơi bạn mua tiền điện tử</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <FormField
                                control={form.control}
                                name="currentPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            Giá mua (USD)
                                            <HelpTooltip text="Giá mua bằng USD của 1 đơn vị tiền điện tử" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>Giá mua theo USD</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            Số lượng
                                            <HelpTooltip text="Số lượng tiền điện tử đã mua" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>Số lượng tiền điện tử</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="wallet"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            Ví lưu trữ
                                            <HelpTooltip text="Địa chỉ ví lưu trữ tiền điện tử" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ví dụ: MetaMask, Ledger..."
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>Ví lưu trữ tiền điện tử của bạn</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="mt-4 flex justify-end">
                            <Link href="/investments/crypto" passHref>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-sm text-purple-600 border-purple-200 hover:bg-purple-50"
                                >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Xem thêm thông tin Crypto
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-100 bg-green-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-green-800">Thông tin giao dịch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="fee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center">
                                            Phí giao dịch (USD)
                                            <HelpTooltip text="Phí giao dịch khi mua tiền điện tử" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>Phí giao dịch, gas fee, v.v.</FormDescription>
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
                                            Ngày mua
                                            <HelpTooltip text="Ngày mua tiền điện tử" />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>Ngày thực hiện giao dịch mua</FormDescription>
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
                                            Ghi chú
                                            <HelpTooltip text="Ghi chú thêm về khoản đầu tư tiền điện tử" />
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Nhập ghi chú về khoản đầu tư này..."
                                                {...field}
                                                disabled={isLoading}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormDescription>Thông tin bổ sung về khoản đầu tư</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Đang thêm..." : "Thêm đầu tư tiền điện tử"}
                </Button>
            </form>
        </Form>
    );
} 
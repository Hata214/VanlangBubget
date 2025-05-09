'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { io } from 'socket.io-client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { getLatestCryptoPrices, getCryptoPriceHistory, addCryptoInvestment } from '@/services/cryptoService';

// Đăng ký các thành phần cho Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Định nghĩa kiểu dữ liệu cho tiền điện tử
interface CryptoData {
    symbol: string;
    name: string;
    usd: number;
    usdChange24h: number;
}

// Định nghĩa kiểu dữ liệu cho lịch sử giá
interface PriceHistory {
    timestamp: string;
    usd: number;
}

// Mock data cho tiền điện tử
const mockCryptoData: CryptoData[] = [
    { symbol: 'BTC', name: 'Bitcoin', usd: 62345.78, usdChange24h: 2.34 },
    { symbol: 'ETH', name: 'Ethereum', usd: 3421.56, usdChange24h: -1.23 },
    { symbol: 'BNB', name: 'Binance Coin', usd: 567.89, usdChange24h: 0.45 },
    { symbol: 'XRP', name: 'XRP', usd: 0.5678, usdChange24h: -0.23 },
    { symbol: 'ADA', name: 'Cardano', usd: 0.4567, usdChange24h: 1.23 },
    { symbol: 'SOL', name: 'Solana', usd: 123.45, usdChange24h: 3.45 },
];

// Mock data cho lịch sử giá
const generateMockPriceHistory = (symbol: string, days = 7): PriceHistory[] => {
    const basePrice = mockCryptoData.find(c => c.symbol === symbol)?.usd || 1000;
    const history: PriceHistory[] = [];

    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Tạo biến động giá ngẫu nhiên trong khoảng ±5%
        const randomChange = (Math.random() * 10 - 5) / 100;
        const price = basePrice * (1 + randomChange * (days - i) / days);

        history.push({
            timestamp: date.toISOString(),
            usd: price
        });
    }

    return history;
};

export default function CryptoInvestmentsPage() {
    const t = useTranslations('Investments');
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();

    const [cryptoPrices, setCryptoPrices] = useState<CryptoData[]>(mockCryptoData);
    const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');
    const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Cập nhật useEffect để dùng API thật khi có thể
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const apiData = await getLatestCryptoPrices().catch(() => null);

                // Dùng dữ liệu API nếu có, nếu không dùng mock data
                if (apiData && apiData.length > 0) {
                    setCryptoPrices(apiData);
                }
            } catch (error) {
                console.error('Không thể lấy dữ liệu từ API, dùng mock data:', error);
            }
        };

        fetchPrices();

        // Cập nhật dữ liệu mỗi 1 phút
        const interval = setInterval(fetchPrices, 60000);
        return () => clearInterval(interval);
    }, []);

    // Cập nhật useEffect lấy lịch sử giá
    useEffect(() => {
        setLoading(true);

        const fetchPriceHistory = async () => {
            try {
                const apiHistory = await getCryptoPriceHistory(selectedCrypto, 30).catch(() => null);

                // Dùng dữ liệu API nếu có, nếu không dùng mock data
                if (apiHistory && apiHistory.length > 0) {
                    setPriceHistory(apiHistory);
                } else {
                    // Dùng dữ liệu giả lập nếu không có API
                    const mockHistory = generateMockPriceHistory(selectedCrypto, 30);
                    setPriceHistory(mockHistory);
                }
            } catch (error) {
                console.error('Không thể lấy lịch sử giá từ API, dùng mock data:', error);
                const mockHistory = generateMockPriceHistory(selectedCrypto, 30);
                setPriceHistory(mockHistory);
            } finally {
                setLoading(false);
            }
        };

        fetchPriceHistory();
    }, [selectedCrypto]);

    // Dữ liệu biểu đồ
    const chartData = {
        labels: priceHistory.map(item => new Date(item.timestamp).toLocaleDateString()),
        datasets: [
            {
                label: `${selectedCrypto} (USD)`,
                data: priceHistory.map(item => item.usd),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: `${t('priceHistory')} - ${selectedCrypto}`,
            },
        },
        scales: {
            y: {
                ticks: {
                    callback: function (value: any, index: number, ticks: any[]): string {
                        return '$' + value.toLocaleString();
                    }
                }
            }
        }
    };

    // Cập nhật hàm thêm khoản đầu tư
    const handleAddInvestment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;

        try {
            // Lấy dữ liệu từ form
            const formElements = form.elements as HTMLFormControlsCollection;
            const quantityInput = formElements.namedItem('quantity') as HTMLInputElement;
            const priceInput = formElements.namedItem('price') as HTMLInputElement;
            const dateInput = formElements.namedItem('date') as HTMLInputElement;
            const feeInput = formElements.namedItem('fee') as HTMLInputElement;
            const transactionTypeInput = formElements.namedItem('transactionType') as HTMLSelectElement;
            const notesInput = formElements.namedItem('notes') as HTMLTextAreaElement;

            const data = {
                type: 'crypto',
                symbol: selectedCrypto,
                assetName: cryptoPrices.find(c => c.symbol === selectedCrypto)?.name || selectedCrypto,
                quantity: parseFloat(quantityInput.value),
                purchasePrice: parseFloat(priceInput.value),
                currentPrice: cryptoPrices.find(c => c.symbol === selectedCrypto)?.usd || 0,
                transactions: [{
                    type: transactionTypeInput.value,
                    price: parseFloat(priceInput.value),
                    quantity: parseFloat(quantityInput.value),
                    fee: parseFloat(feeInput.value || '0'),
                    date: new Date(dateInput.value),
                    notes: notesInput.value
                }],
                notes: notesInput.value
            };

            // Gọi API để thêm khoản đầu tư
            try {
                await addCryptoInvestment(data);
                toast({
                    type: 'success',
                    title: t('addSuccess'),
                    description: t('addSuccessDescription'),
                });

                // Reset form
                form.reset();
            } catch (error) {
                console.error('Lỗi khi thêm khoản đầu tư:', error);
                toast({
                    type: 'error',
                    title: t('addError'),
                    description: t('addErrorDescription'),
                });
            }
        } catch (error) {
            console.error('Lỗi khi xử lý form:', error);
            toast({
                type: 'error',
                title: t('addError'),
                description: t('addErrorDescription'),
            });
        }
    };

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">{t('title')} - Crypto</h1>
                    <p className="text-muted-foreground">Theo dõi và đầu tư vào tiền điện tử</p>
                </div>

                {/* Thẻ giá tiền điện tử */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {cryptoPrices.map((crypto) => (
                        <Card
                            key={crypto.symbol}
                            className={`cursor-pointer transition-all hover:shadow-md ${selectedCrypto === crypto.symbol ? 'ring-2 ring-primary' : ''
                                }`}
                            onClick={() => setSelectedCrypto(crypto.symbol)}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        {crypto.symbol.charAt(0)}
                                    </div>
                                    <span>{crypto.name}</span>
                                    <span className="text-gray-500 text-sm">({crypto.symbol})</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${crypto.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <div className={`text-sm flex items-center ${crypto.usdChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                    {crypto.usdChange24h >= 0 ? (
                                        <TrendingUp className="h-4 w-4 mr-1" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 mr-1" />
                                    )}
                                    {Math.abs(crypto.usdChange24h).toFixed(2)}% (24h)
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList className="mb-4">
                        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                        <TabsTrigger value="invest">Đầu tư</TabsTrigger>
                        <TabsTrigger value="history">Lịch sử</TabsTrigger>
                    </TabsList>

                    {/* Tab Tổng quan */}
                    <TabsContent value="overview">
                        <Card>
                            <CardHeader>
                                <CardTitle>{selectedCrypto} - {cryptoPrices.find(c => c.symbol === selectedCrypto)?.name}</CardTitle>
                                <CardDescription>Biểu đồ giá 30 ngày gần đây</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center items-center h-80">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="ml-2">{t('loading')}</span>
                                    </div>
                                ) : (
                                    <div className="h-80">
                                        <Line data={chartData} options={chartOptions} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Đầu tư */}
                    <TabsContent value="invest">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('addInvestment')}</CardTitle>
                                <CardDescription>Thêm khoản đầu tư {selectedCrypto} vào danh mục của bạn</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4" onSubmit={handleAddInvestment}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                {t('type')}
                                            </label>
                                            <select className="w-full p-2 border rounded" disabled>
                                                <option value="crypto">Tiền điện tử ({selectedCrypto})</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                {t('quantity')}
                                            </label>
                                            <input
                                                name="quantity"
                                                type="number"
                                                step="0.0001"
                                                className="w-full p-2 border rounded"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                {t('price')}
                                            </label>
                                            <input
                                                name="price"
                                                type="number"
                                                step="0.01"
                                                className="w-full p-2 border rounded"
                                                placeholder={cryptoPrices.find(c => c.symbol === selectedCrypto)?.usd.toString()}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                {t('purchaseDate')}
                                            </label>
                                            <input
                                                name="date"
                                                type="date"
                                                className="w-full p-2 border rounded"
                                                defaultValue={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                {t('fee')}
                                            </label>
                                            <input
                                                name="fee"
                                                type="number"
                                                step="0.01"
                                                className="w-full p-2 border rounded"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                {t('transactionType')}
                                            </label>
                                            <select
                                                name="transactionType"
                                                className="w-full p-2 border rounded"
                                            >
                                                <option value="buy">{t('buy')}</option>
                                                <option value="sell">{t('sell')}</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">
                                                {t('notes')}
                                            </label>
                                            <textarea
                                                name="notes"
                                                className="w-full p-2 border rounded"
                                                rows={3}
                                                placeholder={t('notesPlaceholder')}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full">
                                        {t('addInvestment')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Lịch sử */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lịch sử giao dịch</CardTitle>
                                <CardDescription>Các giao dịch {selectedCrypto} của bạn</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-10">
                                    <p className="text-lg font-medium text-gray-500 mb-4">Chưa có giao dịch nào</p>
                                    <Button onClick={() => setActiveTab('invest')}>
                                        Thêm giao dịch đầu tiên
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
} 
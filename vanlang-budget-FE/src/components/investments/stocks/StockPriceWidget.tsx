'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { StockAutoComplete } from './StockAutoComplete';
import { formatCurrency } from '@/utils/formatters';
import { createInvestment } from '@/services/investmentService';
import { useToast } from '@/components/ToastProvider';
import axios from 'axios';

interface StockPriceWidgetProps {
    onAddInvestment?: () => void;
    defaultSymbol?: string;
    showAddButton?: boolean;
}

// Interface cho dữ liệu cổ phiếu
interface StockData {
    symbol: string;
    price: number;
    change?: number;
    percentChange?: number;
    lastUpdated?: Date;
    name: string;
    industry: string;
}

export function StockPriceWidget({ onAddInvestment, defaultSymbol = 'VNM', showAddButton = true }: StockPriceWidgetProps) {
    const [symbol, setSymbol] = useState<string>(defaultSymbol);
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchStockPrice = useCallback(async () => {
        if (!symbol) return;

        setIsLoading(true);
        setError(null);
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'https://my-app-flashapi.onrender.com';
            const response = await axios.get(`${API_BASE_URL}/api/price?symbol=${symbol}&source=TCBS`);

            if (response.data && response.data.price !== undefined && response.data.price !== null) {
                // Xử lý giá trị: nếu giá > 1000 thì có thể là đơn vị đồng, chia cho 1000 để hiển thị theo nghìn đồng
                let newPrice = response.data.price;
                if (newPrice > 1000) {
                    // Nếu giá > 1000, giả định là đơn vị đồng và chuyển sang nghìn đồng
                    newPrice = newPrice / 1000;
                }

                const oldPrice = stockData?.price || newPrice;
                const priceChange = newPrice - oldPrice;
                const percentChange = oldPrice ? (priceChange / oldPrice) * 100 : 0;

                setStockData({
                    symbol: symbol,
                    price: newPrice,
                    change: priceChange,
                    percentChange: percentChange,
                    lastUpdated: new Date(),
                    name: response.data.name || symbol,
                    industry: response.data.industry || ''
                });
            } else {
                setError('Không thể lấy giá cổ phiếu');
            }
        } catch (error) {
            console.error('Lỗi khi lấy giá cổ phiếu:', error);
            setError('Lỗi khi lấy giá cổ phiếu');
        } finally {
            setIsLoading(false);
        }
    }, [symbol, stockData?.price]);

    useEffect(() => {
        if (symbol) {
            fetchStockPrice();

            // Cập nhật giá mỗi 30 giây
            const intervalId = setInterval(fetchStockPrice, 30000);
            return () => clearInterval(intervalId);
        }
    }, [fetchStockPrice, symbol]);

    const handleSelectStock = (value: string) => {
        setSymbol(value);
    };

    const handleRefresh = () => {
        fetchStockPrice();
    };

    const handleAddInvestment = () => {
        if (onAddInvestment) {
            onAddInvestment();
        }
    };

    // Định dạng số tiền
    const formatPrice = (price: number | undefined) => {
        if (price === undefined) return '-';
        return formatCurrency(price);
    };

    // Định dạng phần trăm thay đổi
    const formatPercentChange = (percentChange: number | undefined) => {
        if (percentChange === undefined) return '-';
        const sign = percentChange >= 0 ? '+' : '';
        return `${sign}${percentChange.toFixed(2)}%`;
    };

    // Xác định màu sắc dựa trên biến động giá
    const getPriceChangeColor = (change: number | undefined) => {
        if (change === undefined) return '';
        return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : '';
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Giá cổ phiếu
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleRefresh}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <StockAutoComplete
                            onStockSelect={handleSelectStock}
                            defaultValue={symbol}
                            isLoading={isLoading}
                        />
                    </div>

                    {error ? (
                        <div className="text-center text-sm text-red-500">
                            {error}
                        </div>
                    ) : stockData ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Giá hiện tại:</span>
                                <span className="text-2xl font-bold">{formatPrice(stockData.price)}</span>
                            </div>

                            {stockData.change !== undefined && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Thay đổi:</span>
                                    <div className={`flex items-center ${getPriceChangeColor(stockData.change)}`}>
                                        {stockData.change > 0 ? (
                                            <TrendingUp className="h-4 w-4 mr-1" />
                                        ) : stockData.change < 0 ? (
                                            <TrendingDown className="h-4 w-4 mr-1" />
                                        ) : null}
                                        <span className="font-medium">{formatPrice(stockData.change)} ({formatPercentChange(stockData.percentChange)})</span>
                                    </div>
                                </div>
                            )}

                            {stockData.name && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Tên:</span>
                                    <span className="text-sm font-medium">{stockData.name}</span>
                                </div>
                            )}

                            {stockData.industry && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Ngành:</span>
                                    <span className="text-sm">{stockData.industry}</span>
                                </div>
                            )}

                            {stockData.lastUpdated && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Cập nhật:</span>
                                    <span className="text-sm">{stockData.lastUpdated.toLocaleTimeString()}</span>
                                </div>
                            )}

                            {showAddButton && (
                                <Button
                                    className="w-full mt-2"
                                    onClick={handleAddInvestment}
                                    disabled={isLoading}
                                >
                                    Thêm đầu tư
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <div className="text-sm text-muted-foreground">
                                {isLoading ? 'Đang tải...' : 'Chọn mã cổ phiếu để xem giá'}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

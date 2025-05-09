'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { StockPriceResponse } from '@/services/stockApiService';
import { StockAutoComplete } from './StockAutoComplete';
import { createInvestment } from '@/services/investmentService';
import { useToast } from '@/components/ToastProvider';

interface StockPriceWidgetProps {
    defaultSymbol?: string;
}

export function StockPriceWidget({ defaultSymbol = 'VNM' }: StockPriceWidgetProps) {
    const [symbol, setSymbol] = useState<string>(defaultSymbol);
    const [stockData, setStockData] = useState<StockPriceResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastPrice, setLastPrice] = useState<number | null>(null);
    const { toast } = useToast();

    const API_BASE_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'http://localhost:8000';

    const fetchStockPrice = async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log(`Đang kết nối đến ${API_BASE_URL}/api/price?symbol=${symbol}`);
            const response = await fetch(`${API_BASE_URL}/api/price?symbol=${symbol}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Dữ liệu nhận được:', data);

            if (data.error) {
                setError(data.error);
                setStockData(null);
            } else {
                setLastPrice(stockData?.price || null);
                setStockData(data);
            }
        } catch (err) {
            console.error('Lỗi khi gọi API:', err);
            setError('Không thể kết nối đến máy chủ API.');
            setStockData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStockPrice();

        // Thiết lập interval để cập nhật giá mỗi 30 giây
        const intervalId = setInterval(fetchStockPrice, 30000);

        return () => clearInterval(intervalId);
    }, [symbol]);

    const handleSelectStock = (value: string) => {
        setSymbol(value);
    };

    const getPriceChangeIndicator = () => {
        if (!lastPrice || !stockData?.price) return null;

        if (stockData.price > lastPrice) {
            return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
        } else if (stockData.price < lastPrice) {
            return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col space-y-4">
                {/* Form tìm kiếm cổ phiếu */}
                <Card className="border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Tra cứu cổ phiếu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="pb-2">
                            <StockAutoComplete
                                onStockSelect={handleSelectStock}
                                defaultValue={symbol}
                                isLoading={isLoading}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Hiển thị thông tin cổ phiếu khi đã chọn */}
                {stockData && (
                    <Card className="border-blue-100">
                        <CardHeader className="pb-2 flex flex-row justify-between items-center">
                            <CardTitle className="text-xl">Thông tin cổ phiếu</CardTitle>
                            {/* Removed "Thêm đầu tư" button */}
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Mã CP</p>
                                    <p className="text-xl font-bold">{stockData.symbol}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Giá</p>
                                    <p className="text-xl font-bold">{stockData.price?.toLocaleString('vi-VN')} đ</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Removed Form đầu tư cổ phiếu */}
            </div>
        </div>
    );
}

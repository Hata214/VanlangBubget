'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { StockPortfolioDashboard } from '@/components/investments/stocks/StockPortfolioDashboard';
import { MarketStockTable, MarketStockItem } from '@/components/investments/stocks/MarketStockTable'; // Import the new component and interface
import { StockPriceChart } from '@/components/investments/stocks/StockPriceChart'; // Import the new chart component
import { TrendingUp, ListFilter, ChevronLeft, Loader2, RefreshCw } from 'lucide-react'; // Import Loader2 and RefreshCw
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react'; // Import useMemo
import axios from 'axios';
import { toast } from '@/components/ui/Toaster';
import { StockAutoComplete } from '@/components/investments/stocks/StockAutoComplete'; // Import StockAutoComplete
import { formatCurrency } from '@/utils/formatters'; // Import formatCurrency
import { getRealtimeStocks, getAllStocks, getStockHistory } from '@/services/stockApiService'; // Import new services

export default function StocksMarketPage() {
    const t = useTranslations('StockMarketPage');
    const common_t = useTranslations('common'); // For common translations
    const investments_t = useTranslations('Investments'); // For general investment translations if needed
    const [allStocks, setAllStocks] = useState<MarketStockItem[]>([]); // Specify type
    const [loadingAllStocks, setLoadingAllStocks] = useState(true);
    const [errorAllStocks, setErrorAllStocks] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<keyof MarketStockItem | null>('symbol'); // State for sorting column
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // State for sorting direction
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // Thời gian cập nhật cuối cùng

    // State for chart data
    const [chartStockSymbol, setChartStockSymbol] = useState<string>('VNM'); // Default symbol for chart
    const [chartStockData, setChartStockData] = useState<{ price: number | null } | null>(null); // Data for chart (current price)
    const [loadingChartStock, setLoadingChartStock] = useState(false);
    const [errorChartStock, setErrorChartStock] = useState<string | null>(null);
    const [historicalData, setHistoricalData] = useState<any[]>([]); // State for historical data

    // Danh sách mã cổ phiếu mặc định để hiển thị
    const defaultStocks = "VNM,VCB,HPG,FPT,MWG,VIC,MSN,TCB,BID,CTG,VHM,GAS,PLX,PNJ,REE,VJC,SAB,NLG,HDB,ACB";

    console.log('STOCK_API_URL CHECK - Value from Vercel env:', process.env.NEXT_PUBLIC_STOCK_API_URL);
    const API_BASE_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'http://localhost:8000';
    console.log('STOCK_API_URL CHECK - API_BASE_URL being used:', API_BASE_URL);

    useEffect(() => {
        fetchAllStocks();
    }, []);

    // Fetch all stocks for the list using realtime API
    const fetchAllStocks = async () => {
        setLoadingAllStocks(true);
        setErrorAllStocks(null);
        try {
            // Lấy danh sách cổ phiếu từ API realtime
            const realtimeData = await getRealtimeStocks(defaultStocks);

            if (realtimeData && realtimeData.data && realtimeData.data.length > 0) {
                // Lấy thông tin tên và ngành từ API danh sách cổ phiếu
                const stocksListData = await getAllStocks();
                const stocksInfo = stocksListData.stocks.reduce((acc: Record<string, { name: string; industry: string }>, stock) => {
                    acc[stock.symbol] = { name: stock.name, industry: stock.industry };
                    return acc;
                }, {});

                // Kết hợp dữ liệu từ cả hai API
                const formattedStocks: MarketStockItem[] = realtimeData.data.map((stock) => ({
                    symbol: stock.symbol,
                    name: stocksInfo[stock.symbol]?.name || stock.symbol,
                    industry: stocksInfo[stock.symbol]?.industry || 'Chưa phân loại',
                    price: stock.price,
                    change: stock.change,
                    pct_change: stock.pct_change,
                    volume: stock.volume,
                }));

                setAllStocks(formattedStocks);
                setLastUpdated(new Date());
            } else {
                throw new Error(t('errorStockList'));
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách cổ phiếu:', error);
            toast.error(
                common_t('error'),
                t('errorStockList')
            );
            setErrorAllStocks(t('errorStockList'));
        } finally {
            setLoadingAllStocks(false);
        }
    };

    // Fetch historical data for the chart's selected stock
    const fetchChartStockHistory = async (symbol: string) => {
        setLoadingChartStock(true);
        setErrorChartStock(null);
        try {
            // Tính ngày bắt đầu (30 ngày trước)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = endDate.toISOString().split('T')[0];

            // Lấy dữ liệu lịch sử
            const historyData = await getStockHistory(
                symbol,
                formattedStartDate,
                formattedEndDate,
                '1D'
            );

            if (historyData && historyData.data && historyData.data.length > 0) {
                // Chuyển đổi định dạng dữ liệu cho biểu đồ
                const chartData = historyData.data.map(item => ({
                    date: item.date,
                    price: item.close,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    volume: item.volume,
                    change: item.change,
                    pct_change: item.pct_change
                }));

                setHistoricalData(chartData);

                // Lấy giá hiện tại từ dữ liệu mới nhất
                const latestData = historyData.data[historyData.data.length - 1];
                setChartStockData({ price: latestData.close });
            } else {
                throw new Error(`Không tìm thấy dữ liệu lịch sử cho mã ${symbol}`);
            }
        } catch (error) {
            console.error(`Lỗi khi lấy dữ liệu lịch sử cổ phiếu ${symbol}:`, error);
            setErrorChartStock(`Không thể lấy dữ liệu lịch sử cổ phiếu ${symbol}.`);

            // Nếu không lấy được dữ liệu lịch sử, tạo dữ liệu mô phỏng dựa trên giá hiện tại
            const currentStock = allStocks.find(stock => stock.symbol === symbol);
            if (currentStock && currentStock.price) {
                setChartStockData({ price: currentStock.price });
                setHistoricalData(generateMockHistoricalData(currentStock.price));
            } else {
                setChartStockData(null);
                setHistoricalData([]);
            }
        } finally {
            setLoadingChartStock(false);
        }
    };

    // Generate mock historical data based on the current price (fallback)
    const generateMockHistoricalData = (currentPrice: number) => {
        const data = [];
        const numPoints = 30; // Number of data points
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numPoints); // Start 30 days ago

        let previousPrice = currentPrice * (1 - Math.random() * 0.1); // Bắt đầu với giá thấp hơn hiện tại một chút

        for (let i = 0; i < numPoints; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);

            // Tạo biến động giá ngẫu nhiên (±3%)
            const changePercent = (Math.random() - 0.5) * 0.06;
            const closePrice = previousPrice * (1 + changePercent);

            // Tạo giá mở cửa, cao nhất, thấp nhất
            const openPrice = previousPrice * (1 + (Math.random() - 0.5) * 0.02);
            const amplitude = closePrice * 0.02; // Biên độ dao động 2%
            const highPrice = Math.max(closePrice, openPrice) + Math.random() * amplitude;
            const lowPrice = Math.min(closePrice, openPrice) - Math.random() * amplitude;

            // Tính toán thay đổi giá
            const change = closePrice - previousPrice;
            const pctChange = (change / previousPrice) * 100;

            // Tạo khối lượng giao dịch ngẫu nhiên
            const volume = Math.floor(100000 + Math.random() * 900000);

            data.push({
                date: date.toISOString(),
                price: closePrice,
                open: openPrice,
                high: highPrice,
                low: lowPrice,
                volume: volume,
                change: change,
                pct_change: pctChange
            });

            previousPrice = closePrice;
        }
        return data;
    };

    // Fetch chart stock data when symbol changes
    useEffect(() => {
        if (chartStockSymbol) {
            fetchChartStockHistory(chartStockSymbol);
        }
    }, [chartStockSymbol]);

    // Sorting logic for the stock list table
    const handleSort = (column: keyof MarketStockItem) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc'); // Default to ascending when changing column
        }
    };

    // Memoize sorted stocks to avoid unnecessary re-sorting
    const sortedStocks = useMemo(() => {
        if (!sortColumn) return allStocks;

        return [...allStocks].sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            if (aValue === undefined) return 1;
            if (bValue === undefined) return -1;

            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [allStocks, sortColumn, sortDirection]);

    // Format thời gian cập nhật cuối cùng
    const formatLastUpdated = () => {
        if (!lastUpdated) return 'Chưa cập nhật';

        return lastUpdated.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground">{t('description')}</p>
                    </div>
                    <Link href="/investments" passHref className="mt-3 sm:mt-0 self-start sm:self-center">
                        <Button variant="outline" size="sm" className="flex items-center whitespace-nowrap">
                            <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
                            {t('backToPortfolio')}
                        </Button>
                    </Link>
                </div>

                <div className="space-y-6"> {/* Changed from grid to vertical spacing */}
                    <Card> {/* Moved "Cổ phiếu nổi bật" up */}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                                <ListFilter className="h-5 w-5 mr-2 text-blue-500" />
                                {t('featuredStocks')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <StockPortfolioDashboard />
                            </div>
                        </CardContent>
                    </Card>

                    <Card> {/* Biểu đồ thị trường */}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                                {t('marketChart')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Stock selection for chart */}
                                <div className="flex items-center gap-2">
                                    <span>Chọn mã cổ phiếu:</span>
                                    <div className="w-32"> {/* Adjust width as needed */}
                                        <StockAutoComplete
                                            onStockSelect={setChartStockSymbol}
                                            defaultValue={chartStockSymbol}
                                            isLoading={loadingAllStocks} // Use loading state from all stocks for simplicity
                                        />
                                    </div>
                                </div>

                                {/* Chart area */}
                                <div className="h-[300px] w-full">
                                    {/* Use StockPriceChart component */}
                                    <StockPriceChart
                                        data={historicalData} // Pass historical data
                                        isLoading={loadingChartStock}
                                        error={errorChartStock}
                                    />
                                </div>

                                {/* Removed display of current price below the chart */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Re-added "Danh sách cổ phiếu" card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('stockList')}</CardTitle>
                            <div className="flex items-center">
                                <span className="text-sm text-muted-foreground mr-2">
                                    Cập nhật lúc: {formatLastUpdated()}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchAllStocks}
                                    disabled={loadingAllStocks}
                                >
                                    {loadingAllStocks ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                    )}
                                    Cập nhật
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingAllStocks ? (
                                <div className="text-center text-muted-foreground">{t('loadingStockList')}</div>
                            ) : errorAllStocks ? (
                                <div className="text-center text-destructive">{errorAllStocks}</div>
                            ) : (
                                // Display MarketStockTable with sorting
                                <MarketStockTable
                                    stocks={sortedStocks} // Pass sorted data
                                    isLoading={loadingAllStocks}
                                    onSort={handleSort} // Pass sorting handler
                                    sortColumn={sortColumn}
                                    sortDirection={sortDirection}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}

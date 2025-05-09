'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { StockPortfolioDashboard } from '@/components/investments/stocks/StockPortfolioDashboard';
import { MarketStockTable, MarketStockItem } from '@/components/investments/stocks/MarketStockTable'; // Import the new component and interface
import { StockPriceChart } from '@/components/investments/stocks/StockPriceChart'; // Import the new chart component
import { TrendingUp, ListFilter, ChevronLeft, Loader2 } from 'lucide-react'; // Import Loader2
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react'; // Import useMemo
import axios from 'axios';
import { toast } from '@/components/ui/Toaster';
import { StockAutoComplete } from '@/components/investments/stocks/StockAutoComplete'; // Import StockAutoComplete
import { formatCurrency } from '@/utils/formatters'; // Import formatCurrency

export default function StocksMarketPage() {
    const t = useTranslations('StockMarketPage');
    const common_t = useTranslations('common'); // For common translations
    const investments_t = useTranslations('Investments'); // For general investment translations if needed
    const [allStocks, setAllStocks] = useState<MarketStockItem[]>([]); // Specify type
    const [loadingAllStocks, setLoadingAllStocks] = useState(true);
    const [errorAllStocks, setErrorAllStocks] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<keyof MarketStockItem | null>('symbol'); // State for sorting column
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // State for sorting direction

    // State for chart data
    const [chartStockSymbol, setChartStockSymbol] = useState<string>('VNM'); // Default symbol for chart
    const [chartStockData, setChartStockData] = useState<{ price: number | null } | null>(null); // Data for chart (current price)
    const [loadingChartStock, setLoadingChartStock] = useState(false);
    const [errorChartStock, setErrorChartStock] = useState<string | null>(null);
    const [mockHistoricalData, setMockHistoricalData] = useState<any[]>([]); // State for mock historical data


    const API_BASE_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'http://localhost:8000';

    useEffect(() => {
        fetchAllStocks();
    }, []);

    // Fetch all stocks for the list
    const fetchAllStocks = async () => {
        setLoadingAllStocks(true);
        setErrorAllStocks(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/stocks`);
            if (response.data && response.data.stocks) {
                // Map the data to match MarketStockItem structure
                const formattedStocks: MarketStockItem[] = response.data.stocks.map((stock: any) => ({
                    symbol: stock.symbol,
                    name: stock.name,
                    industry: stock.industry,
                    price: stock.price,
                }));
                setAllStocks(formattedStocks);
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

    // Fetch current price for the chart's selected stock
    const fetchChartStockPrice = async (symbol: string) => {
        setLoadingChartStock(true);
        setErrorChartStock(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/price?symbol=${symbol}`);
            if (response.data && response.data.price !== undefined) {
                setChartStockData({ price: response.data.price });
            } else {
                throw new Error(`Không tìm thấy dữ liệu giá cho mã ${symbol}`);
            }
        } catch (error) {
            console.error(`Lỗi khi lấy giá cổ phiếu ${symbol}:`, error);
            setErrorChartStock(`Không thể lấy giá cổ phiếu ${symbol}.`);
            setChartStockData(null);
        } finally {
            setLoadingChartStock(false);
        }
    };

    // Generate mock historical data based on the current price
    const generateMockHistoricalData = (currentPrice: number) => {
        const data = [];
        const numPoints = 30; // Number of data points
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numPoints); // Start 30 days ago

        for (let i = 0; i < numPoints; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            // Generate price with some variation around the current price
            const price = currentPrice * (1 + (Math.random() - 0.5) * 0.1); // ±5% variation
            data.push({ date: date.toISOString(), price: price });
        }
        return data;
    };

    // Fetch chart stock data when symbol changes
    useEffect(() => {
        if (chartStockSymbol) {
            fetchChartStockPrice(chartStockSymbol);
        }
    }, [chartStockSymbol]);

    // Generate mock historical data when chartStockData is updated
    useEffect(() => {
        if (chartStockData?.price !== null && chartStockData?.price !== undefined) {
            setMockHistoricalData(generateMockHistoricalData(chartStockData.price));
        } else {
            setMockHistoricalData([]); // Clear data if no price
        }
    }, [chartStockData]);


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

            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [allStocks, sortColumn, sortDirection]);


    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground">{t('description')}</p>
                    </div>
                    <Link href="/investments" passHref>
                        <Button variant="outline" className="flex items-center">
                            <ChevronLeft className="h-4 w-4 mr-2" />
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
                                        data={mockHistoricalData} // Pass mock historical data
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
                        <CardHeader>
                            <CardTitle>{t('stockList')}</CardTitle>
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

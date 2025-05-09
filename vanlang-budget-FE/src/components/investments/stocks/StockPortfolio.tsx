'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, BarChart4, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { StockTransaction } from './StockTransaction';

// Interface cho dữ liệu cổ phiếu
interface StockHolding {
    symbol: string;
    name: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    marketValue: number;
    investedAmount: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    lastUpdated: string;
}

interface StockPortfolioProps {
    userId?: string;
}

// Dữ liệu mẫu cho danh mục cổ phiếu
const SAMPLE_PORTFOLIO: StockHolding[] = [
    {
        symbol: 'VNM',
        name: 'Công ty CP Sữa Việt Nam',
        quantity: 500,
        averagePrice: 85400,
        currentPrice: 89200,
        marketValue: 44600000,
        investedAmount: 42700000,
        unrealizedPnL: 1900000,
        unrealizedPnLPercent: 4.45,
        lastUpdated: '2024-08-20T09:30:00'
    },
    {
        symbol: 'FPT',
        name: 'Công ty CP FPT',
        quantity: 300,
        averagePrice: 95200,
        currentPrice: 115600,
        marketValue: 34680000,
        investedAmount: 28560000,
        unrealizedPnL: 6120000,
        unrealizedPnLPercent: 21.43,
        lastUpdated: '2024-08-20T09:30:00'
    },
    {
        symbol: 'MWG',
        name: 'Công ty CP Đầu tư Thế Giới Di Động',
        quantity: 200,
        averagePrice: 56400,
        currentPrice: 51200,
        marketValue: 10240000,
        investedAmount: 11280000,
        unrealizedPnL: -1040000,
        unrealizedPnLPercent: -9.22,
        lastUpdated: '2024-08-20T09:30:00'
    },
    {
        symbol: 'VCB',
        name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
        quantity: 100,
        averagePrice: 97400,
        currentPrice: 102600,
        marketValue: 10260000,
        investedAmount: 9740000,
        unrealizedPnL: 520000,
        unrealizedPnLPercent: 5.34,
        lastUpdated: '2024-08-20T09:30:00'
    },
    {
        symbol: 'HPG',
        name: 'Công ty CP Tập đoàn Hòa Phát',
        quantity: 1000,
        averagePrice: 23600,
        currentPrice: 21800,
        marketValue: 21800000,
        investedAmount: 23600000,
        unrealizedPnL: -1800000,
        unrealizedPnLPercent: -7.63,
        lastUpdated: '2024-08-20T09:30:00'
    }
];

export function StockPortfolio({ userId }: StockPortfolioProps) {
    const [portfolio, setPortfolio] = useState<StockHolding[]>(SAMPLE_PORTFOLIO);
    const [selectedStock, setSelectedStock] = useState<string | null>(null);
    const [activeView, setActiveView] = useState('portfolio');

    // Tính tổng giá trị danh mục và lợi nhuận
    const totalPortfolioValue = portfolio.reduce((sum, stock) => sum + stock.marketValue, 0);
    const totalInvestedAmount = portfolio.reduce((sum, stock) => sum + stock.investedAmount, 0);
    const totalUnrealizedPnL = portfolio.reduce((sum, stock) => sum + stock.unrealizedPnL, 0);
    const totalUnrealizedPnLPercent = (totalUnrealizedPnL / totalInvestedAmount) * 100;

    // Xử lý khi thêm giao dịch mới
    const handleTransactionAdded = () => {
        // Trong môi trường thực tế, sẽ refresh dữ liệu từ API
        console.log("Giao dịch đã được thêm, cập nhật danh mục...");
        // fetchPortfolioData();
    };

    // Phân loại cổ phiếu theo lợi nhuận
    const profitableStocks = portfolio.filter(stock => stock.unrealizedPnL > 0);
    const lossStocks = portfolio.filter(stock => stock.unrealizedPnL < 0);

    // Sắp xếp theo % lợi nhuận
    const sortedByPnL = [...portfolio].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent);

    // Hiển thị bảng dựa trên tab đang chọn
    const renderPortfolioContent = () => {
        if (activeView === 'transactions' && selectedStock) {
            return (
                <div className="space-y-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveView('portfolio')}
                        className="mb-2"
                    >
                        Quay lại danh mục
                    </Button>
                    <StockTransaction
                        stockSymbol={selectedStock}
                        onTransactionAdded={handleTransactionAdded}
                    />
                </div>
            );
        }

        if (activeView === 'performance') {
            return <PerformanceTable stocks={sortedByPnL} />;
        }

        // Chọn danh sách cổ phiếu dựa trên tab
        let stocksToShow = portfolio;
        if (activeView === 'profit') {
            stocksToShow = profitableStocks;
        } else if (activeView === 'loss') {
            stocksToShow = lossStocks;
        }

        return (
            <PortfolioTable
                stocks={stocksToShow}
                onSelectStock={(symbol) => {
                    setSelectedStock(symbol);
                    setActiveView('transactions');
                }}
            />
        );
    };

    return (
        <div className="space-y-6">
            {/* Tổng quan danh mục */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold">Danh mục đầu tư cổ phiếu</CardTitle>
                    <CardDescription>
                        Cập nhật lúc: {new Date(portfolio[0]?.lastUpdated || new Date()).toLocaleString('vi-VN')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-card rounded-lg p-4 border">
                            <div className="text-sm text-muted-foreground">Tổng giá trị đầu tư</div>
                            <div className="text-2xl font-bold mt-1">
                                {new Intl.NumberFormat('vi-VN').format(totalInvestedAmount)} đ
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                                {portfolio.length} mã cổ phiếu
                            </div>
                        </div>

                        <div className="bg-card rounded-lg p-4 border">
                            <div className="text-sm text-muted-foreground">Giá trị thị trường</div>
                            <div className="text-2xl font-bold mt-1">
                                {new Intl.NumberFormat('vi-VN').format(totalPortfolioValue)} đ
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground mt-2">
                                <BarChart4 className="h-3 w-3 mr-1" />
                                Giá thị trường hiện tại
                            </div>
                        </div>

                        <div className={cn(
                            "bg-card rounded-lg p-4 border",
                            totalUnrealizedPnL > 0 ? "border-green-200" : "border-red-200"
                        )}>
                            <div className="text-sm text-muted-foreground">Lợi nhuận chưa thực hiện</div>
                            <div className={cn(
                                "text-2xl font-bold mt-1 flex items-center",
                                totalUnrealizedPnL > 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {totalUnrealizedPnL > 0 ? "+" : ""}
                                {new Intl.NumberFormat('vi-VN').format(totalUnrealizedPnL)} đ
                                {totalUnrealizedPnL > 0
                                    ? <ArrowUp className="h-5 w-5 ml-2" />
                                    : <ArrowDown className="h-5 w-5 ml-2" />
                                }
                            </div>
                            <div className={cn(
                                "text-xs mt-2 font-medium",
                                totalUnrealizedPnL > 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {totalUnrealizedPnL > 0 ? "+" : ""}
                                {totalUnrealizedPnLPercent.toFixed(2)}%
                            </div>
                        </div>
                    </div>

                    {/* Tab điều hướng */}
                    <div className="mb-4 border-b">
                        <div className="flex space-x-6">
                            <Button
                                variant={activeView === 'portfolio' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveView('portfolio')}
                                className="rounded-none border-b-2 border-transparent px-2 pb-2 pt-1 font-medium text-sm"
                            >
                                Tất cả cổ phiếu
                            </Button>
                            <Button
                                variant={activeView === 'profit' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveView('profit')}
                                className="rounded-none border-b-2 border-transparent px-2 pb-2 pt-1 font-medium text-sm"
                            >
                                Lãi ({profitableStocks.length})
                            </Button>
                            <Button
                                variant={activeView === 'loss' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveView('loss')}
                                className="rounded-none border-b-2 border-transparent px-2 pb-2 pt-1 font-medium text-sm"
                            >
                                Lỗ ({lossStocks.length})
                            </Button>
                            <Button
                                variant={activeView === 'performance' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveView('performance')}
                                className="rounded-none border-b-2 border-transparent px-2 pb-2 pt-1 font-medium text-sm"
                            >
                                Hiệu suất
                            </Button>
                            {selectedStock && activeView === 'transactions' && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="rounded-none border-b-2 border-transparent px-2 pb-2 pt-1 font-medium text-sm"
                                >
                                    Giao dịch {selectedStock}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Nội dung của tab được chọn */}
                    {renderPortfolioContent()}
                </CardContent>
            </Card>
        </div>
    );
}

// Component hiển thị bảng danh mục
function PortfolioTable({
    stocks,
    onSelectStock
}: {
    stocks: StockHolding[],
    onSelectStock: (symbol: string) => void
}) {
    if (stocks.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">Không có cổ phiếu nào</div>;
    }

    return (
        <Table>
            <caption className="mt-4 text-sm text-muted-foreground">Danh mục cổ phiếu hiện tại</caption>
            <TableHeader>
                <TableRow>
                    <TableHead>Mã CK</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Giá TB</TableHead>
                    <TableHead>Giá hiện tại</TableHead>
                    <TableHead>Tổng giá trị</TableHead>
                    <TableHead>Lãi/Lỗ</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {stocks.map((stock) => (
                    <TableRow key={stock.symbol}>
                        <TableCell>
                            <div className="font-medium">{stock.symbol}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {stock.name}
                            </div>
                        </TableCell>
                        <TableCell>{stock.quantity.toLocaleString('vi-VN')}</TableCell>
                        <TableCell>{stock.averagePrice.toLocaleString('vi-VN')} đ</TableCell>
                        <TableCell className="whitespace-nowrap">
                            <div>{stock.currentPrice.toLocaleString('vi-VN')} đ</div>
                            <PriceChangeIndicator
                                oldPrice={stock.averagePrice}
                                newPrice={stock.currentPrice}
                            />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                            {stock.marketValue.toLocaleString('vi-VN')} đ
                        </TableCell>
                        <TableCell>
                            <div className={cn(
                                "font-medium",
                                stock.unrealizedPnL > 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {stock.unrealizedPnL > 0 ? "+" : ""}
                                {stock.unrealizedPnL.toLocaleString('vi-VN')} đ
                            </div>
                            <div className={cn(
                                "text-xs",
                                stock.unrealizedPnL > 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {stock.unrealizedPnL > 0 ? "+" : ""}
                                {stock.unrealizedPnLPercent.toFixed(2)}%
                            </div>
                        </TableCell>
                        <TableCell>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onSelectStock(stock.symbol)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

// Component hiển thị bảng hiệu suất
function PerformanceTable({ stocks }: { stocks: StockHolding[] }) {
    if (stocks.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">Không có cổ phiếu nào</div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Hiệu suất danh mục theo % lợi nhuận</h3>

            <div className="space-y-3">
                {stocks.map((stock) => (
                    <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-3 border rounded-lg"
                    >
                        <div className="flex-1">
                            <div className="font-medium">{stock.symbol}</div>
                            <div className="text-xs text-muted-foreground">{stock.name}</div>
                        </div>

                        <div className="flex-1 text-center">
                            <div className="text-sm font-medium">
                                {stock.quantity.toLocaleString('vi-VN')} CP
                            </div>
                            <div className="text-xs text-muted-foreground">
                                TB: {stock.averagePrice.toLocaleString('vi-VN')} đ
                            </div>
                        </div>

                        <div className="flex-1 text-right">
                            <div className={cn(
                                "text-base font-semibold",
                                stock.unrealizedPnL > 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {stock.unrealizedPnL > 0 ? "+" : ""}
                                {stock.unrealizedPnLPercent.toFixed(2)}%
                            </div>
                            <div className={cn(
                                "text-xs",
                                stock.unrealizedPnL > 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {stock.unrealizedPnL > 0 ? "+" : ""}
                                {stock.unrealizedPnL.toLocaleString('vi-VN')} đ
                            </div>
                        </div>

                        <div className="w-[100px] ml-3">
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className={cn(
                                        "h-full rounded-full",
                                        stock.unrealizedPnL > 0 ? "bg-green-500" : "bg-red-500"
                                    )}
                                    style={{
                                        width: `${Math.min(Math.abs(stock.unrealizedPnLPercent) * 3, 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Component hiển thị thay đổi giá
function PriceChangeIndicator({ oldPrice, newPrice }: { oldPrice: number, newPrice: number }) {
    const priceDiff = newPrice - oldPrice;
    const percentChange = (priceDiff / oldPrice) * 100;

    return (
        <div className={cn(
            "text-xs flex items-center",
            priceDiff > 0 ? "text-green-600" : priceDiff < 0 ? "text-red-600" : "text-muted-foreground"
        )}>
            {priceDiff > 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
            ) : priceDiff < 0 ? (
                <ArrowDown className="h-3 w-3 mr-1" />
            ) : (
                <TrendingUp className="h-3 w-3 mr-1" />
            )}
            {priceDiff > 0 ? "+" : ""}
            {percentChange.toFixed(2)}%
        </div>
    );
}

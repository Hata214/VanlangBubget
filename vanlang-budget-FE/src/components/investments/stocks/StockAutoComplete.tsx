'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Tag, ChevronRight, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/utils/cn';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/Command';
import { getAllStocks, StocksListResponse } from '@/services/stockApiService';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { toast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

interface StockOption {
    symbol: string;
    name: string;
    industry?: string;
    price?: number;
}

interface Stock {
    symbol: string;
    name: string;
    price: number;
    industry: string;
}

interface StockAutoCompleteProps {
    onStockSelect: (value: string) => void;
    defaultValue?: string;
    isLoading?: boolean;
}

// Local storage key để lưu danh sách yêu thích
const FAVORITE_STOCKS_KEY = 'vanlang-budget-favorite-stocks';

export function StockAutoComplete({ onStockSelect, defaultValue = '', isLoading = false }: StockAutoCompleteProps) {
    const t = useTranslations('Investments.stocks');
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(defaultValue);
    const [options, setOptions] = React.useState<StockOption[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedTab, setSelectedTab] = React.useState('all');
    const [favoriteStocks, setFavoriteStocks] = React.useState<string[]>([]);

    // Thêm các ngân hàng lớn
    const bankStocks = React.useMemo(() => [
        { symbol: 'BID', name: 'BIDV', industry: 'Ngân hàng' },
        { symbol: 'CTG', name: 'VietinBank', industry: 'Ngân hàng' },
        { symbol: 'HDB', name: 'HDBank', industry: 'Ngân hàng' },
        { symbol: 'ACB', name: 'ACB', industry: 'Ngân hàng' },
        { symbol: 'LPB', name: 'LienVietPostBank', industry: 'Ngân hàng' },
        { symbol: 'STB', name: 'Sacombank', industry: 'Ngân hàng' },
        { symbol: 'EIB', name: 'Eximbank', industry: 'Ngân hàng' },
    ], []);

    // Công nghiệp & Năng lượng
    const energyStocks = React.useMemo(() => [
        { symbol: 'GAS', name: 'PV Gas', industry: 'Năng lượng' },
        { symbol: 'POW', name: 'PetroVietnam Power', industry: 'Năng lượng' },
        { symbol: 'PVD', name: 'PV Drilling', industry: 'Dầu khí' },
        { symbol: 'PLX', name: 'Petrolimex', industry: 'Năng lượng' },
        { symbol: 'GEX', name: 'GELEX Group', industry: 'Điện & Điện tử' },
    ], []);

    // Thép & Vật liệu
    const steelStocks = React.useMemo(() => [
        { symbol: 'HPG', name: 'Hòa Phát Group', industry: 'Thép & Kim loại' },
        { symbol: 'HSG', name: 'Hoa Sen Group', industry: 'Thép & Kim loại' },
        { symbol: 'NKG', name: 'Nam Kim Steel', industry: 'Thép & Kim loại' },
    ], []);

    // Danh sách cổ phiếu phổ biến
    const popularStocks = React.useMemo(() => [
        { symbol: 'VNM', name: 'Vinamilk', industry: 'Hàng tiêu dùng' },
        { symbol: 'VIC', name: 'Vingroup', industry: 'Bất động sản' },
        { symbol: 'VHM', name: 'Vinhomes', industry: 'Bất động sản' },
        { symbol: 'FPT', name: 'FPT Corp', industry: 'Công nghệ' },
        { symbol: 'MSN', name: 'Masan Group', industry: 'Đa ngành' },
        { symbol: 'VCB', name: 'Vietcombank', industry: 'Ngân hàng' },
        { symbol: 'TCB', name: 'Techcombank', industry: 'Ngân hàng' },
        { symbol: 'MWG', name: 'Thế Giới Di Động', industry: 'Bán lẻ' },
    ], []);

    // Thêm một số cổ phiếu khác để demo
    const additionalStocks = React.useMemo(() => [
        { symbol: 'PNJ', name: 'Phú Nhuận Jewelry', industry: 'Bán lẻ' },
        { symbol: 'REE', name: 'Cơ Điện Lạnh', industry: 'Công nghiệp' },
        { symbol: 'VRE', name: 'Vincom Retail', industry: 'Bất động sản' },
        { symbol: 'MBB', name: 'MB Bank', industry: 'Ngân hàng' },
        { symbol: 'VJC', name: 'Vietjet Air', industry: 'Hàng không' },
        { symbol: 'SAB', name: 'Sabeco', industry: 'Đồ uống' },
        { symbol: 'NLG', name: 'Nam Long Group', industry: 'Bất động sản' },
    ], []);

    // Kết hợp tất cả danh sách cố định
    const stockLists = React.useMemo(() => [
        ...popularStocks,
        ...additionalStocks,
        ...bankStocks,
        ...energyStocks,
        ...steelStocks
    ], [popularStocks, additionalStocks, bankStocks, energyStocks, steelStocks]);

    // Đọc danh sách cổ phiếu yêu thích từ localStorage
    React.useEffect(() => {
        try {
            const savedFavorites = localStorage.getItem(FAVORITE_STOCKS_KEY);
            if (savedFavorites) {
                setFavoriteStocks(JSON.parse(savedFavorites));
            }
        } catch (error) {
            console.error('Lỗi khi đọc danh sách yêu thích:', error);
        }
    }, []);

    // Lưu danh sách yêu thích vào localStorage khi thay đổi
    React.useEffect(() => {
        try {
            localStorage.setItem(FAVORITE_STOCKS_KEY, JSON.stringify(favoriteStocks));
        } catch (error) {
            console.error('Lỗi khi lưu danh sách yêu thích:', error);
        }
    }, [favoriteStocks]);

    // Lấy danh sách cổ phiếu
    const loadStocks = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllStocks();
            if (data.stocks && Array.isArray(data.stocks)) {
                const stockOptions: StockOption[] = data.stocks.map((stock: Stock) => ({
                    symbol: stock.symbol || '',
                    name: stock.name || '',
                    industry: stock.industry || 'Không xác định',
                    price: stock.price || undefined
                }));
                setOptions(stockOptions);
            } else {
                // Nếu không lấy được từ API, sử dụng danh sách có sẵn
                setOptions(stockLists);
                console.error('Dữ liệu cổ phiếu không đúng định dạng:', data);
            }
        } catch (error) {
            // Trường hợp lỗi, dùng danh sách có sẵn
            setOptions(stockLists);
            console.error('Lỗi khi lấy danh sách cổ phiếu:', error);
        } finally {
            setLoading(false);
        }
    }, [stockLists]);

    // Tải danh sách cổ phiếu khi component được mount
    React.useEffect(() => {
        loadStocks();
    }, [loadStocks]);

    // Cập nhật giá trị khi defaultValue thay đổi
    React.useEffect(() => {
        if (defaultValue) {
            setValue(defaultValue);
        }
    }, [defaultValue]);

    // Lọc options theo từ khóa tìm kiếm và tab đã chọn
    const filteredOptions = React.useMemo(() => {
        let filtered = options;

        if (searchQuery) {
            filtered = filtered.filter(option =>
                option.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (option.industry && option.industry.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        if (selectedTab === 'favorite') {
            filtered = filtered.filter(option => favoriteStocks.includes(option.symbol));
        } else if (selectedTab !== 'all' && selectedTab !== 'popular') {
            filtered = filtered.filter(option => option.industry === selectedTab);
        } else if (selectedTab === 'popular') {
            filtered = filtered.filter(option =>
                popularStocks.some(stock => stock.symbol === option.symbol)
            );
        }

        return filtered;
    }, [options, searchQuery, selectedTab, popularStocks, favoriteStocks]);

    // Lấy danh sách các ngành
    const industries = React.useMemo(() => {
        const industriesSet = new Set<string>();
        options.forEach(stock => {
            if (stock.industry) {
                industriesSet.add(stock.industry);
            }
        });
        return Array.from(industriesSet).sort();
    }, [options]);

    // Thêm hoặc xóa cổ phiếu khỏi danh sách yêu thích
    const toggleFavorite = React.useCallback((symbol: string, event?: React.MouseEvent) => {
        if (event) {
            event.stopPropagation(); // Ngăn không cho sự kiện click lan tỏa
        }

        setFavoriteStocks((prev: string[]) => {
            const isCurrentlyFavorite = prev.includes(symbol);

            if (isCurrentlyFavorite) {
                // Xóa khỏi danh sách yêu thích
                toast.description(`Đã xóa ${symbol} khỏi danh sách yêu thích`);
                return prev.filter(s => s !== symbol);
            } else {
                // Thêm vào danh sách yêu thích
                toast.description(`Đã thêm ${symbol} vào danh sách yêu thích`);
                return [...prev, symbol];
            }
        });
    }, []);

    // Xử lý sự kiện chọn cổ phiếu
    const handleSelectStock = React.useCallback((selectedSymbol: string) => {
        console.log("Đã chọn cổ phiếu:", selectedSymbol);
        setValue(selectedSymbol);
        onStockSelect(selectedSymbol);
        setOpen(false);
    }, [onStockSelect]);

    // Lấy thông tin cổ phiếu đã chọn
    const getSelectedStockInfo = () => {
        const selectedStock = options.find(option => option.symbol === value);
        if (!selectedStock) return value;

        return (
            <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                    <div className="font-medium">{selectedStock.symbol}</div>
                    <div className="text-xs text-muted-foreground">{selectedStock.name}</div>
                </div>
                {selectedStock.price && (
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 ml-2">
                        {selectedStock.price.toLocaleString('vi-VN')}
                    </span>
                )}
            </div>
        );
    };

    // Hiển thị một dòng cổ phiếu
    const renderStockItem = React.useCallback((stock: StockOption) => {
        const isPopular = popularStocks.some(s => s.symbol === stock.symbol);
        const isFavorite = favoriteStocks.includes(stock.symbol);

        return (
            <div
                key={stock.symbol}
                className="flex items-center space-x-2 py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer relative group"
                onClick={() => handleSelectStock(stock.symbol)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleSelectStock(stock.symbol);
                    }
                }}
            >
                {value === stock.symbol && (
                    <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
                {value !== stock.symbol && (
                    <div className="h-4 w-4 flex-shrink-0" />
                )}

                <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="font-medium">{stock.symbol}</span>
                            {isPopular && (
                                <Badge variant="outline" className="ml-2 py-0 h-5 text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {t('popular')}
                                </Badge>
                            )}
                        </div>
                        {stock.price && (
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {stock.price.toLocaleString('vi-VN')}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">{stock.name}</span>
                    {stock.industry && (
                        <span className="text-xs text-muted-foreground">{stock.industry}</span>
                    )}
                </div>

                <button
                    className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                    onClick={(e) => toggleFavorite(stock.symbol, e)}
                    aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                    {isFavorite ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                        <StarOff className="h-4 w-4 text-gray-400" />
                    )}
                </button>
            </div>
        );
    }, [handleSelectStock, popularStocks, value, favoriteStocks, toggleFavorite]);

    // Hiển thị danh sách cổ phiếu
    const renderStocksList = React.useCallback(() => {
        if (loading) {
            return (
                <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('loadingStocks')}
                </div>
            );
        }

        if (filteredOptions.length === 0) {
            if (selectedTab === 'favorite' && favoriteStocks.length === 0) {
                return (
                    <div className="py-6 px-4 text-center text-sm text-muted-foreground">
                        <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>{t('noFavoriteStocks')}</p>
                        <p className="text-xs mt-1">{t('addFavoriteStocks')}</p>
                    </div>
                );
            }

            return (
                <div className="py-6 text-center text-sm text-muted-foreground">
                    {t('noResults')}
                </div>
            );
        }

        return (
            <div className="overflow-y-auto max-h-[300px]">
                {filteredOptions.map(renderStockItem)}
            </div>
        );
    }, [filteredOptions, loading, renderStockItem, selectedTab, favoriteStocks.length, t]);

    // Hiển thị danh sách ngành
    const renderIndustriesList = React.useCallback(() => {
        return (
            <div className="overflow-y-auto max-h-[300px]">
                {industries.map(industry => (
                    <div
                        key={industry}
                        className="flex items-center justify-between py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => setSelectedTab(industry)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                setSelectedTab(industry);
                            }
                        }}
                    >
                        <span>{industry}</span>
                        <ChevronRight className="h-4 w-4" />
                    </div>
                ))}
            </div>
        );
    }, [industries]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : value ? (
                        getSelectedStockInfo()
                    ) : (
                        t('selectStock')
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 max-h-[450px]" align="start">
                <div className="px-3 pt-3">
                    <input
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={t('searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="px-3 py-2">
                    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
                        <button
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                selectedTab === 'all' ? "bg-background text-foreground shadow-sm" : ""
                            )}
                            onClick={() => setSelectedTab('all')}
                        >
                            {t('all')}
                        </button>
                        <button
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                selectedTab === 'favorite' ? "bg-background text-foreground shadow-sm" : ""
                            )}
                            onClick={() => setSelectedTab('favorite')}
                        >
                            <Star className="h-3 w-3 mr-1" />
                            {t('favorite')}
                        </button>
                        <button
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                selectedTab === 'industries' ? "bg-background text-foreground shadow-sm" : ""
                            )}
                            onClick={() => setSelectedTab('industries')}
                        >
                            <span>{t('industry')}</span>
                            <ChevronRight className="ml-1 h-3 w-3" />
                        </button>
                    </div>
                </div>

                <div className="pt-1 pb-2">
                    {selectedTab === 'industries' ? renderIndustriesList() : renderStocksList()}

                    {industries.includes(selectedTab) && (
                        <>
                            <div className="px-2 py-1 border-b flex items-center text-sm">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => setSelectedTab('all')}
                                >
                                    <ChevronRight className="rotate-180 h-4 w-4 mr-1" />
                                    <span>{t('backToAll')}</span>
                                </Button>
                                <span className="ml-2 font-medium">{selectedTab}</span>
                            </div>
                            {renderStocksList()}
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
} 
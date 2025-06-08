import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Search, X, Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover'
import { Calendar } from '@/components/ui/Calendar'
import { cn, formatDate } from '@/lib/utils'

export interface FilterOptions {
    category?: string | string[]
    // filterDate?: string // Thay thế startDate và endDate bằng filterDate duy nhất - Bỏ đi
    // minAmount?: number // Bỏ đi
    // maxAmount?: number // Bỏ đi
    dateRange?: DateRange // Sử dụng DateRange của react-day-picker
    amountRange?: {
        min?: number
        max?: number
    }
}

interface SearchFilterProps {
    categories: string[]
    onSearch: (searchTerm: string) => void
    onFilter: (filters: FilterOptions) => void
    onReset: () => void
    categoryLabel?: string
}

export function SearchFilter({ categories, onSearch, onFilter, onReset, categoryLabel = 'common.category' }: SearchFilterProps) {
    const t = useTranslations();
    const [searchTerm, setSearchTerm] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState<FilterOptions>({})

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            onSearch(searchTerm)
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [searchTerm, onSearch])

    const handleFilterChange = (key: keyof FilterOptions, value: any) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
        onFilter(newFilters)
    }

    const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
        const numericValue = value === '' ? undefined : Number(value)
        const newAmountRange = { ...filters.amountRange, [field]: numericValue }
        handleFilterChange('amountRange', newAmountRange)
    }

    const handleDateRangeChange = (range: DateRange | undefined) => {
        handleFilterChange('dateRange', range)
    }

    const handleReset = () => {
        setSearchTerm('')
        setFilters({}) // Reset cả dateRange và amountRange
        onReset()
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? t('common.hideFilter') : t('common.filter')}
                </Button>
                <Button
                    variant="ghost"
                    onClick={handleReset}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {showFilters && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Category Filter */}
                    <Select
                        value={filters.category as string} // Giữ nguyên nếu chỉ cho chọn 1 category
                        onValueChange={(value) => handleFilterChange('category', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t(categoryLabel)} />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Date Range Filter - From Date */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                <Input
                                    type="text"
                                    readOnly
                                    value={filters.dateRange?.from ? formatDate(filters.dateRange.from) : ''}
                                    placeholder={t('common.filterDateFromPlaceholder', { defaultMessage: 'Từ ngày (dd/mm/yyyy)' })}
                                    className="pl-10 cursor-pointer"
                                />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={filters.dateRange?.from}
                                onSelect={(selectedDate) => {
                                    const newRange: DateRange = {
                                        from: selectedDate ?? undefined,
                                        to: filters.dateRange?.to,
                                    };
                                    handleDateRangeChange(newRange);
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Date Range Filter - To Date */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                <Input
                                    type="text"
                                    readOnly
                                    value={filters.dateRange?.to ? formatDate(filters.dateRange.to) : ''}
                                    placeholder={t('common.filterDateToPlaceholder', { defaultMessage: 'Đến ngày (dd/mm/yyyy)' })}
                                    className="pl-10 cursor-pointer"
                                    disabled={!filters.dateRange?.from} // Disable 'to' date if 'from' is not selected
                                />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={filters.dateRange?.to}
                                onSelect={(selectedDate) => {
                                    const newRange: DateRange = {
                                        from: filters.dateRange?.from,
                                        to: selectedDate ?? undefined,
                                    };
                                    handleDateRangeChange(newRange);
                                }}
                                initialFocus
                                fromDate={filters.dateRange?.from} // Prevent selecting 'to' date before 'from' date
                                disabled={!filters.dateRange?.from}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Min Amount Filter */}
                    <Input
                        type="number"
                        value={filters.amountRange?.min ?? ''}
                        onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                        placeholder={t('common.filterMinAmountPlaceholder')}
                    />

                    {/* Max Amount Filter */}
                    <Input
                        type="number"
                        value={filters.amountRange?.max ?? ''}
                        onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                        placeholder={t('common.filterMaxAmountPlaceholder')}
                    />
                </div>
            )}
        </div>
    )
}

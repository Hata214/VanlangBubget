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
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            type="date"
                            value={filters.dateRange?.from ? filters.dateRange.from.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                                const newDate = e.target.value ? new Date(e.target.value) : undefined;
                                handleDateRangeChange({ ...filters.dateRange, from: newDate });
                            }}
                            placeholder="dd/mm/yyyy"
                            className="pl-10"
                        />
                    </div>

                    {/* Date Range Filter - To Date */}
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            type="date"
                            value={filters.dateRange?.to ? filters.dateRange.to.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                                const newDate = e.target.value ? new Date(e.target.value) : undefined;
                                handleDateRangeChange({ ...filters.dateRange, to: newDate });
                            }}
                            placeholder="dd/mm/yyyy"
                            className="pl-10"
                        />
                    </div>

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

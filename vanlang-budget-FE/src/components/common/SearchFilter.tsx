import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Search, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'

export interface FilterOptions {
    category?: string | string[]
    filterDate?: string // Thay thế startDate và endDate bằng filterDate duy nhất
    minAmount?: number
    maxAmount?: number
    // Thêm các trường mới cho filtering nâng cao
    dateRange?: {
        from?: Date
        to?: Date
    }
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
    categoryLabel?: string // Thêm prop mới để tùy chỉnh nhãn cho danh mục
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

    const handleFilterChange = (key: keyof FilterOptions, value: string | number) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
        onFilter(newFilters)
    }

    const handleReset = () => {
        setSearchTerm('')
        setFilters({})
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
                    <Select
                        value={filters.category as string}
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

                    <Input
                        type="date"
                        value={filters.filterDate}
                        onChange={(e) => handleFilterChange('filterDate', e.target.value)}
                        placeholder={t('common.filterDate')}
                    />

                    <Input
                        type="number"
                        value={filters.minAmount}
                        onChange={(e) => handleFilterChange('minAmount', Number(e.target.value))}
                        placeholder={t('common.filterMinAmountPlaceholder')}
                    />

                    <Input
                        type="number"
                        value={filters.maxAmount}
                        onChange={(e) => handleFilterChange('maxAmount', Number(e.target.value))}
                        placeholder={t('common.filterMaxAmountPlaceholder')}
                    />
                </div>
            )}
        </div>
    )
} 
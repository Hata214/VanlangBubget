'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface StockAutoCompleteProps {
    onStockSelect: (symbol: string) => void;
    defaultValue?: string;
    isLoading?: boolean;
}

export function StockAutoComplete({
    onStockSelect,
    defaultValue = '',
    isLoading = false
}: StockAutoCompleteProps) {
    const [searchValue, setSearchValue] = useState(defaultValue);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchValue.trim()) {
            onStockSelect(searchValue.trim().toUpperCase());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <Input
                value={searchValue}
                onChange={handleChange}
                placeholder="Nhập mã cổ phiếu (ví dụ: VNM)"
                className="w-full"
                disabled={isLoading}
            />
            <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
                disabled={isLoading}
            >
                {isLoading ? 'Đang tải...' : 'Tìm kiếm'}
            </Button>
        </form>
    );
} 
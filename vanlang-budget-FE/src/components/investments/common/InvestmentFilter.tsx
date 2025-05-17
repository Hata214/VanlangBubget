'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';

interface InvestmentFilterProps {
    activeFilter: string | null;
    onFilterChange: (filter: string | null) => void;
}

export default function InvestmentFilter({ activeFilter, onFilterChange }: InvestmentFilterProps) {
    const t = useTranslations('Investments');

    const filters = [
        { key: 'stock', label: t('stock') },
        { key: 'gold', label: t('gold.title') },
        { key: 'realestate', label: t('realestate.title') },
        { key: 'savings', label: 'Tiết kiệm' },
    ];

    return (
        <div className="flex items-center space-x-2 mb-4">
            {filters.map(filter => (
                <Badge
                    key={filter.key}
                    variant="outline"
                    className={`cursor-pointer hover:bg-gray-100
          ${filter.key === 'stock' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
          ${filter.key === 'gold' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
          ${filter.key === 'realestate' ? 'bg-green-50 text-green-700 border-green-200' : ''}
          ${activeFilter === filter.key ? 'ring-2 ring-offset-1' : ''}`}
                    onClick={() => onFilterChange(activeFilter === filter.key ? null : filter.key)}
                >
                    {filter.label}
                </Badge>
            ))}
            <span className="text-sm text-muted-foreground">— {t('allInvestments')}</span>
        </div>
    );
}
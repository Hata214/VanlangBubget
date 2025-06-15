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
        { key: 'stock', label: t('stock'), color: 'blue' },
        { key: 'gold', label: t('gold.title'), color: 'yellow' },
        { key: 'realestate', label: t('realestate.title'), color: 'orange' },
        { key: 'savings', label: t('savings.title'), color: 'green' },
    ];

    const getColorClasses = (color: string, isActive: boolean) => {
        if (isActive) {
            switch (color) {
                case 'blue': return 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-blue-100 border-blue-500 dark:border-blue-600';
                case 'yellow': return 'bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:text-yellow-100 border-yellow-500 dark:border-yellow-600';
                case 'orange': return 'bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700 dark:text-orange-100 border-orange-500 dark:border-orange-600';
                case 'green': return 'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700 dark:text-green-100 border-green-500 dark:border-green-600';
                default: return 'bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-gray-100 border-gray-500 dark:border-gray-600';
            }
        } else {
            switch (color) {
                case 'blue': return 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700 dark:text-blue-200 border-blue-300 dark:border-blue-700';
                case 'yellow': return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-800 dark:hover:bg-yellow-700 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
                case 'orange': return 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-800 dark:hover:bg-orange-700 dark:text-orange-200 border-orange-300 dark:border-orange-700';
                case 'green': return 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-800 dark:hover:bg-green-700 dark:text-green-200 border-green-300 dark:border-green-700';
                default: return 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border-gray-300 dark:border-gray-600';
            }
        }
    };

    return (
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
            {filters.map(filter => (
                <Badge
                    key={filter.key}
                    variant={activeFilter === filter.key ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors duration-150 ease-in-out whitespace-nowrap 
                        ${getColorClasses(filter.color, activeFilter === filter.key)}
                        ${activeFilter === filter.key ? 'ring-2 ring-offset-background dark:ring-offset-background-dark ring-primary dark:ring-primary-dark' : ''}`
                    }
                    onClick={() => onFilterChange(activeFilter === filter.key ? null : filter.key)}
                >
                    {filter.label}
                </Badge>
            ))}
            <button
                className={`text-sm whitespace-nowrap transition-colors duration-150 ease-in-out px-2.5 py-0.5 rounded-full border 
                ${!activeFilter ? 'bg-gray-600 text-white dark:bg-gray-400 dark:text-gray-900 border-gray-600 dark:border-gray-400 ring-2 ring-offset-background dark:ring-offset-background-dark ring-primary dark:ring-primary-dark' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                onClick={() => onFilterChange(null)}
            >
                — {t('allInvestments')}
            </button>
        </div>
    );
}
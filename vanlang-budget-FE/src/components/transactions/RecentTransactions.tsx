'use client'

import { useTranslations } from 'next-intl'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Transaction {
    id: string
    type: 'income' | 'expense' | 'loan'
    amount: number
    description: string
    category: string
    date: string
}

interface RecentTransactionsProps {
    transactions: Transaction[]
    isLoading?: boolean
}

type ColumnAccessor = keyof Transaction | ((item: Transaction) => React.ReactNode)

interface Column {
    header: string
    accessor: ColumnAccessor
    className?: string
}

interface CustomTableProps<T> {
    data: T[]
    columns: { header: string; accessor: keyof T | ((item: T) => React.ReactNode); className?: string }[]
    isLoading?: boolean
    emptyMessage?: string
}

function CustomTable<T>({ data, columns, isLoading, emptyMessage = 'Không có dữ liệu' }: CustomTableProps<T>) {
    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-10 bg-muted rounded mb-4" />
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/50 rounded mb-2" />
                ))}
            </div>
        );
    }

    if (!data.length) {
        return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>;
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
                <thead>
                    <tr className="border-b bg-muted/50">
                        {columns.map((column, index) => (
                            <th
                                key={index}
                                className={`px-4 py-3 font-medium text-foreground ${column.className || ''}`}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, rowIndex) => (
                        <tr key={rowIndex} className="border-b hover:bg-muted/50">
                            {columns.map((column, colIndex) => (
                                <td key={colIndex} className={`px-4 py-3 ${column.className || ''}`}>
                                    {typeof column.accessor === 'function'
                                        ? column.accessor(item)
                                        : item[column.accessor] as React.ReactNode}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
    const t = useTranslations();

    const columns: Column[] = [
        {
            header: t('common.date'),
            accessor: 'date',
            className: 'w-28 sm:w-32',
        },
        {
            header: t('common.type'),
            accessor: (item: Transaction) => {
                let bgColor = '';
                let textColor = '';
                let text = '';

                switch (item.type) {
                    case 'income':
                        bgColor = 'bg-green-100';
                        textColor = 'text-green-800';
                        text = t('income.manage');
                        break;
                    case 'expense':
                        bgColor = 'bg-red-100';
                        textColor = 'text-red-800';
                        text = t('expense.manage');
                        break;
                    case 'loan':
                        bgColor = 'bg-purple-100';
                        textColor = 'text-purple-800';
                        text = t('loan.manage');
                        break;
                }

                return (
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
                    >
                        {text}
                    </span>
                );
            },
            className: 'w-20 sm:w-24',
        },
        {
            header: t('common.category'),
            accessor: (item: Transaction) => {
                let translatedCategory = item.category;
                let bgColor = '';
                let textColor = '';

                if (item.type === 'income') {
                    bgColor = 'bg-green-100';
                    textColor = 'text-green-800';
                    if (['SALARY', 'BONUS', 'INVESTMENT', 'BUSINESS', 'SAVINGS', 'OTHER'].includes(item.category)) {
                        const normalizedCategory = item.category.toLowerCase();
                        translatedCategory = t(`income.category.${normalizedCategory}`);
                    }
                }

                else if (item.type === 'expense') {
                    bgColor = 'bg-red-100';
                    textColor = 'text-red-800';
                    if (['FOOD', 'TRANSPORT', 'SHOPPING', 'ENTERTAINMENT', 'BILLS', 'HEALTH', 'EDUCATION', 'OTHER'].includes(item.category)) {
                        const normalizedCategory = item.category.toLowerCase();
                        translatedCategory = t(`expense.category.${normalizedCategory}`);
                    }
                }

                else if (item.type === 'loan') {
                    bgColor = 'bg-purple-100';
                    textColor = 'text-purple-800';
                    if (['bank', 'credit', 'individual', 'company', 'other'].includes(item.category)) {
                        translatedCategory = t(`loan.lenderTypes.${item.category}`);
                    }
                }

                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${bgColor} ${textColor}`}>
                        {translatedCategory}
                    </span>
                );
            },
            className: 'w-32 sm:w-40',
        },
        {
            header: t('common.description'),
            accessor: 'description',
        },
        {
            header: t('common.amount'),
            accessor: (item: Transaction) => {
                let textColor = '';
                switch (item.type) {
                    case 'income':
                        textColor = 'text-green-600';
                        break;
                    case 'expense':
                        textColor = 'text-red-600';
                        break;
                    case 'loan':
                        textColor = 'text-purple-600';
                        break;
                }
                return (
                    <span className={textColor}>
                        {formatCurrency(item.amount)}
                    </span>
                );
            },
            className: 'w-28 sm:w-32 text-right',
        },
    ]

    const formattedTransactions = transactions.map((transaction) => ({
        ...transaction,
        date: formatDate(transaction.date),
    }))

    return (
        <CustomTable
            data={formattedTransactions}
            columns={columns}
            isLoading={isLoading}
            emptyMessage={t('common.noData')}
        />
    )
}

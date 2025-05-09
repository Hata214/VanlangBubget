'use client'

import { ReactNode, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export type SortDirection = 'asc' | 'desc' | null;

interface SortableColumn<T> {
    header: string
    accessor: keyof T | ((item: T) => ReactNode)
    className?: string
    sortable?: boolean
    sortKey?: string
}

interface SortableTableProps<T> {
    data: T[]
    columns: readonly SortableColumn<T>[]
    isLoading?: boolean
    onRowClick?: (item: T) => void
    emptyMessage?: string
    className?: string
    highlightId?: string | null
    getRowId?: (item: T) => string
    defaultSortField?: string
    defaultSortDirection?: SortDirection
    onSort?: (field: string, direction: SortDirection) => void
}

export function SortableTable<T>({
    data,
    columns,
    isLoading,
    onRowClick,
    emptyMessage = 'Không có dữ liệu',
    className,
    highlightId,
    getRowId,
    defaultSortField,
    defaultSortDirection = null,
    onSort,
    ...props
}: SortableTableProps<T>) {
    const [sortField, setSortField] = useState<string | null>(defaultSortField || null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

    const handleSort = useCallback((field: string) => {
        let newDirection: SortDirection = 'asc';

        if (sortField === field) {
            if (sortDirection === 'asc') {
                newDirection = 'desc';
            } else if (sortDirection === 'desc') {
                newDirection = null;
            } else {
                newDirection = 'asc';
            }
        }

        setSortField(newDirection === null ? null : field);
        setSortDirection(newDirection);

        if (onSort) {
            onSort(field, newDirection);
        }
    }, [sortField, sortDirection, onSort]);

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-10 bg-muted rounded mb-4" />
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/50 rounded mb-2" />
                ))}
            </div>
        )
    }

    if (!data.length) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                {emptyMessage}
            </div>
        )
    }

    // Sắp xếp dữ liệu nếu có trường sắp xếp
    const sortedData = [...data];
    if (sortField && sortDirection) {
        sortedData.sort((a, b) => {
            const aValue = typeof a[sortField as keyof T] === 'function'
                ? (a[sortField as keyof T] as any)()
                : a[sortField as keyof T];
            const bValue = typeof b[sortField as keyof T] === 'function'
                ? (b[sortField as keyof T] as any)()
                : b[sortField as keyof T];

            if (aValue === bValue) return 0;

            const comparison = aValue < bValue ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }

    return (
        <div className="w-full overflow-x-auto">
            <table
                className={cn(
                    'w-full border-collapse text-left text-sm',
                    className
                )}
                {...props}
            >
                <thead>
                    <tr className="border-b bg-muted/50">
                        {columns.map((column, index) => {
                            const sortKey = column.sortKey || column.accessor as string;
                            const isSortable = column.sortable !== false && typeof sortKey === 'string';

                            return (
                                <th
                                    key={index}
                                    className={cn(
                                        'px-4 py-3 font-medium text-foreground',
                                        isSortable && 'cursor-pointer select-none',
                                        column.className
                                    )}
                                    onClick={isSortable ? () => handleSort(sortKey) : undefined}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{column.header}</span>
                                        {isSortable && (
                                            <span className="ml-2 inline-flex">
                                                {sortField === sortKey ? (
                                                    sortDirection === 'asc' ? (
                                                        <ArrowUp className="h-4 w-4" />
                                                    ) : sortDirection === 'desc' ? (
                                                        <ArrowDown className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 opacity-30" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="h-4 w-4 opacity-30" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((item, rowIndex) => {
                        const rowId = getRowId ? getRowId(item) : `row-${rowIndex}`;
                        const isHighlighted = highlightId && rowId === highlightId;

                        return (
                            <tr
                                key={rowIndex}
                                id={rowId}
                                onClick={() => onRowClick?.(item)}
                                className={cn(
                                    'border-b transition-colors',
                                    isHighlighted
                                        ? 'bg-yellow-100 dark:bg-yellow-900/20 animate-pulse'
                                        : 'hover:bg-muted/50',
                                    onRowClick && 'cursor-pointer'
                                )}
                            >
                                {columns.map((column, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={cn('px-4 py-3', column.className)}
                                    >
                                        {typeof column.accessor === 'function'
                                            ? column.accessor(item)
                                            : (item[column.accessor] as ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    )
} 
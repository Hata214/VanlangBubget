'use client'

import { useState } from 'react'
import { Budget } from '@/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { BudgetForm } from './BudgetForm'
import { formatCurrency } from '@/lib/utils'
import { Edit2, Trash2 } from 'lucide-react'

interface Column<T> {
    header: string
    accessor: keyof T | ((item: T) => React.ReactNode)
    className?: string
}

interface CustomTableProps<T> {
    data: T[]
    columns: readonly Column<T>[]
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

const calculatePercentage = (spent: number, total: number) => {
    return Math.round((spent / total) * 100)
}

interface BudgetListProps {
    budgets: Budget[]
    isLoading?: boolean
    categories: string[]
    onEdit: (id: string, data: Omit<Budget, 'id' | 'userId' | 'spent' | 'createdAt' | 'updatedAt'>) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

export function BudgetList({
    budgets,
    isLoading,
    categories,
    onEdit,
    onDelete,
}: BudgetListProps) {
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const columns: readonly Column<Budget>[] = [
        {
            header: 'Danh mục',
            accessor: 'category' as keyof Budget,
        },
        {
            header: 'Số tiền',
            accessor: (budget: Budget) => formatCurrency(budget.amount),
            className: 'text-right',
        },
        {
            header: 'Đã chi',
            accessor: (budget: Budget) => formatCurrency(budget.spent),
            className: 'text-right',
        },
        {
            header: 'Còn lại',
            accessor: (budget: Budget) => {
                const remaining = budget.amount - budget.spent
                return (
                    <span className={remaining < 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(remaining)}
                    </span>
                )
            },
            className: 'text-right',
        },
        {
            header: 'Tiến độ',
            accessor: (budget: Budget) => {
                const percentage = calculatePercentage(budget.spent, budget.amount)
                return (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className={`h-2.5 rounded-full ${percentage > 100 ? 'bg-red-600' : 'bg-green-600'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                )
            },
            className: 'w-32',
        },
        {
            header: 'Thao tác',
            accessor: (budget: Budget) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(budget)}
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(budget)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ),
            className: 'w-24',
        },
    ] as const

    const handleEdit = (budget: Budget) => {
        setSelectedBudget(budget)
        setIsEditModalOpen(true)
    }

    const handleDelete = (budget: Budget) => {
        setSelectedBudget(budget)
        setIsDeleteModalOpen(true)
    }

    const handleEditSubmit = async (data: Omit<Budget, 'id' | 'userId' | 'spent' | 'createdAt' | 'updatedAt'>) => {
        if (!selectedBudget) return
        setIsSubmitting(true)
        try {
            await onEdit(selectedBudget.id, data)
            setIsEditModalOpen(false)
        } catch (error) {
            console.error('Edit error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteSubmit = async () => {
        if (!selectedBudget) return
        setIsSubmitting(true)
        try {
            await onDelete(selectedBudget.id)
            setIsDeleteModalOpen(false)
        } catch (error) {
            console.error('Delete error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <CustomTable
                data={budgets}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="Chưa có ngân sách nào"
            />

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Chỉnh sửa ngân sách"
            >
                <BudgetForm
                    initialData={selectedBudget || undefined}
                    onSubmit={handleEditSubmit}
                    onCancel={() => setIsEditModalOpen(false)}
                    isSubmitting={isSubmitting}
                    categories={categories}
                />
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Xóa ngân sách"
            >
                <div className="space-y-4">
                    <Alert
                        variant="destructive"
                        message="Bạn có chắc chắn muốn xóa ngân sách này?"
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting}
                        >
                            Xóa
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
} 
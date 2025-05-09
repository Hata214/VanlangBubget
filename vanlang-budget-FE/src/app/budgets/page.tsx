'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { addBudget, updateBudget, deleteBudget } from '@/redux/features/budgetSlice'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { BudgetList } from '@/components/budgets/BudgetList'
import { Plus } from 'lucide-react'
import type { Budget } from '@/types'

const categories = [
    'Ăn uống',
    'Di chuyển',
    'Mua sắm',
    'Giải trí',
    'Sức khỏe',
    'Giáo dục',
    'Hóa đơn',
    'Khác',
]

export default function BudgetsPage() {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { budgets, isLoading, error } = useAppSelector((state) => state.budget)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAdd = async (data: Omit<Budget, 'id' | 'userId' | 'spent' | 'createdAt' | 'updatedAt'>) => {
        setIsSubmitting(true)
        try {
            await dispatch(addBudget(data)).unwrap()
            setIsAddModalOpen(false)
            router.refresh()
        } catch (error) {
            console.error('Add error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = async (id: string, data: Omit<Budget, 'id' | 'userId' | 'spent' | 'createdAt' | 'updatedAt'>) => {
        try {
            await dispatch(updateBudget({ id, ...data })).unwrap()
            router.refresh()
        } catch (error) {
            console.error('Edit error:', error)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await dispatch(deleteBudget(id)).unwrap()
            router.refresh()
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Quản lý ngân sách</h1>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm ngân sách
                </Button>
            </div>

            {error && (
                <Alert
                    variant="error"
                    message={error}
                />
            )}

            <Card>
                <BudgetList
                    budgets={budgets}
                    isLoading={isLoading}
                    categories={categories}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Thêm ngân sách"
            >
                <BudgetForm
                    onSubmit={handleAdd}
                    isSubmitting={isSubmitting}
                    categories={categories}
                />
            </Modal>
        </div>
    )
} 
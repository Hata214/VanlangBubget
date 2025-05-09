'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { addExpense, updateExpense, deleteExpense, fetchExpenses, fetchCategories } from '@/redux/features/expenseSlice'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { ExpenseForm, type ExpenseFormData } from '@/components/expenses/ExpenseForm'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { Expense } from '@/types'
import MainLayout from '@/components/layout/MainLayout'
import { useToast } from '@/contexts/ToastContext'

export default function ExpensesPage() {
    const t = useTranslations();
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { expenses, categories, totalExpense, isLoading, error } = useAppSelector((state) => state.expense)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { success, error: showError } = useToast()

    useEffect(() => {
        dispatch(fetchExpenses())
        dispatch(fetchCategories())
    }, [dispatch])

    // Đảm bảo expenses luôn là một mảng
    const safeExpenses = Array.isArray(expenses) ? expenses : [];

    const handleAdd = async (data: ExpenseFormData) => {
        setIsSubmitting(true)
        try {
            // Thêm chi tiêu mới và nhận kết quả trả về
            const newExpense = await dispatch(addExpense(data)).unwrap()
            setIsAddModalOpen(false)

            // Tải lại danh sách chi tiêu từ server sau khi thêm
            await dispatch(fetchExpenses()).unwrap()

            success(t('expense.addSuccess'), t('expense.addSuccessDetail'))
        } catch (error: any) {
            console.error('Add error:', error)
            showError(t('expense.addError'), error?.message || t('expense.addErrorDetail'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = async (id: string, data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        try {
            await dispatch(updateExpense({ id, ...data })).unwrap()

            // Tải lại danh sách chi tiêu từ server sau khi chỉnh sửa
            await dispatch(fetchExpenses()).unwrap()

            success(t('expense.updateSuccess'), t('expense.updateSuccessDetail'))

            // Không thay đổi URL sau khi cập nhật, tránh lỗi Maximum update depth
        } catch (error: any) {
            console.error('Edit error:', error)
            showError(t('expense.updateError'), error?.message || t('expense.updateErrorDetail'))
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await dispatch(deleteExpense(id)).unwrap()

            // Tải lại danh sách chi tiêu từ server sau khi xóa
            await dispatch(fetchExpenses()).unwrap()

            success(t('expense.deleteSuccess'), t('expense.deleteSuccessDetail'))
        } catch (error: any) {
            console.error('Delete error:', error)
            showError(t('expense.deleteError'), error?.message || t('expense.deleteErrorDetail'))
        }
    }

    return (
        <MainLayout>
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{t('expense.manage')}</h1>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('expense.add')}
                    </Button>
                </div>

                {error && (
                    <Alert
                        variant="error"
                        message={error}
                    />
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="p-6">
                        <div className="text-sm font-medium text-gray-500">
                            {t('expense.total')}
                        </div>
                        <div className="mt-2 text-3xl font-bold text-red-600">
                            {formatCurrency(totalExpense)}
                        </div>
                    </Card>
                </div>

                <Card>
                    <ExpenseList
                        expenses={safeExpenses}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </Card>

                <Modal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title={t('expense.add')}
                >
                    <ExpenseForm
                        onSubmit={handleAdd}
                        isSubmitting={isSubmitting}
                    />
                </Modal>
            </div>
        </MainLayout>
    )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { addIncome, updateIncome, deleteIncome, fetchIncomes, fetchCategories } from '@/redux/features/incomeSlice'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { IncomeForm, type IncomeFormData } from '@/components/incomes/IncomeForm'
import { IncomeList } from '@/components/incomes/IncomeList'
import { formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { Income } from '@/types'
import MainLayout from '@/components/layout/MainLayout'
import { useToast } from '@/contexts/ToastContext'

export default function IncomesPage() {
    const t = useTranslations();
    const searchParams = useSearchParams();
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { incomes, categories, totalIncome, totalSavings, isLoading, error } = useAppSelector((state) => state.income)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { success, error: showError } = useToast()

    // Lấy ID cần highlight từ query params
    const highlightId = searchParams.get('highlight');

    useEffect(() => {
        console.log('IncomePage: Component mounted, fetching data...');

        // Định nghĩa hàm fetchData không đồng bộ
        const fetchData = async () => {
            try {
                // Gọi API thu nhập và log kết quả
                console.log('IncomePage: Dispatching fetchIncomes action');
                const result = await dispatch(fetchIncomes()).unwrap();
                console.log('IncomePage: fetchIncomes result:', result);

                // Gọi API danh mục
                console.log('IncomePage: Dispatching fetchCategories action');
                await dispatch(fetchCategories()).unwrap();
            } catch (error) {
                console.error('IncomePage: Error fetching data:', error);
            }
        };

        // Gọi hàm fetchData
        fetchData();
    }, [dispatch]);

    // Đảm bảo incomes luôn là một mảng
    const safeIncomes = Array.isArray(incomes) ? incomes : [];
    console.log('IncomePage: incomes from Redux state:', safeIncomes);
    console.log('IncomePage: totalIncome from Redux state:', totalIncome);

    const handleAdd = async (data: IncomeFormData) => {
        setIsSubmitting(true)
        try {
            // Thêm thu nhập mới và nhận kết quả trả về
            const newIncome = await dispatch(addIncome(data)).unwrap()
            setIsAddModalOpen(false)

            // Tải lại danh sách thu nhập từ server sau khi thêm
            await dispatch(fetchIncomes()).unwrap()

            success(t('income.addSuccess'), t('income.addSuccessDetail'))

            // Cập nhật URL với highlight nhưng giữ nguyên tham số phân trang
            if (newIncome?.id) {
                const currentUrl = new URL(window.location.href);
                const currentPage = currentUrl.searchParams.get('page');

                // Cập nhật highlight ID
                currentUrl.searchParams.set('highlight', newIncome.id);

                // Đảm bảo giữ lại tham số page nếu đang có
                if (currentPage) {
                    currentUrl.searchParams.set('page', currentPage);
                }

                window.history.replaceState({}, '', currentUrl);
                // Không sử dụng router.push để tránh tải lại trang
                // router.push(`/incomes?highlight=${newIncome.id}`);
            }
        } catch (error: any) {
            console.error('Add error:', error)
            showError(t('income.addError'), error?.message || t('income.addErrorDetail'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = async (id: string, data: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        try {
            await dispatch(updateIncome({ id, ...data })).unwrap()

            // Tải lại danh sách thu nhập từ server sau khi chỉnh sửa
            await dispatch(fetchIncomes()).unwrap()

            success(t('income.updateSuccess'), t('income.updateSuccessDetail'))

            // Cập nhật URL với highlight nhưng giữ nguyên tham số phân trang
            const currentUrl = new URL(window.location.href);
            const currentPage = currentUrl.searchParams.get('page');

            // Cập nhật highlight ID
            currentUrl.searchParams.set('highlight', id);

            // Đảm bảo giữ lại tham số page nếu đang có
            if (currentPage) {
                currentUrl.searchParams.set('page', currentPage);
            }

            window.history.replaceState({}, '', currentUrl);
            // Không sử dụng router.push để tránh tải lại trang
            // router.push(`/incomes?highlight=${id}`);
        } catch (error: any) {
            console.error('Edit error:', error)
            showError(t('income.updateError'), error?.message || t('income.updateErrorDetail'))
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await dispatch(deleteIncome(id)).unwrap()

            // Tải lại danh sách thu nhập từ server sau khi xóa
            await dispatch(fetchIncomes()).unwrap()

            success(t('income.deleteSuccess'), t('income.deleteSuccessDetail'))
        } catch (error: any) {
            console.error('Delete error:', error)
            showError(t('income.deleteError'), error?.message || t('income.deleteErrorDetail'))
        }
    }

    return (
        <MainLayout>
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{t('income.manage')}</h1>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('income.add')}
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
                            {t('income.total')}
                        </div>
                        <div className="mt-2 text-3xl font-bold text-green-600">
                            {formatCurrency(totalIncome)}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="text-sm font-medium text-gray-500">
                            {t('income.category.savings')}
                        </div>
                        <div className="mt-2 text-3xl font-bold text-green-600">
                            {formatCurrency(totalSavings)}
                        </div>
                    </Card>
                </div>

                <Card>
                    <IncomeList
                        incomes={safeIncomes}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </Card>

                <Modal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title={t('income.add')}
                >
                    <IncomeForm
                        onSubmit={handleAdd}
                        isSubmitting={isSubmitting}
                    />
                </Modal>
            </div>
        </MainLayout>
    )
} 
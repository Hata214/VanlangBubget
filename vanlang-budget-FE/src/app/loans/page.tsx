'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { addLoan, updateLoan, deleteLoan, fetchLoans } from '@/redux/features/loanSlice'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { LoanForm } from '@/components/loans/LoanForm'
import { LoanList } from '@/components/loans/LoanList'
import { formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { Loan } from '@/types'
import MainLayout from '@/components/layout/MainLayout'
import { useToast } from '@/contexts/ToastContext'

export default function LoansPage() {
    const t = useTranslations();
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { loans, totalLoan, isLoading, error } = useAppSelector((state) => state.loan)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { success, error: showError } = useToast()

    useEffect(() => {
        dispatch(fetchLoans())
    }, [dispatch])

    useEffect(() => {
        if (loans && loans.length > 0) {
            console.log('Đã tải lại danh sách khoản vay, cập nhật dữ liệu hiển thị...');

            const totalLoanDisplay = document.querySelector('.total-loan-display');
            if (totalLoanDisplay) {
                totalLoanDisplay.classList.add('animate-pulse');
                setTimeout(() => {
                    totalLoanDisplay.classList.remove('animate-pulse');
                }, 1000);
            }

            const totalLoanWithInterestDisplay = document.querySelector('.total-loan-with-interest');
            if (totalLoanWithInterestDisplay) {
                totalLoanWithInterestDisplay.classList.add('animate-pulse');
                setTimeout(() => {
                    totalLoanWithInterestDisplay.classList.remove('animate-pulse');
                }, 1000);
            }
        }
    }, [loans]);

    // Đảm bảo loans luôn là một mảng
    const safeLoans = Array.isArray(loans) ? loans : [];

    const handleAdd = async (dataFromForm: {
        amount: number;
        lender: string;
        interestRate: number;
        startDate: string;
        dueDate: string;
        description?: string;
        status?: "ACTIVE" | "PAID" | "OVERDUE";
        interestRateType?: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
        lenderType?: string; // Giả sử LoanForm có thể bao gồm trường này
    }) => {
        setIsSubmitting(true)
        try {
            // Chuẩn bị payload cho Redux action, đảm bảo các trường bắt buộc có giá trị
            const payload: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
                amount: dataFromForm.amount,
                lender: dataFromForm.lender,
                interestRate: dataFromForm.interestRate,
                startDate: dataFromForm.startDate,
                dueDate: dataFromForm.dueDate,
                description: dataFromForm.description || '', // Mặc định nếu undefined
                status: dataFromForm.status || 'ACTIVE',       // Mặc định là ACTIVE
                interestRateType: dataFromForm.interestRateType || 'YEAR', // Mặc định là YEAR
                // Giả sử lenderType là tùy chọn hoặc có giá trị mặc định nếu Loan type yêu cầu
                ...(dataFromForm.lenderType && { lenderType: dataFromForm.lenderType }),
            };
            const newLoan = await dispatch(addLoan(payload)).unwrap()
            setIsAddModalOpen(false)
            await dispatch(fetchLoans()).unwrap()
            success(t('loan.addSuccess'), t('loan.addSuccessDetail'))
        } catch (error: any) {
            console.error('Add error:', error)
            showError(t('loan.addError'), error?.message || t('loan.addErrorDetail'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = async (id: string, data: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
        try {
            console.log('Start editing loan:', id);
            console.log('Edit data received:', data);

            // Đảm bảo status được chuẩn hóa
            if (data.status) {
                data.status = data.status.toUpperCase() as 'ACTIVE' | 'PAID' | 'OVERDUE';
            }

            // Tạo payload cập nhật
            await dispatch(updateLoan({
                id,
                data
            })).unwrap();

            // Gọi ngay fetchLoans để cập nhật lại toàn bộ danh sách và tổng tiền
            console.log('Loan updated successfully, refreshing data...');
            await dispatch(fetchLoans()).unwrap();

            // Hiển thị thông báo thành công
            success(t('loan.updateSuccess'), t('loan.updateSuccessDetail'));

            // Cập nhật URL với highlight nhưng không thay đổi lịch sử duyệt web
            // Giữ lại tham số page hiện tại nếu có
            const currentUrl = new URL(window.location.href);
            const currentPage = currentUrl.searchParams.get('page');

            currentUrl.searchParams.set('highlight', id);
            // Đảm bảo giữ lại tham số page nếu đang có
            if (currentPage) {
                currentUrl.searchParams.set('page', currentPage);
            }

            window.history.replaceState({}, '', currentUrl);

            // Không sử dụng router.push để tránh tải lại trang
            // router.push(`/loans?highlight=${id}`);
        } catch (error: any) {
            console.error('Edit error:', error);
            showError(t('loan.updateError'), error?.message || t('loan.updateErrorDetail'));
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await dispatch(deleteLoan(id)).unwrap()
            router.refresh()
            success(t('loan.deleteSuccess'), t('loan.deleteSuccessDetail'))
        } catch (error: any) {
            console.error('Delete error:', error)
            showError(t('loan.deleteError'), error?.message || t('loan.deleteErrorDetail'))
        }
    }

    return (
        <MainLayout>
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{t('loan.manage')}</h1>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('loan.add')}
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
                            {t('loan.totalLoanAmount')}
                        </div>
                        <div className="mt-2 text-3xl font-bold text-red-600 total-loan-display">
                            {formatCurrency(totalLoan)}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="text-sm font-medium text-gray-500">
                            {t('loan.totalDebtWithInterest')}
                        </div>
                        <div className="mt-2 text-3xl font-bold text-purple-700 total-loan-with-interest">
                            {formatCurrency(safeLoans.reduce((total, loan) => {
                                // Chỉ tính những khoản vay có trạng thái ACTIVE
                                const loanStatus = loan.status?.toUpperCase() || '';
                                if (loanStatus !== 'ACTIVE') {
                                    return total;
                                }

                                // Tính số tiền còn lại sau khi trừ tiền trả trước (nếu có)
                                const totalPaid = loan.payments ? loan.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
                                const remainingAmount = Math.max(0, loan.amount - totalPaid);

                                // Tính số tiền lãi dựa trên thông tin khoản vay
                                const startDate = new Date(loan.startDate);
                                const dueDate = new Date(loan.dueDate);
                                const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                let interestMultiplier = 0;
                                switch (loan.interestRateType) {
                                    case 'DAY':
                                        interestMultiplier = diffDays;
                                        break;
                                    case 'WEEK':
                                        interestMultiplier = diffDays / 7;
                                        break;
                                    case 'MONTH':
                                        interestMultiplier = diffDays / 30;
                                        break;
                                    case 'QUARTER':
                                        interestMultiplier = diffDays / 90;
                                        break;
                                    case 'YEAR':
                                        interestMultiplier = diffDays / 365;
                                        break;
                                }

                                // Tính lãi trên số tiền còn lại sau khi trừ tiền trả trước
                                const interestAmount = Math.round(remainingAmount * (loan.interestRate / 100) * interestMultiplier);

                                // Tổng tiền phải trả = Số tiền còn lại + Tiền lãi
                                return total + remainingAmount + interestAmount;
                            }, 0))}
                        </div>
                    </Card>
                </div>

                <Card>
                    <LoanList
                        loans={safeLoans}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </Card>

                <Modal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title={t('loan.add')}
                >
                    <LoanForm
                        onSubmit={handleAdd}
                        isSubmitting={isSubmitting}
                        initialData={{
                            amount: 0,
                            lender: '',
                            interestRate: 0,
                            startDate: new Date().toISOString().split('T')[0], // Ngày hiện tại
                            dueDate: '',
                            description: '',
                            status: 'ACTIVE', // Trạng thái mặc định
                            interestRateType: 'YEAR', // Loại lãi suất mặc định
                            // lenderType: 'INDIVIDUAL', // Đã xóa vì LoanForm không chấp nhận
                        }}
                        mode="add"
                    />
                </Modal>
            </div>
        </MainLayout>
    )
}

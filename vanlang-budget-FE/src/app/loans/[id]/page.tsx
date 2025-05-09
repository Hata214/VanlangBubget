'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { updateLoan, deleteLoan } from '@/redux/features/loanSlice'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { LoanForm } from '@/components/loans/LoanForm'
import { LoanPaymentList } from '@/components/loans/LoanPaymentList'
import { LoanStatistics } from '@/components/loans/LoanStatistics'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Edit2, Trash2 } from 'lucide-react'
import type { Loan, LoanPayment } from '@/types'
import { loanService } from '@/services/loanService'
import { useToast } from '@/contexts/ToastContext'
import { useTranslations } from 'next-intl'
import React from 'react'

// Định nghĩa Interface cho Loan
interface CustomLoan {
    _id: string;
    id?: string;
    amount: number;
    lender: string;
    lenderType: string;
    interestRate: number;
    interestRateType: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
    startDate: string;
    dueDate: string;
    status: "ACTIVE" | "PAID" | "OVERDUE";
    description?: string;
    notes?: string;
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
    payments?: LoanPayment[];
}

// Định nghĩa kiểu dữ liệu cho dữ liệu cập nhật
type LoanUpdateData = {
    amount: number;
    lender: string;
    lenderType?: string;
    interestRate: number;
    interestRateType: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
    startDate: string;
    dueDate: string;
    status: "ACTIVE" | "PAID" | "OVERDUE";
    description?: string;
};

export default function LoanDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { selectedLoan: loan, isLoading, error } = useAppSelector((state) => state.loan);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: showError } = useToast();
    const t = useTranslations();

    // Lấy ID của khoản vay từ params hoặc từ đối tượng loan
    const loanId = useMemo(() => {
        // Lấy id từ params
        const id = params?.id as string;
        // Chắc chắn trả về một chuỗi không rỗng
        return id || '';
    }, [params]);

    useEffect(() => {
        // Điều này đảm bảo rằng loanId luôn là một chuỗi hợp lệ
        if (!loanId) {
            router.push('/loans');
        }
    }, [loanId, router]);

    // Thêm reference cho card element
    const cardRef = React.useRef<HTMLDivElement>(null);

    // Tính toán số tiền lãi và tổng số tiền phải trả
    const loanCalculations = useMemo(() => {
        if (!loan) return { interestAmount: 0, totalAmount: 0, daysRemaining: 0, isOverdue: false };

        // Tính số ngày giữa ngày vay và ngày đáo hạn
        const startDate = new Date(loan.startDate);
        const dueDate = new Date(loan.dueDate);
        const today = new Date();
        const loanDaysDiff = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        const remainingDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const isOverdue = remainingDays < 0;

        // Tính toán lãi suất dựa trên loại lãi suất
        let interestMultiplier = 1;
        switch (loan.interestRateType) {
            case 'DAY':
                interestMultiplier = loanDaysDiff;
                break;
            case 'WEEK':
                interestMultiplier = loanDaysDiff / 7;
                break;
            case 'MONTH':
                interestMultiplier = loanDaysDiff / 30;
                break;
            case 'QUARTER':
                interestMultiplier = loanDaysDiff / 90;
                break;
            case 'YEAR':
                interestMultiplier = loanDaysDiff / 365;
                break;
            default:
                interestMultiplier = 1;
        }

        // Tính số tiền lãi
        const interestAmount = Math.round(loan.amount * (loan.interestRate / 100) * interestMultiplier);

        // Tổng số tiền phải trả
        const totalAmount = loan.amount + interestAmount;

        return {
            interestAmount,
            totalAmount,
            daysRemaining: remainingDays,
            isOverdue
        };
    }, [loan]);

    const handleUpdateLoan = async (data: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!loan || !loanId) return;
        setIsSubmitting(true);
        try {
            // Kiểm tra thay đổi trạng thái
            const oldStatus = loan.status?.toUpperCase();
            const newStatus = data.status?.toUpperCase();
            const hasStatusChange = oldStatus !== newStatus && oldStatus && newStatus;

            console.log('Updating loan with data:', data);
            if (hasStatusChange) {
                console.log(`Status change: ${oldStatus} -> ${newStatus}`);
            }

            await dispatch(updateLoan({ id: loanId, data })).unwrap();
            setShowEditModal(false);
            router.refresh();

            // Hiển thị thông báo dựa trên thay đổi
            if (hasStatusChange) {
                // Hiển thị thông báo dựa trên trạng thái mới
                let statusTitle = '';
                let statusMessage = '';

                switch (newStatus) {
                    case 'PAID':
                        statusTitle = 'Khoản vay đã được thanh toán';
                        statusMessage = `Khoản vay "${loan.description}" đã được đánh dấu là đã trả.`;
                        break;
                    case 'ACTIVE':
                        statusTitle = 'Khoản vay đang hoạt động';
                        statusMessage = `Khoản vay "${loan.description}" đã được đánh dấu là đang vay.`;
                        break;
                    case 'OVERDUE':
                        statusTitle = 'Khoản vay đã quá hạn';
                        statusMessage = `Khoản vay "${loan.description}" đã được đánh dấu là quá hạn.`;
                        break;
                    default:
                        statusTitle = 'Trạng thái khoản vay đã thay đổi';
                        statusMessage = `Trạng thái khoản vay "${loan.description}" đã được cập nhật.`;
                }

                // Hiển thị thông báo chi tiết về thay đổi trạng thái
                success(statusTitle, statusMessage);
            } else {
                // Thông báo cập nhật thông thường
                success(t('loan.updateSuccess'), t('loan.updateSuccessDetail'));
            }
        } catch (error: any) {
            console.error('Update loan error:', error);
            showError(t('loan.updateError'), error?.message || t('loan.updateErrorDetail'));
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDeleteLoan = async () => {
        if (!loan || !loanId) return;
        setIsSubmitting(true);
        try {
            await dispatch(deleteLoan(loanId)).unwrap();
            router.push('/loans');
            success(t('loan.deleteSuccess'), t('loan.deleteSuccessDetail'));
        } catch (error: any) {
            console.error('Delete loan error:', error);
            showError(t('loan.deleteError'), error?.message || t('loan.deleteErrorDetail'));
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddPayment = async (formData: FormData) => {
        if (!loan || !loanId) return;
        setIsSubmitting(true);
        try {
            const data: Omit<LoanPayment, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
                loanId: loanId,
                amount: Number(formData.get('amount')),
                paymentDate: formData.get('paymentDate') as string,
                description: formData.get('description') as string,
            }

            const files = formData.getAll('attachments') as File[];
            if (files.length > 0) {
                const attachmentUrls = await Promise.all(
                    files.map(file => loanService.uploadAttachment(loanId, 'temp', file))
                );
                data.attachments = attachmentUrls;
            }

            await loanService.addPayment(loanId, data);
            router.refresh();
            success(t('loan.payment.addSuccess'), t('loan.payment.addSuccessDetail'));
        } catch (error: any) {
            console.error('Add payment error:', error);
            showError(t('loan.payment.addError'), error?.message || t('loan.payment.addErrorDetail'));
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleEditPayment = async (paymentId: string, formData: FormData) => {
        if (!loan || !loanId) return;
        setIsSubmitting(true);
        try {
            const data: Partial<Omit<LoanPayment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {
                amount: Number(formData.get('amount')),
                paymentDate: formData.get('paymentDate') as string,
                description: formData.get('description') as string,
            }

            const files = formData.getAll('attachments') as File[];
            if (files.length > 0) {
                const attachmentUrls = await Promise.all(
                    files.map(file => loanService.uploadAttachment(loanId, paymentId, file))
                );
                data.attachments = attachmentUrls;
            }

            await loanService.updatePayment(loanId, paymentId, data);
            router.refresh();
            success(t('loan.payment.updateSuccess'), t('loan.payment.updateSuccessDetail'));
        } catch (error: any) {
            console.error('Edit payment error:', error);
            showError(t('loan.payment.updateError'), error?.message || t('loan.payment.updateErrorDetail'));
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDeletePayment = async (paymentId: string) => {
        if (!loan || !loanId) return;
        setIsSubmitting(true);
        try {
            await loanService.deletePayment(loanId, paymentId);
            router.refresh();
            success(t('loan.payment.deleteSuccess'), t('loan.payment.deleteSuccessDetail'));
        } catch (error: any) {
            console.error('Delete payment error:', error);
            showError(t('loan.payment.deleteError'), error?.message || t('loan.payment.deleteErrorDetail'));
        } finally {
            setIsSubmitting(false);
        }
    }

    // Quay lại danh sách khoản vay, giữ nguyên phân trang
    const handleBack = () => {
        // Trích xuất tham số page từ URL trước đó (nếu có)
        const referrer = document.referrer;
        const currentUrl = new URL(window.location.origin + '/loans');

        try {
            if (referrer && referrer.includes('/loans')) {
                const referrerUrl = new URL(referrer);
                const pageParam = referrerUrl.searchParams.get('page');

                if (pageParam) {
                    currentUrl.searchParams.set('page', pageParam);
                }
            }
        } catch (error) {
            console.error('Error parsing referrer URL:', error);
        }

        // Quay lại trang danh sách khoản vay với tham số page (nếu có)
        router.push(currentUrl.toString());
    }

    if (!loan) {
        return null
    }

    // Bảo đảm loanId luôn là string hợp lệ
    const safeLoanId = loanId || params?.id as string || '';

    // Lấy màu sắc theo trạng thái khoản vay
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-blue-100 text-blue-800';
            case 'PAID':
                return 'bg-green-100 text-green-800';
            case 'OVERDUE':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6 loan-details-container">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Chi tiết khoản vay</h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                    >
                        Quay lại
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowEditModal(true)}
                    >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                    </Button>
                </div>
            </div>

            {error && (
                <Alert
                    variant="error"
                    message={error}
                />
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="loan-details-card transition-all duration-500" ref={cardRef}>
                    <CardHeader>
                        <CardTitle>Thông tin khoản vay</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-2 gap-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Số tiền vay
                                </dt>
                                <dd className="mt-1 text-lg font-semibold">
                                    {formatCurrency(loan.amount)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Người cho vay
                                </dt>
                                <dd className="mt-1">{loan.lender}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Lãi suất
                                </dt>
                                <dd className="mt-1">{loan.interestRate}%</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Số tiền lãi
                                </dt>
                                <dd className="mt-1 text-amber-600 font-medium">
                                    {formatCurrency(loanCalculations.interestAmount)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Tổng cần trả
                                </dt>
                                <dd className="mt-1 text-red-600 font-medium">
                                    {formatCurrency(loanCalculations.totalAmount)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Ngày vay
                                </dt>
                                <dd className="mt-1">{formatDate(loan.startDate)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Ngày đáo hạn
                                </dt>
                                <dd className="mt-1">{formatDate(loan.dueDate)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Thời gian còn lại
                                </dt>
                                <dd className={`mt-1 ${loanCalculations.isOverdue ? 'text-red-600' : loanCalculations.daysRemaining < 7 ? 'text-amber-600' : ''}`}>
                                    {loanCalculations.isOverdue
                                        ? `Quá hạn ${Math.abs(loanCalculations.daysRemaining)} ngày`
                                        : `Còn ${loanCalculations.daysRemaining} ngày`}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Trạng thái
                                </dt>
                                <dd className="mt-1">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loan.status === 'ACTIVE'
                                            ? 'bg-blue-100 text-blue-800'
                                            : loan.status === 'PAID'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {loan.status === 'ACTIVE'
                                            ? 'Đang vay'
                                            : loan.status === 'PAID'
                                                ? 'Đã trả'
                                                : 'Quá hạn'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                        {loan.description && (
                            <div className="mt-4">
                                <dt className="text-sm font-medium text-gray-500">
                                    Ghi chú
                                </dt>
                                <dd className="mt-1">{loan.description}</dd>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Thống kê</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LoanStatistics loans={[{ ...loan, id: safeLoanId }]} />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent>
                    <LoanPaymentList
                        loanId={safeLoanId}
                        loanAmount={loan.amount}
                        payments={loan.payments || []}
                        isLoading={isLoading}
                        onAddPayment={handleAddPayment}
                        onEditPayment={handleEditPayment}
                        onDeletePayment={handleDeletePayment}
                    />
                </CardContent>
            </Card>

            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Chỉnh sửa khoản vay"
            >
                <LoanForm
                    initialData={{
                        amount: loan.amount,
                        lender: loan.lender,
                        interestRate: loan.interestRate,
                        startDate: loan.startDate,
                        dueDate: loan.dueDate,
                        description: loan.description,
                    }}
                    onSubmit={handleUpdateLoan}
                    isSubmitting={isSubmitting}
                    mode="edit"
                />
            </Modal>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Xóa khoản vay"
            >
                <Alert variant="destructive">
                    <AlertTitle>Bạn có chắc chắn muốn xóa khoản vay này?</AlertTitle>
                    <AlertDescription>
                        Tất cả thông tin về khoản vay và lịch sử trả sẽ bị xóa. Hành động này không thể hoàn tác.
                    </AlertDescription>
                </Alert>
                <div className="flex justify-end gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteLoan}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang xóa...' : 'Xóa'}
                    </Button>
                </div>
            </Modal>

            <style jsx global>{`
    .highlight-target {
        box-shadow: 0 0 25px 8px rgba(245, 158, 11, 0.8) !important;
        transform: scale(1.04);
                    z-index: 10;
                    transition: all 0.3s ease;
    }
`}</style>
        </div>
    )
} 
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LoanPaymentForm } from './LoanPaymentForm'
import { Edit2, Trash2, FileText } from 'lucide-react'
import type { LoanPayment } from '@/types'

interface LoanPaymentListProps {
    loanId: string
    loanAmount: number
    payments: LoanPayment[]
    isLoading?: boolean
    onAddPayment: (data: FormData) => Promise<void>
    onEditPayment: (id: string, data: FormData) => Promise<void>
    onDeletePayment: (id: string) => Promise<void>
}

export function LoanPaymentList({
    loanId,
    loanAmount,
    payments,
    isLoading,
    onAddPayment,
    onEditPayment,
    onDeletePayment,
}: LoanPaymentListProps) {
    const [selectedPayment, setSelectedPayment] = useState<LoanPayment | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showAttachmentsModal, setShowAttachmentsModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const remainingAmount = loanAmount - totalPaid

    const handleAdd = async (data: FormData) => {
        setIsSubmitting(true)
        try {
            await onAddPayment(data)
            setShowAddModal(false)
        } catch (error) {
            console.error('Add payment error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = async (data: FormData) => {
        if (!selectedPayment) return
        setIsSubmitting(true)
        try {
            await onEditPayment(selectedPayment.id, data)
            setShowEditModal(false)
            setSelectedPayment(null)
        } catch (error) {
            console.error('Edit payment error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedPayment) return
        setIsSubmitting(true)
        try {
            await onDeletePayment(selectedPayment.id)
            setShowDeleteModal(false)
            setSelectedPayment(null)
        } catch (error) {
            console.error('Delete payment error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const columns = [
        {
            header: 'Ngày trả',
            accessor: (payment: LoanPayment) => formatDate(payment.paymentDate),
            className: 'w-32',
        },
        {
            header: 'Số tiền',
            accessor: (payment: LoanPayment) => formatCurrency(payment.amount),
            className: 'w-32 text-right',
        },
        {
            header: 'Ghi chú',
            accessor: 'description' as const,
        },
        {
            header: 'Tệp đính kèm',
            accessor: (payment: LoanPayment) => (
                payment.attachments && payment.attachments.length > 0 ? (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedPayment(payment)
                            setShowAttachmentsModal(true)
                        }}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                        <FileText className="w-4 h-4" />
                        <span>{payment.attachments.length} tệp</span>
                    </button>
                ) : null
            ),
            className: 'w-32',
        },
        {
            header: '',
            accessor: (payment: LoanPayment) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setSelectedPayment(payment)
                            setShowEditModal(true)
                        }}
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setSelectedPayment(payment)
                            setShowDeleteModal(true)
                        }}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ),
            className: 'w-24',
        },
    ]

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Lịch sử trả</h2>
                <Button onClick={() => setShowAddModal(true)}>Thêm khoản trả</Button>
            </div>

            <Table
                columns={columns}
                data={payments}
                isLoading={isLoading}
                emptyMessage="Chưa có khoản trả nào"
            />

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Thêm khoản trả"
            >
                <LoanPaymentForm
                    loanId={loanId}
                    remainingAmount={remainingAmount}
                    onSubmit={handleAdd}
                    isSubmitting={isSubmitting}
                />
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setSelectedPayment(null)
                }}
                title="Chỉnh sửa khoản trả"
            >
                {selectedPayment && (
                    <LoanPaymentForm
                        loanId={loanId}
                        remainingAmount={remainingAmount + selectedPayment.amount}
                        initialData={{
                            amount: selectedPayment.amount,
                            paymentDate: selectedPayment.paymentDate,
                            description: selectedPayment.description,
                            attachments: selectedPayment.attachments,
                        }}
                        onSubmit={handleEdit}
                        isSubmitting={isSubmitting}
                    />
                )}
            </Modal>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false)
                    setSelectedPayment(null)
                }}
                title="Xóa khoản trả"
            >
                <Alert variant="destructive">
                    <AlertTitle>Bạn có chắc chắn muốn xóa khoản trả này?</AlertTitle>
                    <AlertDescription>Hành động này không thể hoàn tác.</AlertDescription>
                </Alert>
                <div className="flex justify-end gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowDeleteModal(false)
                            setSelectedPayment(null)
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang xóa...' : 'Xóa'}
                    </Button>
                </div>
            </Modal>

            <Modal
                isOpen={showAttachmentsModal}
                onClose={() => {
                    setShowAttachmentsModal(false)
                    setSelectedPayment(null)
                }}
                title="Tệp đính kèm"
            >
                {selectedPayment?.attachments && (
                    <div className="grid grid-cols-2 gap-4">
                        {selectedPayment.attachments.map((attachment, index) => (
                            <div key={index} className="relative">
                                {attachment.endsWith('.pdf') ? (
                                    <a
                                        href={attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-4 border rounded hover:bg-gray-50"
                                    >
                                        <FileText className="w-8 h-8 text-blue-500" />
                                        <span className="text-sm truncate">PDF Document</span>
                                    </a>
                                ) : (
                                    <a
                                        href={attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <img
                                            src={attachment}
                                            alt={`Attachment ${index + 1}`}
                                            className="w-full aspect-square object-cover rounded"
                                        />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    )
} 
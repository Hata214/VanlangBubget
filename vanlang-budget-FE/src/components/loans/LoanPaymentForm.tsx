'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Textarea } from '@/components/ui/Textarea'
import { formatCurrency } from '@/lib/utils'
import { X, FileText, Image as ImageIcon } from 'lucide-react'

export interface LoanPaymentFormProps {
    loanId: string
    remainingAmount: number
    initialData?: {
        amount: number
        paymentDate: string
        description?: string
        attachments?: string[]
    }
    onSubmit: (data: FormData) => Promise<void>
    isSubmitting: boolean
}

export function LoanPaymentForm({
    loanId,
    remainingAmount,
    initialData,
    onSubmit,
    isSubmitting,
}: LoanPaymentFormProps) {
    const t = useTranslations();
    const [amount, setAmount] = useState(initialData?.amount || 0)
    const [paymentDate, setPaymentDate] = useState(
        initialData?.paymentDate || new Date().toISOString().split('T')[0]
    )
    const [description, setDescription] = useState(initialData?.description || '')
    const [files, setFiles] = useState<FileList | null>(null)
    const [previews, setPreviews] = useState<string[]>(initialData?.attachments || [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files
        if (selectedFiles) {
            setFiles(selectedFiles)
            // Create preview URLs for new files
            const newPreviews = Array.from(selectedFiles).map(file => URL.createObjectURL(file))
            setPreviews([...previews, ...newPreviews])
        }
    }

    const handleRemoveFile = (index: number) => {
        if (files) {
            const dt = new DataTransfer()
            const fileArray = Array.from(files)
            fileArray.splice(index, 1)
            fileArray.forEach(file => dt.items.add(file))
            setFiles(dt.files)
        }
        // Remove preview
        const newPreviews = [...previews]
        URL.revokeObjectURL(newPreviews[index]) // Clean up URL object
        newPreviews.splice(index, 1)
        setPreviews(newPreviews)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const formData = new FormData()
        formData.append('loanId', loanId)
        formData.append('amount', amount.toString())
        formData.append('paymentDate', paymentDate)
        formData.append('description', description)

        if (files) {
            Array.from(files).forEach((file) => {
                formData.append('attachments', file)
            })
        }

        await onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label htmlFor="amount" className="text-sm font-medium">
                    {t('loan.paymentAmount')} ({t('common.max')} {formatCurrency(remainingAmount)})
                </label>
                <CurrencyInput
                    id="amount"
                    placeholder={t('loan.enterPaymentAmount')}
                    value={amount}
                    onValueChange={(value) => {
                        if (value !== undefined && value > remainingAmount) {
                            setAmount(remainingAmount);
                        } else {
                            setAmount(value === undefined ? 0 : value);
                        }
                    }}
                    className="text-right"
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="paymentDate" className="text-sm font-medium">
                    {t('loan.paymentDate')}
                </label>
                <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="description" className="text-sm font-medium">
                    {t('common.description')}
                </label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="attachments" className="text-sm font-medium">
                    {t('loan.attachments')}
                </label>
                <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                />
                <p className="text-xs text-gray-500">
                    {t('loan.acceptedFileTypes')}
                </p>

                {/* File Previews */}
                {previews.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative group">
                                {preview.endsWith('.pdf') ? (
                                    <div className="flex items-center gap-2 p-4 border rounded">
                                        <FileText className="w-8 h-8 text-blue-500" />
                                        <span className="text-sm truncate">{t('loan.pdfDocument')}</span>
                                    </div>
                                ) : (
                                    <div className="relative aspect-square">
                                        <img
                                            src={preview}
                                            alt={`${t('loan.preview')} ${index + 1}`}
                                            className="w-full h-full object-cover rounded"
                                        />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index)}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t('common.saving') : initialData ? t('common.update') : t('common.add')}
                </Button>
            </div>
        </form>
    )
}
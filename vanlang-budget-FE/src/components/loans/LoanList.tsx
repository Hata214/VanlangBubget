'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { SearchFilter, type FilterOptions } from '@/components/common/SearchFilter'
import { Pagination } from '@/components/common/Pagination'
import { LoanForm } from './LoanForm'
import { LoanStatusIndicator } from './LoanStatusIndicator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Edit2, Trash2 } from 'lucide-react'
import type { Loan } from '@/types'
import type { ReactNode } from 'react'
import { SortableTable, SortDirection } from '@/components/ui/SortableTable'

interface LoanListProps {
    loans: Loan[]
    isLoading?: boolean
    onEdit: (id: string, data: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onRowClick?: (loan: Loan) => void
}

interface Column<T> {
    header: string
    accessor: keyof T | ((item: T) => ReactNode)
    className?: string
    sortable?: boolean
    sortKey?: string
}

export function LoanList({ loans, isLoading, onEdit, onDelete, onRowClick }: LoanListProps) {
    const t = useTranslations();
    const searchParams = useSearchParams()

    // Ban đầu khởi tạo trang từ URL (nếu có) hoặc mặc định là 1
    const [currentPage, setCurrentPage] = useState(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const pageParam = urlParams.get('page');
            return pageParam && !isNaN(Number(pageParam)) && Number(pageParam) > 0 ? Number(pageParam) : 1;
        }
        return 1;
    });

    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState<FilterOptions>({})
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Lưu trữ giá trị trang trước đó để tránh mất giá trị trong quá trình render lại
    const prevPageRef = useRef(currentPage);

    // Danh sách người cho vay
    const loanLenders = useMemo(() => [
        t('loan.lenderTypes.individual'),
        t('loan.lenderTypes.bank'),
        t('loan.lenderTypes.credit'),
        t('loan.lenderTypes.other')
    ], [t]);

    const getLocalizedLender = useCallback((lenderKey: string): string => {
        // Chuyển đổi các giá trị tiếng Anh sang hiển thị tiếng Việt
        switch (lenderKey?.toLowerCase()) {
            case 'individual':
                return t('loan.lenderTypes.individual');
            case 'bank':
                return t('loan.lenderTypes.bank');
            case 'credit':
                return t('loan.lenderTypes.credit');
            case 'other':
                return t('loan.lenderTypes.other');
            default:
                return lenderKey || t('loan.lenderTypes.other');
        }
    }, [t]);

    const filteredLoans = useMemo(() => {
        if (!Array.isArray(loans)) {
            console.warn('loans is not an array:', loans);
            return [];
        }

        return loans.filter((loan) => {
            // Tìm kiếm theo mô tả
            if (searchTerm && !loan.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
            }

            // Lọc theo người cho vay (thay vì danh mục)
            if (filters.category && loan.lender !== filters.category) {
                return false
            }

            // Lọc theo khoảng thời gian
            if (filters.filterDate) {
                const filterDate = new Date(filters.filterDate);
                const loanStartDate = new Date(loan.startDate);

                // So sánh theo ngày tháng năm (bỏ qua giờ phút giây)
                if (filterDate.getDate() !== loanStartDate.getDate() ||
                    filterDate.getMonth() !== loanStartDate.getMonth() ||
                    filterDate.getFullYear() !== loanStartDate.getFullYear()) {
                    return false;
                }
            }

            // Lọc theo khoảng tiền
            if (filters.minAmount && loan.amount < filters.minAmount) {
                return false
            }
            if (filters.maxAmount && loan.amount > filters.maxAmount) {
                return false
            }

            return true
        })
    }, [loans, searchTerm, filters])

    // Sắp xếp dữ liệu
    const sortedLoans = useMemo(() => {
        if (!sortField || !sortDirection || !Array.isArray(filteredLoans)) {
            return filteredLoans;
        }

        return [...filteredLoans].sort((a, b) => {
            switch (sortField) {
                case 'startDate':
                    const startDateA = new Date(a.startDate).getTime();
                    const startDateB = new Date(b.startDate).getTime();
                    return sortDirection === 'asc'
                        ? startDateA - startDateB
                        : startDateB - startDateA;
                case 'lender':
                    const lenderA = a.lender || '';
                    const lenderB = b.lender || '';
                    return sortDirection === 'asc'
                        ? lenderA.localeCompare(lenderB)
                        : lenderB.localeCompare(lenderA);
                case 'amount':
                    return sortDirection === 'asc'
                        ? a.amount - b.amount
                        : b.amount - a.amount;
                case 'dueDate':
                    const dueDateA = new Date(a.dueDate).getTime();
                    const dueDateB = new Date(b.dueDate).getTime();
                    return sortDirection === 'asc'
                        ? dueDateA - dueDateB
                        : dueDateB - dueDateA;
                case 'status':
                    const statusA = a.status || '';
                    const statusB = b.status || '';
                    return sortDirection === 'asc'
                        ? statusA.localeCompare(statusB)
                        : statusB.localeCompare(statusA);
                default:
                    return 0;
            }
        });
    }, [filteredLoans, sortField, sortDirection]);

    // Phân trang
    const paginatedLoans = useMemo(() => {
        if (!Array.isArray(sortedLoans)) {
            console.warn('sortedLoans is not an array:', sortedLoans);
            return [];
        }

        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return sortedLoans.slice(startIndex, endIndex)
    }, [sortedLoans, currentPage, itemsPerPage])

    const getStatusColor = (status: Loan['status']) => {
        // Chuyển đổi status về uppercase để dễ so sánh
        const statusUpper = status?.toUpperCase() || '';

        switch (statusUpper) {
            case 'ACTIVE':
                return 'bg-blue-100 text-blue-800'; // Đang vay: màu xanh lam
            case 'PAID':
                return 'bg-green-100 text-green-800'; // Đã trả: màu lục
            case 'OVERDUE':
                return 'bg-red-100 text-red-800'; // Quá hạn: màu đỏ
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    const getStatusText = (status: Loan['status']) => {
        // Chuyển đổi status về uppercase để dễ so sánh
        const statusUpper = status?.toUpperCase() || '';

        switch (statusUpper) {
            case 'ACTIVE':
                return t('loan.active');
            case 'PAID':
                return t('loan.paid');
            case 'OVERDUE':
                return t('loan.overdue');
            default:
                // Tự động đặt về trạng thái 'active' nếu không định nghĩa
                return t('loan.active');
        }
    }

    // Hàm hỗ trợ để hiển thị đơn vị thời gian lãi suất
    const getInterestRateTypeText = (type: Loan['interestRateType']) => {
        switch (type) {
            case 'DAY':
                return t('loan.interestRateTypes.day', { defaultMessage: 'ngày' })
            case 'WEEK':
                return t('loan.interestRateTypes.week', { defaultMessage: 'tuần' })
            case 'MONTH':
                return t('loan.interestRateTypes.month', { defaultMessage: 'tháng' })
            case 'QUARTER':
                return t('loan.interestRateTypes.quarter', { defaultMessage: 'quý' })
            case 'YEAR':
                return t('loan.interestRateTypes.year', { defaultMessage: 'năm' })
            default:
                return 'năm'
        }
    }

    const columns: Column<Loan>[] = [
        {
            header: t('loan.startDate'),
            accessor: (loan: Loan) => formatDate(loan.startDate),
            className: 'w-32',
            sortable: true,
            sortKey: 'startDate'
        },
        {
            header: t('loan.lender'),
            accessor: (loan: Loan) => getLocalizedLender(loan.lender),
            className: 'w-32',
            sortable: true,
            sortKey: 'lender'
        },
        {
            header: t('common.description'),
            accessor: 'description' as const,
        },
        {
            header: t('loan.amount'),
            accessor: (loan: Loan) => (
                <span className="text-red-600">{formatCurrency(loan.amount)}</span>
            ),
            className: 'w-32 text-right',
            sortable: true,
            sortKey: 'amount'
        },
        {
            header: t('loan.interestRate'),
            accessor: (loan: Loan) => {
                // Tính số tiền lãi dựa trên thông tin khoản vay
                const startDateObj = new Date(loan.startDate);
                const dueDateObj = new Date(loan.dueDate);

                if (isNaN(startDateObj.getTime()) || isNaN(dueDateObj.getTime()) || dueDateObj <= startDateObj) {
                    // Trả về hiển thị mặc định nếu ngày không hợp lệ
                    return (
                        <div className="flex flex-col items-end text-right">
                            <div className="font-medium">{loan.interestRate}% / {getInterestRateTypeText(loan.interestRateType)}</div>
                            <div className="text-sm mt-1">
                                <span className="text-gray-500">{t('loan.interest')}:</span>
                                <span className="text-orange-600 ml-1 font-medium">{formatCurrency(0)}</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-gray-500">{t('loan.total')}:</span>
                                <span className="text-purple-700 ml-1 font-medium">{formatCurrency(loan.amount)}</span>
                            </div>
                        </div>
                    );
                }

                const diffTime = dueDateObj.getTime() - startDateObj.getTime();
                const loanDurationInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let calculatedInterest = 0;
                const rate = loan.interestRate; // Lãi suất người dùng nhập
                const rateType = loan.interestRateType; // Loại lãi suất người dùng chọn

                if (loan.lender?.toLowerCase() === 'bank') {
                    // Áp dụng công thức "Lãi theo ngày" (S * r_monthly * n_days) / 30 cho ngân hàng
                    let r_monthly_equivalent_percent = 0;
                    switch (rateType) {
                        case 'DAY':
                            r_monthly_equivalent_percent = rate * 30;
                            break;
                        case 'WEEK':
                            r_monthly_equivalent_percent = rate * (30 / 7);
                            break;
                        case 'MONTH':
                            r_monthly_equivalent_percent = rate;
                            break;
                        case 'QUARTER':
                            r_monthly_equivalent_percent = rate / 3;
                            break;
                        case 'YEAR':
                            r_monthly_equivalent_percent = rate / 12;
                            break;
                        default:
                            r_monthly_equivalent_percent = 0;
                    }
                    calculatedInterest = loan.amount * (r_monthly_equivalent_percent / 100) * (loanDurationInDays / 30);
                } else {
                    // Áp dụng lãi đơn giản cho các loại người cho vay khác
                    let interestMultiplier = 0;
                    switch (rateType) {
                        case 'DAY':
                            interestMultiplier = loanDurationInDays;
                            break;
                        case 'WEEK':
                            interestMultiplier = loanDurationInDays / 7;
                            break;
                        case 'MONTH':
                            interestMultiplier = loanDurationInDays / 30;
                            break;
                        case 'QUARTER':
                            interestMultiplier = loanDurationInDays / 90;
                            break;
                        case 'YEAR':
                            interestMultiplier = loanDurationInDays / 365;
                            break;
                        default:
                            interestMultiplier = 0;
                    }
                    calculatedInterest = loan.amount * (rate / 100) * interestMultiplier;
                }
                const interestAmount = Math.round(calculatedInterest);
                const totalAmount = loan.amount + interestAmount;

                return (
                    <div className="flex flex-col items-end text-right">
                        <div className="font-medium">{loan.interestRate}% / {getInterestRateTypeText(loan.interestRateType)}</div>
                        <div className="text-sm mt-1">
                            <span className="text-gray-500">{t('loan.interest')}:</span>
                            <span className="text-orange-600 ml-1 font-medium">{formatCurrency(interestAmount)}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-gray-500">{t('loan.total')}:</span>
                            <span className="text-purple-700 ml-1 font-medium">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                );
            },
            className: 'w-48 text-right',
        },
        {
            header: t('loan.dueDate'),
            accessor: (loan: Loan) => formatDate(loan.dueDate),
            className: 'w-32',
            sortable: true,
            sortKey: 'dueDate'
        },
        {
            header: t('loan.status'),
            accessor: (loan: Loan) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                    {getStatusText(loan.status)}
                </span>
            ),
            className: 'w-24',
            sortable: true,
            sortKey: 'status'
        },
        {
            header: t('common.actions'),
            accessor: (loan: Loan) => (
                <div className="flex justify-end space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLoan(loan)
                            setShowEditModal(true)
                        }}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLoan(loan)
                            setShowDeleteModal(true)
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ),
            className: 'w-24',
            sortable: false
        },
    ]

    const handleSearch = (term: string) => {
        setSearchTerm(term)
        setCurrentPage(1)
    }

    const handleFilter = (newFilters: FilterOptions) => {
        setFilters(newFilters)
        setCurrentPage(1)
    }

    const handleReset = () => {
        setSearchTerm('')
        setFilters({})
        setCurrentPage(1)
    }

    useEffect(() => {
        prevPageRef.current = currentPage;
    }, [currentPage]);

    // Cập nhật handlePageChange để lưu trang vào URL một cách đơn giản và ổn định
    const handlePageChange = useCallback((page: number) => {
        // Cập nhật state
        setCurrentPage(page);
        prevPageRef.current = page;

        // Cập nhật URL với giá trị trang mới nhưng giữ nguyên các tham số khác
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('page', page.toString());
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size)
        setCurrentPage(1)
    }

    const handleSort = (field: string, direction: SortDirection) => {
        setSortField(field);
        setSortDirection(direction);
    };

    const handleEditSubmit = async (data: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!selectedLoan) return;
        setIsSubmitting(true);
        try {
            console.log('Editing loan with data:', data);

            // Đảm bảo trạng thái được chuẩn hóa
            const newStatus = data.status?.toUpperCase() as 'ACTIVE' | 'PAID' | 'OVERDUE';
            const oldStatus = selectedLoan.status?.toUpperCase() as 'ACTIVE' | 'PAID' | 'OVERDUE';

            if (!data.status) {
                // Nếu không có trạng thái, sử dụng trạng thái hiện tại của khoản vay
                data.status = oldStatus || 'ACTIVE';
            } else {
                data.status = newStatus;
            }

            // Kiểm tra nếu có thay đổi trạng thái
            const hasStatusChange = oldStatus !== data.status;
            if (hasStatusChange) {
                console.log(`Status changing from ${oldStatus} to ${data.status}`);
            }

            // Tạo đầy đủ dữ liệu cho khoản vay
            const completeData: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {
                amount: data.amount,
                description: data.description,
                lender: data.lender,
                interestRate: data.interestRate,
                interestRateType: data.interestRateType,
                startDate: data.startDate,
                dueDate: data.dueDate,
                status: data.status
            };

            console.log('Sending complete data for edit:', completeData);

            // Gọi hàm cập nhật và đợi kết quả
            await onEdit(selectedLoan.id, completeData as any);

            // Đóng modal
            setShowEditModal(false);
            setSelectedLoan(null);

            // Đánh dấu highlight khoản vay vừa cập nhật
            const element = document.getElementById(`loan-row-${selectedLoan.id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch (error) {
            console.error('Edit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDelete = async () => {
        if (!selectedLoan) return
        setIsSubmitting(true)
        try {
            await onDelete(selectedLoan.id)
            setShowDeleteModal(false)
            setSelectedLoan(null)
        } catch (error) {
            console.error('Delete error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Sửa lại cách xử lý onRowClick để không làm ảnh hưởng đến phân trang
    const handleRowClick = useCallback((loan: Loan) => {
        // Nếu có onRowClick được truyền từ bên ngoài
        if (onRowClick) {
            // Lưu lại trang hiện tại trước khi thực hiện click
            const currentPageValue = prevPageRef.current;

            // Gọi callback từ prop
            onRowClick(loan);

            // Đảm bảo không bị reset trang về 1 sau khi xử lý click
            // Chỉ thực hiện nếu trang khác 1 và cần bảo toàn
            if (currentPageValue > 1) {
                // Sử dụng một flag để tránh cập nhật nhiều lần
                const url = new URL(window.location.href);
                const pageInUrl = url.searchParams.get('page');

                // Chỉ cập nhật URL và state nếu cần thiết
                if (!pageInUrl || pageInUrl !== currentPageValue.toString()) {
                    // Trì hoãn việc đặt lại trang để đảm bảo các xử lý khác đã hoàn tất
                    setTimeout(() => {
                        // Kiểm tra lại một lần nữa trước khi cập nhật
                        if (prevPageRef.current !== currentPageValue) {
                            setCurrentPage(currentPageValue);
                        }

                        // Cập nhật URL với page hiện tại nếu cần
                        url.searchParams.set('page', currentPageValue.toString());

                        // Sử dụng replaceState để không thêm vào history stack
                        window.history.replaceState(null, '', url);
                    }, 50);
                }
            }
        }
    }, [onRowClick]);

    return (
        <div className="space-y-4">
            {/* Real-time Status Indicator */}
            <LoanStatusIndicator />

            <SearchFilter
                onSearch={handleSearch}
                onFilter={handleFilter}
                onReset={handleReset}
                categories={loanLenders}
                categoryLabel={t('loan.lender')}
            />

            <SortableTable
                data={paginatedLoans}
                columns={columns}
                isLoading={isLoading}
                emptyMessage={t('loan.noLoan', { defaultMessage: 'Chưa có khoản vay nào' })}
                getRowId={(loan) => `loan-row-${loan.id}`}
                onSort={handleSort}
                onRowClick={handleRowClick}
            />

            <Pagination
                currentPage={currentPage}
                totalItems={sortedLoans.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />

            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setSelectedLoan(null)
                }}
                title={t('loan.edit')}
            >
                {selectedLoan && (
                    <LoanForm
                        mode="edit"
                        initialData={{
                            amount: selectedLoan.amount,
                            description: selectedLoan.description,
                            lender: selectedLoan.lender,
                            interestRate: selectedLoan.interestRate,
                            interestRateType: selectedLoan.interestRateType || 'YEAR',
                            startDate: new Date(selectedLoan.startDate).toISOString().split('T')[0],
                            dueDate: new Date(selectedLoan.dueDate).toISOString().split('T')[0],
                            status: selectedLoan.status
                        }}
                        onSubmit={handleEditSubmit}
                        isSubmitting={isSubmitting}
                    />
                )}
            </Modal>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false)
                    setSelectedLoan(null)
                }}
                title={t('loan.delete')}
            >
                <Alert
                    variant="destructive"
                    className="mb-4"
                >
                    <AlertDescription>
                        {t('loan.deleteConfirm')}
                    </AlertDescription>
                </Alert>
                <div className="flex justify-end space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowDeleteModal(false)
                            setSelectedLoan(null)
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        isLoading={isSubmitting}
                    >
                        {t('loan.delete')}
                    </Button>
                </div>
            </Modal>
        </div>
    )
}

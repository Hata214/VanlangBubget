'use client'

import React, { useState, useMemo, useEffect, ReactNode, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Edit2, Trash2 } from 'lucide-react'
import { Income } from '@/types'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/common/Pagination'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { SearchFilter, FilterOptions } from '@/components/common/SearchFilter'
import { IncomeForm } from './IncomeForm'
import { useAppSelector } from '@/redux/hooks'
import { useSearchParams } from 'next/navigation'
import { SortableTable, SortDirection } from '@/components/ui/SortableTable'

interface IncomeListProps {
    incomes: Income[]
    isLoading?: boolean
    onEdit: (id: string, data: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onRowClick?: (income: Income) => void
}

interface Column<T> {
    header: string
    accessor: keyof T | ((item: T) => ReactNode)
    className?: string
    sortable?: boolean
    sortKey?: string
}

export function IncomeList({ incomes, isLoading, onEdit, onDelete, onRowClick }: IncomeListProps) {
    const t = useTranslations();
    const { categories } = useAppSelector((state) => state.income);
    const searchParams = useSearchParams()

    // Khởi tạo giá trị trang từ URL nếu có
    const initialPage = (() => {
        const pageParam = searchParams.get('page');
        return pageParam && !isNaN(Number(pageParam)) ? Number(pageParam) : 1;
    })();

    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState<FilterOptions>({})
    const [currentPage, setCurrentPage] = useState(initialPage)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [selectedIncome, setSelectedIncome] = useState<Income | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Lưu currentPage trong useRef để đảm bảo giá trị không bị mất khi re-render
    const prevPageRef = useRef(currentPage);

    // Cập nhật ref khi currentPage thay đổi
    useEffect(() => {
        prevPageRef.current = currentPage;
    }, [currentPage]);

    // Danh sách danh mục từ Redux hoặc sử dụng danh mục từ bản dịch
    const incomeCategories = useMemo(() => {
        // Tạo danh sách danh mục từ translations - chỉ bao gồm danh mục tiếng Việt
        const defaultCategories = [
            'Lương',
            'Thưởng',
            'Đầu tư',
            'Kinh doanh',
            'Tiền tiết kiệm',
            'Khác'
        ];

        // Kết hợp với danh mục từ redux nếu có
        if (categories && categories.length > 0) {
            return [...defaultCategories, ...categories.filter((cat: string) =>
                !defaultCategories.includes(cat) &&
                !['BONUS', 'INVESTMENT', 'SALARY', 'Khác', 'income.category.other'].includes(cat)
            )];
        }
        return defaultCategories;
    }, [categories, t]);

    const filteredIncomes = useMemo(() => {
        if (!Array.isArray(incomes)) {
            console.warn('incomes is not an array:', incomes);
            return [];
        }

        return incomes.filter((income) => {
            // Tìm kiếm theo mô tả
            if (searchTerm && !income.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
            }

            // Lọc theo danh mục
            if (filters.category && income.category !== filters.category) {
                return false
            }

            // Lọc theo khoảng thời gian
            if (filters.filterDate) {
                const filterDate = new Date(filters.filterDate);
                const incomeDate = new Date(income.date);
                // So sánh theo ngày tháng năm (bỏ qua giờ phút giây)
                if (filterDate.getDate() !== incomeDate.getDate() ||
                    filterDate.getMonth() !== incomeDate.getMonth() ||
                    filterDate.getFullYear() !== incomeDate.getFullYear()) {
                    return false;
                }
            }

            // Lọc theo khoảng tiền
            if (filters.minAmount && income.amount < filters.minAmount) {
                return false
            }
            if (filters.maxAmount && income.amount > filters.maxAmount) {
                return false
            }

            return true
        })
    }, [incomes, searchTerm, filters])

    // Sắp xếp dữ liệu
    const sortedIncomes = useMemo(() => {
        if (!sortField || !sortDirection || !Array.isArray(filteredIncomes)) {
            return filteredIncomes;
        }

        return [...filteredIncomes].sort((a, b) => {
            switch (sortField) {
                case 'date':
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    return sortDirection === 'asc'
                        ? dateA - dateB
                        : dateB - dateA;
                case 'category':
                    const catA = a.category || '';
                    const catB = b.category || '';
                    return sortDirection === 'asc'
                        ? catA.localeCompare(catB)
                        : catB.localeCompare(catA);
                case 'amount':
                    return sortDirection === 'asc'
                        ? a.amount - b.amount
                        : b.amount - a.amount;
                default:
                    return 0;
            }
        });
    }, [filteredIncomes, sortField, sortDirection]);

    // Phân trang
    const paginatedIncomes = useMemo(() => {
        if (!Array.isArray(sortedIncomes)) {
            console.warn('sortedIncomes is not an array:', sortedIncomes);
            return [];
        }

        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return sortedIncomes.slice(startIndex, endIndex)
    }, [sortedIncomes, currentPage, itemsPerPage])

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

    // Cập nhật handlePageChange để lưu trang vào URL
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);

        // Cập nhật URL với tham số page nhưng giữ nguyên các tham số khác
        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());

        // Sử dụng replaceState thay vì pushState để không thêm vào history stack
        window.history.replaceState({}, '', url);
    }, []);

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size)
        setCurrentPage(1)
    }

    const handleEdit = (income: Income) => {
        setSelectedIncome(income)
        setShowEditModal(true)
    }

    const handleDelete = async () => {
        if (!selectedIncome) return
        setIsSubmitting(true)
        try {
            await onDelete(selectedIncome.id)
            setShowDeleteModal(false)
            setSelectedIncome(null)
        } catch (error) {
            console.error('Delete error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditSubmit = async (data: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!selectedIncome) return
        setIsSubmitting(true)
        try {
            await onEdit(selectedIncome.id, data)
            setShowEditModal(false)
            setSelectedIncome(null)
        } catch (error) {
            console.error('Edit error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSort = (field: string, direction: SortDirection) => {
        setSortField(field);
        setSortDirection(direction);
    };

    // Xử lý số trang từ URL, tách riêng để tránh xung đột
    useEffect(() => {
        const pageParam = searchParams.get('page');
        if (pageParam && !isNaN(Number(pageParam))) {
            const pageNumber = Number(pageParam);
            // Đảm bảo trang hợp lệ
            if (pageNumber > 0 && pageNumber <= Math.ceil(sortedIncomes.length / itemsPerPage)) {
                // Chỉ cập nhật khi trang thực sự thay đổi và khác với trang hiện tại
                if (pageNumber !== currentPage && pageNumber !== prevPageRef.current) {
                    console.log("Cập nhật trang từ URL:", pageNumber, "trang hiện tại:", currentPage);
                    setCurrentPage(pageNumber);
                }
            } else if (pageNumber > Math.ceil(sortedIncomes.length / itemsPerPage) && Math.ceil(sortedIncomes.length / itemsPerPage) > 0) {
                // Nếu trang không hợp lệ (lớn hơn tổng số trang), chuyển về trang cuối cùng
                const lastPage = Math.ceil(sortedIncomes.length / itemsPerPage);
                if (lastPage !== currentPage && lastPage !== prevPageRef.current) {
                    console.log("Trang không hợp lệ, chuyển về trang cuối:", lastPage);
                    setCurrentPage(lastPage);

                    // Cập nhật URL - đảm bảo không gọi khi đang trong quá trình cập nhật
                    const url = new URL(window.location.href);
                    if (url.searchParams.get('page') !== lastPage.toString()) {
                        url.searchParams.set('page', lastPage.toString());
                        window.history.replaceState({}, '', url);
                    }
                }
            }
        }
        // Chỉ theo dõi các dependency cần thiết
    }, [searchParams.get('page'), currentPage, sortedIncomes.length, itemsPerPage]);

    // Sửa lại cách xử lý onRowClick để không làm ảnh hưởng đến phân trang
    const handleRowClick = useCallback((income: Income) => {
        // Nếu có onRowClick được truyền từ bên ngoài
        if (onRowClick) {
            // Lưu lại trang hiện tại trước khi thực hiện click
            const currentPageValue = prevPageRef.current;

            // Gọi callback từ prop
            onRowClick(income);

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

    const columns = [
        {
            header: t('common.date'),
            accessor: (income: Income) => formatDate(income.date),
            className: 'w-32',
            sortable: true,
            sortKey: 'date'
        },
        {
            header: t('common.category'),
            accessor: (income: Income) => {
                // Kiểm tra nếu category là undefined hoặc null
                if (!income.category) {
                    console.warn('Income category is undefined or null for income:', income);
                    return t('income.category.other'); // Mặc định về Khác
                }

                // Kiểm tra xem có phải danh mục tiếng Anh không để chuyển đổi
                // Ưu tiên kiểm tra các giá trị có thể được lưu trữ (bao gồm cả tiếng Việt)
                // và ánh xạ chúng tới khóa dịch thuật chuẩn.
                const categoryKey = income.category?.toLowerCase();
                switch (categoryKey) {
                    case 'salary':
                    case 'lương':
                        return t('income.category.salary');
                    case 'bonus':
                    case 'thưởng':
                        return t('income.category.bonus');
                    case 'investment':
                    case 'đầu tư':
                        return t('income.category.investment');
                    case 'business':
                    case 'kinh doanh':
                        return t('income.category.business');
                    case 'savings':
                    case 'tiền tiết kiệm':
                        return t('income.category.savings');
                    case 'other':
                    case 'khác':
                        return t('income.category.other');
                    default:
                        // Nếu không khớp, thử tìm một khóa dịch khớp với giá trị gốc
                        // Điều này hữu ích nếu có danh mục tùy chỉnh đã được dịch
                        if (income.category && t(`income.category.${income.category.toLowerCase()}`) !== `income.category.${income.category.toLowerCase()}`) {
                            return t(`income.category.${income.category.toLowerCase()}`);
                        }
                        // Nếu vẫn không tìm thấy, trả về giá trị gốc hoặc một giá trị mặc định
                        return income.category || t('income.category.other');
                }
            },
            className: 'w-32',
            sortable: true,
            sortKey: 'category'
        },
        {
            header: t('common.description'),
            accessor: 'description' as const,
        },
        {
            header: t('common.amount'),
            accessor: (income: Income) => (
                <span className="text-green-600">{formatCurrency(income.amount)}</span>
            ),
            className: 'w-32 text-right',
            sortable: true,
            sortKey: 'amount'
        },
        {
            header: t('common.actions'),
            accessor: (income: Income) => (
                <div className="flex justify-end space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(income)
                        }}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIncome(income)
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

    return (
        <div className="space-y-4">
            <SearchFilter
                categories={incomeCategories}
                onSearch={handleSearch}
                onFilter={handleFilter}
                onReset={handleReset}
            />

            <SortableTable
                data={paginatedIncomes}
                columns={columns}
                isLoading={isLoading}
                emptyMessage={t('income.noIncome', { defaultMessage: 'Chưa có khoản thu nhập nào' })}
                getRowId={(income) => `income-row-${income.id}`}
                onSort={handleSort}
                defaultSortField={sortField || undefined}
                defaultSortDirection={sortDirection}
                onRowClick={handleRowClick}
            />

            <Pagination
                currentPage={currentPage}
                totalItems={filteredIncomes.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />

            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setSelectedIncome(null)
                }}
                title={t('income.edit')}
            >
                {selectedIncome && (
                    <IncomeForm
                        initialData={{
                            amount: selectedIncome.amount,
                            description: selectedIncome.description,
                            category: selectedIncome.category,
                            date: new Date(selectedIncome.date).toISOString().split('T')[0]
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
                    setSelectedIncome(null)
                }}
                title={t('income.delete')}
            >
                <Alert
                    variant="destructive"
                    className="mb-4"
                >
                    <AlertDescription>
                        {t('income.deleteConfirm')}
                    </AlertDescription>
                </Alert>
                <div className="flex justify-end space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowDeleteModal(false)
                            setSelectedIncome(null)
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        isLoading={isSubmitting}
                    >
                        {t('income.delete')}
                    </Button>
                </div>
            </Modal>
        </div>
    )
}

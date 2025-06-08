'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Table } from '@/components/ui/table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { SearchFilter, type FilterOptions } from '@/components/common/SearchFilter'
import { Pagination } from '@/components/common/Pagination'
import { ExpenseForm } from './ExpenseForm'
import type { ExpenseFormData } from './ExpenseForm'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Edit2, Trash2, MapPin, Navigation } from 'lucide-react'
import type { Expense } from '@/types'
import type { ReactNode } from 'react'
import { useAppSelector } from '@/redux/hooks'
import { SortableTable, SortDirection } from '@/components/ui/SortableTable'

interface Location {
    lat: number
    lng: number
    address: string
}

interface ExpenseListProps {
    expenses: Expense[]
    isLoading?: boolean
    onEdit: (id: string, data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onRowClick?: (expense: Expense) => void
}

interface Column<T> {
    header: string
    accessor: keyof T | ((item: T) => ReactNode)
    className?: string
}

// Component hiển thị bản đồ
function LocationMap({ location }: { location: Location | undefined }) {
    const t = useTranslations();
    const [geocodedLocation, setGeocodedLocation] = useState<Location | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState(false);

    // Thực hiện geocode địa chỉ nếu chỉ có địa chỉ và không có tọa độ
    useEffect(() => {
        async function geocodeAddress() {
            if (location && location.address && location.lat === 0 && location.lng === 0) {
                setIsGeocoding(true);
                setGeocodeError(false);

                try {
                    const encodedAddress = encodeURIComponent(location.address);
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&accept-language=vi`
                    );

                    if (!response.ok) {
                        throw new Error('Geocoding failed');
                    }

                    const data = await response.json();
                    if (data && data.length > 0) {
                        const result = data[0];
                        setGeocodedLocation({
                            lat: parseFloat(result.lat),
                            lng: parseFloat(result.lon),
                            address: location.address
                        });
                    } else {
                        setGeocodeError(true);
                    }
                } catch (error) {
                    console.error('Geocoding error:', error);
                    setGeocodeError(true);
                } finally {
                    setIsGeocoding(false);
                }
            }
        }

        geocodeAddress();
    }, [location]);

    // Nếu không có thông tin vị trí
    if (!location) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-md">
                <MapPin className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-500">{t('expense.noLocationData')}</p>
            </div>
        );
    }

    // Đang geocoding địa chỉ
    if (isGeocoding) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-md">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                <p className="text-gray-700">{t('expense.geocodingAddress')}</p>
                <p className="text-sm text-gray-500 mt-2">{location.address}</p>
            </div>
        );
    }

    // Lỗi geocoding
    if (geocodeError && location.lat === 0 && location.lng === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-md p-4">
                <MapPin className="w-12 h-12 text-red-400 mb-2" />
                <p className="text-gray-700 font-medium text-center">{t('expense.geocodingError')}</p>
                <p className="text-gray-500 text-center mt-2">{location.address}</p>
            </div>
        );
    }

    // Sử dụng kết quả geocoding nếu có, hoặc dữ liệu vị trí ban đầu nếu đã có tọa độ
    const displayLocation = geocodedLocation || location;

    // Nếu vẫn không có tọa độ hợp lệ sau khi geocode
    if (displayLocation.lat === 0 && displayLocation.lng === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-md p-4">
                <MapPin className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-700 font-medium text-center">{t('expense.unableToShowOnMap')}</p>
                <p className="text-gray-500 text-center mt-2">{displayLocation.address}</p>
            </div>
        );
    }

    // Tạo URL cho OpenStreetMap với marker tại vị trí
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${displayLocation.lng - 0.002},${displayLocation.lat - 0.002},${displayLocation.lng + 0.002},${displayLocation.lat + 0.002}&layer=mapnik&marker=${displayLocation.lat},${displayLocation.lng}`;

    // Tạo URL để mở vị trí trong Google Maps (tiện lợi hơn cho người dùng)
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${displayLocation.lat},${displayLocation.lng}`;

    // URL trực tiếp đến OpenStreetMap
    const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${displayLocation.lat}&mlon=${displayLocation.lng}&zoom=16`;

    return (
        <div className="space-y-4">
            <div className="bg-gray-100 rounded-md overflow-hidden h-64 relative">
                <iframe
                    title="Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={mapUrl}
                />
                <a
                    href={openStreetMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 bg-white rounded-md shadow-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 flex items-center"
                >
                    <MapPin className="w-3 h-3 mr-1" />
                    {t('expense.viewOnMap')}
                </a>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                    <p className="text-sm font-medium mb-1">{t('expense.address')}:</p>
                    <p className="text-sm text-gray-600">{displayLocation.address}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(googleMapsUrl, '_blank')}
                    className="flex items-center"
                >
                    <Navigation className="w-4 h-4 mr-2" />
                    {t('expense.openInGoogleMaps')}
                </Button>
            </div>
        </div>
    );
}

export function ExpenseList({ expenses, isLoading, onEdit, onDelete, onRowClick }: ExpenseListProps) {
    const t = useTranslations();
    const searchParams = useSearchParams()
    const { categories } = useAppSelector((state) => state.expense); // categories từ Redux, hiện tại không dùng để tạo danh sách cho bộ lọc

    // Khởi tạo giá trị trang từ URL nếu có
    const initialPage = (() => {
        const pageParam = searchParams.get('page');
        return pageParam && !isNaN(Number(pageParam)) ? Number(pageParam) : 1;
    })();

    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState<FilterOptions>({})
    const [currentPage, setCurrentPage] = useState(initialPage)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Thêm useRef để lưu trạng thái trang
    const prevPageRef = useRef(currentPage);

    // Cập nhật ref khi currentPage thay đổi
    useEffect(() => {
        prevPageRef.current = currentPage;
    }, [currentPage]);

    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Danh sách danh mục cho bộ lọc, chỉ bao gồm các danh mục chuẩn đã được dịch
    const expenseCategories = useMemo(() => {
        const standardCategoryKeys = [
            'food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'other'
        ];

        return standardCategoryKeys
            .map(key => {
                const translation = t(`expense.category.${key}`);
                // Chỉ trả về bản dịch nếu nó khác với key (tức là có bản dịch thực sự) và không rỗng
                return (translation && translation !== `expense.category.${key}`) ? translation : null;
            })
            .filter(Boolean) // Lọc bỏ các giá trị null (nếu không có bản dịch hoặc key không tồn tại)
            .sort((a, b) => (a as string).localeCompare(b as string)) as string[];
    }, [t]);

    // Lọc và tìm kiếm
    const filteredExpenses = useMemo(() => {
        if (!Array.isArray(expenses)) {
            console.warn('expenses is not an array:', expenses);
            return [];
        }

        return expenses.filter((expense) => {
            // Tìm kiếm theo mô tả
            if (searchTerm && !expense.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
            }

            // Lọc theo danh mục
            if (filters.category && expense.category !== filters.category) {
                return false
            }

            // Lọc theo khoảng thời gian (dateRange)
            if (filters.dateRange) {
                const expenseDate = new Date(expense.date);
                expenseDate.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày để so sánh

                if (filters.dateRange.from) {
                    const fromDate = new Date(filters.dateRange.from);
                    fromDate.setHours(0, 0, 0, 0);
                    if (expenseDate < fromDate) {
                        return false;
                    }
                }
                if (filters.dateRange.to) {
                    const toDate = new Date(filters.dateRange.to);
                    toDate.setHours(23, 59, 59, 999); // Chuẩn hóa về cuối ngày để so sánh
                    if (expenseDate > toDate) {
                        return false;
                    }
                }
            }

            // Lọc theo khoảng tiền (amountRange)
            if (filters.amountRange) {
                if (filters.amountRange.min !== undefined && expense.amount < filters.amountRange.min) {
                    return false;
                }
                if (filters.amountRange.max !== undefined && expense.amount > filters.amountRange.max) {
                    return false;
                }
            }

            return true
        })
    }, [expenses, searchTerm, filters])

    // Sắp xếp dữ liệu
    const sortedExpenses = useMemo(() => {
        if (!sortField || !sortDirection || !Array.isArray(filteredExpenses)) {
            return filteredExpenses;
        }

        return [...filteredExpenses].sort((a, b) => {
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
    }, [filteredExpenses, sortField, sortDirection]);

    // Phân trang
    const paginatedExpenses = useMemo(() => {
        if (!Array.isArray(sortedExpenses)) {
            console.warn('sortedExpenses is not an array:', sortedExpenses);
            return [];
        }

        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return sortedExpenses.slice(startIndex, endIndex)
    }, [sortedExpenses, currentPage, itemsPerPage])

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

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);

        // Cập nhật URL với tham số page nhưng giữ nguyên các tham số khác
        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());

        // Sử dụng replaceState thay vì pushState để không thêm vào history stack
        window.history.replaceState({}, '', url);
    }, []);

    const handlePageSizeChange = (size: number) => {
        setItemsPerPage(size)
        setCurrentPage(1)
    }

    const handleEdit = async (expense: Expense) => {
        setSelectedExpense(expense)
        setIsEditModalOpen(true)
    }

    const handleDelete = async (expense: Expense) => {
        setSelectedExpense(expense)
        setIsDeleteModalOpen(true)
    }

    const handleEditSubmit = async (data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!selectedExpense) return
        setIsSubmitting(true)
        try {
            await onEdit(selectedExpense.id, data)
            setIsEditModalOpen(false)
        } catch (error) {
            console.error('Edit error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteSubmit = async () => {
        if (!selectedExpense) return
        setIsSubmitting(true)
        try {
            await onDelete(selectedExpense.id)
            setIsDeleteModalOpen(false)
        } catch (error) {
            console.error('Delete error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSort = (field: string, direction: SortDirection) => {
        setSortField(field);
        setSortDirection(direction);
    };

    // Sửa lại cách xử lý onRowClick để không làm ảnh hưởng đến phân trang
    const handleRowClick = useCallback((expense: Expense) => {
        // Nếu có onRowClick được truyền từ bên ngoài
        if (onRowClick) {
            // Lưu lại trang hiện tại trước khi thực hiện click
            const currentPageValue = prevPageRef.current;

            // Gọi callback từ prop
            onRowClick(expense);

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

    // Xử lý số trang từ URL
    useEffect(() => {
        const pageParam = searchParams.get('page');
        if (pageParam && !isNaN(Number(pageParam))) {
            const pageNumber = Number(pageParam);
            // Đảm bảo trang hợp lệ
            if (pageNumber > 0 && pageNumber <= Math.ceil(sortedExpenses.length / itemsPerPage)) {
                // Chỉ cập nhật khi trang thực sự thay đổi và khác với trang hiện tại
                if (pageNumber !== currentPage && pageNumber !== prevPageRef.current) {
                    setCurrentPage(pageNumber);
                }
            } else if (pageNumber > Math.ceil(sortedExpenses.length / itemsPerPage) && Math.ceil(sortedExpenses.length / itemsPerPage) > 0) {
                // Nếu trang không hợp lệ (lớn hơn tổng số trang), chuyển về trang cuối cùng
                const lastPage = Math.ceil(sortedExpenses.length / itemsPerPage);
                if (lastPage !== currentPage && lastPage !== prevPageRef.current) {
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
    }, [searchParams.get('page'), currentPage, sortedExpenses.length, itemsPerPage, prevPageRef]);

    const columns = [
        {
            header: t('common.date'),
            accessor: (expense: Expense) => formatDate(expense.date),
            className: 'w-32',
            sortable: true,
            sortKey: 'date'
        },
        {
            header: t('common.category'),
            accessor: (expense: Expense) => {
                // Kiểm tra nếu category là undefined hoặc null
                if (!expense.category) {
                    console.warn('Expense category is undefined or null for expense:', expense);
                    return t('expense.category.other'); // Mặc định về Khác
                }

                // Ưu tiên kiểm tra các giá trị có thể được lưu trữ (bao gồm cả tiếng Việt)
                // và ánh xạ chúng tới khóa dịch thuật chuẩn.
                const categoryKey = expense.category?.toLowerCase();
                switch (categoryKey) {
                    case 'food':
                    case 'ăn uống':
                        return t('expense.category.food');
                    case 'transport':
                    case 'di chuyển':
                        return t('expense.category.transport');
                    case 'shopping':
                    case 'mua sắm':
                        return t('expense.category.shopping');
                    case 'entertainment':
                    case 'giải trí':
                        return t('expense.category.entertainment');
                    case 'bills':
                    case 'hóa đơn':
                        return t('expense.category.bills');
                    case 'health':
                    case 'sức khỏe':
                        return t('expense.category.health');
                    case 'education':
                    case 'giáo dục':
                        return t('expense.category.education');
                    case 'other':
                    case 'khác':
                        return t('expense.category.other');
                    default:
                        // Nếu không khớp, thử tìm một khóa dịch khớp với giá trị gốc
                        // Điều này hữu ích nếu có danh mục tùy chỉnh đã được dịch
                        if (expense.category && t(`expense.category.${expense.category.toLowerCase()}`) !== `expense.category.${expense.category.toLowerCase()}`) {
                            return t(`expense.category.${expense.category.toLowerCase()}`);
                        }
                        // Nếu vẫn không tìm thấy, trả về giá trị gốc hoặc một giá trị mặc định
                        return expense.category || t('expense.category.other');
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
            header: t('common.location'),
            accessor: (expense: Expense) => (
                expense.location?.address ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 flex items-center justify-start w-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExpense(expense);
                            setShowLocationModal(true);
                        }}
                    >
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">
                            {expense.location.address.length > 30
                                ? `${expense.location.address.substring(0, 30)}...`
                                : expense.location.address}
                        </span>
                    </Button>
                ) : null
            ),
            className: 'w-48',
        },
        {
            header: t('common.amount'),
            accessor: (expense: Expense) => (
                <span className="text-red-600">{formatCurrency(expense.amount)}</span>
            ),
            className: 'w-32 text-right',
            sortable: true,
            sortKey: 'amount'
        },
        {
            header: t('common.actions'),
            accessor: (expense: Expense) => (
                <div className="flex justify-end space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(expense)
                        }}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(expense)
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
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
                onSearch={handleSearch}
                onFilter={handleFilter}
                onReset={handleReset}
                categories={expenseCategories}
            />

            <SortableTable
                data={paginatedExpenses}
                columns={columns}
                isLoading={isLoading}
                emptyMessage={t('expense.noExpense', { defaultMessage: 'Chưa có khoản chi tiêu nào' })}
                getRowId={(expense) => `expense-row-${expense.id}`}
                onSort={handleSort}
                onRowClick={handleRowClick}
            />

            <Pagination
                totalItems={filteredExpenses.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handlePageSizeChange}
            />

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setSelectedExpense(null)
                }}
                title={t('expense.edit')}
            >
                {selectedExpense && (
                    <ExpenseForm
                        initialData={{
                            amount: selectedExpense.amount,
                            description: selectedExpense.description,
                            category: selectedExpense.category,
                            date: new Date(selectedExpense.date).toISOString().split('T')[0],
                            location: selectedExpense.location
                        }}
                        onSubmit={handleEditSubmit}
                        isSubmitting={isSubmitting}
                    />
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title={t('expense.delete')}
            >
                <Alert
                    variant="destructive"
                    className="mb-4"
                >
                    <AlertDescription>
                        {t('expense.deleteConfirm')}
                    </AlertDescription>
                </Alert>
                <div className="flex justify-end space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsDeleteModalOpen(false)}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteSubmit}
                        isLoading={isSubmitting}
                    >
                        {t('expense.delete')}
                    </Button>
                </div>
            </Modal>

            {/* Modal hiển thị bản đồ vị trí */}
            <Modal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                title={t('expense.locationDetails')}
                className="max-w-lg"
            >
                <div className="space-y-4">
                    {selectedExpense?.location && (
                        <div className="text-sm space-y-2">
                            <p className="font-medium">{t('expense.address')}:</p>
                            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-gray-700 flex items-start">
                                <MapPin className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p>{selectedExpense.location.address}</p>
                            </div>
                            <LocationMap location={selectedExpense.location} />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}

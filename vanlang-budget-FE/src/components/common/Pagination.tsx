import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

interface PaginationProps {
    currentPage: number
    totalItems: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (size: number) => void
    className?: string
}

export function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    className
}: PaginationProps) {
    const t = useTranslations();
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const searchParams = useSearchParams();

    // Thêm useRef để theo dõi lần render trước
    const previousUrlPageRef = useRef<number | null>(null);
    const isInitialRender = useRef(true);

    // Khởi tạo giá trị ban đầu từ URL nếu có
    const initialPage = (() => {
        const pageParam = searchParams.get('page');
        if (pageParam && !isNaN(Number(pageParam)) && Number(pageParam) > 0) {
            previousUrlPageRef.current = Number(pageParam);
            return Number(pageParam);
        }
        return currentPage || 1;
    })();

    const [internalPage, setInternalPage] = useState(initialPage);

    // Đồng bộ khi prop currentPage thay đổi (ưu tiên cao nhất)
    useEffect(() => {
        if (currentPage !== internalPage && currentPage > 0) {
            setInternalPage(currentPage);
        }
    }, [currentPage]);

    // Đồng bộ URL một cách an toàn
    useEffect(() => {
        // Bỏ qua lần render đầu tiên để tránh vòng lặp
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        const pageParam = searchParams.get('page');

        // Chỉ xử lý khi có tham số page hợp lệ
        if (pageParam && !isNaN(Number(pageParam))) {
            const urlPage = Number(pageParam);

            // Kiểm tra URL có thay đổi so với lần trước
            if (urlPage !== previousUrlPageRef.current) {
                // Chỉ cập nhật nếu trang từ URL khác với trang hiện tại và hợp lệ
                if (urlPage !== internalPage && urlPage > 0 && urlPage <= totalPages) {
                    console.log('Cập nhật trang từ URL:', urlPage, 'trang hiện tại:', internalPage);
                    setInternalPage(urlPage);

                    // Gọi onPageChange để thông báo thay đổi trang cho component cha
                    if (urlPage !== currentPage) {
                        // Trì hoãn onPageChange để tránh vòng lặp
                        setTimeout(() => {
                            onPageChange(urlPage);
                        }, 0);
                    }
                }

                // Cập nhật ref
                previousUrlPageRef.current = urlPage;
            }
        }
    }, [searchParams, totalPages, internalPage, onPageChange, currentPage]);

    const handlePrevPage = useCallback(() => {
        if (internalPage > 1) {
            const newPage = internalPage - 1;
            setInternalPage(newPage);
            onPageChange(newPage);
        }
    }, [internalPage, onPageChange]);

    const handleNextPage = useCallback(() => {
        if (internalPage < totalPages) {
            const newPage = internalPage + 1;
            setInternalPage(newPage);
            onPageChange(newPage);
        }
    }, [internalPage, totalPages, onPageChange]);

    // Tính toán các thông số hiển thị
    const startItem = Math.max(1, (internalPage - 1) * itemsPerPage + 1);
    const endItem = Math.min(internalPage * itemsPerPage, totalItems);

    return (
        <div className={cn('flex flex-col md:flex-row justify-between items-center gap-4', className)}>
            <div className="text-sm text-muted-foreground">
                {totalItems > 0
                    ? t('common.pagination', {
                        start: startItem,
                        end: endItem,
                        total: totalItems
                    })
                    : t('common.noData')}
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{t('common.pageSize')}:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => onItemsPerPageChange(Number(value))}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue>{itemsPerPage}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevPage}
                        disabled={internalPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        {internalPage} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextPage}
                        disabled={internalPage >= totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
} 
import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, ChevronDown, SortAsc, SortDesc, Check, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchNotifications, markAllAsRead, markAsRead } from '@/redux/features/notificationSlice';
import { NotificationIcon } from './NotificationIcon';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function NotificationDropdown() {
    const t = useTranslations();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { notifications, unreadCount, isLoading, totalCount } = useAppSelector(
        (state) => state.notification
    );
    const [isOpen, setIsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Lấy danh sách thông báo khi component mount
    useEffect(() => {
        if (isOpen && notifications.length === 0) {
            dispatch(fetchNotifications(1));
        }
    }, [dispatch, isOpen, notifications.length]);

    // Xử lý click bên ngoài dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Xử lý khi click vào thông báo
    const handleNotificationClick = (
        notificationId: string,
        isRead: boolean,
        relatedId?: string,
        type?: string
    ) => {
        // Nếu thông báo chưa đọc, đánh dấu là đã đọc
        if (!isRead) {
            handleMarkAsRead(notificationId);
        }

        // Đóng dropdown
        setIsOpen(false);

        // Điều hướng đến trang liên quan nếu có
        if (type && relatedId) {
            // Điều hướng dựa trên loại thông báo
            switch (type) {
                case 'expense':
                    router.push(`/expenses?highlight=${relatedId}`);
                    break;
                case 'income':
                    router.push(`/incomes?highlight=${relatedId}`);
                    break;
                case 'budget':
                    router.push(`/budgets?highlight=${relatedId}`);
                    break;
                case 'loan':
                    router.push(`/loans?highlight=${relatedId}`);
                    break;
                case 'loan-payment':
                    router.push(`/loans/${relatedId}?highlight=payment`);
                    break;
                case 'budget-alert':
                    router.push(`/budgets?highlight=${relatedId}&alert=true`);
                    break;
                case 'system':
                    // Xử lý thông báo hệ thống
                    if (relatedId.startsWith('/')) {
                        // Nếu relatedId là một đường dẫn
                        router.push(relatedId);
                    }
                    break;
                default:
                    // Nếu có link cụ thể trong notification, ưu tiên sử dụng
                    if (relatedId.startsWith('/')) {
                        router.push(relatedId);
                    }
                    break;
            }
        }
    };

    // Xử lý tải thêm thông báo
    const handleLoadMore = () => {
        const nextPage = page + 1;
        dispatch(fetchNotifications(nextPage));
        setPage(nextPage);
    };

    // Xử lý đánh dấu tất cả là đã đọc
    const handleMarkAllAsRead = () => {
        dispatch(markAllAsRead());
    };

    const handleToggleSort = () => {
        const newDirection = sortDirection === 'desc' ? 'asc' : 'desc';
        setSortDirection(newDirection);
        setPage(1);
        dispatch(fetchNotifications({ page: 1, sort: newDirection }));
    };

    // Hàm đánh dấu thông báo đã đọc
    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await dispatch(markAsRead(notificationId));
        } catch (error) {
            console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <NotificationIcon onClick={() => setIsOpen(!isOpen)} />

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold">{t('notifications.title')} {unreadCount > 0 && `(${unreadCount})`}</h3>
                        <div className="flex items-center space-x-3">
                            <button
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                onClick={handleToggleSort}
                                title={sortDirection === 'desc' ? t('notifications.sortNewest') : t('notifications.sortOldest')}
                            >
                                {sortDirection === 'desc' ? (
                                    <SortDesc className="h-4 w-4" />
                                ) : (
                                    <SortAsc className="h-4 w-4" />
                                )}
                            </button>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={handleMarkAllAsRead}
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    {t('notifications.markAllRead')}
                                </Button>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>{t('notifications.noNotifications')}</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {notifications.map((notification) => (
                                    <li
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer relative ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                            }`}
                                        onClick={() => handleNotificationClick(
                                            notification.id,
                                            notification.isRead,
                                            notification.relatedId,
                                            notification.type
                                        )}
                                    >
                                        {!notification.isRead && (
                                            <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></span>
                                        )}
                                        <div className="flex flex-col gap-1">
                                            <div className="font-medium flex justify-between items-start">
                                                <div>
                                                    {notification.title}
                                                    {!notification.isRead && (
                                                        <span className="ml-2 text-xs font-semibold text-blue-500">
                                                            {t('notifications.new')}
                                                        </span>
                                                    )}
                                                </div>
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(notification.id);
                                                        }}
                                                        className="text-xs text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded p-1 transition-colors"
                                                        title={t('notifications.markRead')}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                {formatRelativeTime(new Date(notification.createdAt))}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {notifications.length < totalCount && (
                            <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-sm"
                                    onClick={handleLoadMore}
                                    isLoading={isLoading}
                                >
                                    {!isLoading && <ChevronDown className="w-4 h-4 mr-1" />}
                                    {t('notifications.loadMore')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 
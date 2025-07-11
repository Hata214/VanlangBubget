'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, Check, CheckCheck, Trash2, AlertCircle, Link as LinkIcon, RefreshCw, ArrowRight, History, Wallet, Clock, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import notificationService from '@/services/notificationService'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/redux/hooks'
import { fetchNotifications, markAsReadThunk, markAllAsReadThunk } from '@/redux/features/notificationSlice'
import { Notification as ApiNotification } from '@/types'
import Cookies from 'js-cookie'
import { TOKEN_COOKIE_NAME } from '@/services/api'
import { getToken } from '@/services/api'

// Định nghĩa interface mới thay vì kế thừa để tránh xung đột type
interface DisplayNotification {
    _id: string;
    id?: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    isRead?: boolean;
    link?: string;
    createdAt: string;
    updatedAt?: string;
    data?: any;
    userId?: string;
    relatedId?: string;
}

// Loại thông báo để hiển thị giao diện
// eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
enum NotificationVariant {
    DEFAULT = 'default',
    UPDATE = 'update',
    ALERT = 'alert',
    SUCCESS = 'success'
}

// Hàm lưu thông tin highlight vào localStorage - đơn giản hóa
const setScrollTarget = (targetId: string) => {
    try {
        // Chỉ lưu ID đối tượng
        localStorage.setItem('vanlang_highlight_info', targetId);
        console.log('[SCROLL] Set scroll target ID:', targetId);
    } catch (error) {
        console.error('[SCROLL] Error saving scroll target:', error);
    }
};

// Hàm chuyển hướng và scroll đến phần tử mục tiêu
const navigateToTarget = (router: any, url: string, targetId?: string) => {
    // Nếu có ID mục tiêu, lưu để scroll đến
    if (targetId) {
        console.log(`[SCROLL] Will navigate to ${url} and scroll to ${targetId}`);
        setScrollTarget(targetId);
    } else {
        console.log(`[SCROLL] Navigating to ${url} without scroll target`);
    }

    // Thực hiện chuyển hướng
    if (url.startsWith('/')) {
        // Chuyển hướng đơn giản không thêm highlight
        router.push(url);
    } else if (url.startsWith('http')) {
        window.open(url, '_blank');
    } else {
        router.push('/dashboard');
    }
};

// Thêm dữ liệu mẫu - moved outside component
const createMockNotifications = (t: any): DisplayNotification[] => [
    {
        _id: 'mock-1',
        id: 'mock-1',
        title: t('notifications.mockData.welcomeTitle'),
        message: t('notifications.mockData.welcomeMessage'),
        type: 'info',
        read: false,
        isRead: false,
        link: '/dashboard',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        _id: 'mock-2',
        id: 'mock-2',
        title: t('notifications.mockData.updateTitle'),
        message: t('notifications.mockData.updateMessage'),
        type: 'update',
        read: false,
        isRead: false,
        link: '/investments',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'mock-3',
        id: 'mock-3',
        title: t('notifications.mockData.reminderTitle'),
        message: t('notifications.mockData.reminderMessage'),
        type: 'warning',
        read: true,
        isRead: true,
        link: '/loans',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
];

export default function NotificationsPage() {
    const t = useTranslations();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { success, error } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const { notifications, isLoading: reduxLoading } = useAppSelector((state) => state.notification);
    const [showMockData, setShowMockData] = useState(false);

    // Create mock notifications with translations
    const mockNotifications = createMockNotifications(t);

    useEffect(() => {
        // Tải thông báo từ Redux store
        console.log('Dispatching fetchNotifications');

        // Kiểm tra token xác thực bằng hàm từ api.ts
        const authToken = getToken();
        if (!authToken) {
            console.log('No auth token found, showing mock data instead of API call');
            setShowMockData(true);
            return;
        }

        dispatch(fetchNotifications({ page: 1, sort: 'desc' }));
    }, [dispatch]);

    useEffect(() => {
        console.log('Notifications from Redux:', notifications.length, notifications);
        // Nếu không có thông báo từ API, hiển thị dữ liệu mẫu sau 1 giây
        if (notifications.length === 0 && !reduxLoading) {
            const timer = setTimeout(() => {
                setShowMockData(true);
                console.log('Showing mock notifications data');
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setShowMockData(false);
        }
    }, [notifications, reduxLoading]);

    // Chuyển đổi thông báo từ Redux store sang định dạng hiển thị trong trang này
    const mappedNotifications: DisplayNotification[] = notifications.map(notification => {
        // Đảm bảo dữ liệu hợp lệ từ backend hoặc redux
        const id = notification.id || (notification as any)._id || '';

        return {
            _id: id,
            id: id,
            title: notification.title || '',
            message: notification.message || '',
            type: notification.type?.toString() || 'info',
            read: notification.isRead || (notification as any).read || false,
            isRead: notification.isRead || (notification as any).read || false,
            link: (notification as any).link || '#',
            createdAt: notification.createdAt || new Date().toISOString(),
            updatedAt: notification.updatedAt,
            data: (notification as any).data,
            userId: notification.userId || '',
            relatedId: notification.relatedId
        };
    });

    // Dùng dữ liệu mẫu nếu không có dữ liệu từ API
    const displayNotifications = mappedNotifications.length > 0 ? mappedNotifications : (showMockData ? mockNotifications : []);

    const handleMarkAsRead = async (id: string) => {
        try {
            console.log('Marking notification as read:', id);
            await notificationService.markAsRead(id);
            // Cập nhật trạng thái trong Redux
            dispatch(markAsReadThunk(id));
        } catch (err: any) {
            console.error('Error marking notification as read:', err);
            error('Lỗi', err.message || t('notifications.errors.markAsReadError'));
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            console.log('Marking all notifications as read');
            await notificationService.markAllAsRead();
            // Cập nhật trạng thái trong Redux
            dispatch(markAllAsReadThunk());
        } catch (err: any) {
            console.error('Error marking all notifications as read:', err);
            error('Lỗi', err.message || t('notifications.errors.markAllReadError'));
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setIsLoading(true);
            console.log('Deleting notification:', id);
            await notificationService.delete(id);
            // Tải lại thông báo từ server sau khi xóa
            dispatch(fetchNotifications({ page: 1, sort: 'desc' }));
            success('Đã xóa', t('notifications.success.deleted'));
        } catch (err: any) {
            console.error('Error deleting notification:', err);
            error('Lỗi', err.message || t('notifications.errors.deleteError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        try {
            setIsLoading(true);
            console.log('Deleting all read notifications');
            await notificationService.deleteAll();
            console.log('Successfully deleted all read notifications');
            // Tải lại thông báo từ server sau khi xóa
            dispatch(fetchNotifications({ page: 1, sort: 'desc' }));
            success('Hoàn tất', t('notifications.success.allDeleted'));
        } catch (err: any) {
            console.error('Error in handleDeleteAll:', err);
            error('Lỗi', err.message || t('notifications.errors.deleteAllError'));
        } finally {
            setIsLoading(false);
        }
    };

    // Xác định loại thông báo để hiển thị giao diện phù hợp
    const getNotificationType = (notification: DisplayNotification): NotificationVariant => {
        // Kiểm tra các thông báo cập nhật và tạo mới từ các chức năng chính
        if (notification.type === 'INCOME_UPDATE' ||
            notification.type === 'INCOME_CREATE' ||
            notification.type === 'EXPENSE_UPDATE' ||
            notification.type === 'EXPENSE_CREATE' ||
            notification.type === 'LOAN_UPDATE' ||
            notification.type === 'LOAN_CREATE' ||
            notification.type === 'INVESTMENT_UPDATE' ||
            notification.type === 'INVESTMENT_CREATE') {
            return NotificationVariant.SUCCESS;
        }

        // Kiểm tra có phải là thông báo cập nhật từ các chức năng chính không
        if (notification.title?.toLowerCase().includes('cập nhật') ||
            notification.message?.toLowerCase().includes('cập nhật') ||
            notification.type?.toLowerCase().includes('update')) {
            return NotificationVariant.UPDATE;
        }

        // Kiểm tra có phải là thông báo cảnh báo không
        if (notification.type?.toUpperCase() === 'ERROR' ||
            notification.type?.toUpperCase() === 'WARNING' ||
            notification.type?.toUpperCase() === 'ACCOUNT-BALANCE' ||
            notification.type?.toUpperCase() === 'LOAN-OVERDUE') {
            return NotificationVariant.ALERT;
        }

        // Kiểm tra thông báo khoản vay đến hạn
        if (notification.type?.toUpperCase() === 'LOAN-DUE') {
            return NotificationVariant.ALERT;
        }

        return NotificationVariant.DEFAULT;
    };

    const getNotificationTypeIcon = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'SUCCESS':
                return <CheckCheck className="text-green-500" />;
            case 'WARNING':
                return <Bell className="text-amber-500" />;
            case 'ERROR':
                return <AlertCircle className="text-red-500" />;
            case 'UPDATE':
                return <RefreshCw className="text-indigo-500" />;
            case 'ACCOUNT-BALANCE':
                return <Wallet className="text-purple-500" />;
            case 'LOAN-DUE':
                return <Clock className="text-amber-500" />;
            case 'LOAN-OVERDUE':
                return <AlertTriangle className="text-rose-600" />;
            case 'INFO':
            default:
                return <Bell className="text-blue-500" />;
        }
    };

    // Render item thông báo cập nhật
    const renderUpdateNotification = (notification: DisplayNotification) => {
        return (
            <div className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border border-indigo-100 ${notification.read ? 'bg-indigo-50 bg-opacity-30' : 'bg-indigo-50'}`}>
                <div className="flex-shrink-0 mt-1">
                    <RefreshCw className="text-indigo-600 h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                            <div className="font-medium text-indigo-900 text-sm sm:text-base">
                                {notification.title}
                                {!notification.read && (
                                    <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 text-xs">
                                        {t('notifications.newBadge')}
                                    </Badge>
                                )}
                            </div>
                            <small className="text-indigo-500 text-xs">{t('notifications.updateData')}</small>
                        </div>
                        <small className="text-indigo-500 text-xs sm:shrink-0">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: vi
                            })}
                        </small>
                    </div>
                    <p className="text-xs sm:text-sm text-indigo-700 mt-1">
                        {notification.message}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-2">
                        <div className="flex flex-wrap gap-2">
                            {notification.link && notification.link !== '#' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-100 h-7 px-2 text-xs"
                                    onClick={() => navigateToTarget(router, notification.link || '/dashboard', notification.relatedId)}
                                >
                                    <span className="hidden sm:inline">{t('notifications.viewDetails')}</span>
                                    <span className="sm:hidden">Xem</span>
                                    <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <div className="flex space-x-2">
                            {!notification.read && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification._id)}
                                    className="text-indigo-600 hover:text-indigo-700 h-7 px-2"
                                >
                                    <Check className="h-3 w-3" />
                                    <span className="hidden sm:inline ml-1 text-xs">Đánh dấu</span>
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(notification._id)}
                                className="text-indigo-600 hover:text-indigo-700 h-7 px-2"
                            >
                                <Trash2 className="h-3 w-3" />
                                <span className="hidden sm:inline ml-1 text-xs">Xóa</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render thông báo thông thường
    const renderDefaultNotification = (notification: DisplayNotification) => {
        return (
            <div
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${notification.read
                    ? 'bg-muted/30 dark:bg-muted/20 border-border'
                    : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                    }`}
            >
                <div className="flex-shrink-0 mt-1">
                    {getNotificationTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                            <div className="font-medium text-foreground text-sm sm:text-base">
                                {notification.title}
                                {!notification.read && (
                                    <Badge variant="secondary" className="ml-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/70 text-xs">
                                        {t('notifications.newBadge')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <small className="text-muted-foreground text-xs sm:shrink-0">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: vi
                            })}
                        </small>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {notification.message}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-2">
                        <div className="flex space-x-2">
                            {notification.link && notification.link !== '#' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 h-7 px-2 text-xs"
                                    onClick={() => {
                                        try {
                                            console.log('Navigating to detail link:', notification.link);

                                            // Nếu có relatedId thì ưu tiên điều hướng theo loại thông báo
                                            if (notification.relatedId) {
                                                if (notification.title?.toLowerCase().includes('khoản vay') ||
                                                    notification.message?.toLowerCase().includes('khoản vay')) {
                                                    // Kiểm tra relatedId
                                                    console.log('RelatedId for loan:', notification.relatedId);
                                                    // Đảm bảo relatedId là chuỗi
                                                    const relatedIdStr = notification.relatedId.toString();

                                                    // Chuyển hướng đến trang chi tiết khoản vay
                                                    navigateToTarget(router, `/loans/${relatedIdStr}`, relatedIdStr);
                                                    return;
                                                }
                                            }

                                            // Xử lý tương tự như trên
                                            const link = notification.link || '';
                                            if (link.startsWith('/')) {
                                                // Trích xuất ID từ đường dẫn nếu có thể
                                                const pathSegments = link.split('/').filter(Boolean);
                                                const potentialId = pathSegments[pathSegments.length - 1];
                                                // Chỉ sử dụng ID nếu có định dạng giống MongoDB ID
                                                const targetId = /^[0-9a-fA-F]{24}$/.test(potentialId) ? potentialId : undefined;

                                                navigateToTarget(router, link, targetId);
                                            } else if (link.startsWith('http')) {
                                                window.open(link, '_blank');
                                            } else {
                                                router.push('/dashboard');
                                            }
                                        } catch (error) {
                                            console.error('Error navigating to detail link:', error);
                                            router.push('/dashboard');
                                        }
                                    }}
                                >
                                    <LinkIcon className="mr-1 h-3 w-3" />
                                    {t('notifications.viewDetails')}
                                </Button>
                            )}
                            {!notification.read && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 h-7 px-2 text-xs"
                                    onClick={() => handleMarkAsRead(notification._id)}
                                >
                                    <Check className="mr-1 h-3 w-3" />
                                    {t('notifications.markAsRead')}
                                </Button>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                            onClick={() => handleDelete(notification._id)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // Render thông báo cảnh báo
    const renderAlertNotification = (notification: DisplayNotification) => {
        let bgColor, borderColor, textColor, buttonColor;

        switch (notification.type?.toUpperCase()) {
            case 'ERROR':
                bgColor = 'bg-red-50 dark:bg-red-950/30';
                borderColor = 'border-red-200 dark:border-red-800';
                textColor = 'text-red-700 dark:text-red-300';
                buttonColor = 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-800 dark:hover:text-red-300';
                break;
            case 'ACCOUNT-BALANCE':
                bgColor = 'bg-purple-50 dark:bg-purple-950/30';
                borderColor = 'border-purple-200 dark:border-purple-800';
                textColor = 'text-purple-700 dark:text-purple-300';
                buttonColor = 'text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/50 hover:text-purple-800 dark:hover:text-purple-300';
                break;
            case 'LOAN-DUE':
                bgColor = 'bg-amber-50 dark:bg-amber-950/30';
                borderColor = 'border-amber-200 dark:border-amber-800';
                textColor = 'text-amber-700 dark:text-amber-300';
                buttonColor = 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 hover:text-amber-800 dark:hover:text-amber-300';
                break;
            case 'LOAN-OVERDUE':
                bgColor = 'bg-rose-50 dark:bg-rose-950/30';
                borderColor = 'border-rose-200 dark:border-rose-800';
                textColor = 'text-rose-700 dark:text-rose-300';
                buttonColor = 'text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 hover:text-rose-800 dark:hover:text-rose-300';
                break;
            case 'WARNING':
            default:
                bgColor = 'bg-amber-50 dark:bg-amber-950/30';
                borderColor = 'border-amber-200 dark:border-amber-800';
                textColor = 'text-amber-700 dark:text-amber-300';
                buttonColor = 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 hover:text-amber-800 dark:hover:text-amber-300';
                break;
        }

        return (
            <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${borderColor} ${notification.read ? `${bgColor} opacity-70` : bgColor}`}>
                <div className="flex-shrink-0 mt-1">
                    {getNotificationTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                            <div className={`font-medium ${textColor} text-sm sm:text-base`}>
                                {notification.title}
                                {!notification.read && (
                                    <Badge variant="secondary" className={`ml-2 ${bgColor} ${textColor} hover:opacity-80 text-xs`}>
                                        {t('notifications.newBadge')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <small className="text-muted-foreground text-xs sm:shrink-0">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: vi
                            })}
                        </small>
                    </div>
                    <p className={`text-xs sm:text-sm ${textColor} mt-1`}>
                        {notification.message}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-2">
                        <div className="flex flex-wrap gap-2">
                            {notification.link && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`${buttonColor} h-7 px-2 text-xs`}
                                    onClick={() => handleViewAction(notification)}
                                >
                                    <ArrowRight className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">{t('notifications.viewDetails')}</span>
                                    <span className="sm:hidden">Xem</span>
                                </Button>
                            )}
                            {!notification.read && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`${buttonColor} h-7 px-2 text-xs`}
                                    onClick={() => handleMarkAsRead(notification._id)}
                                >
                                    <Check className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">{t('notifications.markAsRead')}</span>
                                    <span className="sm:hidden">Đánh dấu</span>
                                </Button>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`${buttonColor} h-7 px-2 self-start sm:self-auto`}
                            onClick={() => handleDelete(notification._id)}
                        >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1 text-xs">Xóa</span>
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // Render thông báo thành công
    const renderSuccessNotification = (notification: DisplayNotification) => {
        return (
            <div className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-800 transition-colors ${notification.read ? 'bg-green-50 dark:bg-green-950/20 opacity-70' : 'bg-green-50 dark:bg-green-950/30'}`}>
                <div className="flex-shrink-0 mt-1">
                    <CheckCheck className="text-green-600 dark:text-green-400 h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                            <div className="font-medium text-green-900 dark:text-green-100 text-sm sm:text-base">
                                {notification.title}
                                {!notification.read && (
                                    <Badge variant="secondary" className="ml-2 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/70 text-xs">
                                        {t('notifications.newBadge')}
                                    </Badge>
                                )}
                            </div>
                            <small className="text-green-500 dark:text-green-400 text-xs">{t('notifications.updateData')}</small>
                        </div>
                        <small className="text-green-500 dark:text-green-400 text-xs sm:shrink-0">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: vi
                            })}
                        </small>
                    </div>
                    <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1">
                        {notification.message}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                        {notification.link && notification.link !== '#' && (
                            <Button
                                variant="link"
                                className="p-0 h-auto text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 self-start"
                                onClick={() => navigateToTarget(router, notification.link as string, notification.relatedId)}
                            >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                <span className="text-xs">{t('notifications.viewDetails')}</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 bg-green-50 dark:bg-green-950/50 hover:bg-green-100 dark:hover:bg-green-950/70 self-start sm:self-auto"
                            onClick={() => handleMarkAsRead(notification._id)}
                            disabled={notification.read}
                        >
                            <Check className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">{notification.read ? t('notifications.alreadyRead') : t('notifications.markAsRead')}</span>
                            <span className="sm:hidden">{notification.read ? 'Đã đọc' : 'Đánh dấu'}</span>
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // Render notification dựa vào loại
    const renderNotification = (notification: DisplayNotification) => {
        const notificationType = getNotificationType(notification);

        // Sử dụng các hàm render tùy thuộc vào loại thông báo
        switch (notificationType) {
            case NotificationVariant.UPDATE:
                return renderUpdateNotification(notification);
            case NotificationVariant.ALERT:
                return renderAlertNotification(notification);
            case NotificationVariant.SUCCESS:
                return renderSuccessNotification(notification);
            case NotificationVariant.DEFAULT:
            default:
                return renderDefaultNotification(notification);
        }
    };

    // Xử lý hành động xem chi tiết
    const handleViewAction = (notification: DisplayNotification) => {
        try {
            console.log('Navigating to notification link:', notification);

            // Kiểm tra xem nếu là thông báo về số dư âm
            if (notification.title?.toLowerCase().includes('cảnh báo số dư âm') ||
                notification.message?.toLowerCase().includes('số dư tài khoản') ||
                notification.type?.toUpperCase() === 'ACCOUNT-BALANCE') {
                console.log('Negative balance alert detected, redirecting to dashboard');
                router.push('/dashboard');
                return;
            }

            // Kiểm tra nếu là thông báo liên quan đến khoản vay
            if (notification.type?.toUpperCase() === 'LOAN-DUE' ||
                notification.type?.toUpperCase() === 'LOAN-OVERDUE' ||
                notification.type?.toUpperCase() === 'LOAN') {

                // Ưu tiên sử dụng relatedId nếu có
                if (notification.relatedId) {
                    const loanId = notification.relatedId.toString();
                    console.log('Loan notification with relatedId:', loanId);
                    router.push(`/loans/${loanId}`);
                    return;
                }

                // Nếu không có relatedId, chuyển hướng đến trang khoản vay
                router.push('/loans');
                return;
            }

            // Xử lý link nếu có
            if (notification.link && notification.link !== '#') {
                const link = notification.link.trim();
                console.log('Using notification link:', link);

                if (link.startsWith('/')) {
                    router.push(link);
                    return;
                } else if (link.startsWith('http')) {
                    window.open(link, '_blank');
                    return;
                }
            }

            // Fallback: dựa vào loại thông báo để chuyển hướng
            switch (notification.type?.toUpperCase()) {
                case 'EXPENSE':
                    router.push('/expenses');
                    break;
                case 'INCOME':
                    router.push('/incomes');
                    break;
                case 'BUDGET':
                    router.push('/dashboard');
                    break;
                default:
                    router.push('/dashboard');
                    break;
            }
        } catch (error) {
            console.error('Error navigating from notification:', error);
            // Fallback an toàn về trang chủ nếu có lỗi
            router.push('/dashboard');
        }
    };

    return (
        <MainLayout>
            <div className="container pb-12 pt-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">{t('notifications.title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('notifications.subtitle')}</p>
                </div>

                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg sm:text-xl">{t('notifications.yourNotifications')}</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                disabled={displayNotifications.length === 0 || displayNotifications.every(n => n.read)}
                                className="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                            >
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
                                <span className="sm:hidden">Đánh dấu đã đọc</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteAll}
                                disabled={displayNotifications.length === 0 || displayNotifications.every(n => !n.read)}
                                className="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                            >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">{t('notifications.deleteRead')}</span>
                                <span className="sm:hidden">Xóa đã đọc</span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {reduxLoading && !showMockData ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                                        <div className="flex-shrink-0 mt-1">
                                            <Skeleton className="h-5 w-5 rounded-full" />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <Skeleton className="h-5 w-3/5" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-4/5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : displayNotifications.length > 0 ? (
                            <div className="space-y-4">
                                {displayNotifications.map((notification) => (
                                    <div key={notification._id}>
                                        {renderNotification(notification)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                                <Bell className="h-12 w-12 text-muted-foreground/50" />
                                <h3 className="text-lg font-medium text-foreground">{t('notifications.noNotifications')}</h3>
                                <p className="text-muted-foreground max-w-md">{t('notifications.emptyMessage')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

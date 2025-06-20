import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { io } from 'socket.io-client';
import { Bell, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import notificationService from '@/services/notificationService';
import { formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { useAppDispatch } from '@/redux/hooks';
import { fetchLoans } from '@/redux/features/loanSlice';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    link: string;
    createdAt: string;
    data?: any;
}

export function NotificationCenter() {
    const t = useTranslations();
    const { success } = useToast();
    const dispatch = useAppDispatch();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const loadNotifications = async () => {
        try {
            setIsLoading(true);
            const data = await notificationService.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(notification => !notification.read).length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();

        // Kết nối Socket.io để nhận thông báo mới
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vanlangbubget.onrender.com';

        try {
            // Lấy token từ cookie
            const tokenCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='));

            let token = null;
            if (tokenCookie) {
                try {
                    const tokenValue = decodeURIComponent(tokenCookie.split('=')[1]);
                    // Xử lý trường hợp token được lưu dưới dạng JSON string
                    if (tokenValue.startsWith('{') && tokenValue.includes('accessToken')) {
                        const tokenObj = JSON.parse(tokenValue);
                        token = tokenObj.accessToken;
                    } else {
                        token = tokenValue;
                    }
                    console.log('Found authentication token for socket.io connection');
                } catch (e) {
                    console.error('Error parsing token from cookie:', e);
                }
            }

            const socket = io(apiUrl, {
                withCredentials: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                transports: ['websocket', 'polling'],
                auth: token ? { token } : undefined
            });

            socket.on('connect', () => {
                console.log('Connected to notification socket');
            });

            socket.on('connect_error', (err: Error) => {
                console.error('Socket connection error:', err.message);
            });

            // Define a more specific type for the notification data if possible
            // For now, using a general structure based on usage
            interface SocketNotificationData {
                notification?: {
                    title: string;
                    message: string;
                };
                // Add other properties if known
            }
            socket.on('notification', (data: SocketNotificationData) => {
                console.log('Received notification:', data);
                loadNotifications(); // Tải lại thông báo khi có thông báo mới

                // Hiển thị thông báo toast
                if (data.notification && data.notification.title) {
                    success(data.notification.title, data.notification.message);
                }
            });

            // Lắng nghe sự kiện thay đổi trạng thái khoản vay
            socket.on('loan_status_changed', (data: {
                loanId: string;
                oldStatus: string;
                newStatus: string;
                message?: string;
            }) => {
                console.log('Loan status changed event received:', data);

                // Tải lại danh sách khoản vay khi trạng thái thay đổi
                dispatch(fetchLoans());

                // Hiển thị thông báo chi tiết hơn
                const statusLabels: Record<string, string> = {
                    'ACTIVE': 'Đang vay',
                    'PAID': 'Đã trả',
                    'OVERDUE': 'Quá hạn'
                };

                const oldStatusLabel = statusLabels[data.oldStatus] || data.oldStatus;
                const newStatusLabel = statusLabels[data.newStatus] || data.newStatus;

                const title = 'Trạng thái khoản vay đã thay đổi';
                const message = data.message ||
                    `Khoản vay đã chuyển từ trạng thái ${oldStatusLabel} sang ${newStatusLabel}`;

                // Hiển thị thông báo
                success(title, message);

                // Tải lại thông báo
                loadNotifications();
            });

            socket.on('error', (err: Error) => {
                console.error('Socket error:', err);
            });

            socket.on('disconnect', (reason: string) => {
                console.log('Disconnected from notification socket:', reason);
            });

            return () => {
                socket.disconnect();
            };
        } catch (err) {
            console.error('Error setting up socket connection:', err);
        }
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(notification =>
                notification._id === id ? { ...notification, read: true } : notification
            ));
            setUnreadCount(prev => Math.max(prev - 1, 0));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifications.map(notification => ({ ...notification, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification._id);
        }

        // Thêm xử lý đặc biệt cho thông báo cảnh báo số dư âm
        if (notification.title?.toLowerCase().includes('cảnh báo số dư âm') ||
            notification.message?.toLowerCase().includes('số dư tài khoản') ||
            notification.message?.toLowerCase().includes('số dư âm')) {
            console.log('Negative balance notification clicked, redirecting to dashboard');
            window.location.href = '/dashboard';
            setIsOpen(false);
            return;
        }

        // Nếu có link, điều hướng đến đó
        if (notification.link) {
            window.location.href = notification.link;
        }

        // Đóng dropdown sau khi click
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 px-1.5 min-w-[20px] h-5 flex items-center justify-center"
                    >
                        {unreadCount}
                    </Badge>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-[80vh] bg-white shadow-lg rounded-md overflow-hidden z-50">
                    <div className="p-3 border-b flex justify-between items-center">
                        <h3 className="font-medium">{t('notifications')}</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                >
                                    {t('markAllAsRead')}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[60vh]">
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-500">
                                {t('loading')}...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                {t('noNotifications')}
                            </div>
                        ) : (
                            <ul>
                                {notifications.map((notification) => (
                                    <li
                                        key={notification._id}
                                        className={`border-b last:border-0 ${!notification.read ? 'bg-blue-50' : ''}`}
                                    >
                                        <button
                                            onClick={() => handleNotificationClick(notification)}
                                            className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <div className="font-medium">{notification.title}</div>
                                                <div className="text-gray-600 text-sm mt-1">{notification.message}</div>
                                                <div className="text-gray-400 text-xs mt-2">
                                                    {formatRelativeTime(new Date(notification.createdAt))}
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

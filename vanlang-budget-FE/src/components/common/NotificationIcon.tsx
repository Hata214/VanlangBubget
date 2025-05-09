import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchUnreadCount } from '@/redux/features/notificationSlice';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

interface NotificationIconProps {
    onClick: () => void;
    className?: string;
}

export function NotificationIcon({ onClick, className }: NotificationIconProps) {
    const t = useTranslations();
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAuth();
    const { socket } = useNotification();
    const { unreadCount } = useAppSelector((state) => state.notification);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Lấy số lượng thông báo chưa đọc khi component mount
    useEffect(() => {
        if (isAuthenticated) {
            // Lấy số lượng thông báo chưa đọc ngay lập tức
            dispatch(fetchUnreadCount());

            // Thiết lập interval để cập nhật định kỳ (2 phút)
            intervalRef.current = setInterval(() => {
                dispatch(fetchUnreadCount());
            }, 2 * 60 * 1000);
        }

        return () => {
            // Clear interval khi component unmount
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [dispatch, isAuthenticated]);

    // Lắng nghe sự kiện 'notification' từ socket để cập nhật unreadCount khi có thông báo mới
    useEffect(() => {
        if (socket && isAuthenticated) {
            // Khi nhận thông báo mới, cập nhật số lượng thông báo chưa đọc
            const handleNewNotification = () => {
                dispatch(fetchUnreadCount());
            };

            socket.on('notification', handleNewNotification);

            return () => {
                socket.off('notification', handleNewNotification);
            };
        }
    }, [socket, dispatch, isAuthenticated]);

    return (
        <button
            className={cn(
                'relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                className
            )}
            onClick={onClick}
            aria-label={t('notifications.title')}
        >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
} 
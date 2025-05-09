import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { addNotification, fetchUnreadCount } from '@/redux/features/notificationSlice';
import { Notification } from '@/types';
import { initializeSocket, closeSocket, onNewNotification, offNewNotification, getSocket } from '@/utils/notifyUtils';

// Import từ đường dẫn tuyệt đối thay vì tương đối
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface NotificationContextProps {
    socket: Socket | null;
    connectNotificationSocket: () => void;
    disconnectNotificationSocket: () => void;
}

const NotificationContext = createContext<NotificationContextProps>({
    socket: null,
    connectNotificationSocket: () => { },
    disconnectNotificationSocket: () => { },
});

export const useNotification = () => useContext(NotificationContext);

interface NotificationProviderProps {
    children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { isAuthenticated, accessToken } = useAuth();
    const dispatch = useAppDispatch();
    const { info } = useToast();
    const { notificationSettings } = useAppSelector((state) => state.notification);

    const connectNotificationSocket = () => {
        if (!isAuthenticated) {
            console.log('Not connecting notification socket - user not authenticated');
            return;
        }

        console.log('Connecting notification socket');
        // Sử dụng utility function từ notifyUtils
        const socketInstance = initializeSocket();
        setSocket(socketInstance);

        // Đăng ký lắng nghe sự kiện thông báo mới
        onNewNotification((notification: Notification) => {
            console.log('New notification received:', notification);

            // Thêm thông báo mới vào redux store
            dispatch(addNotification(notification));

            // Cập nhật số lượng thông báo chưa đọc
            dispatch(fetchUnreadCount());

            // Hiển thị toast nếu cài đặt cho phép
            if (notificationSettings?.pushNotifications) {
                info(notification.title, notification.message);
            }
        });
    };

    const disconnectNotificationSocket = () => {
        console.log('Disconnecting notification socket');
        // Hủy đăng ký lắng nghe sự kiện
        offNewNotification();

        // Ngắt kết nối socket
        closeSocket();
        setSocket(null);
    };

    // Kết nối socket khi người dùng đăng nhập
    useEffect(() => {
        console.log('Auth state changed, isAuthenticated:', isAuthenticated);
        if (isAuthenticated) {
            connectNotificationSocket();

            // Lấy số lượng thông báo chưa đọc khi đăng nhập
            dispatch(fetchUnreadCount());
        } else {
            disconnectNotificationSocket();
        }

        return () => {
            disconnectNotificationSocket();
        };
    }, [isAuthenticated, dispatch]);

    return (
        <NotificationContext.Provider value={{
            socket,
            connectNotificationSocket,
            disconnectNotificationSocket
        }}>
            {children}
        </NotificationContext.Provider>
    );
} 
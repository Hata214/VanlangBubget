import { io, Socket } from 'socket.io-client';
import { Notification, NotificationType } from '@/types';
import api from '@/services/api';
import { TOKEN_COOKIE_NAME, getToken } from '@/services/api';

let socket: Socket | null = null;

/**
 * Khởi tạo kết nối socket.io với xác thực
 * @returns Đối tượng socket đã kết nối
 */
export const initializeSocket = (): Socket => {
    if (socket) {
        return socket;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    // Lấy token từ service
    const token = getToken();

    socket = io(apiUrl, {
        withCredentials: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined
    });

    socket.on('connect', () => {
        console.log('Socket connected successfully');
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });

    return socket;
};

/**
 * Lấy socket đã được khởi tạo hoặc tạo mới nếu chưa có
 * @returns Đối tượng socket
 */
export const getSocket = (): Socket => {
    if (!socket) {
        return initializeSocket();
    }
    return socket;
};

/**
 * Đóng kết nối socket
 */
export const closeSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

/**
 * Gửi thông báo đến người dùng
 * @param data Dữ liệu thông báo
 * @returns Promise với response từ API
 */
export const sendNotification = async (data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    emailNotification?: boolean;
}) => {
    try {
        const response = await api.post('/api/notifications', data);
        return response.data;
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
};

/**
 * Gửi thông báo đến nhiều người dùng
 * @param data Dữ liệu thông báo
 * @returns Promise với response từ API
 */
export const sendBulkNotifications = async (data: {
    userIds: string[];
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    emailNotification?: boolean;
}) => {
    try {
        const response = await api.post('/api/notifications/bulk', data);
        return response.data;
    } catch (error) {
        console.error('Error sending bulk notifications:', error);
        throw error;
    }
};

/**
 * Lấy danh sách thông báo
 * @param page Số trang
 * @param limit Số lượng thông báo mỗi trang
 * @returns Promise với response từ API
 */
export const getNotifications = async (page = 1, limit = 10) => {
    try {
        const response = await api.get(`/api/notifications?page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

/**
 * Lấy số lượng thông báo chưa đọc
 * @returns Promise với số lượng thông báo chưa đọc
 */
export const getUnreadCount = async () => {
    try {
        const response = await api.get('/api/notifications/unread-count');
        return response.data.count;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        throw error;
    }
};

/**
 * Đánh dấu thông báo đã đọc
 * @param notificationId ID thông báo
 * @returns Promise với response từ API
 */
export const markAsRead = async (notificationId: string) => {
    try {
        const response = await api.patch(`/api/notifications/${notificationId}/read`);
        return response.data;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 * @returns Promise với response từ API
 */
export const markAllAsRead = async () => {
    try {
        const response = await api.patch('/api/notifications/read-all');
        return response.data;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

/**
 * Xóa một thông báo
 * @param notificationId ID thông báo
 * @returns Promise với response từ API
 */
export const deleteNotification = async (notificationId: string) => {
    try {
        const response = await api.delete(`/api/notifications/${notificationId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

/**
 * Cập nhật cài đặt thông báo
 * @param settings Cài đặt thông báo mới
 * @returns Promise với response từ API
 */
export const updateNotificationSettings = async (settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    inAppNotifications?: boolean;
}) => {
    try {
        const response = await api.patch('/api/notifications/settings', settings);
        return response.data;
    } catch (error) {
        console.error('Error updating notification settings:', error);
        throw error;
    }
};

/**
 * Đăng ký lắng nghe sự kiện thông báo mới
 * @param callback Hàm callback được gọi khi có thông báo mới
 */
export const onNewNotification = (callback: (notification: Notification) => void) => {
    if (!socket) {
        console.warn('Socket is not connected. Call connectSocket first.');
        return;
    }

    socket.on('notification', (notification: Notification) => {
        callback(notification);
    });
};

/**
 * Hủy đăng ký lắng nghe sự kiện thông báo mới
 */
export const offNewNotification = () => {
    if (!socket) {
        return;
    }

    socket.off('notification');
};

/**
 * Tạo chuỗi văn bản cho loại thông báo
 * @param type Loại thông báo
 * @returns Chuỗi văn bản mô tả loại thông báo
 */
export const getNotificationTypeText = (type: NotificationType): string => {
    switch (type) {
        case 'expense':
            return 'Chi tiêu';
        case 'income':
            return 'Thu nhập';
        case 'budget':
            return 'Ngân sách';
        case 'system':
            return 'Hệ thống';
        case 'account-balance':
            return 'Số dư tài khoản';
        case 'loan-due':
            return 'Khoản vay sắp đến hạn';
        case 'loan-overdue':
            return 'Khoản vay quá hạn';
        default:
            return 'Thông báo';
    }
};

/**
 * Lấy màu cho loại thông báo
 * @param type Loại thông báo
 * @returns Màu tương ứng với loại thông báo
 */
export const getNotificationTypeColor = (type: NotificationType): string => {
    switch (type) {
        case 'expense':
            return 'text-red-500';
        case 'income':
            return 'text-green-500';
        case 'budget':
            return 'text-yellow-500';
        case 'system':
            return 'text-blue-500';
        case 'account-balance':
            return 'text-purple-500';
        case 'loan-due':
            return 'text-amber-500';
        case 'loan-overdue':
            return 'text-rose-600';
        default:
            return 'text-gray-500';
    }
};

/**
 * Lấy icon cho loại thông báo
 * @param type Loại thông báo
 * @returns Tên icon tương ứng với loại thông báo
 */
export const getNotificationTypeIcon = (type: NotificationType): string => {
    switch (type) {
        case 'expense':
            return 'credit-card';
        case 'income':
            return 'banknotes';
        case 'budget':
            return 'chart-bar';
        case 'system':
            return 'bell';
        case 'account-balance':
            return 'exclamation-circle';
        case 'loan-due':
            return 'clock';
        case 'loan-overdue':
            return 'exclamation-triangle';
        default:
            return 'bell';
    }
};

/**
 * @deprecated Sử dụng initializeSocket thay thế
 * Hàm này chỉ được giữ lại để tương thích ngược với mã cũ
 * @param token Token xác thực (không sử dụng nữa)
 * @returns Socket đã kết nối
 */
export const connectSocket = (token?: string): Socket => {
    console.warn('connectSocket() đã bị deprecated, vui lòng sử dụng initializeSocket() thay thế');
    return initializeSocket();
};

/**
 * @deprecated Sử dụng closeSocket thay thế
 * Hàm này chỉ được giữ lại để tương thích ngược với mã cũ
 */
export const disconnectSocket = (): void => {
    console.warn('disconnectSocket() đã bị deprecated, vui lòng sử dụng closeSocket() thay thế');
    closeSocket();
}; 
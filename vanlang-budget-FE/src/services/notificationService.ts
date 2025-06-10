import instance from './api';
import { NotificationSettings } from '@/types';
import { getToken } from './api';

// Định nghĩa kiểu Notification (tương tự như trong NotificationCenter.tsx)
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

const notificationService = {
    async getNotifications(page = 1, sort = 'desc'): Promise<Notification[]> {
        try {
            // Log token hiện tại để debug
            const token = getToken();
            console.log('Token khi gọi getNotifications:', token ? `${token.substring(0, 15)}...` : 'Không có token');

            const response = await instance.get(`/api/notifications?page=${page}&sort=${sort}`);
            console.log('API response:', response.status, response.statusText);

            // Đảm bảo trả về đúng định dạng dữ liệu
            if (response.data && response.data.data) {
                return response.data.data || [];
            }
            return response.data || [];
        } catch (error: any) {
            console.error('Lỗi khi lấy thông báo:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            // Trả về mảng rỗng thay vì throw error để tránh crash UI
            return [];
        }
    },

    async getUnreadCount() {
        try {
            const response = await instance.get('/api/notifications/unread-count');
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy số thông báo chưa đọc:', error);
            throw error;
        }
    },

    async markAsRead(id: string) {
        try {
            const response = await instance.patch(`/api/notifications/${id}/read`, {});
            return response.data;
        } catch (error) {
            console.error('Lỗi khi đánh dấu đã đọc:', error);
            throw error;
        }
    },

    async markAllAsRead() {
        try {
            const response = await instance.patch('/api/notifications/read-all', {});
            return response.data;
        } catch (error) {
            console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
            throw error;
        }
    },

    async delete(id: string) {
        try {
            const response = await instance.delete(`/api/notifications/${id}`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi xóa thông báo:', error);
            throw error;
        }
    },

    async deleteAll() {
        try {
            const response = await instance.delete('/api/notifications/read');
            return response.data;
        } catch (error) {
            console.error('Lỗi khi xóa thông báo đã đọc:', error);
            throw error;
        }
    },

    async checkNegativeBalance() {
        try {
            const response = await instance.post('/api/notifications/check-balance');
            return response.data;
        } catch (error) {
            console.error('Lỗi khi kiểm tra số dư âm:', error);
            throw error;
        }
    },

    async getSettings() {
        try {
            const response = await instance.get('/api/notifications/settings');
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy cài đặt thông báo:', error);
            throw error;
        }
    },

    async updateSettings(settings: Partial<NotificationSettings>) {
        try {
            const response = await instance.patch('/api/notifications/settings', settings);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi cập nhật cài đặt thông báo:', error);
            throw error;
        }
    }
};

export default notificationService;

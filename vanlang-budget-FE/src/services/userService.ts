import api from './api';

/**
 * Service cho quản lý người dùng
 */
export const userService = {
    /**
     * Lấy danh sách người dùng
     * @param options Tùy chọn tìm kiếm, phân trang, sắp xếp
     */
    async getUsers(options?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
        sortBy?: string;
        sortDirection?: 'asc' | 'desc';
    }) {
        const params = options || {};
        const response = await api.get('/api/admin/users', { params });
        return response.data;
    },

    /**
     * Lấy thông tin chi tiết người dùng
     * @param userId ID của người dùng
     */
    async getUserById(userId: string) {
        const response = await api.get(`/api/admin/users/${userId}`);
        return response.data;
    },

    /**
     * Tạo người dùng mới (dành cho admin)
     * @param userData Thông tin người dùng mới
     */
    async createUser(userData: any) {
        const response = await api.post('/api/admin/users', userData);
        return response.data;
    },

    /**
     * Cập nhật thông tin người dùng
     * @param userId ID của người dùng
     * @param userData Thông tin cần cập nhật
     */
    async updateUser(userId: string, userData: any) {
        const response = await api.put(`/api/admin/users/${userId}`, userData);
        return response.data;
    },

    /**
     * Xóa người dùng
     * @param userId ID của người dùng
     */
    async deleteUser(userId: string) {
        const response = await api.delete(`/api/admin/users/${userId}`);
        return response.data;
    },

    /**
     * Thăng cấp người dùng lên Admin
     * Chỉ SuperAdmin mới có quyền thực hiện
     * @param userId ID của người dùng
     */
    async promoteToAdmin(userId: string) {
        try {
            console.log(`Đang gửi request thăng cấp user ${userId} lên admin`);
            const response = await api.post(`/api/admin/users/${userId}/promote`);
            console.log('Kết quả thăng cấp từ API:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi thăng cấp user:', error);
            throw error;
        }
    },

    /**
     * Hạ cấp Admin xuống người dùng thường
     * Chỉ SuperAdmin mới có quyền thực hiện
     * @param userId ID của người dùng
     */
    async demoteFromAdmin(userId: string) {
        try {
            console.log(`Đang gửi request hạ cấp admin ${userId} xuống user`);
            const response = await api.post(`/api/admin/users/${userId}/demote`);
            console.log('Kết quả hạ cấp từ API:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi hạ cấp admin:', error);
            throw error;
        }
    },

    /**
     * Kích hoạt tài khoản người dùng
     * @param userId ID của người dùng
     */
    async activateUser(userId: string) {
        const response = await api.post(`/api/admin/users/${userId}/activate`);
        return response.data;
    },

    /**
     * Vô hiệu hóa tài khoản người dùng
     * @param userId ID của người dùng
     */
    async deactivateUser(userId: string) {
        const response = await api.post(`/api/admin/users/${userId}/deactivate`);
        return response.data;
    },

    /**
     * Lấy số liệu thống kê người dùng
     */
    async getUserStats() {
        const response = await api.get('/api/admin/users/stats');
        return response.data;
    },

    /**
     * Đặt lại mật khẩu người dùng (dành cho admin)
     * @param userId ID của người dùng
     * @param newPassword Mật khẩu mới
     */
    async resetUserPassword(userId: string, newPassword: string) {
        const response = await api.post(`/api/admin/users/${userId}/reset-password`, { newPassword });
        return response.data;
    }
};

export default userService; 
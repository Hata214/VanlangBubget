import api from './api';

/**
 * Service cho admin dashboard và các chức năng admin khác
 */
export const adminService = {
    /**
     * Lấy dữ liệu dashboard admin
     */
    async getDashboardData() {
        const response = await api.get('/api/admin/dashboard');
        return response.data;
    },

    /**
     * Lấy danh sách activity logs
     */
    async getActivityLogs(options?: {
        page?: number;
        limit?: number;
        adminId?: string;
        actionType?: string;
        targetType?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const params = options || {};
        console.log('🔄 AdminService.getActivityLogs - Params:', params);

        const response = await api.get('/api/admin/activity-logs', { params });

        console.log('📡 AdminService.getActivityLogs - Response:', response);
        console.log('📊 AdminService.getActivityLogs - Response Data:', response.data);

        return response.data;
    },

    /**
     * Lấy thống kê hoạt động admin
     */
    async getActivityStats(days: number = 30) {
        const response = await api.get('/api/admin/activity-logs/stats', {
            params: { days }
        });
        return response.data;
    },

    /**
     * Lấy logs theo action type
     */
    async getLogsByAction(actionType: string, options?: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
    }) {
        const params = options || {};
        const response = await api.get(`/api/admin/activity-logs/by-action/${actionType}`, { params });
        return response.data;
    },

    /**
     * Lấy logs trong khoảng thời gian
     */
    async getLogsByDateRange(startDate: string, endDate: string, options?: {
        page?: number;
        limit?: number;
    }) {
        const params = { startDate, endDate, ...options };
        const response = await api.get('/api/admin/activity-logs/by-date', { params });
        return response.data;
    },

    /**
     * Lấy logs của admin cụ thể
     */
    async getAdminLogs(adminId: string, options?: {
        page?: number;
        limit?: number;
        actionType?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const params = options || {};
        const response = await api.get(`/api/admin/activity-logs/${adminId}`, { params });
        return response.data;
    },

    /**
     * Lấy danh sách admin (SuperAdmin only)
     */
    async getAdminList(options?: {
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const params = options || {};
        const response = await api.get('/api/admin/manage/list', { params });
        return response.data;
    },

    /**
     * Tạo admin mới (SuperAdmin only)
     */
    async createAdmin(adminData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
    }) {
        const response = await api.post('/api/admin/manage/create', adminData);
        return response.data;
    },

    /**
     * Cập nhật thông tin admin (SuperAdmin only)
     */
    async updateAdmin(adminId: string, adminData: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        email?: string;
    }) {
        const response = await api.put(`/api/admin/manage/update/${adminId}`, adminData);
        return response.data;
    },

    /**
     * Xóa admin (SuperAdmin only)
     */
    async deleteAdmin(adminId: string) {
        const response = await api.delete(`/api/admin/manage/delete/${adminId}`);
        return response.data;
    },

    /**
     * Kích hoạt/vô hiệu hóa admin (SuperAdmin only)
     */
    async toggleAdminStatus(adminId: string) {
        const response = await api.patch(`/api/admin/manage/toggle-status/${adminId}`);
        return response.data;
    },

    /**
     * Xuất dữ liệu người dùng CSV
     */
    async exportUsersCSV(filters?: {
        role?: string;
        status?: string;
        search?: string;
    }) {
        const params = filters || {};
        const response = await api.get('/api/admin/users/export', {
            params,
            responseType: 'blob'
        });

        // Tạo file download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'Xuất dữ liệu thành công' };
    },

    /**
     * Xuất activity logs CSV
     */
    async exportActivityLogsCSV(filters?: {
        adminId?: string;
        actionType?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const params = filters || {};
        const response = await api.get('/api/admin/activity-logs/export', {
            params,
            responseType: 'blob'
        });

        // Tạo file download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity-logs-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'Xuất dữ liệu thành công' };
    }
};

export default adminService;

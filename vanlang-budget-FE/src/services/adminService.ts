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
     * Lấy danh sách người dùng với phân trang và filter
     */
    async getUsers(options?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
        sortBy?: string;
        sortDirection?: string;
    }) {
        const params = options || {};
        const response = await api.get('/api/admin/users', { params });
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
    },

    /**
     * Xóa tất cả activity logs (SuperAdmin only)
     */
    async deleteAllActivityLogs() {
        const response = await api.delete('/api/admin/activity-logs/delete-all');
        return response.data;
    },

    // === Transaction Management ===
    /**
     * Lấy danh sách tất cả giao dịch
     */
    async getAllTransactions(options?: {
        page?: number;
        limit?: number;
        search?: string;
        type?: string;
        dateRange?: string;
        userId?: string;
        amountRange?: string;
        sortBy?: string;
        sortOrder?: string;
    }) {
        const params = options || {};
        const response = await api.get('/api/admin/transactions', { params });
        return response.data;
    },

    /**
     * Lấy chi tiết một giao dịch
     */
    async getTransactionById(transactionId: string, type?: string) {
        const params = type ? { type } : {};
        const response = await api.get(`/api/admin/transactions/${transactionId}`, { params });
        return response.data;
    },

    /**
     * Cập nhật giao dịch
     */
    async updateTransaction(transactionId: string, type: string, updateData: any) {
        const response = await api.put(`/api/admin/transactions/${transactionId}?type=${type}`, updateData);
        return response.data;
    },

    /**
     * Xóa giao dịch
     */
    async deleteTransaction(transactionId: string, type: string) {
        const response = await api.delete(`/api/admin/transactions/${transactionId}?type=${type}`);
        return response.data;
    },

    /**
     * Xuất dữ liệu giao dịch
     */
    async exportTransactions(options?: {
        search?: string;
        type?: string;
        dateRange?: string;
        userId?: string;
        amountRange?: string;
    }) {
        const params = options || {};
        const response = await api.get('/api/admin/transactions/export', {
            params,
            responseType: 'blob'
        });
        return response;
    },

    // === Payment Transaction Management ===
    /**
     * Lấy danh sách giao dịch thanh toán premium
     */
    async getPaymentTransactions(queryString?: string) {
        const url = queryString ? `/api/admin/transactions?${queryString}` : '/api/admin/transactions';
        const response = await api.get(url);
        return response.data;
    },

    /**
     * Lấy chi tiết giao dịch thanh toán
     */
    async getPaymentTransactionById(transactionId: string) {
        const response = await api.get(`/api/admin/transactions/${transactionId}`);
        return response.data;
    },

    /**
     * Cập nhật trạng thái giao dịch thanh toán
     */
    async updatePaymentTransactionStatus(transactionId: string, status: string, notes?: string) {
        const response = await api.patch(`/api/admin/transactions/${transactionId}/status`, {
            status,
            notes
        });
        return response.data;
    },

    /**
     * Lấy thống kê giao dịch thanh toán
     */
    async getPaymentTransactionStats(dateRange?: { startDate?: string; endDate?: string }) {
        const params = dateRange || {};
        const response = await api.get('/api/admin/transactions/stats', { params });
        return response.data;
    },

    /**
     * Migrate dữ liệu payment transactions thật từ users hiện có
     */
    async migrateRealPaymentTransactions() {
        const response = await api.post('/api/admin/transactions/migrate-real-data');
        return response.data;
    },

    /**
     * Tạo giao dịch mẫu (cho development/testing) - DEPRECATED
     */
    async createSampleTransactions() {
        const response = await api.post('/api/admin/transactions/create-sample');
        return response.data;
    },

    /**
     * Xuất báo cáo giao dịch thanh toán
     */
    async exportPaymentTransactions(filters?: {
        search?: string;
        status?: string;
        type?: string;
        planType?: string;
        paymentMethod?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const params = filters || {};
        const response = await api.get('/api/admin/transactions/export', {
            params,
            responseType: 'blob'
        });

        // Tạo file download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment-transactions-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'Xuất dữ liệu thành công' };
    },

    // === Admin Management (SuperAdmin only) ===
    /**
     * Lấy danh sách tất cả admin users
     */
    async getAllAdmins(options?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: string;
    }) {
        const params = options || {};
        const response = await api.get('/api/admin/manage/admins', { params });
        return response.data;
    },

    /**
     * Tạo admin mới
     */
    async createAdmin(adminData: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role?: 'admin' | 'superadmin';
        phoneNumber?: string;
    }) {
        const response = await api.post('/api/admin/manage/admins', {
            ...adminData,
            role: adminData.role || 'admin'
        });
        return response.data;
    },

    /**
     * Cập nhật thông tin admin
     */
    async updateAdmin(adminId: string, updateData: {
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
        role?: 'admin' | 'superadmin';
        status?: 'active' | 'inactive' | 'suspended';
    }) {
        const response = await api.put(`/api/admin/manage/admins/${adminId}`, updateData);
        return response.data;
    },

    /**
     * Xóa admin
     */
    async deleteAdmin(adminId: string) {
        const response = await api.delete(`/api/admin/manage/admins/${adminId}`);
        return response.data;
    },

    /**
     * Toggle trạng thái admin
     */
    async toggleAdminStatus(adminId: string) {
        const response = await api.patch(`/api/admin/manage/admins/${adminId}/toggle-status`);
        return response.data;
    },

    /**
     * Reset mật khẩu admin
     */
    async resetAdminPassword(adminId: string) {
        const response = await api.post(`/api/admin/manage/admins/${adminId}/reset-password`);
        return response.data;
    },

    /**
     * Lấy danh sách tất cả người dùng (bao gồm user, admin, superadmin)
     */
    async getAllUsers(options?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        dateRange?: string;
        sortBy?: string;
        sortOrder?: string;
    }) {
        const params = options || {};
        const response = await api.get('/api/admin/users', { params });
        return response.data;
    },

    /**
     * Cập nhật role của user
     */
    async updateUserRole(userId: string, role: 'user' | 'admin' | 'superadmin') {
        console.log(`Đang gửi request cập nhật role của user ${userId} thành ${role}`);
        try {
            const response = await api.put(`/api/admin/users/${userId}`, { role });
            console.log('Kết quả cập nhật role:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi cập nhật role:', error);
            throw error;
        }
    },

    // === System Settings ===
    /**
     * Lấy cài đặt hệ thống
     */
    async getSystemSettings() {
        const response = await api.get('/api/admin/settings');
        return response.data;
    },

    /**
     * Cập nhật cài đặt hệ thống
     */
    async updateSystemSettings(settings: any) {
        const response = await api.put('/api/admin/settings', { settings });
        return response.data;
    },

    /**
     * Kiểm tra cấu hình email
     */
    async testEmailConfig(emailConfig: any) {
        const response = await api.post('/api/admin/settings/test-email', { emailConfig });
        return response.data;
    },

    /**
     * Tạo backup hệ thống
     */
    async createBackup() {
        const response = await api.post('/api/admin/settings/backup', {}, {
            responseType: 'blob'
        });
        return response;
    },

    /**
     * Khôi phục từ backup
     */
    async restoreFromBackup(file: File) {
        const formData = new FormData();
        formData.append('backup', file);

        const response = await api.post('/api/admin/settings/restore', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export default adminService;

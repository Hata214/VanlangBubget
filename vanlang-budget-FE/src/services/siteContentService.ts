import api from './api';

/**
 * Service cho quản lý nội dung trang web
 */
export const siteContentService = {
    /**
     * Lấy nội dung trang web theo loại
     * @param type Loại nội dung (footer, about, terms, privacy, faq, contact, homepage)
     * @param language Ngôn ngữ (mặc định: vi)
     */
    async getContentByType(type: string, language?: string) {
        const params = language ? { language } : {};
        const response = await api.get(`/api/site-content/${type}`, { params });
        return response.data;
    },

    /**
     * Cập nhật nội dung trang web theo loại
     * @param type Loại nội dung
     * @param content Nội dung cần cập nhật
     * @param status Trạng thái nội dung (draft, published, pending_review)
     */
    async updateContentByType(type: string, content: any, status?: string) {
        const response = await api.put(`/api/site-content/${type}`, { content, status });
        return response.data;
    },

    /**
     * Lấy nội dung trang chủ
     * @param language Ngôn ngữ (mặc định: vi)
     */
    async getHomepageContent(language?: string) {
        const params = language ? { language } : {};
        const response = await api.get('/api/site-content/homepage', { params });
        return response.data;
    },

    /**
     * Lấy nội dung trang chủ theo section
     * @param section Tên section cần lấy
     * @param language Ngôn ngữ (mặc định: vi)
     */
    async getHomepageSection(section: string, language?: string) {
        const params = language ? { language } : {};
        const response = await api.get(`/api/site-content/homepage/${section}`, { params });
        return response.data;
    },

    /**
     * Cập nhật nội dung trang chủ theo section
     * @param section Tên section cần cập nhật
     * @param content Nội dung cần cập nhật
     * @param language Ngôn ngữ (mặc định: vi)
     */
    async updateHomepageSection(section: string, content: any, language?: string) {
        const response = await api.put(`/api/site-content/homepage/${section}`, { content, language });
        return response.data;
    },

    /**
     * Lấy lịch sử chỉnh sửa nội dung
     * @param type Loại nội dung
     */
    async getContentHistory(type: string) {
        const response = await api.get(`/api/site-content/${type}/history`);
        return response.data;
    },

    /**
     * Khôi phục nội dung từ phiên bản trước (chỉ dành cho SuperAdmin)
     * @param type Loại nội dung
     * @param version Phiên bản cần khôi phục
     */
    async restoreContentVersion(type: string, version: number) {
        const response = await api.post(`/api/site-content/${type}/restore/${version}`);
        return response.data;
    },

    /**
     * Phê duyệt nội dung trang chủ (chỉ dành cho SuperAdmin)
     */
    async approveHomepageContent() {
        const response = await api.post('/api/site-content/homepage/approve');
        return response.data;
    },

    /**
     * Từ chối nội dung trang chủ (chỉ dành cho SuperAdmin)
     * @param reason Lý do từ chối
     */
    async rejectHomepageContent(reason?: string) {
        const response = await api.post('/api/site-content/homepage/reject', { reason });
        return response.data;
    }
};

export default siteContentService; 
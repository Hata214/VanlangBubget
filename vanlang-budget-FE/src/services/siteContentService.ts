import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { localFallbackData } from '@/content/fallbacks';

/**
 * Service cho quản lý nội dung trang web
 */
export const siteContentService = {
    /**
     * Lấy nội dung trang web theo loại. Backend sẽ trả về toàn bộ document SiteContent.
     * @param type Loại nội dung (ví dụ: 'homepage', 'about')
     * @param forceRefresh Bắt buộc refresh, bỏ qua cache
     */
    async getContentByType(type: string, forceRefresh: boolean = false) {
        try {
            let actualType = type;
            if (actualType === 'home') { // Chuẩn hóa
                actualType = 'homepage';
            }
            console.log(`[SERVICE] Lấy toàn bộ nội dung đa ngôn ngữ cho type: ${actualType}, forceRefresh: ${forceRefresh}`);

            // Tạo cache busting mạnh hơn
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(7);
            const params = {
                _t: timestamp,
                _r: randomId,
                ...(forceRefresh && { _force: '1' })
            };

            // Thêm headers để tránh cache
            const headers = forceRefresh ? {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            } : {};

            const response = await axios.get(`${API_ENDPOINTS.SITE_CONTENT}/${actualType}`, {
                params,
                headers
            });
            console.log(`[SERVICE] API Response for ${actualType}:`, response.data);
            return response.data; // response.data là toàn bộ SiteContent document
        } catch (apiError) {
            console.error(`Lỗi khi lấy nội dung ${type} từ API:`, apiError);
            // Fallback logic có thể cần xem xét lại để trả về cấu trúc mong đợi (ví dụ: một object có trường data.content)
            const fallbackKey = `${type.split('-')[0]}-vi`; // Cơ bản fallback về 'vi'
            return {
                success: false, // Chỉ rõ API call thất bại
                data: { content: { vi: this.getFallbackContent(fallbackKey) } }, // Cấu trúc fallback
                message: 'API error, using fallback.',
                meta: { source: 'fallback_api_error', updatedAt: new Date().toISOString() }
            };
        }
    },

    /**
     * Cập nhật nội dung trang web theo loại.
     * @param type Loại nội dung (ví dụ: 'about', 'features', 'homepage').
     * @param fullContentData Object chứa toàn bộ nội dung đa ngôn ngữ (ví dụ: { vi: {...}, en: {...} }).
     * @param languageEdited Ngôn ngữ vừa được chỉnh sửa chính (ví dụ: 'en').
     * @param status Trạng thái nội dung (draft, published, pending_review).
     */
    async updateContentByType(type: string, fullContentData: any, languageEdited?: string, status?: string) {
        try {
            let actualType = type;
            if (actualType === 'home') {
                actualType = 'homepage';
            }
            console.log(`[SERVICE] Cập nhật nội dung cho type=${actualType}, ngôn ngữ chính được sửa: ${languageEdited}`);
            const requestData: { content: any; language?: string; status?: string } = {
                content: fullContentData,
            };
            if (languageEdited) {
                requestData.language = languageEdited;
            }
            if (status) {
                requestData.status = status;
            }
            const response = await axios.put(`${API_ENDPOINTS.SITE_CONTENT}/${actualType}?_t=${Date.now()}`, requestData);
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi cập nhật nội dung ${type}:`, error);
            throw error;
        }
    },

    async getHomepageContent(forceRefresh: boolean = false) { // Hàm này có thể không cần thiết nữa nếu getContentByType('homepage') đã đủ
        return this.getContentByType('homepage', forceRefresh);
    },

    async getHomepageSection(section: string, language?: string) {
        try {
            const lang = language || 'vi';
            const params = { language: lang, _t: Date.now() };
            const response = await axios.get(`${API_ENDPOINTS.SITE_CONTENT}/homepage/${section}`, { params });
            return response.data; // Backend trả về data.content[lang][section]
        } catch (error) {
            console.error(`Lỗi khi lấy section ${section} (${language}):`, error);
            return {
                success: false, data: this.getFallbackHomepageSection(section, language),
                meta: { source: 'fallback', updatedAt: new Date().toISOString() }
            };
        }
    },

    async updateHomepageSection(section: string, sectionData: any, language?: string) {
        const lang = language || 'vi';
        // Backend controller updateHomepageSection mong đợi { content: sectionData, language: lang } trong body
        const response = await axios.put(`${API_ENDPOINTS.SITE_CONTENT}/homepage/${section}`, { content: sectionData, language: lang });
        return response.data;
    },

    async updateHomepageContent(fullContentData: any, languageEdited?: string) {
        // Hàm này giờ sẽ tương tự như updateContentByType('homepage', ...)
        return this.updateContentByType('homepage', fullContentData, languageEdited);
    },

    async getContentHistory(type: string) {
        const response = await axios.get(`${API_ENDPOINTS.SITE_CONTENT}/${type}/history`);
        return response.data;
    },

    async restoreContentVersion(type: string, version: number) {
        const response = await axios.post(`${API_ENDPOINTS.SITE_CONTENT}/${type}/restore/${version}`);
        return response.data;
    },

    async approveHomepageContent() {
        const response = await axios.post(`${API_ENDPOINTS.SITE_CONTENT}/homepage/approve`);
        return response.data;
    },

    async rejectHomepageContent(reason?: string) {
        const response = await axios.post(`${API_ENDPOINTS.SITE_CONTENT}/homepage/reject`, { reason });
        return response.data;
    },

    async approveContentByType(type: string) {
        let actualType = type;
        if (actualType === 'home') actualType = 'homepage';
        if (actualType === 'homepage') return this.approveHomepageContent();

        const response = await axios.post(`${API_ENDPOINTS.SITE_CONTENT}/${actualType}/approve`);
        return response.data;
    },

    async rejectContentByType(type: string, reason?: string) {
        let actualType = type;
        if (actualType === 'home') actualType = 'homepage';
        if (actualType === 'homepage') return this.rejectHomepageContent(reason);

        const response = await axios.post(`${API_ENDPOINTS.SITE_CONTENT}/${actualType}/reject`, { reason });
        return response.data;
    },

    async initializeHomepageContent() {
        const response = await axios.post(`${API_ENDPOINTS.SITE_CONTENT}/homepage/initialize`);
        return response.data;
    },

    async initializeContentByType(type: string) {
        try {
            const response = await axios.post(`${API_ENDPOINTS.SITE_CONTENT}/${type}/initialize`);
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi khởi tạo nội dung ${type} qua API /initialize:`, error);
            // Fallback: thử tạo/cập nhật với nội dung mặc định đa ngôn ngữ
            const fallbackMultiLang = {
                vi: this.getFallbackContent(`${type}-vi`) || {},
                en: this.getFallbackContent(`${type}-en`) || {}
            };
            // Đảm bảo không gửi object rỗng nếu không có fallback
            if (Object.keys(fallbackMultiLang.vi).length === 0 && Object.keys(fallbackMultiLang.en).length === 0) {
                console.error(`Không có dữ liệu fallback cho ${type} để thử cập nhật.`);
                throw error; // Ném lỗi ban đầu nếu không có fallback
            }
            try {
                console.warn(`Thử fallback cập nhật nội dung cho ${type} sau khi initialize thất bại.`);
                // Gọi updateContentByType, giả sử 'vi' là ngôn ngữ chính được "sửa" để thêm vào mảng languages nếu cần
                return await this.updateContentByType(type, fallbackMultiLang, 'vi');
            } catch (updateError) {
                console.error(`Lỗi khi fallback cập nhật nội dung ${type}:`, updateError);
                throw updateError;
            }
        }
    },

    // ... (các hàm còn lại giữ nguyên) ...
    async createHomepageContent(content: any) {
        const response = await axios.post('/api/site-content/homepage', { content });
        return response.data;
    },

    async getHomepageTemplates() {
        const response = await axios.get('/api/site-content/homepage/templates');
        return response.data;
    },

    async applyHomepageTemplate(templateId: string) {
        const response = await axios.post(`/api/site-content/homepage/templates/${templateId}/apply`);
        return response.data;
    },

    async getSectionStructure(section: string) {
        const response = await axios.get(`/api/site-content/structure/${section}`);
        return response.data;
    },

    async addSectionItem(section: string, itemData: any) {
        const response = await axios.post(`/api/site-content/homepage/${section}/items`, { item: itemData });
        return response.data;
    },

    async removeSectionItem(section: string, itemId: string) {
        const response = await axios.delete(`/api/site-content/homepage/${section}/items/${itemId}`);
        return response.data;
    },

    async addContentTypeItem(type: string, section: string, itemData: any) {
        const response = await axios.post(`${API_ENDPOINTS.SITE_CONTENT}/${type}/${section}/items`, { item: itemData });
        return response.data;
    },

    async removeContentTypeItem(type: string, section: string, itemId: string) {
        const response = await axios.delete(`${API_ENDPOINTS.SITE_CONTENT}/${type}/${section}/items/${itemId}`);
        return response.data;
    },

    getFallbackContent(contentType: string) {
        return localFallbackData[contentType] || {};
    },

    getFallbackHomepageSection(sectionName: string, language: string = 'vi') {
        const homepageKey = `homepage-${language}`;
        const fallbackHomepage = localFallbackData[homepageKey] || {};
        return fallbackHomepage[sectionName] || {};
    },

    async checkContentStatus(contentType: string) {
        // This function might need re-evaluation based on actual backend capabilities or requirements.
        // For now, it's a mock.
        try {
            let actualType = contentType;
            if (contentType.includes('-')) {
                actualType = contentType.split('-')[0];
            }
            if (actualType === 'home') actualType = 'homepage';

            return {
                success: true,
                data: { isSync: true, lastSync: new Date().toISOString(), type: actualType }
            };
        } catch (error) {
            console.error(`Lỗi khi kiểm tra trạng thái nội dung ${contentType}:`, error);
            return { success: false, data: { isSync: false, lastSync: null } };
        }
    }
};

export default siteContentService;

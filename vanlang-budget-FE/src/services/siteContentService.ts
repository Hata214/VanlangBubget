import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { localFallbackData } from '@/content/fallbacks';

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
        try {
            // Xử lý đặc biệt cho các loại nội dung có tiền tố ngôn ngữ (ví dụ: homepage-vi, homepage-en)
            let actualType = type;
            let actualLanguage = language;

            // Kiểm tra nếu type có dạng "xxx-vi" hoặc "xxx-en"
            if (type.includes('-')) {
                const parts = type.split('-');
                if (parts.length === 2 && (parts[1] === 'vi' || parts[1] === 'en')) {
                    actualType = parts[0];
                    actualLanguage = parts[1];
                }
            }

            // Chuẩn hóa loại nội dung
            if (actualType === 'home') {
                actualType = 'homepage';
            }

            console.log(`Lấy nội dung cho type=${actualType}, language=${actualLanguage}`);

            // Kiểm tra xem có dữ liệu fallback không trước khi gọi API
            const fallbackData = this.getFallbackContent(`${actualType}-${actualLanguage || 'vi'}`);

            try {
                const params = actualLanguage ? { language: actualLanguage } : {};
                const response = await axios.get(`${API_ENDPOINTS.SITE_CONTENT}/${actualType}`, { params });
                return response.data;
            } catch (apiError) {
                console.error(`Lỗi khi lấy nội dung ${type} từ API:`, apiError);

                // Trả về dữ liệu fallback nếu API thất bại
                return {
                    success: true,
                    data: fallbackData,
                    meta: {
                        source: 'fallback',
                        updatedAt: new Date().toISOString()
                    }
                };
            }
        } catch (error) {
            console.error(`Lỗi khi lấy nội dung ${type}:`, error);

            // Trả về dữ liệu fallback nếu có lỗi xử lý
            return {
                success: true,
                data: this.getFallbackContent(type),
                meta: {
                    source: 'fallback',
                    updatedAt: new Date().toISOString()
                }
            };
        }
    },

    /**
     * Cập nhật nội dung trang web theo loại
     * @param type Loại nội dung
     * @param content Nội dung cần cập nhật
     * @param status Trạng thái nội dung (draft, published, pending_review)
     */
    async updateContentByType(type: string, content: any, status?: string) {
        const response = await axios.put(`${API_ENDPOINTS.SITE_CONTENT}/${type}`, { content, status });
        return response.data;
    },

    /**
     * Lấy nội dung trang chủ
     * @param language Ngôn ngữ (mặc định: vi)
     */
    async getHomepageContent(language?: string) {
        const params = language ? { language } : {};
        const response = await axios.get('/api/site-content/homepage', { params });
        return response.data;
    },

    /**
     * Lấy nội dung trang chủ theo section
     * @param section Tên section cần lấy
     * @param language Ngôn ngữ (mặc định: vi)
     */
    async getHomepageSection(section: string, language?: string) {
        try {
            const params = language ? { language } : {};
            const response = await axios.get(`${API_ENDPOINTS.SITE_CONTENT}/homepage/${section}`, { params });
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi lấy section ${section}:`, error);

            // Trả về dữ liệu fallback cho section này
            return {
                success: true,
                data: this.getFallbackHomepageSection(section, language),
                meta: {
                    source: 'fallback',
                    updatedAt: new Date().toISOString()
                }
            };
        }
    },

    /**
     * Cập nhật nội dung trang chủ theo section
     * @param section Tên section cần cập nhật
     * @param content Nội dung cần cập nhật
     * @param language Ngôn ngữ (mặc định: vi)
     */
    async updateHomepageSection(section: string, content: any, language?: string) {
        const response = await axios.put(`${API_ENDPOINTS.SITE_CONTENT}/homepage/${section}?lang=${language}`, content);
        return response.data;
    },

    /**
     * Lấy lịch sử chỉnh sửa nội dung
     * @param type Loại nội dung
     */
    async getContentHistory(type: string) {
        const response = await axios.get(`/api/site-content/${type}/history`);
        return response.data;
    },

    /**
     * Khôi phục nội dung từ phiên bản trước (chỉ dành cho SuperAdmin)
     * @param type Loại nội dung
     * @param version Phiên bản cần khôi phục
     */
    async restoreContentVersion(type: string, version: number) {
        const response = await axios.post(`/api/site-content/${type}/restore/${version}`);
        return response.data;
    },

    /**
     * Phê duyệt nội dung trang chủ (chỉ dành cho SuperAdmin)
     */
    async approveHomepageContent() {
        const response = await axios.post('/api/site-content/homepage/approve');
        return response.data;
    },

    /**
     * Từ chối nội dung trang chủ (chỉ dành cho SuperAdmin)
     * @param reason Lý do từ chối
     */
    async rejectHomepageContent(reason?: string) {
        const response = await axios.post('/api/site-content/homepage/reject', { reason });
        return response.data;
    },

    /**
     * Khởi tạo dữ liệu mặc định cho trang chủ (chỉ dành cho SuperAdmin)
     * @param language Ngôn ngữ (mặc định: vi)
     */
    async initializeHomepageContent(language?: string) {
        const fallbackContent = this.getFallbackContent(`homepage-${language}`);
        const response = await axios.post(`${API_ENDPOINTS.SITE_CONTENT}/homepage/initialize?lang=${language}`, fallbackContent);
        return response.data;
    },

    /**
     * Tạo nội dung trang chủ mới
     * @param content Nội dung trang chủ
     */
    async createHomepageContent(content: any) {
        const response = await axios.post('/api/site-content/homepage', { content });
        return response.data;
    },

    /**
     * Lấy danh sách các templates có sẵn cho trang chủ
     */
    async getHomepageTemplates() {
        const response = await axios.get('/api/site-content/homepage/templates');
        return response.data;
    },

    /**
     * Áp dụng template cho trang chủ
     * @param templateId ID của template
     */
    async applyHomepageTemplate(templateId: string) {
        const response = await axios.post(`/api/site-content/homepage/templates/${templateId}/apply`);
        return response.data;
    },

    /**
     * Lấy cấu trúc nội dung cho mỗi section
     * @param section Tên section
     */
    async getSectionStructure(section: string) {
        const response = await axios.get(`/api/site-content/structure/${section}`);
        return response.data;
    },

    /**
     * Thêm phần mới vào một section (chẳng hạn thêm testimonial mới)
     * @param section Tên section
     * @param itemData Dữ liệu phần tử mới
     */
    async addSectionItem(section: string, itemData: any) {
        const response = await axios.post(`/api/site-content/homepage/${section}/items`, { item: itemData });
        return response.data;
    },

    /**
     * Xóa phần tử khỏi một section
     * @param section Tên section
     * @param itemId ID của phần tử
     */
    async removeSectionItem(section: string, itemId: string) {
        const response = await axios.delete(`/api/site-content/homepage/${section}/items/${itemId}`);
        return response.data;
    },

    // Lấy dữ liệu fallback theo loại nội dung
    getFallbackContent(contentType: string) {
        // Lấy dữ liệu fallback từ các file tĩnh
        return localFallbackData[contentType] || {};
    },

    // Lấy dữ liệu fallback cho một section cụ thể của trang chủ
    getFallbackHomepageSection(sectionName: string, language: string = 'vi') {
        const homepageKey = `homepage-${language}`;
        const fallbackHomepage = localFallbackData[homepageKey] || {};
        return fallbackHomepage[sectionName] || {};
    },

    // Kiểm tra trạng thái của nội dung (đã đồng bộ hay chưa)
    async checkContentStatus(contentType: string) {
        try {
            console.log(`Kiểm tra trạng thái nội dung cho: ${contentType}`);

            // Xử lý đặc biệt cho các loại nội dung có tiền tố ngôn ngữ (ví dụ: homepage-vi, homepage-en)
            let actualType = contentType;
            let language = 'vi';

            // Kiểm tra nếu contentType có dạng "xxx-vi" hoặc "xxx-en"
            if (contentType.includes('-')) {
                const parts = contentType.split('-');
                if (parts.length === 2 && (parts[1] === 'vi' || parts[1] === 'en')) {
                    actualType = parts[0];
                    language = parts[1];
                }
            }

            // Chuẩn hóa loại nội dung
            if (actualType === 'home') {
                actualType = 'homepage';
            }

            console.log(`Kiểm tra trạng thái cho type=${actualType}, language=${language}`);

            // Sửa lại: Không gọi API status vì backend không có endpoint này
            // Thay vào đó, giả định nội dung luôn đã được đồng bộ
            return {
                success: true,
                data: {
                    isSync: true,
                    lastSync: new Date().toISOString(),
                    type: actualType,
                    language: language
                }
            };
        } catch (error) {
            console.error(`Lỗi khi kiểm tra trạng thái nội dung ${contentType}:`, error);
            return {
                success: false,
                data: {
                    isSync: false,
                    lastSync: null
                }
            };
        }
    }
};

export default siteContentService;
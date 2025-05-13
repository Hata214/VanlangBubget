'use client';

import React from 'react';
import { useSiteContent } from '@/components/SiteContentProvider';

interface SectionContentProps {
    sectionKey: string;
    fallback?: any;
    language?: 'vi' | 'en';
    render: (content: any) => React.ReactNode;
    categoryFields?: string[];
}

/**
 * Component hiển thị nội dung section với cơ chế fallback
 * 
 * @param sectionKey - Khóa của section cần hiển thị (vd: 'hero', 'features')
 * @param fallback - Dữ liệu fallback khi không có dữ liệu từ API (tùy chọn)
 * @param language - Ngôn ngữ hiển thị, nếu không cung cấp sẽ lấy từ context
 * @param render - Hàm render nội dung, nhận đầu vào là dữ liệu section
 * @param categoryFields - Danh sách các trường thuộc danh mục cần hiển thị (tùy chọn)
 */
export default function SectionContent({
    sectionKey,
    fallback,
    language,
    render,
    categoryFields
}: SectionContentProps) {
    const { content, isLoading, language: contextLanguage, getFallbackIfEmpty } = useSiteContent();

    const currentLanguage = language || contextLanguage;

    // Lấy nội dung section từ API hoặc fallback nếu không có
    const sectionContent = getFallbackIfEmpty(sectionKey, fallback);

    // Cấu trúc dữ liệu cho mỗi danh mục
    const getCategoryStructure = (category: string): string[] => {
        const structures: Record<string, string[]> = {
            'hero': ['title', 'subtitle', 'description', 'cta', 'secondaryCta', 'image', 'background'],
            'features': ['title', 'subtitle', 'feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6'],
            'testimonials': ['title', 'subtitle', 'testimonial1', 'testimonial2', 'testimonial3'],
            'pricing': ['title', 'subtitle', 'free', 'premium', 'business'],
            'contact': ['title', 'subtitle', 'email', 'phone', 'address', 'formNameLabel', 'formEmailLabel', 'formSubjectLabel', 'formMessageLabel', 'formSubmitButton'],
            'footer': ['description', 'copyrightText', 'links', 'social'],
            'about': ['title', 'subtitle', 'description', 'team', 'mission', 'vision', 'values'],
            'roadmap': ['title', 'subtitle', 'description', 'milestones'],
        };

        return structures[category] || [];
    };

    // Chỉ lấy các trường được chỉ định trong categoryFields nếu có
    const filterContentByFields = (data: any): any => {
        // Nếu không có categoryFields hoặc sectionKey không có trong cấu trúc, trả về data gốc
        if (!categoryFields) {
            const defaultFields = getCategoryStructure(sectionKey);
            if (defaultFields.length === 0) return data;

            // Lọc dựa trên cấu trúc mặc định cho section này
            const filteredData: Record<string, any> = {};
            defaultFields.forEach(field => {
                if (field in data) filteredData[field] = data[field];
            });
            return filteredData;
        }

        // Lọc dữ liệu theo categoryFields được chỉ định
        const filteredData: Record<string, any> = {};
        categoryFields.forEach(field => {
            if (field in data) filteredData[field] = data[field];
        });
        return filteredData;
    };

    // Lọc theo ngôn ngữ cho các trường đa ngôn ngữ
    const processMultiLanguageFields = (data: any): any => {
        if (!data) return null;

        // Nếu là object có cấu trúc { vi: ..., en: ... }
        if (data && typeof data === 'object' && ('vi' in data || 'en' in data)) {
            // Ưu tiên ngôn ngữ hiện tại, nếu không có thì thử ngôn ngữ khác
            return data[currentLanguage] || data.vi || data.en || '';
        }

        // Nếu là mảng
        if (Array.isArray(data)) {
            return data.map(item => processMultiLanguageFields(item));
        }

        // Nếu là object phức tạp
        if (data && typeof data === 'object') {
            const result: Record<string, any> = {};

            for (const key in data) {
                result[key] = processMultiLanguageFields(data[key]);
            }

            return result;
        }

        // Các loại dữ liệu khác
        return data;
    };

    // Nội dung đã được lọc và xử lý ngôn ngữ
    const filteredContent = filterContentByFields(sectionContent);
    const processedContent = processMultiLanguageFields(filteredContent);

    // Hiển thị loading nếu đang tải
    if (isLoading) {
        return (
            <div className="w-full py-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Render nội dung
    return render(processedContent);
} 
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';
import siteContentService from '@/services/siteContentService';
import { localFallbackData } from '@/content/fallbacks';

// Định nghĩa kiểu dữ liệu cho context
interface SiteContentContextType {
    content: Record<string, any>;
    isLoading: boolean;
    language: 'vi' | 'en';
    error: Error | null;
    refreshContent: () => Promise<void>;
    getFallbackIfEmpty: (key: string, fallbackObj?: any) => any;
}

// Tạo context
const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

// Props cho provider
interface SiteContentProviderProps {
    children: ReactNode;
    initialContent?: Record<string, any>;
    initialLanguage?: 'vi' | 'en';
}

export const SiteContentProvider: React.FC<SiteContentProviderProps> = ({
    children,
    initialContent = {},
    initialLanguage = 'vi'
}) => {
    const [content, setContent] = useState<Record<string, any>>(initialContent);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [language, setLanguage] = useState<'vi' | 'en'>(initialLanguage);
    const [error, setError] = useState<Error | null>(null);

    const pathname = usePathname();

    // Xác định loại trang hiện tại từ pathname
    const getContentTypeFromPath = (path: string): string => {
        const pathSegments = path.split('/').filter(Boolean);

        // Trang chủ
        if (pathSegments.length === 0 || pathSegments[0] === '') {
            return `homepage-${language}`;
        }

        // Kiểm tra trang ngôn ngữ
        const actualPath = pathSegments[0] === 'vi' || pathSegments[0] === 'en'
            ? pathSegments[1] || 'homepage'
            : pathSegments[0];

        // Ánh xạ path sang loại nội dung
        const contentTypeMap: Record<string, string> = {
            '': 'homepage',
            'homepage': 'homepage',
            'about': 'about',
            'features': 'features',
            'pricing': 'pricing',
            'contact': 'contact',
            'roadmap': 'roadmap'
        };

        const contentType = contentTypeMap[actualPath] || 'homepage';
        return `${contentType}-${language}`;
    };

    // Tải nội dung từ API
    const loadContent = async () => {
        if (!pathname) return;

        setIsLoading(true);
        setError(null);

        try {
            const contentType = getContentTypeFromPath(pathname);

            // Kiểm tra xem dữ liệu đã được đồng bộ với database chưa
            try {
                const statusResponse = await siteContentService.checkContentStatus(contentType);
                console.log(`Kết quả kiểm tra trạng thái cho ${contentType}:`, statusResponse);

                // Nếu dữ liệu chưa được đồng bộ, sử dụng fallback
                if (statusResponse?.data?.isSync === false) {
                    console.log(`Dữ liệu ${contentType} chưa được đồng bộ, sử dụng fallback`);
                    const fallbackData = localFallbackData[contentType] || {};
                    setContent(prev => ({ ...prev, [contentType]: fallbackData }));
                    return;
                }
            } catch (statusError) {
                console.warn(`Lỗi khi kiểm tra trạng thái ${contentType}, tiếp tục tải nội dung:`, statusError);
                // Tiếp tục tải nội dung ngay cả khi kiểm tra trạng thái thất bại
            }

            // Tải dữ liệu từ API
            const response = await siteContentService.getContentByType(contentType);

            if (response && response.data) {
                // Lưu nội dung vào state
                setContent(prev => ({ ...prev, [contentType]: response.data }));
            } else {
                // Sử dụng dữ liệu fallback nếu không có dữ liệu từ API
                const fallbackData = localFallbackData[contentType] || {};
                setContent(prev => ({ ...prev, [contentType]: fallbackData }));
            }
        } catch (err) {
            console.error('Lỗi khi tải nội dung:', err);
            setError(err as Error);

            // Sử dụng dữ liệu fallback khi có lỗi
            const contentType = getContentTypeFromPath(pathname);
            const fallbackData = localFallbackData[contentType] || {};
            setContent(prev => ({ ...prev, [contentType]: fallbackData }));
        } finally {
            setIsLoading(false);
        }
    };

    // Tải lại nội dung
    const refreshContent = async () => {
        await loadContent();
    };

    // Lấy dữ liệu fallback nếu dữ liệu chính rỗng
    const getFallbackIfEmpty = (key: string, fallbackObj?: any) => {
        const contentType = getContentTypeFromPath(pathname);
        const currentContent = content[contentType] || {};

        // Nếu có dữ liệu, trả về dữ liệu đó
        if (currentContent[key] && Object.keys(currentContent[key]).length > 0) {
            return currentContent[key];
        }

        // Nếu không có dữ liệu, trả về fallback
        const fallback = localFallbackData[contentType] || {};
        return fallbackObj || fallback[key] || {};
    };

    // Tải nội dung khi component được mount
    useEffect(() => {
        loadContent();
    }, [pathname, language]);

    // Giá trị context
    const value: SiteContentContextType = {
        content,
        isLoading,
        language,
        error,
        refreshContent,
        getFallbackIfEmpty
    };

    return (
        <SiteContentContext.Provider value={value}>
            {children}
        </SiteContentContext.Provider>
    );
};

// Hook sử dụng context
export const useSiteContent = () => {
    const context = useContext(SiteContentContext);

    if (context === undefined) {
        throw new Error('useSiteContent must be used within a SiteContentProvider');
    }

    return context;
};
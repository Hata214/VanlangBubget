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
    const [error, setError] = useState<Error | null>(null);
    const [language, setLanguage] = useState<'vi' | 'en'>(initialLanguage);

    const pathname = usePathname();

    // Lắng nghe thay đổi ngôn ngữ từ URL hoặc cookie
    useEffect(() => {
        // Xác định ngôn ngữ từ pathname
        const pathSegments = pathname.split('/').filter(Boolean);
        const localeFromPath = pathSegments[0] === 'vi' || pathSegments[0] === 'en'
            ? pathSegments[0] as 'vi' | 'en'
            : 'vi';

        if (localeFromPath !== language) {
            setLanguage(localeFromPath);
        }
    }, [pathname, language]);

    // Xác định loại trang hiện tại từ pathname (chỉ trả về base type)
    const getBaseContentTypeFromPath = (path: string): string => {
        const pathSegments = path.split('/').filter(Boolean);
        let actualPathSegments = pathSegments;

        // Bỏ qua segment ngôn ngữ (nếu có) để lấy path thực tế cho content type
        if (pathSegments.length > 0 && (pathSegments[0] === 'vi' || pathSegments[0] === 'en')) {
            actualPathSegments = pathSegments.slice(1);
        }

        const pageSegment = actualPathSegments[0] || 'homepage'; // Mặc định là 'homepage' nếu không có segment

        const contentTypeMap: Record<string, string> = {
            '': 'homepage', // Được xử lý bởi pageSegment default
            'home': 'homepage',
            'homepage': 'homepage',
            'about': 'about',
            'features': 'features',
            'pricing': 'pricing',
            'contact': 'contact',
            'roadmap': 'roadmap'
            // Các loại khác như header, footer có thể cần logic tải riêng nếu không dựa trên path
        };
        return contentTypeMap[pageSegment] || 'homepage'; // Fallback về 'homepage' cho các path không xác định
    };

    // Tải nội dung từ API
    const loadContent = async () => {
        if (!pathname) return;

        setIsLoading(true);
        setError(null);
        const baseContentType = getBaseContentTypeFromPath(pathname);

        try {
            // Kiểm tra xem dữ liệu đã được đồng bộ với database chưa
            try {
                // siteContentService.checkContentStatus có thể đã tự xử lý việc tách ngôn ngữ
                // nhưng truyền baseContentType sẽ rõ ràng hơn.
                const statusResponse = await siteContentService.checkContentStatus(baseContentType);
                console.log(`Kết quả kiểm tra trạng thái cho ${baseContentType}:`, statusResponse);

                if (statusResponse?.data?.isSync === false) {
                    console.log(`Dữ liệu ${baseContentType} chưa được đồng bộ, sử dụng fallback`);
                    const viFallback = localFallbackData[`${baseContentType}-vi`] || {};
                    const enFallback = localFallbackData[`${baseContentType}-en`] || {};
                    const fallbackResponse = {
                        status: 'success_fallback_sync',
                        data: {
                            content: { vi: viFallback, en: enFallback },
                            type: baseContentType, status: 'published', version: 0, languages: ['vi', 'en']
                        }
                    };
                    setContent(prev => ({ ...prev, [baseContentType]: fallbackResponse }));
                    return;
                }
            } catch (statusError) {
                console.warn(`Lỗi khi kiểm tra trạng thái ${baseContentType}, tiếp tục tải nội dung:`, statusError);
            }

            // Tải dữ liệu từ API sử dụng baseContentType
            console.log(`[PROVIDER DEBUG] Loading content for base type: ${baseContentType}`);
            const response = await siteContentService.getContentByType(baseContentType);
            console.log(`[PROVIDER DEBUG] Service response for ${baseContentType}:`, response);

            if (response && response.data) { // response là toàn bộ object từ service {status, data: SiteContentDoc}
                console.log(`[PROVIDER DEBUG] Setting content for ${baseContentType}:`, response);
                setContent(prev => ({ ...prev, [baseContentType]: response }));
            } else {
                console.log(`[PROVIDER DEBUG] Using fallback for ${baseContentType} due to no/invalid API response`);
                const viFallback = localFallbackData[`${baseContentType}-vi`] || {};
                const enFallback = localFallbackData[`${baseContentType}-en`] || {};
                const fallbackResponse = {
                    status: 'success_fallback_api',
                    data: {
                        content: { vi: viFallback, en: enFallback },
                        type: baseContentType, status: 'published', version: 0, languages: ['vi', 'en']
                    }
                };
                setContent(prev => ({ ...prev, [baseContentType]: fallbackResponse }));
            }
        } catch (err) {
            console.error(`Lỗi khi tải nội dung cho ${baseContentType}:`, err);
            setError(err as Error);

            const viFallback = localFallbackData[`${baseContentType}-vi`] || {};
            const enFallback = localFallbackData[`${baseContentType}-en`] || {};
            const fallbackResponse = {
                status: 'error_fallback',
                data: {
                    content: { vi: viFallback, en: enFallback },
                    type: baseContentType, status: 'published', version: 0, languages: ['vi', 'en']
                }
            };
            setContent(prev => ({ ...prev, [baseContentType]: fallbackResponse }));
        } finally {
            setIsLoading(false);
        }
    };

    // Tải lại nội dung với force refresh
    const refreshContent = async () => {
        console.log('🔄 [PROVIDER] Force refreshing content...');

        // Clear current content để force reload
        setContent({});
        setError(null);

        // Reload content
        await loadContent();

        console.log('✅ [PROVIDER] Content refreshed successfully');
    };

    // Lấy dữ liệu fallback nếu dữ liệu chính rỗng
    const getFallbackIfEmpty = (key: string, fallbackObj?: any) => {
        const baseContentType = getBaseContentTypeFromPath(pathname);
        const pageServiceResponse = content[baseContentType]; // Đây là { status, data: SiteContentDoc }
        const multiLangContent = pageServiceResponse?.data?.content;
        const langSpecificContent = multiLangContent?.[language];

        // Nếu có dữ liệu từ API cho key này
        if (langSpecificContent && typeof langSpecificContent === 'object' && langSpecificContent !== null && key in langSpecificContent) {
            const value = langSpecificContent[key];
            // Kiểm tra xem giá trị có phải là object rỗng không, hoặc có giá trị thực sự
            if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
                return value;
            }
            if (typeof value !== 'object' && value !== null && value !== undefined) {
                return value;
            }
        }

        // Nếu không, sử dụng fallback từ localFallbackData
        const fallbackKeyForFile = `${baseContentType}-${language}`; // ví dụ: 'homepage-vi'
        const fallbackContentForFile = localFallbackData[fallbackKeyForFile] || {};

        return fallbackObj || fallbackContentForFile[key] || (typeof fallbackContentForFile[key] === 'boolean' ? fallbackContentForFile[key] : {});
    };

    // Tải nội dung khi component được mount hoặc khi pathname hoặc language thay đổi
    useEffect(() => {
        loadContent();
    }, [pathname, language]); // language được thêm vào dependency array vì getBaseContentTypeFromPath không còn phụ thuộc vào nó trực tiếp
    // nhưng logic hiển thị và fallback trong getFallbackIfEmpty phụ thuộc vào state `language`.
    // loadContent sẽ fetch cho baseType, và việc chọn ngôn ngữ diễn ra khi truy cập content.

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

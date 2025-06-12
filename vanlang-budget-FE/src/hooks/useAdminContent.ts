'use client'

import { useState, useEffect } from 'react'
import siteContentService from '@/services/siteContentService'

/**
 * Hook để load admin content với fallback
 * @param contentType - Loại content (about, features, roadmap, pricing, contact)
 * @param language - Ngôn ngữ (vi, en)
 */
export function useAdminContent<T = any>(contentType: string, language: string = 'vi') {
    const [content, setContent] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const loadContent = async () => {
            try {
                console.log(`🔍 Loading ${contentType} content from admin...`)

                // Các sections thuộc homepage - chỉ admin interface sử dụng
                const HOMEPAGE_SECTIONS = ['homepage', 'testimonials', 'statistics']

                let actualContentType = contentType
                let extractSection = null

                // Nếu là section của homepage, load từ homepage và extract section
                if (HOMEPAGE_SECTIONS.includes(contentType) && contentType !== 'homepage') {
                    actualContentType = 'homepage'
                    extractSection = contentType
                    console.log(`🔍 ${contentType} is homepage section, loading from homepage and extracting ${extractSection}`)
                }

                // Features, Roadmap, và Pricing được xử lý như content type riêng biệt cho trang công khai
                if (contentType === 'features' || contentType === 'roadmap' || contentType === 'pricing') {
                    console.log(`🔍 Loading ${contentType} as separate content type`)
                }

                // Gọi service không cần language, backend trả về toàn bộ document
                const response = await siteContentService.getContentByType(actualContentType);
                console.log(`🔍 ${actualContentType} (for ${contentType}) full content response:`, response);

                if (response && response.data && response.data.content) {
                    const fullMultiLangContent = response.data.content; // Đây là object { vi: {...}, en: {...} }
                    let contentForCurrentLanguage = fullMultiLangContent[language];

                    if (extractSection && contentForCurrentLanguage) {
                        // Nếu là section của homepage, lấy phần section từ ngôn ngữ hiện tại
                        contentForCurrentLanguage = contentForCurrentLanguage[extractSection];
                        console.log(`🔍 Extracted section '${extractSection}' for language '${language}':`, contentForCurrentLanguage);
                    } else if (extractSection && !contentForCurrentLanguage) {
                        // Trường hợp homepage có section nhưng ngôn ngữ đó chưa có content
                        console.warn(`🔍 No content for language '${language}' in homepage to extract section '${extractSection}'.`);
                        contentForCurrentLanguage = null;
                    } else if (!extractSection && !contentForCurrentLanguage && Object.keys(fullMultiLangContent).length > 0) {
                        // Nếu không phải section homepage, và ngôn ngữ hiện tại không có content,
                        // nhưng có content ở ngôn ngữ khác, có thể fallback hoặc để null.
                        // Hiện tại để null để component tự fallback qua i18n.
                        console.warn(`🔍 No content for language '${language}' for type '${actualContentType}'.`);
                        contentForCurrentLanguage = null;
                    } else if (!contentForCurrentLanguage && Object.keys(fullMultiLangContent).length === 0) {
                        // Không có content cho bất kỳ ngôn ngữ nào
                        console.warn(`🔍 No content found for any language for type '${actualContentType}'.`);
                        contentForCurrentLanguage = null;
                    }


                    console.log(`🔍 Setting content for ${contentType} (lang: ${language}):`, contentForCurrentLanguage);
                    setContent(contentForCurrentLanguage || null);

                } else if (response && response.data && (contentType === 'header' || contentType === 'footer')) {
                    // Xử lý trường hợp cũ của header/footer nơi content có thể nằm trực tiếp trong response.data
                    const fullMultiLangContent = response.data;
                    let contentForCurrentLanguage = fullMultiLangContent[language];
                    console.warn(`🔍 Using direct data for ${contentType} (lang: ${language}):`, contentForCurrentLanguage);
                    setContent(contentForCurrentLanguage || null);
                }
                else {
                    console.log(`🔍 No data.content in response for ${contentType}, using fallback`);
                    setContent(null); // Fallback to translation
                }
            } catch (err) {
                console.error(`Error loading ${contentType} content:`, err)
                setError(err as Error)
                // Fallback to translation if admin content fails
            } finally {
                setIsLoading(false)
            }
        }

        loadContent()
    }, [contentType, language])

    return { content, isLoading, error }
}

export default useAdminContent

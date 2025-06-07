'use client'

import { useState, useEffect } from 'react'
import siteContentService from '@/services/siteContentService'

/**
 * Hook để load admin content với fallback
 * @param contentType - Loại content (about, features, roadmap, pricing, contact)
 * @param language - Ngôn ngữ (vi, en)
 */
export function useAdminContent(contentType: string, language: string = 'vi') {
    const [content, setContent] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

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

                const response = await siteContentService.getContentByType(actualContentType, language)
                console.log(`🔍 ${contentType} content response:`, response)

                if (response && response.data) {
                    let finalContent = response.data

                    // Xử lý đặc biệt cho các content types - extract language specific content
                    if (['about', 'features', 'roadmap', 'pricing', 'contact'].includes(contentType)) {
                        console.log(`🔍 Processing ${contentType} content for language: ${language}`)
                        console.log(`🔍 Raw API response data:`, finalContent)

                        // Kiểm tra cấu trúc API response có multilingual không: { vi: {...}, en: {...} }
                        if (finalContent[language]) {
                            // Cấu trúc multilingual - extract language specific content
                            finalContent = finalContent[language]
                            console.log(`🔍 Extracted ${contentType} content for ${language}:`, finalContent)
                        } else if (finalContent.title || finalContent.description) {
                            // Cấu trúc single language - sử dụng trực tiếp
                            console.log(`🔍 Using direct ${contentType} content (single language):`, finalContent)
                            // finalContent giữ nguyên
                        } else {
                            console.log(`🔍 No valid content structure found for ${contentType}, using fallback`)
                            finalContent = null // Sẽ fallback về translation
                        }
                    }
                    // Nếu cần extract section từ homepage content
                    else if (extractSection) {
                        console.log(`🔍 Extracting ${extractSection} from response:`, response.data)

                        // Kiểm tra cấu trúc response: { status: 'success', data: { content: {...} } }
                        if (response.data.data && response.data.data.content) {
                            finalContent = response.data.data.content[extractSection]
                            console.log(`🔍 Extracted ${extractSection} from response.data.data.content:`, finalContent)
                        }
                        // Kiểm tra cấu trúc: { data: { content: {...} } }
                        else if (response.data.content) {
                            finalContent = response.data.content[extractSection]
                            console.log(`🔍 Extracted ${extractSection} from response.data.content:`, finalContent)
                        }
                        // Kiểm tra cấu trúc: { [extractSection]: {...} }
                        else if (response.data[extractSection]) {
                            finalContent = response.data[extractSection]
                            console.log(`🔍 Extracted ${extractSection} directly from response.data:`, finalContent)
                        }
                        else {
                            console.log(`🔍 Could not find ${extractSection} in response, using full response`)
                            finalContent = response.data
                        }
                    }

                    console.log(`🔍 Setting content for ${contentType}:`, finalContent)
                    setContent(finalContent)
                } else {
                    console.log(`🔍 No data in response for ${contentType}, using fallback`)
                    setContent(null) // Fallback to translation
                }
            } catch (err) {
                console.error(`Error loading ${contentType} content:`, err)
                setError(err)
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

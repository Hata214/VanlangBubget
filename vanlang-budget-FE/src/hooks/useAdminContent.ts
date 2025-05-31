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

                // Các sections thuộc homepage
                const HOMEPAGE_SECTIONS = ['homepage', 'pricing', 'testimonials', 'statistics', 'features']

                let actualContentType = contentType
                let extractSection = null

                // Nếu là section của homepage, load từ homepage và extract section
                if (HOMEPAGE_SECTIONS.includes(contentType) && contentType !== 'homepage') {
                    actualContentType = 'homepage'
                    extractSection = contentType
                    console.log(`🔍 ${contentType} is homepage section, loading from homepage and extracting ${extractSection}`)
                }

                const response = await siteContentService.getContentByType(actualContentType, language)
                console.log(`🔍 ${contentType} content response:`, response)
                console.log(`🔍 ${contentType} response.data:`, response.data)
                console.log(`🔍 ${contentType} response.data type:`, typeof response.data)

                if (response.data) {
                    let finalContent = response.data

                    // Nếu cần extract section từ homepage content
                    if (extractSection) {
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
                    console.log(`🔍 No data in response for ${contentType}`)
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

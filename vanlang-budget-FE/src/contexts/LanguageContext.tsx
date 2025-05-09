'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { locales } from '@/i18n'

type Locale = 'vi' | 'en'

interface LanguageContextType {
    locale: Locale
    messages: Record<string, any>
    changeLanguage: (newLocale: Locale) => Promise<void>
    isChangingLanguage: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
    children: ReactNode
    initialLocale?: Locale
    initialMessages?: Record<string, any>
}

export function LanguageProvider({
    children,
    initialLocale = 'vi',
    initialMessages = {},
}: LanguageProviderProps) {
    const [locale, setLocale] = useState<Locale>(initialLocale)
    const [messages, setMessages] = useState<Record<string, any>>(initialMessages)
    const [isChangingLanguage, setIsChangingLanguage] = useState(false)

    // Tải messages từ file khi component mount
    useEffect(() => {
        const cookieLocale = Cookies.get('NEXT_LOCALE') as Locale | undefined
        const currentLocale = cookieLocale && locales.includes(cookieLocale as any)
            ? cookieLocale
            : initialLocale

        if (currentLocale !== initialLocale) {
            loadMessages(currentLocale)
        }
    }, [initialLocale])

    // Hàm để tải messages từ file json
    const loadMessages = async (localeToLoad: Locale): Promise<boolean> => {
        try {
            const newMessages = (await import(`@/messages/${localeToLoad}.json`)).default
            setMessages(newMessages)
            setLocale(localeToLoad)
            return true
        } catch (error) {
            console.error(`Could not load messages for locale "${localeToLoad}"`, error)
            return false
        }
    }

    // Hàm để thay đổi ngôn ngữ
    const changeLanguage = async (newLocale: Locale): Promise<void> => {
        if (newLocale === locale) return

        // Bắt đầu thay đổi ngôn ngữ
        setIsChangingLanguage(true)

        // Lưu vào cookie
        Cookies.set('NEXT_LOCALE', newLocale, { expires: 365 })

        // Tải messages mới
        await loadMessages(newLocale)

        // Hoàn tất quá trình thay đổi
        setIsChangingLanguage(false)
    }

    return (
        <LanguageContext.Provider
            value={{
                locale,
                messages,
                changeLanguage,
                isChangingLanguage,
            }}
        >
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage(): LanguageContextType {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
} 
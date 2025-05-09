'use client'

import React, { useEffect, useState } from 'react'
import { Providers } from '@/redux/provider'
import { ThemeProvider } from '@/components/ThemeProvider'
import Cookies from 'js-cookie'
import { locales } from '@/i18n'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { LocalizedProvider } from './LocalizedProvider'
import { ToastProvider } from '@/components/ToastProvider'
import { AuthProvider } from '@/contexts/AuthContext' // Custom Auth Context
import { NotificationProvider } from '@/contexts/NotificationContext'
import { NotificationHandler } from '@/components/notification/NotificationHandler'
import NextAuthProvider from '@/components/providers/NextAuthProvider' // Import NextAuthProvider

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const [initialMessages, setInitialMessages] = useState<Record<string, any>>({});
    const [initialLocale, setInitialLocale] = useState<string>('vi');
    const [isLoading, setIsLoading] = useState(true);

    // Tải messages khởi đầu
    useEffect(() => {
        const loadInitialMessages = async () => {
            // Đọc cookie để lấy ngôn ngữ khởi đầu
            const cookieLocale = Cookies.get('NEXT_LOCALE');
            const currentLocale = cookieLocale && locales.includes(cookieLocale as any) ? cookieLocale : 'vi';

            try {
                // Tải messages cho locale khởi đầu
                const messages = (await import(`@/messages/${currentLocale}.json`)).default;
                setInitialMessages(messages);
                setInitialLocale(currentLocale);
                setIsLoading(false);
            } catch (error) {
                console.error(`Could not load initial messages for locale "${currentLocale}"`, error);

                // Fallback to default language
                try {
                    const messages = (await import('@/messages/vi.json')).default;
                    setInitialMessages(messages);
                    setInitialLocale('vi');
                    setIsLoading(false);
                } catch (e) {
                    console.error("Failed to load fallback messages", e);
                    // Even if both fail, let's continue with empty messages
                    setIsLoading(false);
                }
            }
        };

        loadInitialMessages();
    }, []);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        // Đặt NextAuthProvider ở đây, bao bọc các provider khác nếu cần,
        // hoặc bao bọc trực tiếp children nếu các provider khác không cần session context
        <NextAuthProvider>
            <Providers>
                <ThemeProvider>
                    <ToastProvider>
                        {/* AuthProvider tùy chỉnh có thể cần hoặc không cần nằm trong NextAuthProvider */}
                        {/* Nếu AuthProvider tùy chỉnh cũng dùng session, nó nên nằm trong NextAuthProvider */}
                        <AuthProvider>
                            <NotificationProvider>
                                <LanguageProvider initialLocale={initialLocale as any} initialMessages={initialMessages}>
                                    <LocalizedProvider>
                                        <NotificationHandler />
                                        {children}
                                    </LocalizedProvider>
                                </LanguageProvider>
                            </NotificationProvider>
                        </AuthProvider>
                    </ToastProvider>
                </ThemeProvider>
            </Providers>
        </NextAuthProvider>
    )
}

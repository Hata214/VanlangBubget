import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { Toaster } from "@/components/ui/Toaster";
import { Providers } from '../components/providers/Providers';
import { SiteContentProvider } from '@/components/SiteContentProvider';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: {
        template: '%s | VanLang Budget',
        default: 'VanLang Budget',
    },
    description: 'Ứng dụng quản lý tài chính cá nhân',
    keywords: ['quản lý tài chính', 'chi tiêu', 'thu nhập', 'ngân sách', 'khoản vay'],
    authors: [{ name: 'VanLang Budget Team' }],
    viewport: 'width=device-width, initial-scale=1',
    robots: 'index, follow',
    icons: [
        { rel: 'icon', url: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', url: '/images/logos/logo.png', type: 'image/png' },
    ]
}

// Server component root layout
export default function RootLayout({
    children
}: {
    children: React.ReactNode
}) {
    // Sử dụng ngôn ngữ mặc định vì không còn URL prefix
    const defaultLanguage = 'vi';

    return (
        <html lang={defaultLanguage} suppressHydrationWarning>
            <head>
                {/* ...existing head content... */}
            </head>
            <body className={inter.className}>
                <Providers>
                    <ClientWrapper>
                        <SiteContentProvider initialLanguage={defaultLanguage}>
                            {children}
                        </SiteContentProvider>
                    </ClientWrapper>
                </Providers>
                <Toaster />
            </body>
        </html>
    )
}

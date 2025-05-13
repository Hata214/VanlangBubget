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
    children,
    params
}: {
    children: React.ReactNode,
    params: { locale: string }
}) {
    return (
        <html lang={params.locale} suppressHydrationWarning>
            <head>
                {/* ...existing head content... */}
            </head>
            <body className={inter.className}>
                <Providers>
                    <SiteContentProvider initialLanguage={params.locale as 'vi' | 'en'}>
                        <ClientWrapper>
                            {children}
                        </ClientWrapper>
                    </SiteContentProvider>
                </Providers>
                <Toaster />
            </body>
        </html>
    )
}

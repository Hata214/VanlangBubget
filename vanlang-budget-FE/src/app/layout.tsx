import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: {
        template: '%s | VangLang Budget',
        default: 'VangLang Budget',
    },
    description: 'Ứng dụng quản lý tài chính cá nhân',
    keywords: ['quản lý tài chính', 'chi tiêu', 'thu nhập', 'ngân sách', 'khoản vay'],
    authors: [{ name: 'VangLang Budget Team' }],
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
}: {
    children: React.ReactNode
}) {
    return (
        <html suppressHydrationWarning>
            <body className={inter.className}>
                <ClientWrapper>
                    {children}
                </ClientWrapper>
                <Toaster />
            </body>
        </html>
    )
} 
import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { locales } from '@/i18n'
import { NextIntlClientProvider } from 'next-intl'
// import NextAuthProvider from '@/components/providers/NextAuthProvider' // Sẽ import trong ClientWrapper
// import { getServerSession } from 'next-auth/next' // Không cần lấy session ở đây nữa
// import { authOptions } from '@/app/api/auth/[...nextauth]/options' // Không cần authOptions ở đây nữa

// Import message cho từng locale
const getMessages = async (locale: string) => {
    try {
        // Tải file messages chính
        const mainMessages = (await import(`../../messages/${locale}.json`)).default;

        // Không cần nhập thêm file investments.json riêng biệt vì đã được đưa vào file chính

        return mainMessages;
    } catch (error) {
        console.error(`Could not load messages for locale: ${locale}`, error);
        // Trả về object rỗng nếu không tải được
        return {};
    }
};

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
        { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
    ]
}

// Tạo các đường dẫn tĩnh cho mỗi locale
export async function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode,
    params: { locale: string }
}) {
    const messages = await getMessages(locale);
    // const session = await getServerSession(authOptions); // Không cần lấy session ở đây nữa

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={inter.className}>
                {/* NextAuthProvider sẽ được đặt trong ClientWrapper */}
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <ClientWrapper>
                        {children}
                    </ClientWrapper>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import PublicLayout from '@/components/layout/PublicLayout'

export default function LocaleNotFound() {
    const pathname = usePathname() || ''
    const isEnglish = pathname.startsWith('/en')
    const homeLink = isEnglish ? '/en' : '/'
    const contactLink = isEnglish ? '/en/contact' : '/contact'

    // Nội dung dựa theo ngôn ngữ
    const subtitle = isEnglish ? 'Page Not Found' : 'Không tìm thấy trang'
    const description = isEnglish
        ? "The page you are looking for doesn't exist or has been moved."
        : 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.'
    const backHome = isEnglish ? 'Back to Home' : 'Trở về trang chủ'
    const contactSupport = isEnglish ? 'Contact Support' : 'Liên hệ hỗ trợ'

    return (
        <PublicLayout>
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
                <div className="space-y-8 max-w-lg mx-auto">
                    <div className="space-y-4">
                        <h1 className="text-9xl font-bold text-indigo-600">404</h1>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {subtitle}
                        </h2>
                        <p className="text-lg text-gray-500 dark:text-gray-400">
                            {description}
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 justify-center pt-6">
                        <Link href={homeLink} className="w-full sm:w-auto">
                            <Button
                                className="w-full"
                                size="lg"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {backHome}
                            </Button>
                        </Link>
                        <Link href={contactLink} className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className="w-full"
                                size="lg"
                            >
                                {contactSupport}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
} 
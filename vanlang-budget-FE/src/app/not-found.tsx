'use client'

import Link from 'next/link'
import PublicLayout from '@/components/layout/PublicLayout'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
    return (
        <PublicLayout>
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
                <div className="space-y-8 max-w-lg mx-auto">
                    <div className="space-y-4">
                        <h1 className="text-9xl font-bold text-indigo-600">404</h1>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Không tìm thấy trang
                        </h2>
                        <p className="text-lg text-gray-500 dark:text-gray-400">
                            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 justify-center pt-6">
                        <Link href="/" className="w-full sm:w-auto">
                            <Button
                                className="w-full"
                                size="lg"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Trở về trang chủ
                            </Button>
                        </Link>
                        <Link href="/contact" className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className="w-full"
                                size="lg"
                            >
                                Liên hệ hỗ trợ
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
} 
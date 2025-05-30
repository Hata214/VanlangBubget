'use client'

import Link from 'next/link'
import PublicLayout from '@/components/layout/PublicLayout'
import { ArrowLeft, Scale } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function Legal404() {
    return (
        <PublicLayout>
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
                <div className="space-y-8 max-w-lg mx-auto">
                    <div className="space-y-4">
                        <Scale className="h-24 w-24 mx-auto text-indigo-600 dark:text-indigo-400" />
                        <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">404</h1>
                        <h2 className="text-2xl font-bold text-foreground">
                            Tài liệu pháp lý đang được cập nhật
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Chúng tôi đang xây dựng các tài liệu pháp lý để đảm bảo tuân thủ quy định và bảo vệ quyền lợi của người dùng.
                            Vui lòng quay lại sau!
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
'use client'

import Link from 'next/link'
import PublicLayout from '@/components/layout/PublicLayout'
import { ArrowLeft, Lightbulb, Share, BrainCircuit, Calendar, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function Feature404() {
    return (
        <PublicLayout>
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
                <div className="space-y-8 max-w-lg mx-auto">
                    <div className="space-y-4">
                        <Lightbulb className="h-24 w-24 mx-auto text-indigo-600" />
                        <h1 className="text-4xl font-bold text-indigo-600">Tính năng đang phát triển</h1>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Lộ trình phát triển VangLang Budget
                        </h2>
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
                            Chúng tôi đang nỗ lực phát triển thêm nhiều tính năng hữu ích để mang đến trải nghiệm tốt nhất cho bạn.
                        </p>

                        <div className="space-y-6 mt-8">
                            <div className="flex flex-col md:flex-row items-center bg-card border border-border rounded-lg p-4 md:p-6">
                                <div className="flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-3 md:mr-6 mb-4 md:mb-0">
                                    <BrainCircuit className="h-8 w-8 text-indigo-600" />
                                </div>
                                <div className="text-left flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cố vấn tài chính AI</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Nhận các khuyến nghị cá nhân hóa dựa trên thói quen chi tiêu và mục tiêu tài chính của bạn.</p>
                                </div>
                                <div className="flex items-center mt-4 md:mt-0 md:ml-4">
                                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                    <span className="text-sm text-gray-500">Tháng 5/2025</span>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center bg-card border border-border rounded-lg p-4 md:p-6">
                                <div className="flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-3 md:mr-6 mb-4 md:mb-0">
                                    <Share className="h-8 w-8 text-indigo-600" />
                                </div>
                                <div className="text-left flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chia sẻ chi phí nhóm</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Quản lý chi phí chung với bạn bè, gia đình hoặc đồng nghiệp.</p>
                                </div>
                                <div className="flex items-center mt-4 md:mt-0 md:ml-4">
                                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                    <span className="text-sm text-gray-500">Tháng 12/2025</span>
                                </div>
                            </div>
                        </div>
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
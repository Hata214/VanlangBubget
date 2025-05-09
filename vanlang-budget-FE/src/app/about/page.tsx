'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Users, Target, Star, Clock } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AboutPage() {
    const t = useTranslations()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Giả lập thời gian tải trang
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [])

    if (isLoading) {
        return (
            <PublicLayout>
                <div className="container mx-auto py-12">
                    <div className="flex justify-center items-center min-h-[50vh]">
                        <div className="animate-pulse text-xl">{t('common.loading')}</div>
                    </div>
                </div>
            </PublicLayout>
        )
    }

    return (
        <PublicLayout>
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link href="/" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span>{t('common.backToHome')}</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('about.title')}</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">{t('about.subtitle')}</p>
                </div>

                {/* Giới thiệu */}
                <div className="mb-16">
                    <Card>
                        <CardContent className="p-8">
                            <p className="text-lg leading-relaxed">
                                {t('about.description')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sứ mệnh & Tầm nhìn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <Card>
                        <CardContent className="p-8">
                            <div className="flex items-center mb-4">
                                <Target className="h-8 w-8 text-indigo-600 mr-3" />
                                <h2 className="text-2xl font-bold">{t('about.mission.title')}</h2>
                            </div>
                            <p className="text-lg leading-relaxed">{t('about.mission.content')}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-8">
                            <div className="flex items-center mb-4">
                                <Star className="h-8 w-8 text-indigo-600 mr-3" />
                                <h2 className="text-2xl font-bold">{t('about.vision.title')}</h2>
                            </div>
                            <p className="text-lg leading-relaxed">{t('about.vision.content')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Giá trị cốt lõi */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8 text-center">{t('about.values.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold mb-4 text-indigo-600">{t('about.values.simplicity.title')}</h3>
                                <p className="text-gray-700 dark:text-gray-300">{t('about.values.simplicity.content')}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold mb-4 text-indigo-600">{t('about.values.transparency.title')}</h3>
                                <p className="text-gray-700 dark:text-gray-300">{t('about.values.transparency.content')}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold mb-4 text-indigo-600">{t('about.values.support.title')}</h3>
                                <p className="text-gray-700 dark:text-gray-300">{t('about.values.support.content')}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Đội ngũ */}
                <div className="mb-16">
                    <div className="flex items-center mb-8">
                        <Users className="h-8 w-8 text-indigo-600 mr-3" />
                        <h2 className="text-3xl font-bold">{t('about.team.title')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="w-20 h-20 bg-indigo-100 rounded-full mb-4 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                                    NT
                                </div>
                                <h3 className="text-xl font-bold">{t('about.team.members.ceo.name')}</h3>
                                <p className="text-indigo-600 mb-4">{t('about.team.members.ceo.role')}</p>
                                <p className="text-gray-700 dark:text-gray-300">{t('about.team.members.ceo.bio')}</p>
                            </CardContent>
                        </Card>
                        <Card className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="w-20 h-20 bg-indigo-100 rounded-full mb-4 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                                    HL
                                </div>
                                <h3 className="text-xl font-bold">{t('about.team.members.cto.name')}</h3>
                                <p className="text-indigo-600 mb-4">{t('about.team.members.cto.role')}</p>
                                <p className="text-gray-700 dark:text-gray-300">{t('about.team.members.cto.bio')}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Lịch sử */}
                <div>
                    <div className="flex items-center mb-8">
                        <Clock className="h-8 w-8 text-indigo-600 mr-3" />
                        <h2 className="text-3xl font-bold">{t('about.history.title')}</h2>
                    </div>
                    <Card>
                        <CardContent className="p-8">
                            <div className="space-y-8">
                                <div className="flex">
                                    <div className="mr-6">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold">
                                            2023
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-lg">{t('about.history.milestones.founding')}</p>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="mr-6">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold">
                                            2024
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-lg">{t('about.history.milestones.launch')}</p>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="mr-6">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold">
                                            2025
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-lg">{t('about.history.milestones.expansion')}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    )
} 
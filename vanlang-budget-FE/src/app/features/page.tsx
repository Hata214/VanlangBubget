'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronLeft, CheckCircle, Timer } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import * as Icons from 'lucide-react'

export default function FeaturesPage() {
    const t = useTranslations()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Giả lập thời gian tải
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [])

    // Render dynamic icon based on iconName
    const renderIcon = (iconName: string, className: string = "h-6 w-6") => {
        const IconComponent = (Icons as any)[iconName]
        return IconComponent ? <IconComponent className={className} /> : null
    }

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

    // Danh sách các tính năng chính và biểu tượng tương ứng
    const mainFeatures = [
        {
            id: 'expense-tracking',
            title: t('features.mainFeatures.expenseTracking.title'),
            description: t('features.mainFeatures.expenseTracking.description'),
            benefits: t.raw('features.mainFeatures.expenseTracking.benefits') as string[],
            iconName: 'BarChart3'
        },
        {
            id: 'budget-management',
            title: t('features.mainFeatures.budgetManagement.title'),
            description: t('features.mainFeatures.budgetManagement.description'),
            benefits: t.raw('features.mainFeatures.budgetManagement.benefits') as string[],
            iconName: 'PiggyBank'
        },
        {
            id: 'financial-analysis',
            title: t('features.mainFeatures.financialAnalysis.title'),
            description: t('features.mainFeatures.financialAnalysis.description'),
            benefits: t.raw('features.mainFeatures.financialAnalysis.benefits') as string[],
            iconName: 'LineChart'
        },
        {
            id: 'future-planning',
            title: t('features.mainFeatures.futurePlanning.title'),
            description: t('features.mainFeatures.futurePlanning.description'),
            benefits: t.raw('features.mainFeatures.futurePlanning.benefits') as string[],
            iconName: 'Clock'
        },
        {
            id: 'loan-management',
            title: t('features.mainFeatures.loanManagement.title'),
            description: t('features.mainFeatures.loanManagement.description'),
            benefits: t.raw('features.mainFeatures.loanManagement.benefits') as string[],
            iconName: 'CreditCard'
        },
        {
            id: 'data-security',
            title: t('features.mainFeatures.dataSecurity.title'),
            description: t('features.mainFeatures.dataSecurity.description'),
            benefits: t.raw('features.mainFeatures.dataSecurity.benefits') as string[],
            iconName: 'Shield'
        }
    ];

    // Tính năng sắp ra mắt
    const comingSoonFeatures = [
        {
            title: t('features.comingSoon.aiAdvisor.title'),
            description: t('features.comingSoon.aiAdvisor.description'),
            eta: t('features.comingSoon.aiAdvisor.eta')
        },
        {
            title: t('features.comingSoon.groupExpense.title'),
            description: t('features.comingSoon.groupExpense.description'),
            eta: t('features.comingSoon.groupExpense.eta')
        }
    ];

    return (
        <PublicLayout>
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <Link href="/" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span>{t('common.backToHome')}</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('features.title')}</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">{t('features.subtitle')}</p>
                </div>

                {/* Mô tả tổng quan */}
                <div className="mb-16">
                    <Card>
                        <CardContent className="p-8">
                            <p className="text-lg leading-relaxed">
                                {t('features.description')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tính năng chính */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold mb-10 text-center">{t('features.mainFeatures.title')}</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {mainFeatures.map((feature) => (
                            <Card key={feature.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                <CardContent className="p-8">
                                    <div className="flex items-center mb-4">
                                        <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 mr-4">
                                            {renderIcon(feature.iconName, "w-8 h-8")}
                                        </div>
                                        <h3 className="text-2xl font-bold">{feature.title}</h3>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-6">{feature.description}</p>
                                    <div className="space-y-2">
                                        <p className="font-semibold text-gray-900 dark:text-white">{t('features.benefits')}:</p>
                                        <ul className="space-y-2">
                                            {feature.benefits.map((benefit, index) => (
                                                <li key={index} className="flex items-start">
                                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Tính năng sắp ra mắt */}
                <div>
                    <div className="flex items-center mb-8">
                        <Timer className="h-8 w-8 text-indigo-600 mr-3" />
                        <h2 className="text-3xl font-bold">{t('features.comingSoon.title')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {comingSoonFeatures.map((feature, index) => (
                            <Card key={index} className="border-dashed border-2 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/10">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{feature.title}</h3>
                                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded dark:bg-indigo-800 dark:text-indigo-200">
                                            {feature.eta}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-20 text-center">
                    <h3 className="text-2xl font-bold mb-4">{t('home.cta.title')}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {t('home.cta.description')}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button size="lg" className="px-8">
                            {t('home.cta.getStarted')}
                        </Button>
                        <Button size="lg" variant="outline" className="px-8">
                            {t('home.hero.learnMore')}
                        </Button>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
} 
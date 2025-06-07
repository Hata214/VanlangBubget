'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CheckCircle, Timer, Globe } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import * as Icons from 'lucide-react'
import useAdminContent from '@/hooks/useAdminContent'

interface FeatureItem {
    id?: string;
    title?: string;
    description?: string;
    icon?: string;
    iconName?: string;
    benefits?: string[];
}

interface ComingSoonFeature {
    id?: string;
    title?: string;
    description?: string;
    eta?: string;
    icon?: string;
}

interface FeaturesContent {
    title?: string;
    subtitle?: string;
    description?: string;
    items?: FeatureItem[];
    features?: FeatureItem[];
    comingSoon?: ComingSoonFeature[];
}

export default function FeaturesPage() {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { content: featuresContent, isLoading } = useAdminContent<FeaturesContent>('features', locale)

    // Language switcher handler
    const handleLanguageChange = (newLocale: 'vi' | 'en') => {
        router.push(`/${newLocale}/features`)
    }

    // Debug logs
    console.log('🔍 FeaturesPage - featuresContent:', featuresContent)
    console.log('🔍 FeaturesPage - isLoading:', isLoading)

    // Render dynamic icon based on iconName or emoji
    const renderIcon = (iconName: string, className: string = "h-6 w-6") => {
        // If it's an emoji, return it directly
        if (iconName && iconName.length <= 2 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconName)) {
            return <span className="text-2xl">{iconName}</span>
        }

        // Otherwise try to find the icon component
        const IconComponent = (Icons as any)[iconName]
        return IconComponent ? <IconComponent className={className} /> : <Icons.BarChart3 className={className} />
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
            benefits: Array.isArray(t.raw('features.mainFeatures.expenseTracking.benefits'))
                ? t.raw('features.mainFeatures.expenseTracking.benefits')
                : [t('features.mainFeatures.expenseTracking.benefits.0'),
                t('features.mainFeatures.expenseTracking.benefits.1'),
                t('features.mainFeatures.expenseTracking.benefits.2'),
                t('features.mainFeatures.expenseTracking.benefits.3')],
            iconName: 'BarChart3'
        },
        {
            id: 'budget-management',
            title: t('features.mainFeatures.budgetManagement.title'),
            description: t('features.mainFeatures.budgetManagement.description'),
            benefits: Array.isArray(t.raw('features.mainFeatures.budgetManagement.benefits'))
                ? t.raw('features.mainFeatures.budgetManagement.benefits')
                : [t('features.mainFeatures.budgetManagement.benefits.0'),
                t('features.mainFeatures.budgetManagement.benefits.1'),
                t('features.mainFeatures.budgetManagement.benefits.2'),
                t('features.mainFeatures.budgetManagement.benefits.3')],
            iconName: 'PiggyBank'
        },
        {
            id: 'financial-analysis',
            title: t('features.mainFeatures.financialAnalysis.title'),
            description: t('features.mainFeatures.financialAnalysis.description'),
            benefits: Array.isArray(t.raw('features.mainFeatures.financialAnalysis.benefits'))
                ? t.raw('features.mainFeatures.financialAnalysis.benefits')
                : [t('features.mainFeatures.financialAnalysis.benefits.0'),
                t('features.mainFeatures.financialAnalysis.benefits.1'),
                t('features.mainFeatures.financialAnalysis.benefits.2'),
                t('features.mainFeatures.financialAnalysis.benefits.3')],
            iconName: 'LineChart'
        },
        {
            id: 'future-planning',
            title: t('features.mainFeatures.futurePlanning.title'),
            description: t('features.mainFeatures.futurePlanning.description'),
            benefits: Array.isArray(t.raw('features.mainFeatures.futurePlanning.benefits'))
                ? t.raw('features.mainFeatures.futurePlanning.benefits')
                : [t('features.mainFeatures.futurePlanning.benefits.0'),
                t('features.mainFeatures.futurePlanning.benefits.1'),
                t('features.mainFeatures.futurePlanning.benefits.2'),
                t('features.mainFeatures.futurePlanning.benefits.3')],
            iconName: 'Clock'
        },
        {
            id: 'loan-management',
            title: t('features.mainFeatures.loanManagement.title'),
            description: t('features.mainFeatures.loanManagement.description'),
            benefits: Array.isArray(t.raw('features.mainFeatures.loanManagement.benefits'))
                ? t.raw('features.mainFeatures.loanManagement.benefits')
                : [t('features.mainFeatures.loanManagement.benefits.0'),
                t('features.mainFeatures.loanManagement.benefits.1'),
                t('features.mainFeatures.loanManagement.benefits.2'),
                t('features.mainFeatures.loanManagement.benefits.3')],
            iconName: 'CreditCard'
        },
        {
            id: 'data-security',
            title: t('features.mainFeatures.dataSecurity.title'),
            description: t('features.mainFeatures.dataSecurity.description'),
            benefits: Array.isArray(t.raw('features.mainFeatures.dataSecurity.benefits'))
                ? t.raw('features.mainFeatures.dataSecurity.benefits')
                : [t('features.mainFeatures.dataSecurity.benefits.0'),
                t('features.mainFeatures.dataSecurity.benefits.1'),
                t('features.mainFeatures.dataSecurity.benefits.2'),
                t('features.mainFeatures.dataSecurity.benefits.3')],
            iconName: 'Shield'
        }
    ];

    // Tính năng sắp ra mắt - ưu tiên từ API, fallback nếu không có
    const defaultComingSoonFeatures = [
        {
            title: t('features.comingSoon.aiAdvisor.title') || "Smart AI Advisor",
            description: t('features.comingSoon.aiAdvisor.description') || "Analyze and provide personalized financial advice based on spending behavior",
            eta: t('features.comingSoon.aiAdvisor.eta') || "Q2 2025",
            icon: "🤖"
        },
        {
            title: t('features.comingSoon.groupExpense.title') || "Group Expenses",
            description: t('features.comingSoon.groupExpense.description') || "Share and manage expenses with friends, family, or colleagues",
            eta: t('features.comingSoon.groupExpense.eta') || "Q3 2025",
            icon: "👥"
        },
        {
            title: "Bank Synchronization",
            description: "Integrate directly with bank accounts to automatically update transactions",
            eta: "Q4 2025",
            icon: "🏦"
        }
    ];

    // Sử dụng Coming Soon features từ API nếu có, nếu không dùng default
    // Kiểm tra cả cấu trúc cũ và mới của API
    const apiComingSoonFeatures = featuresContent?.comingSoon;
    const comingSoonFeatures: ComingSoonFeature[] = (apiComingSoonFeatures && apiComingSoonFeatures.length > 0)
        ? apiComingSoonFeatures
        : defaultComingSoonFeatures;

    return (
        <PublicLayout>
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <Link href="/" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span>{t('common.backToHome')}</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {featuresContent?.title || t('features.title')}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        {featuresContent?.subtitle || t('features.subtitle')}
                    </p>
                </div>

                {/* Mô tả tổng quan */}
                <div className="mb-16">
                    <Card>
                        <CardContent className="p-8">
                            <p className="text-lg leading-relaxed">
                                {featuresContent?.description || t('features.description')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tính năng chính */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold mb-10 text-center">{t('features.mainFeatures.title')}</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {/* Hiển thị features từ API nếu có, nếu không dùng fallback */}
                        {(featuresContent?.items || featuresContent?.features || mainFeatures).map((feature: FeatureItem, index: number) => {
                            // Xử lý dữ liệu từ API hoặc fallback
                            // Đảm bảo featureData có kiểu FeatureItem
                            const featureData: FeatureItem = (featuresContent?.items || featuresContent?.features) ? {
                                id: feature.id || `feature-${index}`,
                                title: feature.title,
                                description: feature.description,
                                icon: feature.icon,
                                iconName: feature.iconName,
                                benefits: feature.benefits || []
                            } : feature;

                            return (
                                <Card key={featureData.id || index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center mb-4">
                                            <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 mr-4 dark:bg-indigo-900 dark:text-indigo-300">
                                                {/* Ưu tiên icon, sau đó đến iconName */}
                                                {renderIcon(featureData.icon || featureData.iconName || 'BarChart3', "w-8 h-8")}
                                            </div>
                                            <h3 className="text-xl font-bold">{featureData.title}</h3>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 mb-4">{featureData.description}</p>

                                        {/* Chỉ hiển thị benefits nếu có (fallback data) */}
                                        {featureData.benefits && featureData.benefits.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="font-semibold text-gray-900 dark:text-white">{t('features.benefits')}:</p>
                                                <ul className="space-y-2">
                                                    {featureData.benefits.map((benefit: string, benefitIndex: number) => (
                                                        <li key={benefitIndex} className="flex items-start">
                                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                                                            <span className="text-sm">{benefit}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Tính năng sắp ra mắt */}
                <div>
                    <div className="flex items-center mb-8">
                        <Timer className="h-8 w-8 text-indigo-600 mr-3" />
                        <h2 className="text-3xl font-bold">{t('features.comingSoon.title')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {comingSoonFeatures.map((feature: ComingSoonFeature, index: number) => (
                            <Card key={feature.id || index} className="border-dashed border-2 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center mb-4">
                                        {feature.icon && (
                                            <div className="text-2xl mr-3">
                                                {renderIcon(feature.icon)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{feature.title}</h3>
                                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded dark:bg-indigo-800 dark:text-indigo-200 ml-2">
                                                    {feature.eta}
                                                </span>
                                            </div>
                                        </div>
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

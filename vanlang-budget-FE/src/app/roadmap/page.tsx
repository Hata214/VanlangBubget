'use client'

import Link from 'next/link'
import PublicLayout from '@/components/layout/PublicLayout'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Lightbulb, Share, BrainCircuit, Calendar, CheckCircle, BarChart, PiggyBank, LineChart, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function RoadmapPage() {
    const t = useTranslations()

    // Tính năng đã hoàn thành
    const completedFeatures = [
        {
            icon: <BarChart className="h-8 w-8 text-green-600" />,
            title: t('home.features.expenseTracking.title'),
            description: t('home.features.expenseTracking.description'),
            date: 'Q1 2025'
        },
        {
            icon: <PiggyBank className="h-8 w-8 text-green-600" />,
            title: t('home.features.budgetManagement.title'),
            description: t('home.features.budgetManagement.description'),
            date: 'Q1 2025'
        },
        {
            icon: <LineChart className="h-8 w-8 text-green-600" />,
            title: t('home.features.financialAnalysis.title'),
            description: t('home.features.financialAnalysis.description'),
            date: 'Q1 2025'
        },
        {
            icon: <Clock className="h-8 w-8 text-green-600" />,
            title: t('home.features.futurePlanning.title'),
            description: t('home.features.futurePlanning.description'),
            date: 'Q1 2025'
        },
        {
            icon: <Shield className="h-8 w-8 text-green-600" />,
            title: t('home.features.dataSecurity.title'),
            description: t('home.features.dataSecurity.description'),
            date: 'Q1 2025'
        }
    ];

    // Tính năng sắp ra mắt
    const upcomingFeatures = [
        {
            icon: <BrainCircuit className="h-8 w-8 text-indigo-600" />,
            title: t('features.comingSoon.aiAdvisor.title'),
            description: t('features.comingSoon.aiAdvisor.description'),
            date: t('features.comingSoon.aiAdvisor.eta')
        },
        {
            icon: <Share className="h-8 w-8 text-indigo-600" />,
            title: t('features.comingSoon.groupExpense.title'),
            description: t('features.comingSoon.groupExpense.description'),
            date: t('features.comingSoon.groupExpense.eta')
        }
    ];

    return (
        <PublicLayout>
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="flex justify-center mb-4">
                            <Lightbulb className="h-16 w-16 text-indigo-600" />
                        </div>
                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            {t('roadmap.title')}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            {t('roadmap.description')}
                        </p>
                    </div>

                    {/* Biểu đồ thời gian */}
                    <div className="mb-16">
                        <div className="relative">
                            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-indigo-200 dark:bg-indigo-900/30"></div>
                            <div className="space-y-12">

                                {/* Q1 2025 */}
                                <div className="relative">
                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-4">
                                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                                            <CheckCircle className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-lg p-6 md:w-[calc(50%-2rem)] md:ml-auto">
                                        <div className="flex items-center mb-4">
                                            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                                            <h3 className="text-xl font-bold text-foreground">Q1 2025</h3>
                                        </div>
                                        <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                                            {t('roadmap.phase1.title')}
                                        </h4>
                                        <p className="text-muted-foreground mb-4">
                                            {t('roadmap.phase1.description')}
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {completedFeatures.map((feature, index) => (
                                                <div key={index} className="flex items-start">
                                                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-medium text-foreground">{feature.title}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Q2 2025 */}
                                <div className="relative">
                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-lg p-6 md:w-[calc(50%-2rem)]">
                                        <div className="flex items-center mb-4">
                                            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                                            <h3 className="text-xl font-bold text-foreground">Q2 2025</h3>
                                        </div>
                                        <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                                            {t('roadmap.phase2.title')}
                                        </h4>
                                        <p className="text-muted-foreground mb-4">
                                            {t('roadmap.phase2.description')}
                                        </p>
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <BrainCircuit className="h-8 w-8 text-indigo-600 mr-3 flex-shrink-0" />
                                                <div>
                                                    <h5 className="font-semibold text-foreground">{t('features.comingSoon.aiAdvisor.title')}</h5>
                                                    <p className="text-sm text-muted-foreground">{t('features.comingSoon.aiAdvisor.description')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Q4 2025 */}
                                <div className="relative">
                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-lg p-6 md:w-[calc(50%-2rem)] md:ml-auto">
                                        <div className="flex items-center mb-4">
                                            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                                            <h3 className="text-xl font-bold text-foreground">Q4 2025</h3>
                                        </div>
                                        <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                                            {t('roadmap.phase3.title')}
                                        </h4>
                                        <p className="text-muted-foreground mb-4">
                                            {t('roadmap.phase3.description')}
                                        </p>
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <Share className="h-8 w-8 text-indigo-600 mr-3 flex-shrink-0" />
                                                <div>
                                                    <h5 className="font-semibold text-foreground">{t('features.comingSoon.groupExpense.title')}</h5>
                                                    <p className="text-sm text-muted-foreground">{t('features.comingSoon.groupExpense.description')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Upcoming */}
                                <div className="relative">
                                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-300 dark:bg-indigo-700 flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">...</span>
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-lg p-6 md:w-[calc(50%-2rem)]">
                                        <div className="flex items-center mb-4">
                                            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                                            <h3 className="text-xl font-bold text-foreground">{t('roadmap.future.title')}</h3>
                                        </div>
                                        <p className="text-muted-foreground">
                                            {t('roadmap.future.description')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center mt-12">
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            {t('roadmap.cta.title')}
                        </h2>
                        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                            {t('roadmap.cta.description')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/">
                                <Button size="lg" className="w-full sm:w-auto">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    {t('common.backToHome')}
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                    {t('roadmap.cta.feedback')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
} 
'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import PublicLayout from '@/components/layout/PublicLayout'
import useAdminContent from '@/hooks/useAdminContent'
import { Check, Star } from 'lucide-react'

export default function PricingPage() {
    const t = useTranslations()
    const { content: pricingContent, isLoading } = useAdminContent('pricing', 'vi')

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

    // Kiểm tra xem có pricing plans từ admin content không
    const hasPricingPlans = pricingContent?.plans && pricingContent.plans.length > 0

    return (
        <PublicLayout>
            <div className="min-h-screen bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            {pricingContent?.title || t('pricing.title')}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            {pricingContent?.description || t('pricing.description')}
                        </p>
                    </div>

                    {/* Conditional Content */}
                    {hasPricingPlans ? (
                        /* Hiển thị pricing plans từ admin content */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                            {pricingContent.plans.map((plan, index) => (
                                <div key={index} className={`relative bg-card border border-border rounded-lg p-6 shadow-lg ${plan.popular ? 'ring-2 ring-indigo-500' : ''}`}>
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                                                <Star className="h-4 w-4 mr-1" />
                                                Phổ biến
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                            {plan.price}
                                        </div>
                                        <p className="text-muted-foreground">{plan.description}</p>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {plan.features?.map((feature, featureIndex) => (
                                            <li key={featureIndex} className="flex items-start">
                                                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                                <span className="text-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className={`w-full ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                        variant={plan.popular ? 'default' : 'outline'}
                                    >
                                        {plan.buttonText || 'Chọn gói này'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Hiển thị layout cơ bản khi chưa có pricing plans */
                        <div className="flex flex-col items-center justify-center min-h-[50vh]">
                            <Card className="w-full max-w-md">
                                <CardHeader className="text-center">
                                    <CardTitle className="text-2xl">
                                        {t('pricing.comingSoon')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('pricing.comingSoonDescription')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-center">
                                    <Link href="/">
                                        <Button>{t('common.backToHome')}</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* CTA Section */}
                    {hasPricingPlans && (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-foreground mb-4">
                                {t('pricing.cta.title')}
                            </h2>
                            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                                {t('pricing.cta.description')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/">
                                    <Button size="lg" className="w-full sm:w-auto">
                                        {t('common.backToHome')}
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                        {t('pricing.cta.contact')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    )
} 
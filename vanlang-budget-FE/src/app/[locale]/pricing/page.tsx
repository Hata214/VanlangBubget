'use client';

import React from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import useAdminContent from '@/hooks/useAdminContent'
import { Check, Star, Globe, ChevronLeft } from 'lucide-react';

interface PricingPlan {
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
    isFeatured?: boolean; // Gói nổi bật
}

export default function PricingPage() {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { content: pricingContent, isLoading } = useAdminContent('pricing', locale)

    // Language switcher handler
    const handleLanguageChange = (newLocale: 'vi' | 'en') => {
        router.push(`/${newLocale}/pricing`)
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

    // Luôn hiển thị layout "Coming Soon" thay vì pricing plans
    // Admin có thể chỉnh sửa title và description thông qua site-content
    const shouldShowComingSoon = true;

    return (
        <PublicLayout>
            <div className="container mx-auto py-12">
                {/* Language Switcher */}
                <div className="flex justify-end mb-6">
                    <div className="flex items-center space-x-2 bg-card border border-border rounded-lg p-1">
                        <Globe className="h-4 w-4 text-muted-foreground ml-2" />
                        <button
                            onClick={() => handleLanguageChange('vi')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${locale === 'vi'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Tiếng Việt
                        </button>
                        <button
                            onClick={() => handleLanguageChange('en')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${locale === 'en'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            English
                        </button>
                    </div>
                </div>

                {/* Back to Home Link */}
                <div className="mb-8">
                    <Link href="/" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span>{t('common.backToHome')}</span>
                    </Link>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        {pricingContent?.title || t('pricing.title')}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        {pricingContent?.description || t('pricing.description')}
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    {/* Coming Soon Layout */}
                    <div className="flex flex-col items-center justify-center min-h-[50vh]">
                        <Card className="w-full max-w-md">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">
                                    {pricingContent?.comingSoonTitle || t('pricing.comingSoon')}
                                </CardTitle>
                                <CardDescription>
                                    {pricingContent?.comingSoonDescription || t('pricing.comingSoonDescription')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <Link href="/">
                                    <Button>{t('common.backToHome')}</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

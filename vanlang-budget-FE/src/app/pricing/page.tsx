'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import PublicLayout from '@/components/layout/PublicLayout'

export default function PricingPage() {
    const t = useTranslations()

    return (
        <PublicLayout>
            <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">{t('pricing.comingSoon')}</CardTitle>
                        <CardDescription>
                            {t('pricing.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Link href="/">
                            <Button>{t('common.backToHome')}</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </PublicLayout>
    )
} 
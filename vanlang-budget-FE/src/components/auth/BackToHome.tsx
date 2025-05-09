'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function BackToHome() {
    const t = useTranslations();

    return (
        <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('auth.backToHome')}
        </Link>
    )
} 
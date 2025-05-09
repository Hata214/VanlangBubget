'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function InvestmentsLocaleRedirect() {
    const router = useRouter();
    const t = useTranslations('Investments');

    useEffect(() => {
        // Chuyển hướng người dùng đến trang /investments
        router.replace('/investments');
    }, [router]);

    return (
        <div className="container mx-auto px-4 py-6 flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{t('redirectingToInvestments')}</span>
        </div>
    );
} 
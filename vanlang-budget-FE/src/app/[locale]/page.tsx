'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
    const t = useTranslations();
    const locale = useLocale();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full space-y-8">
                <div className="flex flex-col items-center justify-center">
                    <Image
                        src="/logo-vlb.png"
                        alt="VangLang Budget Logo"
                        width={80}
                        height={80}
                        className="mb-4"
                    />
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-foreground">
                        {t('app.name')}
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        {t('app.description')}
                    </p>
                </div>
                <div className="mt-8 space-y-6">
                    <div className="flex items-center justify-center space-x-4">
                        <Link
                            href={`/${locale}/login`}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {t('auth.login')}
                        </Link>
                        <Link
                            href={`/${locale}/register`}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {t('auth.register')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
} 
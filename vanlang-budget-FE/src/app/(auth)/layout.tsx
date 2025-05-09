'use client'

import { ReactNode } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface AuthLayoutProps {
    children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    const t = useTranslations();

    return (
        <div className="min-h-screen bg-background">
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex flex-col items-center">
                        <Image
                            src="/images/logos/logo.png"
                            alt="VangLang Budget Logo"
                            width={64}
                            height={64}
                            className="mb-4"
                        />
                        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
                            {t('app.name')}
                        </h2>
                    </div>
                </div>
                {children}
            </div>
        </div>
    )
} 
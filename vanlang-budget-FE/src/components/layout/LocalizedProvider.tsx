'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { useLanguage } from '@/contexts/LanguageContext'

interface LocalizedProviderProps {
    children: ReactNode
}

export function LocalizedProvider({ children }: LocalizedProviderProps) {
    const { locale, messages } = useLanguage()

    // Mỗi khi locale hoặc messages thay đổi, NextIntlClientProvider sẽ cập nhật lại
    // mà không làm mất trạng thái đăng nhập
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    )
} 
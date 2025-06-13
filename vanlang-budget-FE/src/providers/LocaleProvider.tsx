'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { defaultLocale, locales, type Locale } from '@/i18n';

interface LocaleContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function useLocaleContext() {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useLocaleContext must be used within a LocaleProvider');
    }
    return context;
}

interface LocaleProviderProps {
    children: React.ReactNode;
    initialLocale?: Locale;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window !== 'undefined') {
            const savedLocale = localStorage.getItem('preferred-locale') as Locale;
            if (savedLocale && locales.includes(savedLocale)) {
                return savedLocale;
            }
        }
        return initialLocale || defaultLocale;
    });

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);

        if (typeof window !== 'undefined') {
            localStorage.setItem('preferred-locale', newLocale);
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        }
    };

    useEffect(() => {
        // Sync với localStorage khi component mount
        if (typeof window !== 'undefined') {
            const savedLocale = localStorage.getItem('preferred-locale') as Locale;
            if (savedLocale && locales.includes(savedLocale) && savedLocale !== locale) {
                setLocaleState(savedLocale);
            }
        }
    }, [locale]);

    return (
        <LocaleContext.Provider value={{ locale, setLocale }}>
            {children}
        </LocaleContext.Provider>
    );
} 
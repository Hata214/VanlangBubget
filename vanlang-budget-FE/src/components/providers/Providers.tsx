'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/redux/store';
import { LanguageProvider } from '@/contexts/LanguageContext';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ReduxProvider store={store}>
            <LanguageProvider initialLocale="vi">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={true}
                    disableTransitionOnChange={false}
                    storageKey="vanlang-budget-theme"
                    themes={['light', 'dark', 'system']}
                >
                    {children}
                </ThemeProvider>
            </LanguageProvider>
        </ReduxProvider>
    );
}

'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/redux/store';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ReduxProvider store={store}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
            >
                {children}
            </ThemeProvider>
        </ReduxProvider>
    );
}

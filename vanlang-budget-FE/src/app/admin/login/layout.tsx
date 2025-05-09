'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export default function AdminLoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={inter.className} style={{ minHeight: '100vh' }}>
            {children}
            <Toaster />
        </div>
    );
} 
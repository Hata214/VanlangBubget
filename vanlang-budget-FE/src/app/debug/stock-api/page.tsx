'use client';

import React from 'react';
import StockApiTester from '@/components/debug/StockApiTester';

export default function StockApiDebugPage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Stock API Debug</h1>
                <p className="text-muted-foreground">
                    Test và debug kết nối với Stock API trong production environment
                </p>
            </div>
            
            <StockApiTester />
            
            <div className="mt-8 p-4 bg-muted rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
                <div className="space-y-1 text-sm">
                    <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
                    <div><strong>Stock API URL:</strong> {process.env.NEXT_PUBLIC_STOCK_API_URL || 'https://my-app-flashapi.onrender.com'}</div>
                    <div><strong>Frontend URL:</strong> {process.env.NEXT_PUBLIC_SITE_URL}</div>
                    <div><strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL}</div>
                </div>
            </div>
        </div>
    );
}

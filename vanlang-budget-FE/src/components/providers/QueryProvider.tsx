'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';
import React, { useState, ReactNode } from 'react'; // Import ReactNode

// Đổi thành const arrow function
const QueryProvider = ({ children }: { children: ReactNode }) => { // Sử dụng ReactNode đã import
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 1000, // 5 seconds
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <ReactQueryStreamedHydration>
                {children}
            </ReactQueryStreamedHydration>
        </QueryClientProvider>
    );
};

export default QueryProvider;

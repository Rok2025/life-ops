'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 分钟内不重复请求
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient(): QueryClient {
    if (typeof window === 'undefined') {
        // Server: 每次新建
        return makeQueryClient();
    }
    // Browser: 复用单例
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(getQueryClient);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

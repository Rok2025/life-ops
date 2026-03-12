'use client';

import { useQuery } from '@tanstack/react-query';
import { queryApi } from '../api/queryApi';

export function useQueryHistory(date: string) {
    return useQuery({
        queryKey: ['english-queries', date],
        queryFn: () => queryApi.getByDate(date),
    });
}

export function useQueryCount(date: string) {
    return useQuery({
        queryKey: ['english-query-count', date],
        queryFn: () => queryApi.getCount(date),
    });
}

export function useRecentQueries(limit = 3) {
    return useQuery({
        queryKey: ['english-queries-recent', limit],
        queryFn: () => queryApi.getRecent(limit),
    });
}

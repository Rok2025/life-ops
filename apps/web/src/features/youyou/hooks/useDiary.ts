'use client';

import { useQuery } from '@tanstack/react-query';
import { youyouApi } from '../api/youyouApi';

export function useDiaryEntries(limit = 30, offset = 0) {
    return useQuery({
        queryKey: ['youyou-diary', limit, offset],
        queryFn: () => youyouApi.getDiaryEntries(limit, offset),
    });
}

export function useDiaryByDate(date: string) {
    return useQuery({
        queryKey: ['youyou-diary', date],
        queryFn: () => youyouApi.getDiaryByDate(date),
        enabled: !!date,
    });
}

export function useDiaryStats() {
    return useQuery({
        queryKey: ['youyou-diary-stats'],
        queryFn: () => youyouApi.getDiaryStats(),
    });
}

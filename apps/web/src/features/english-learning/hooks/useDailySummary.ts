'use client';

import { useQuery } from '@tanstack/react-query';
import { summaryApi } from '../api/summaryApi';

export function useDailySummary(date: string) {
    return useQuery({
        queryKey: ['english-daily-summary', date],
        queryFn: () => summaryApi.getByDate(date),
    });
}

export function useSummaryRange(startDate: string, endDate: string) {
    return useQuery({
        queryKey: ['english-daily-summaries', startDate, endDate],
        queryFn: () => summaryApi.getRange(startDate, endDate),
    });
}

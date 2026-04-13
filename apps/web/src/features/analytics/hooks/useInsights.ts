'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import type { AnalyticsPeriod } from '../types';

export function useInsights(period: AnalyticsPeriod) {
    return useQuery({
        queryKey: ['insights-snapshot', period],
        queryFn: () => analyticsApi.getInsights(period),
        staleTime: 60 * 1000,
    });
}

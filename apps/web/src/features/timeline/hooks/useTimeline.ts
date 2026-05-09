'use client';

import { useQuery } from '@tanstack/react-query';
import { timelineApi } from '../api/timelineApi';
import type { TimelineEntry, TimelineFilters } from '../types';

export function useTimeline(filters: TimelineFilters, initialData?: TimelineEntry[]) {
    return useQuery({
        queryKey: ['global-timeline', filters],
        queryFn: () => timelineApi.getTimeline(filters),
        initialData,
        staleTime: 30 * 1000,
    });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { timelineApi } from '../api/timelineApi';
import type { TimelineFilters } from '../types';

export function useTimeline(filters: TimelineFilters) {
    return useQuery({
        queryKey: ['global-timeline', filters],
        queryFn: () => timelineApi.getTimeline(filters),
        staleTime: 30 * 1000,
    });
}

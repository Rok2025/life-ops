'use client';

import { useQuery } from '@tanstack/react-query';
import { youyouApi } from '../api/youyouApi';
import type { MilestoneCategory } from '../types';

export function useMilestones(category?: MilestoneCategory) {
    return useQuery({
        queryKey: ['youyou-milestones', category],
        queryFn: () => youyouApi.getMilestones(category),
    });
}

export function useMilestoneStats() {
    return useQuery({
        queryKey: ['youyou-milestone-stats'],
        queryFn: () => youyouApi.getMilestoneStats(),
    });
}

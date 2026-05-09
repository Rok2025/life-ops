'use client';

import { useQuery } from '@tanstack/react-query';
import { familyApi } from '../api/familyApi';

type FamilyStats = {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
    doneThisWeek: number;
};

export function useFamilyStats(initialData?: FamilyStats) {
    const query = useQuery({
        queryKey: ['family-stats'],
        queryFn: () => familyApi.getStats(),
        initialData,
    });

    return {
        stats: query.data ?? { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0, doneThisWeek: 0 },
        loading: query.isLoading,
    };
}

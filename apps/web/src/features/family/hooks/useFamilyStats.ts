'use client';

import { useQuery } from '@tanstack/react-query';
import { familyApi } from '../api/familyApi';

export function useFamilyStats() {
    const query = useQuery({
        queryKey: ['family-stats'],
        queryFn: () => familyApi.getStats(),
    });

    return {
        stats: query.data ?? { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0, doneThisWeek: 0 },
        loading: query.isLoading,
    };
}

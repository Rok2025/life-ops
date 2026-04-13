'use client';

import { useQuery } from '@tanstack/react-query';
import { familyApi } from '../api/familyApi';
import type { TaskFilter } from '../types';

export function useFamilyTasks(filter?: TaskFilter, activeMemberId?: string | null) {
    // Resolve 'mine' to the active member's id
    const resolvedAssignee =
        filter?.assignee === 'mine' && activeMemberId
            ? activeMemberId
            : filter?.assignee;

    const queryFilter = filter
        ? { ...filter, assignee: resolvedAssignee ?? 'all' }
        : undefined;

    const query = useQuery({
        queryKey: ['family-tasks', queryFilter],
        queryFn: () =>
            familyApi.getTasks({
                status: queryFilter?.status,
                assignee: queryFilter?.assignee,
                category: queryFilter?.category,
            }),
    });

    return {
        tasks: query.data ?? [],
        loading: query.isLoading,
        refetch: query.refetch,
    };
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { outputApi } from '../api/outputApi';

export function useOutputsByProject(projectId: string) {
    return useQuery({
        queryKey: ['outputs', { projectId }],
        queryFn: () => outputApi.getByProject(projectId),
        enabled: !!projectId,
    });
}

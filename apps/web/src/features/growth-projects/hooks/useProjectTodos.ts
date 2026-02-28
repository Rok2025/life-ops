'use client';

import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';

export function useProjectTodos(projectId: string) {
    return useQuery({
        queryKey: ['project-todos', projectId],
        queryFn: () => projectsApi.getTodos(projectId),
        enabled: !!projectId,
    });
}

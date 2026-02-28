'use client';

import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';

export function useProjectNotes(projectId: string) {
    return useQuery({
        queryKey: ['project-notes', projectId],
        queryFn: () => projectsApi.getNotes(projectId),
        enabled: !!projectId,
    });
}

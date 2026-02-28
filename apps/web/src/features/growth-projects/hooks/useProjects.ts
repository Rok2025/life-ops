'use client';

import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import type { GrowthArea, ProjectStatus, ProjectScope } from '../types';

export function useProjects(
    area: GrowthArea,
    filters?: { status?: ProjectStatus; scope?: ProjectScope },
) {
    return useQuery({
        queryKey: ['projects', area, filters],
        queryFn: () => projectsApi.getByArea(area, filters),
    });
}

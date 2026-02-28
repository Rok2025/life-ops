'use client';

import { useQuery } from '@tanstack/react-query';
import { outputApi } from '../api/outputApi';
import type { OutputType, OutputStatus } from '../types';

export function useOutputs(filters?: { type?: OutputType; status?: OutputStatus; projectId?: string }) {
    return useQuery({
        queryKey: ['outputs', filters],
        queryFn: () => outputApi.getAll(filters),
    });
}

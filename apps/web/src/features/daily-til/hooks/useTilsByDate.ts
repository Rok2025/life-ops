'use client';

import { useQuery } from '@tanstack/react-query';
import { tilApi } from '../api/tilApi';

export function useTilsByDate(date: string) {
    return useQuery({
        queryKey: ['tils', date],
        queryFn: () => tilApi.getByDate(date),
    });
}

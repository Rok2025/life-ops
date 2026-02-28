'use client';

import { useQuery } from '@tanstack/react-query';
import { frogsApi } from '../api/frogsApi';

export function useFrogsByDate(date: string) {
    return useQuery({
        queryKey: ['frogs', date],
        queryFn: () => frogsApi.getByDate(date),
    });
}

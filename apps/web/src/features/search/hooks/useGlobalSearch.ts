'use client';

import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';
import type { SearchFilters } from '../types';

export function useGlobalSearch(keyword: string, filters: SearchFilters) {
    const trimmedKeyword = keyword.trim();

    return useQuery({
        queryKey: ['global-search', trimmedKeyword, filters],
        queryFn: () => searchApi.search(trimmedKeyword, filters),
        enabled: trimmedKeyword.length > 0,
        staleTime: 30 * 1000,
    });
}

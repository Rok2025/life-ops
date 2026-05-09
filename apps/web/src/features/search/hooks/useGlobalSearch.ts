'use client';

import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';
import type { SearchFilters, SearchResult } from '../types';

export function useGlobalSearch(keyword: string, filters: SearchFilters, initialData?: SearchResult[]) {
    const trimmedKeyword = keyword.trim();

    return useQuery({
        queryKey: ['global-search', trimmedKeyword, filters],
        queryFn: () => searchApi.search(trimmedKeyword, filters),
        enabled: trimmedKeyword.length > 0,
        initialData,
        staleTime: 30 * 1000,
    });
}

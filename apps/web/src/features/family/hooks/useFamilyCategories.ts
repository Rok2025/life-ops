'use client';

import { useQuery } from '@tanstack/react-query';
import { familyApi } from '../api/familyApi';
import type { TaskCategoryConfig } from '../types';

export function useFamilyCategories(initialData?: TaskCategoryConfig[]) {
    const query = useQuery({
        queryKey: ['family-categories'],
        queryFn: () => familyApi.getCategories(),
        initialData,
    });

    return {
        categories: query.data ?? [],
        loading: query.isLoading,
    };
}

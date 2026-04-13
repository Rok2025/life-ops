'use client';

import { useQuery } from '@tanstack/react-query';
import { familyApi } from '../api/familyApi';

export function useFamilyCategories() {
    const query = useQuery({
        queryKey: ['family-categories'],
        queryFn: () => familyApi.getCategories(),
    });

    return {
        categories: query.data ?? [],
        loading: query.isLoading,
    };
}

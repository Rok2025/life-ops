'use client';

import { useQuery } from '@tanstack/react-query';
import { familyApi } from '../api/familyApi';

export function useFamilyMembers() {
    const query = useQuery({
        queryKey: ['family-members'],
        queryFn: () => familyApi.getMembers(),
    });

    return {
        members: query.data ?? [],
        loading: query.isLoading,
    };
}

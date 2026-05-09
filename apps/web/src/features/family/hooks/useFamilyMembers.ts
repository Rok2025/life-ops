'use client';

import { useQuery } from '@tanstack/react-query';
import { familyApi } from '../api/familyApi';
import type { FamilyMember } from '../types';

export function useFamilyMembers(initialData?: FamilyMember[]) {
    const query = useQuery({
        queryKey: ['family-members'],
        queryFn: () => familyApi.getMembers(),
        initialData,
    });

    return {
        members: query.data ?? [],
        loading: query.isLoading,
    };
}

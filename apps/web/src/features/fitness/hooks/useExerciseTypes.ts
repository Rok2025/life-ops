'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fitnessApi } from '../api/fitnessApi';

export function useExerciseTypes() {
    const query = useQuery({
        queryKey: ['fitness-exercise-types'],
        queryFn: () => fitnessApi.getExerciseTypes(),
    });

    const categories = useMemo(
        () => [...new Set((query.data ?? []).map(e => e.category))],
        [query.data],
    );

    return {
        exerciseTypes: query.data ?? [],
        categories,
        loading: query.isLoading,
    };
}

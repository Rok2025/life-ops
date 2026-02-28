'use client';

import { useQuery } from '@tanstack/react-query';
import { fitnessApi } from '../api/fitnessApi';

export function useWorkoutDetail(sessionId: string) {
    const sessionQuery = useQuery({
        queryKey: ['fitness-workout-session', sessionId],
        queryFn: () => fitnessApi.getWorkoutSession(sessionId),
        enabled: !!sessionId,
    });

    const setsQuery = useQuery({
        queryKey: ['fitness-workout-sets', sessionId],
        queryFn: () => fitnessApi.getWorkoutSets(sessionId),
        enabled: !!sessionId,
    });

    return {
        session: sessionQuery.data ?? null,
        sets: setsQuery.data ?? [],
        loading: sessionQuery.isLoading || setsQuery.isLoading,
    };
}

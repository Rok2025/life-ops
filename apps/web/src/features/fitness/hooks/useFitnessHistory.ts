'use client';

import { useQuery } from '@tanstack/react-query';
import { fitnessApi } from '../api/fitnessApi';

export function useFitnessHistoryData() {
    const workoutsQuery = useQuery({
        queryKey: ['fitness-history-workouts'],
        queryFn: () => fitnessApi.getAllWorkoutsByMonth(),
    });

    const statsQuery = useQuery({
        queryKey: ['fitness-history-stats'],
        queryFn: () => fitnessApi.getHistoryStats(),
    });

    return {
        workoutsByMonth: workoutsQuery.data ?? [],
        stats: statsQuery.data ?? { totalWorkouts: 0, totalSets: 0, totalVolume: 0 },
        loading: workoutsQuery.isLoading || statsQuery.isLoading,
    };
}

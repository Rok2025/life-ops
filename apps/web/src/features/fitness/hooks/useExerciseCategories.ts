'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { configApi } from '@/features/system-config/api/configApi';

/**
 * 获取训练部位分类映射 { value → label }
 * 例如 { chest: '胸部', back: '背部', ... }
 */
export function useExerciseCategories() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['fitness-exercise-categories'],
        queryFn: () => configApi.getActiveByScope('exercise_category'),
    });

    const categories = useMemo(() => {
        const map: Record<string, string> = {};
        for (const item of query.data ?? []) {
            map[item.value] = item.label;
        }
        return map;
    }, [query.data]);

    const categoryList = useMemo(
        () => (query.data ?? []).map(item => item.value),
        [query.data],
    );

    const reload = () => queryClient.invalidateQueries({ queryKey: ['fitness-exercise-categories'] });

    return { categories, categoryList, loading: query.isLoading, reload };
}

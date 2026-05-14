'use client';

import { useQuery } from '@tanstack/react-query';
import { unifiedTodosApi } from '../api/unifiedTodosApi';

export function useUnifiedTodos() {
    return useQuery({
        queryKey: ['unified-todos'],
        queryFn: () => unifiedTodosApi.getTodos(),
    });
}

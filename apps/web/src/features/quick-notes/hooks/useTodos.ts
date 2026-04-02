'use client';

import { useQuery } from '@tanstack/react-query';
import { notesApi } from '../api/notesApi';

export function useTodos() {
    return useQuery({
        queryKey: ['todos'],
        queryFn: () => notesApi.getTodos(),
    });
}

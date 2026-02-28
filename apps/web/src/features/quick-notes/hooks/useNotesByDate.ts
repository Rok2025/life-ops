'use client';

import { useQuery } from '@tanstack/react-query';
import { notesApi } from '../api/notesApi';

export function useNotesByDate(date: string) {
    return useQuery({
        queryKey: ['notes', date],
        queryFn: () => notesApi.getByDate(date),
    });
}

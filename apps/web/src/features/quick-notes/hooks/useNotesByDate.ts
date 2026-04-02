'use client';

import { useQuery } from '@tanstack/react-query';
import { notesApi } from '../api/notesApi';

interface UseNotesByDateOptions {
    includeTodos?: boolean;
}

export function useNotesByDate(date: string, options: UseNotesByDateOptions = {}) {
    const includeTodos = options.includeTodos ?? true;

    return useQuery({
        queryKey: ['notes', date, includeTodos ? 'with-todos' : 'notes-only'],
        queryFn: () => notesApi.getByDate(date, { includeTodos }),
    });
}

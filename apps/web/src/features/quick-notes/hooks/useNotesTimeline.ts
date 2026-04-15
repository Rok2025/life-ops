'use client';

import { useQuery } from '@tanstack/react-query';
import { notesApi } from '../api/notesApi';

export function useNotesTimeline() {
    return useQuery({
        queryKey: ['notes-timeline'],
        queryFn: () => notesApi.getNotesTimeline(),
    });
}

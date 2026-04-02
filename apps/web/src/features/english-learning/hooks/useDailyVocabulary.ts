'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyPlanApi } from '../api/dailyPlanApi';
import { wordBankApi } from '../api/wordBankApi';
import type { SaveAssignmentRecordInput } from '../types';

export function useWordBankStats() {
    return useQuery({
        queryKey: ['english-word-bank-stats'],
        queryFn: () => wordBankApi.getStats(),
    });
}

export function useDailyAssignments(date: string) {
    return useQuery({
        queryKey: ['english-daily-assignments', date],
        queryFn: () => dailyPlanApi.getOrCreateForDate(date),
    });
}

export function useRecentWordLogs(wordId: string | null, limit = 3) {
    return useQuery({
        queryKey: ['english-word-logs', wordId, limit],
        queryFn: () => dailyPlanApi.getRecentLogs(wordId as string, limit),
        enabled: Boolean(wordId),
    });
}

export function useDailyVocabularyMutations(date: string) {
    const queryClient = useQueryClient();

    const invalidateDaily = () => {
        queryClient.invalidateQueries({ queryKey: ['english-daily-assignments', date] });
        queryClient.invalidateQueries({ queryKey: ['english-word-bank-stats'] });
        queryClient.invalidateQueries({ queryKey: ['english-word-logs'] });
        queryClient.invalidateQueries({ queryKey: ['english-cards-review'] });
        queryClient.invalidateQueries({ queryKey: ['english-cards-review-count'] });
        queryClient.invalidateQueries({ queryKey: ['english-cards-stats'] });
    };

    const importWordBankMutation = useMutation({
        mutationFn: (markdown: string) => wordBankApi.importMarkdown(markdown),
        onSuccess: invalidateDaily,
    });

    const saveAssignmentRecordMutation = useMutation({
        mutationFn: (input: SaveAssignmentRecordInput) => dailyPlanApi.saveRecord(input),
        onSuccess: invalidateDaily,
    });

    const skipAssignmentMutation = useMutation({
        mutationFn: (assignmentId: string) => dailyPlanApi.skipAssignment(assignmentId),
        onSuccess: invalidateDaily,
    });

    return {
        importWordBankMutation,
        saveAssignmentRecordMutation,
        skipAssignmentMutation,
    };
}

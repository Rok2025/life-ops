'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryApi } from '../api/queryApi';
import { cardApi } from '../api/cardApi';
import { summaryApi } from '../api/summaryApi';
import type { CreateQueryInput, CreateCardInput, UpdateCardInput, Familiarity } from '../types';

export function useEnglishMutations() {
    const queryClient = useQueryClient();

    const invalidateQueries = () =>
        queryClient.invalidateQueries({ queryKey: ['english-queries'] });
    const invalidateCards = () =>
        queryClient.invalidateQueries({ queryKey: ['english-cards'] });
    const invalidateAll = () => {
        invalidateQueries();
        invalidateCards();
        queryClient.invalidateQueries({ queryKey: ['english-query-count'] });
        queryClient.invalidateQueries({ queryKey: ['english-queries-recent'] });
        queryClient.invalidateQueries({ queryKey: ['english-cards-review'] });
        queryClient.invalidateQueries({ queryKey: ['english-cards-review-count'] });
        queryClient.invalidateQueries({ queryKey: ['english-cards-stats'] });
    };

    // Query mutations
    const createQueryMutation = useMutation({
        mutationFn: (input: CreateQueryInput) => queryApi.create(input),
        onSuccess: invalidateAll,
    });

    const deleteQueryMutation = useMutation({
        mutationFn: (id: string) => queryApi.delete(id),
        onSuccess: invalidateAll,
    });

    // Card mutations
    const createCardMutation = useMutation({
        mutationFn: (input: CreateCardInput) => cardApi.create(input),
        onSuccess: invalidateAll,
    });

    const updateCardMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateCardInput }) =>
            cardApi.update(id, input),
        onSuccess: invalidateCards,
    });

    const reviewCardMutation = useMutation({
        mutationFn: ({ id, familiarity }: { id: string; familiarity: Familiarity }) =>
            cardApi.updateReview(id, familiarity),
        onSuccess: invalidateAll,
    });

    const deleteCardMutation = useMutation({
        mutationFn: (id: string) => cardApi.delete(id),
        onSuccess: invalidateAll,
    });

    // Mark query as saved when creating a card from it
    const saveQueryToCardMutation = useMutation({
        mutationFn: async ({ queryId, card }: { queryId: string; card: CreateCardInput }) => {
            const newCard = await cardApi.create(card);
            await queryApi.markSaved(queryId);
            return newCard;
        },
        onSuccess: invalidateAll,
    });

    // Summary mutations
    const upsertSummaryMutation = useMutation({
        mutationFn: ({
            date,
            updates,
        }: {
            date: string;
            updates: {
                total_queries: number;
                total_cards: number;
                new_words: string[];
                ai_summary?: string | null;
            };
        }) => summaryApi.upsert(date, updates),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['english-daily-summary'] }),
    });

    return {
        createQueryMutation,
        deleteQueryMutation,
        createCardMutation,
        updateCardMutation,
        reviewCardMutation,
        deleteCardMutation,
        saveQueryToCardMutation,
        upsertSummaryMutation,
    };
}

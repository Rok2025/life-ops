'use client';

import { useQuery } from '@tanstack/react-query';
import { cardApi } from '../api/cardApi';
import type { CardFilters } from '../types';

export function useEnglishCards(filters: CardFilters = {}) {
    return useQuery({
        queryKey: [
            'english-cards',
            filters.search ?? '',
            filters.difficulty ?? '',
            filters.familiarity ?? '',
            filters.tag ?? '',
        ],
        queryFn: () => cardApi.getAll(filters),
    });
}

export function useCardsForReview() {
    return useQuery({
        queryKey: ['english-cards-review'],
        queryFn: () => cardApi.getForReview(),
    });
}

export function useCardReviewCount() {
    return useQuery({
        queryKey: ['english-cards-review-count'],
        queryFn: () => cardApi.getReviewCount(),
    });
}

export function useCardStats() {
    return useQuery({
        queryKey: ['english-cards-stats'],
        queryFn: () => cardApi.getStats(),
    });
}

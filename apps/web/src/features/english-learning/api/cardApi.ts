import { supabase } from '@/lib/supabase';
import type { EnglishCard, CreateCardInput, UpdateCardInput, CardFilters, Familiarity } from '../types';
import { REVIEW_INTERVALS } from '../constants';

export const cardApi = {
    /** Get all cards with optional filters */
    getAll: async (filters: CardFilters = {}): Promise<EnglishCard[]> => {
        let query = supabase
            .from('english_cards')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters.difficulty) {
            query = query.eq('difficulty', filters.difficulty);
        }
        if (filters.familiarity !== undefined) {
            query = query.eq('familiarity', filters.familiarity);
        }
        if (filters.tag) {
            query = query.contains('tags', [filters.tag]);
        }
        if (filters.search?.trim()) {
            const term = filters.search.trim();
            query = query.or(`front_text.ilike.%${term}%,back_text.ilike.%${term}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    /** Get cards due for review */
    getForReview: async (): Promise<EnglishCard[]> => {
        const { data, error } = await supabase
            .from('english_cards')
            .select('*')
            .lt('familiarity', 5)
            .lte('next_review_at', new Date().toISOString())
            .order('next_review_at', { ascending: true });
        if (error) throw error;
        return data ?? [];
    },

    /** Get count of cards due for review */
    getReviewCount: async (): Promise<number> => {
        const { count, error } = await supabase
            .from('english_cards')
            .select('*', { count: 'exact', head: true })
            .lt('familiarity', 5)
            .lte('next_review_at', new Date().toISOString());
        if (error) throw error;
        return count ?? 0;
    },

    /** Get card statistics */
    getStats: async (): Promise<{
        total: number;
        byDifficulty: Record<string, number>;
        byFamiliarity: Record<number, number>;
        mastered: number;
    }> => {
        const { data, error } = await supabase
            .from('english_cards')
            .select('difficulty, familiarity');
        if (error) throw error;

        const cards = data ?? [];
        const byDifficulty: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
        const byFamiliarity: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        for (const c of cards) {
            byDifficulty[c.difficulty] = (byDifficulty[c.difficulty] ?? 0) + 1;
            byFamiliarity[c.familiarity] = (byFamiliarity[c.familiarity] ?? 0) + 1;
        }

        return {
            total: cards.length,
            byDifficulty,
            byFamiliarity,
            mastered: byFamiliarity[5] ?? 0,
        };
    },

    /** Create a new card */
    create: async (input: CreateCardInput): Promise<EnglishCard> => {
        const { data, error } = await supabase
            .from('english_cards')
            .insert({
                ...input,
                tags: input.tags ?? [],
                next_review_at: new Date().toISOString(),
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** Update a card */
    update: async (id: string, input: UpdateCardInput): Promise<EnglishCard> => {
        const { data, error } = await supabase
            .from('english_cards')
            .update({ ...input, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** Update review result with spaced repetition */
    updateReview: async (id: string, newFamiliarity: Familiarity): Promise<EnglishCard> => {
        const intervalDays = REVIEW_INTERVALS[newFamiliarity];
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + intervalDays);

        const { data, error } = await supabase
            .from('english_cards')
            .update({
                familiarity: newFamiliarity,
                last_reviewed_at: new Date().toISOString(),
                next_review_at: nextReview.toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        // Increment review_count separately
        const newCount = (data.review_count ?? 0) + 1;
        await supabase
            .from('english_cards')
            .update({ review_count: newCount })
            .eq('id', id);

        return { ...data, review_count: newCount };
    },

    /** Delete a card */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('english_cards')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};

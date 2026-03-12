import { supabase } from '@/lib/supabase';
import type { DailySummary } from '../types';

export const summaryApi = {
    /** Get summary for a specific date */
    getByDate: async (date: string): Promise<DailySummary | null> => {
        const { data, error } = await supabase
            .from('english_daily_summaries')
            .select('*')
            .eq('summary_date', date)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    /** Get summaries for a date range */
    getRange: async (startDate: string, endDate: string): Promise<DailySummary[]> => {
        const { data, error } = await supabase
            .from('english_daily_summaries')
            .select('*')
            .gte('summary_date', startDate)
            .lte('summary_date', endDate)
            .order('summary_date', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** Create or update a daily summary */
    upsert: async (
        date: string,
        updates: {
            total_queries: number;
            total_cards: number;
            new_words: string[];
            ai_summary?: string | null;
        },
    ): Promise<DailySummary> => {
        const { data, error } = await supabase
            .from('english_daily_summaries')
            .upsert(
                {
                    summary_date: date,
                    ...updates,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'summary_date' },
            )
            .select()
            .single();
        if (error) throw error;
        return data;
    },
};

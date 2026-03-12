import { supabase } from '@/lib/supabase';
import type { EnglishQuery, CreateQueryInput } from '../types';

export const queryApi = {
    /** Get queries by date */
    getByDate: async (date: string): Promise<EnglishQuery[]> => {
        const { data, error } = await supabase
            .from('english_queries')
            .select('*')
            .eq('query_date', date)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** Get today's query count */
    getCount: async (date: string): Promise<number> => {
        const { count, error } = await supabase
            .from('english_queries')
            .select('*', { count: 'exact', head: true })
            .eq('query_date', date);
        if (error) throw error;
        return count ?? 0;
    },

    /** Get recent queries */
    getRecent: async (limit = 5): Promise<EnglishQuery[]> => {
        const { data, error } = await supabase
            .from('english_queries')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data ?? [];
    },

    /** Create a query record */
    create: async (input: CreateQueryInput): Promise<EnglishQuery> => {
        const { data, error } = await supabase
            .from('english_queries')
            .insert(input)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** Mark query as saved to card */
    markSaved: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('english_queries')
            .update({ is_saved: true })
            .eq('id', id);
        if (error) throw error;
    },

    /** Delete a query */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('english_queries')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};

import { supabase } from '@/lib/supabase';
import type { TIL, CreateTilInput, UpdateTilInput } from '../types';

export const tilApi = {
    /** 按日期获取 TIL 列表 */
    getByDate: async (date: string): Promise<TIL[]> => {
        const { data, error } = await supabase
            .from('daily_til')
            .select('*')
            .eq('til_date', date)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** 获取某日 TIL 数量 */
    getCount: async (date: string): Promise<number> => {
        const { count, error } = await supabase
            .from('daily_til')
            .select('*', { count: 'exact', head: true })
            .eq('til_date', date);
        if (error) throw error;
        return count ?? 0;
    },

    /** 创建 TIL */
    create: async (input: CreateTilInput): Promise<TIL> => {
        const { data, error } = await supabase
            .from('daily_til')
            .insert({
                til_date: input.til_date,
                content: input.content,
                category: input.category,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新 TIL */
    update: async (id: string, updates: UpdateTilInput): Promise<TIL> => {
        const { data, error } = await supabase
            .from('daily_til')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除 TIL */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('daily_til')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /** 获取日期范围内有数据的日期列表 */
    getDatesInRange: async (start: string, end: string): Promise<string[]> => {
        const { data, error } = await supabase
            .from('daily_til')
            .select('til_date')
            .gte('til_date', start)
            .lte('til_date', end);
        if (error) throw error;
        const unique = [...new Set((data ?? []).map(d => d.til_date))];
        return unique.sort();
    },
};

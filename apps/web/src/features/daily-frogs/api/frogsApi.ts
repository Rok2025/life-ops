import { supabase } from '@/lib/supabase';
import type { Frog, CreateFrogInput, UpdateFrogInput } from '../types';

export const frogsApi = {
    /** 按日期获取青蛙列表 */
    getByDate: async (date: string): Promise<Frog[]> => {
        const { data, error } = await supabase
            .from('daily_frogs')
            .select('*')
            .eq('frog_date', date)
            .order('created_at');
        if (error) throw error;
        return data ?? [];
    },

    /** 获取某日青蛙统计 */
    getStats: async (date: string): Promise<{ completed: number; total: number }> => {
        const { data, error } = await supabase
            .from('daily_frogs')
            .select('is_completed')
            .eq('frog_date', date);
        if (error) throw error;
        const total = data?.length ?? 0;
        const completed = data?.filter(f => f.is_completed).length ?? 0;
        return { completed, total };
    },

    /** 创建青蛙 */
    create: async (input: CreateFrogInput): Promise<Frog> => {
        const { data, error } = await supabase
            .from('daily_frogs')
            .insert({ frog_date: input.frog_date, title: input.title })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新青蛙 */
    update: async (id: string, updates: UpdateFrogInput): Promise<Frog> => {
        const { data, error } = await supabase
            .from('daily_frogs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 切换完成状态 */
    toggleComplete: async (id: string, completed: boolean): Promise<void> => {
        const { error } = await supabase
            .from('daily_frogs')
            .update({
                is_completed: completed,
                completed_at: completed ? new Date().toISOString() : null,
            })
            .eq('id', id);
        if (error) throw error;
    },

    /** 删除青蛙 */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('daily_frogs')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /** 获取日期范围内有数据的日期列表 */
    getDatesInRange: async (start: string, end: string): Promise<string[]> => {
        const { data, error } = await supabase
            .from('daily_frogs')
            .select('frog_date')
            .gte('frog_date', start)
            .lte('frog_date', end);
        if (error) throw error;
        const unique = [...new Set((data ?? []).map(d => d.frog_date))];
        return unique.sort();
    },
};

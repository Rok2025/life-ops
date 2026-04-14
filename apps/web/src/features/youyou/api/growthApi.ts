import { supabase } from '@/lib/supabase';
import type {
    GrowthRecord,
    CreateGrowthRecordInput,
    UpdateGrowthRecordInput,
} from '../types';

export const growthApi = {
    /** 获取发育记录（按日期倒序） */
    getRecords: async (limit = 50, offset = 0): Promise<GrowthRecord[]> => {
        const { data, error } = await supabase
            .from('youyou_growth_records')
            .select('*')
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) throw error;
        return data ?? [];
    },

    /** 按日期获取 */
    getByDate: async (date: string): Promise<GrowthRecord | null> => {
        const { data, error } = await supabase
            .from('youyou_growth_records')
            .select('*')
            .eq('date', date)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    /** 获取最新一条记录 */
    getLatest: async (): Promise<GrowthRecord | null> => {
        const { data, error } = await supabase
            .from('youyou_growth_records')
            .select('*')
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    /** 创建 */
    create: async (input: CreateGrowthRecordInput): Promise<GrowthRecord> => {
        const { data, error } = await supabase
            .from('youyou_growth_records')
            .insert(input)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新 */
    update: async (id: string, updates: UpdateGrowthRecordInput): Promise<GrowthRecord> => {
        const { data, error } = await supabase
            .from('youyou_growth_records')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除 */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('youyou_growth_records')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /** 统计 */
    getStats: async (): Promise<{ total: number }> => {
        const { count, error } = await supabase
            .from('youyou_growth_records')
            .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return { total: count ?? 0 };
    },
};

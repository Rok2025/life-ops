import { supabase } from '@/lib/supabase';
import type {
    DiaryEntry,
    CreateDiaryInput,
    UpdateDiaryInput,
    Milestone,
    MilestoneCategory,
    CreateMilestoneInput,
    UpdateMilestoneInput,
} from '../types';

export const youyouApi = {
    // ── Diary ───────────────────────────────────────────

    /** 获取日记列表（分页，按日期倒序） */
    getDiaryEntries: async (limit = 30, offset = 0): Promise<DiaryEntry[]> => {
        const { data, error } = await supabase
            .from('youyou_diary')
            .select('*')
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) throw error;
        return data ?? [];
    },

    /** 按日期获取单条日记 */
    getDiaryByDate: async (date: string): Promise<DiaryEntry | null> => {
        const { data, error } = await supabase
            .from('youyou_diary')
            .select('*')
            .eq('date', date)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    /** 创建日记 */
    createDiary: async (input: CreateDiaryInput): Promise<DiaryEntry> => {
        const { data, error } = await supabase
            .from('youyou_diary')
            .insert({
                date: input.date,
                mood: input.mood ?? null,
                highlight: input.highlight ?? null,
                learned: input.learned ?? null,
                funny_quote: input.funny_quote ?? null,
                diet_note: input.diet_note ?? null,
                sleep_note: input.sleep_note ?? null,
                content: input.content ?? null,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新日记 */
    updateDiary: async (id: string, updates: UpdateDiaryInput): Promise<DiaryEntry> => {
        const { data, error } = await supabase
            .from('youyou_diary')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除日记 */
    deleteDiary: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('youyou_diary')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /** 获取日记统计 */
    getDiaryStats: async (): Promise<{ total: number; thisMonth: number }> => {
        const { count: total, error: e1 } = await supabase
            .from('youyou_diary')
            .select('*', { count: 'exact', head: true });
        if (e1) throw e1;

        const monthStart = new Date();
        monthStart.setDate(1);
        const { count: thisMonth, error: e2 } = await supabase
            .from('youyou_diary')
            .select('*', { count: 'exact', head: true })
            .gte('date', monthStart.toISOString().slice(0, 10));
        if (e2) throw e2;

        return { total: total ?? 0, thisMonth: thisMonth ?? 0 };
    },

    // ── Milestones ──────────────────────────────────────

    /** 获取全部里程碑 */
    getMilestones: async (category?: MilestoneCategory): Promise<Milestone[]> => {
        let query = supabase
            .from('youyou_milestones')
            .select('*')
            .order('category')
            .order('sort_order', { ascending: true });

        if (category) query = query.eq('category', category);

        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    },

    /** 创建里程碑 */
    createMilestone: async (input: CreateMilestoneInput): Promise<Milestone> => {
        const { data, error } = await supabase
            .from('youyou_milestones')
            .insert({
                category: input.category,
                title: input.title,
                description: input.description ?? null,
                expected_age_months: input.expected_age_months ?? null,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新里程碑（含标记达成） */
    updateMilestone: async (id: string, updates: UpdateMilestoneInput): Promise<Milestone> => {
        const { data, error } = await supabase
            .from('youyou_milestones')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 标记里程碑达成 */
    achieveMilestone: async (id: string, achievedAt?: string): Promise<Milestone> => {
        const { data, error } = await supabase
            .from('youyou_milestones')
            .update({ achieved_at: achievedAt ?? new Date().toISOString().slice(0, 10) })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 取消里程碑达成 */
    unachieveMilestone: async (id: string): Promise<Milestone> => {
        const { data, error } = await supabase
            .from('youyou_milestones')
            .update({ achieved_at: null })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除里程碑 */
    deleteMilestone: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('youyou_milestones')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /** 获取里程碑统计 */
    getMilestoneStats: async (): Promise<{ total: number; achieved: number }> => {
        const { count: total, error: e1 } = await supabase
            .from('youyou_milestones')
            .select('*', { count: 'exact', head: true });
        if (e1) throw e1;

        const { count: achieved, error: e2 } = await supabase
            .from('youyou_milestones')
            .select('*', { count: 'exact', head: true })
            .not('achieved_at', 'is', null);
        if (e2) throw e2;

        return { total: total ?? 0, achieved: achieved ?? 0 };
    },
};

import { supabase } from '@/lib/supabase';
import type { QuickNote, CreateNoteInput, UpdateNoteInput } from '../types';

export const notesApi = {
    /** 按日期获取笔记列表 */
    getByDate: async (date: string): Promise<QuickNote[]> => {
        const { data, error } = await supabase
            .from('quick_notes')
            .select('*')
            .eq('note_date', date)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** 获取某日笔记数量 */
    getCount: async (date: string): Promise<number> => {
        const { count, error } = await supabase
            .from('quick_notes')
            .select('*', { count: 'exact', head: true })
            .eq('note_date', date);
        if (error) throw error;
        return count ?? 0;
    },

    /** 创建笔记 */
    create: async (input: CreateNoteInput): Promise<QuickNote> => {
        const { data, error } = await supabase
            .from('quick_notes')
            .insert(input)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新笔记 */
    update: async (id: string, updates: UpdateNoteInput): Promise<QuickNote> => {
        const { data, error } = await supabase
            .from('quick_notes')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除笔记 */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('quick_notes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};

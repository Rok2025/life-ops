import { supabase } from '@/lib/supabase';
import { getLocalDateStr } from '@/lib/utils/date';
import type { QuickNote, CreateNoteInput, CreateTodoInput, UpdateNoteInput } from '../types';

type NoteQueryOptions = {
    includeTodos?: boolean;
};

export const notesApi = {
    /** 按日期获取笔记列表 */
    getByDate: async (date: string, options: NoteQueryOptions = {}): Promise<QuickNote[]> => {
        const includeTodos = options.includeTodos ?? true;
        let query = supabase
            .from('quick_notes')
            .select('*')
            .eq('note_date', date);

        if (!includeTodos) {
            query = query.neq('type', 'todo');
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** 获取某日笔记数量 */
    getCount: async (date: string, options: NoteQueryOptions = {}): Promise<number> => {
        const includeTodos = options.includeTodos ?? true;
        let query = supabase
            .from('quick_notes')
            .select('*', { count: 'exact', head: true })
            .eq('note_date', date);

        if (!includeTodos) {
            query = query.neq('type', 'todo');
        }

        const { count, error } = await query;
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

    /** 快速创建待办 */
    createTodo: async (input: CreateTodoInput): Promise<QuickNote> => {
        return notesApi.create({
            note_date: getLocalDateStr(),
            type: 'todo',
            content: input.content,
            answer: null,
            is_answered: false,
            is_completed: false,
            priority: input.priority ?? 'normal',
            execute_date: input.execute_date ?? null,
        });
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

    /** 切换待办完成状态 */
    toggleCompleted: async (id: string, isCompleted: boolean): Promise<QuickNote> => {
        const { data, error } = await supabase
            .from('quick_notes')
            .update({
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 获取全部待办 */
    getTodos: async (): Promise<QuickNote[]> => {
        const { data, error } = await supabase
            .from('quick_notes')
            .select('*')
            .eq('type', 'todo')
            .order('is_completed', { ascending: true })
            .order('execute_date', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** 获取所有未完成的待办 */
    getIncompleteTodos: async (): Promise<QuickNote[]> => {
        const { data, error } = await supabase
            .from('quick_notes')
            .select('*')
            .eq('type', 'todo')
            .eq('is_completed', false)
            .order('execute_date', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** 获取未完成待办数量 */
    getIncompleteTodoCount: async (): Promise<number> => {
        const { count, error } = await supabase
            .from('quick_notes')
            .select('*', { count: 'exact', head: true })
            .eq('type', 'todo')
            .eq('is_completed', false);
        if (error) throw error;
        return count ?? 0;
    },

    /** 获取日期范围内有数据的日期列表 */
    getDatesInRange: async (start: string, end: string, options: NoteQueryOptions = {}): Promise<string[]> => {
        const includeTodos = options.includeTodos ?? true;
        let query = supabase
            .from('quick_notes')
            .select('note_date')
            .gte('note_date', start)
            .lte('note_date', end);

        if (!includeTodos) {
            query = query.neq('type', 'todo');
        }

        const { data, error } = await query;
        if (error) throw error;
        const unique = [...new Set((data ?? []).map(d => d.note_date))];
        return unique.sort();
    },
};

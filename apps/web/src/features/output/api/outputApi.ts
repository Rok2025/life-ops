import { supabase } from '@/lib/supabase';
import type {
    Output,
    OutputWithProject,
    CreateOutputInput,
    UpdateOutputInput,
    OutputType,
    OutputStatus,
} from '../types';

export const outputApi = {
    /** 获取所有输出（含关联项目信息） */
    getAll: async (filters?: {
        type?: OutputType;
        status?: OutputStatus;
        projectId?: string;
    }): Promise<OutputWithProject[]> => {
        let query = supabase
            .from('outputs')
            .select('*, growth_projects(title, area)')
            .order('created_at', { ascending: false });

        if (filters?.type) query = query.eq('type', filters.type);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.projectId) query = query.eq('project_id', filters.projectId);

        const { data, error } = await query;
        if (error) throw error;

        return (data ?? []).map((item: Record<string, unknown>) => {
            const project = item.growth_projects as { title: string; area: string } | null;
            return {
                id: item.id as string,
                project_id: item.project_id as string | null,
                title: item.title as string,
                type: item.type as OutputType,
                content: item.content as string | null,
                url: item.url as string | null,
                status: item.status as OutputStatus,
                created_at: item.created_at as string,
                updated_at: item.updated_at as string,
                project_title: project?.title,
                project_area: project?.area,
            };
        });
    },

    /** 按项目获取输出 */
    getByProject: async (projectId: string): Promise<Output[]> => {
        const { data, error } = await supabase
            .from('outputs')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** 创建输出 */
    create: async (input: CreateOutputInput): Promise<Output> => {
        const { data, error } = await supabase
            .from('outputs')
            .insert({
                project_id: input.project_id ?? null,
                title: input.title,
                type: input.type,
                content: input.content ?? null,
                url: input.url ?? null,
                status: input.status ?? 'draft',
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新输出 */
    update: async (id: string, updates: UpdateOutputInput): Promise<Output> => {
        const { data, error } = await supabase
            .from('outputs')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除输出 */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('outputs')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /** 获取输出统计 */
    getStats: async (): Promise<{ total: number; published: number; draft: number }> => {
        const { count: total } = await supabase
            .from('outputs')
            .select('*', { count: 'exact', head: true });

        const { count: published } = await supabase
            .from('outputs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published');

        return {
            total: total ?? 0,
            published: published ?? 0,
            draft: (total ?? 0) - (published ?? 0),
        };
    },
};

import { supabase } from '@/lib/supabase';
import type {
    GrowthArea,
    Project,
    ProjectWithStats,
    CreateProjectInput,
    UpdateProjectInput,
    ProjectTodo,
    CreateTodoInput,
    ProjectNote,
    CreateNoteInput,
    ProjectStatus,
    ProjectScope,
} from '../types';

export const projectsApi = {
    // ── Projects ────────────────────────────────────────

    /** 按领域获取项目列表（含待办统计） */
    getByArea: async (
        area: GrowthArea,
        filters?: { status?: ProjectStatus; scope?: ProjectScope },
    ): Promise<ProjectWithStats[]> => {
        let query = supabase
            .from('growth_projects')
            .select('*')
            .eq('area', area)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.scope) query = query.eq('scope', filters.scope);

        const { data, error } = await query;
        if (error) throw error;

        const projects = data ?? [];
        if (projects.length === 0) return [];

        // 批量获取待办统计
        const ids = projects.map(p => p.id);
        const { data: todos, error: todosError } = await supabase
            .from('project_todos')
            .select('project_id, is_completed')
            .in('project_id', ids);
        if (todosError) throw todosError;

        const statsMap = new Map<string, { total: number; completed: number }>();
        for (const t of (todos ?? [])) {
            const s = statsMap.get(t.project_id) ?? { total: 0, completed: 0 };
            s.total++;
            if (t.is_completed) s.completed++;
            statsMap.set(t.project_id, s);
        }

        return projects.map(p => ({
            ...p,
            todo_total: statsMap.get(p.id)?.total ?? 0,
            todo_completed: statsMap.get(p.id)?.completed ?? 0,
        }));
    },

    /** 获取所有项目（用于 Output 关联选择） */
    getAll: async (): Promise<Project[]> => {
        const { data, error } = await supabase
            .from('growth_projects')
            .select('*')
            .order('area')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** 获取单个项目 */
    getById: async (id: string): Promise<Project> => {
        const { data, error } = await supabase
            .from('growth_projects')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    /** 创建项目 */
    create: async (input: CreateProjectInput): Promise<Project> => {
        const { data, error } = await supabase
            .from('growth_projects')
            .insert({
                area: input.area,
                title: input.title,
                description: input.description ?? null,
                scope: input.scope,
                start_date: input.start_date ?? null,
                end_date: input.end_date ?? null,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 更新项目 */
    update: async (id: string, updates: UpdateProjectInput): Promise<Project> => {
        const { data, error } = await supabase
            .from('growth_projects')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除项目 */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('growth_projects')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /** 获取领域统计 */
    getAreaStats: async (area: GrowthArea): Promise<{ active: number; total: number }> => {
        const { count: active, error: e1 } = await supabase
            .from('growth_projects')
            .select('*', { count: 'exact', head: true })
            .eq('area', area)
            .eq('status', 'active');
        if (e1) throw e1;

        const { count: total, error: e2 } = await supabase
            .from('growth_projects')
            .select('*', { count: 'exact', head: true })
            .eq('area', area);
        if (e2) throw e2;

        return { active: active ?? 0, total: total ?? 0 };
    },

    // ── Todos ───────────────────────────────────────────

    /** 获取项目待办列表 */
    getTodos: async (projectId: string): Promise<ProjectTodo[]> => {
        const { data, error } = await supabase
            .from('project_todos')
            .select('*')
            .eq('project_id', projectId)
            .order('is_completed', { ascending: true })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data ?? [];
    },

    /** 创建待办 */
    createTodo: async (input: CreateTodoInput): Promise<ProjectTodo> => {
        const { data, error } = await supabase
            .from('project_todos')
            .insert({
                project_id: input.project_id,
                title: input.title,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 切换待办完成状态 */
    toggleTodo: async (id: string, completed: boolean): Promise<ProjectTodo> => {
        const { data, error } = await supabase
            .from('project_todos')
            .update({
                is_completed: completed,
                completed_at: completed ? new Date().toISOString() : null,
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除待办 */
    deleteTodo: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('project_todos')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // ── Notes ───────────────────────────────────────────

    /** 获取项目灵感/成果列表 */
    getNotes: async (projectId: string): Promise<ProjectNote[]> => {
        const { data, error } = await supabase
            .from('project_notes')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** 创建灵感/成果 */
    createNote: async (input: CreateNoteInput): Promise<ProjectNote> => {
        const { data, error } = await supabase
            .from('project_notes')
            .insert({
                project_id: input.project_id,
                todo_id: input.todo_id ?? null,
                type: input.type,
                content: input.content,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 删除灵感/成果 */
    deleteNote: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('project_notes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};

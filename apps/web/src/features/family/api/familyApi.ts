import { supabase } from '@/lib/supabase';
import type {
    FamilyMember,
    FamilyTask,
    MemberBrief,
    CreateTaskInput,
    UpdateTaskInput,
    TaskCategoryConfig,
} from '../types';

/** Attach assignees to tasks via family_task_assignees join */
async function attachAssignees(
    tasks: Array<Omit<FamilyTask, 'assignees'> & { id: string }>,
): Promise<FamilyTask[]> {
    if (tasks.length === 0) return [];

    const taskIds = tasks.map((t) => t.id);
    const { data: links } = await supabase
        .from('family_task_assignees')
        .select('task_id, member_id, family_members(id, name, avatar_color)')
        .in('task_id', taskIds);

    const assigneeMap = new Map<string, MemberBrief[]>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (links ?? []).forEach((link: any) => {
        if (!link.family_members) return;
        const list = assigneeMap.get(link.task_id) ?? [];
        list.push(link.family_members as MemberBrief);
        assigneeMap.set(link.task_id, list);
    });

    return tasks.map((t) => ({
        ...t,
        assignees: assigneeMap.get(t.id) ?? [],
    })) as FamilyTask[];
}

export const familyApi = {
    // ── Members ────────────────────────────────────────────

    getMembers: async (): Promise<FamilyMember[]> => {
        const { data, error } = await supabase
            .from('family_members')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (error) {
            console.error('获取家庭成员失败:', error);
            return [];
        }
        return data ?? [];
    },

    // ── Categories (from system_configs) ───────────────────

    getCategories: async (): Promise<TaskCategoryConfig[]> => {
        const { data, error } = await supabase
            .from('system_configs')
            .select('value, label')
            .eq('scope', 'family_task_category')
            .eq('is_active', true)
            .order('sort_order');

        if (error) {
            console.error('获取家庭任务分类失败:', error);
            return [];
        }
        return data ?? [];
    },

    // ── Tasks ──────────────────────────────────────────────

    getTasks: async (options?: {
        status?: string;
        assignee?: string;
        category?: string;
    }): Promise<FamilyTask[]> => {
        let query = supabase
            .from('family_tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (options?.status && options.status !== 'all') {
            query = query.eq('status', options.status);
        }
        if (options?.category && options.category !== 'all') {
            query = query.eq('category', options.category);
        }

        const { data, error } = await query;

        if (error) {
            console.error('获取家庭任务失败:', error);
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let tasks = await attachAssignees((data ?? []) as any);

        // Client-side assignee filtering (needs join data)
        if (options?.assignee && options.assignee !== 'all') {
            if (options.assignee === 'unassigned') {
                tasks = tasks.filter((t) => t.assignees.length === 0);
            } else {
                tasks = tasks.filter((t) =>
                    t.assignees.some((a) => a.id === options.assignee),
                );
            }
        }

        return tasks;
    },

    getTaskById: async (id: string): Promise<FamilyTask | null> => {
        const { data, error } = await supabase
            .from('family_tasks')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('获取任务详情失败:', error);
            return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [task] = await attachAssignees([data as any]);
        return task ?? null;
    },

    createTask: async (input: CreateTaskInput): Promise<FamilyTask> => {
        const { data, error } = await supabase
            .from('family_tasks')
            .insert({
                title: input.title,
                description: input.description ?? null,
                category: input.category ?? null,
                priority: input.priority ?? 'normal',
                due_date: input.due_date ?? null,
                created_by: input.created_by ?? null,
            })
            .select('*')
            .single();

        if (error) throw error;

        // Insert assignees
        const assigneeIds = input.assignee_ids ?? [];
        if (assigneeIds.length > 0) {
            const { error: linkError } = await supabase
                .from('family_task_assignees')
                .insert(assigneeIds.map((mid) => ({ task_id: data.id, member_id: mid })));
            if (linkError) console.error('分配负责人失败:', linkError);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [task] = await attachAssignees([data as any]);
        return task;
    },

    updateTask: async (id: string, updates: UpdateTaskInput): Promise<FamilyTask> => {
        const { assignee_ids, ...dbUpdates } = updates;

        const { data, error } = await supabase
            .from('family_tasks')
            .update({ ...dbUpdates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        // Sync assignees if provided
        if (assignee_ids !== undefined) {
            await supabase
                .from('family_task_assignees')
                .delete()
                .eq('task_id', id);

            if (assignee_ids.length > 0) {
                await supabase
                    .from('family_task_assignees')
                    .insert(assignee_ids.map((mid) => ({ task_id: id, member_id: mid })));
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [task] = await attachAssignees([data as any]);
        return task;
    },

    completeTask: async (id: string): Promise<FamilyTask> => {
        return familyApi.updateTask(id, {
            status: 'done',
            completed_at: new Date().toISOString(),
        });
    },

    reopenTask: async (id: string): Promise<FamilyTask> => {
        return familyApi.updateTask(id, {
            status: 'todo',
            completed_at: null,
        });
    },

    deleteTask: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('family_tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ── Stats ──────────────────────────────────────────────

    getStats: async (): Promise<{
        total: number;
        todo: number;
        inProgress: number;
        done: number;
    }> => {
        const { data, error } = await supabase
            .from('family_tasks')
            .select('status');

        if (error) {
            console.error('获取任务统计失败:', error);
            return { total: 0, todo: 0, inProgress: 0, done: 0 };
        }

        const tasks = data ?? [];
        return {
            total: tasks.length,
            todo: tasks.filter((t) => t.status === 'todo').length,
            inProgress: tasks.filter((t) => t.status === 'in_progress').length,
            done: tasks.filter((t) => t.status === 'done').length,
        };
    },
};

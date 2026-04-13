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
        /** Only return done tasks completed within N days (default 7). 0 = no limit */
        doneWithinDays?: number;
    }): Promise<FamilyTask[]> => {
        let query = supabase
            .from('family_tasks')
            .select('*')
            .order('created_at', { ascending: true });

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

        // Trim old done tasks — keep only recent N days (default 7)
        const doneWithin = options?.doneWithinDays ?? 7;
        if (doneWithin > 0) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - doneWithin);
            tasks = tasks.filter(
                (t) => t.status !== 'done' || (t.completed_at && new Date(t.completed_at) >= cutoff),
            );
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

    /** Advance status: todo → in_progress → done → todo */
    advanceStatus: async (id: string, currentStatus: string): Promise<FamilyTask> => {
        const next = { todo: 'in_progress', in_progress: 'done', done: 'todo' } as const;
        const nextStatus = next[currentStatus as keyof typeof next] ?? 'todo';
        return familyApi.updateTask(id, {
            status: nextStatus,
            completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
        });
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
        overdue: number;
        doneThisWeek: number;
    }> => {
        const today = new Date(new Date().toDateString());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        const todayStr = today.toISOString();
        const weekStartStr = weekStart.toISOString();

        const [
            { count: total },
            { count: todo },
            { count: inProgress },
            { count: done },
            { count: overdue },
            { count: doneThisWeek },
        ] = await Promise.all([
            supabase.from('family_tasks').select('*', { count: 'exact', head: true }),
            supabase.from('family_tasks').select('*', { count: 'exact', head: true }).eq('status', 'todo'),
            supabase.from('family_tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
            supabase.from('family_tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
            supabase.from('family_tasks').select('*', { count: 'exact', head: true }).neq('status', 'done').not('due_date', 'is', null).lt('due_date', todayStr),
            supabase.from('family_tasks').select('*', { count: 'exact', head: true }).eq('status', 'done').gte('completed_at', weekStartStr),
        ]);

        return {
            total: total ?? 0,
            todo: todo ?? 0,
            inProgress: inProgress ?? 0,
            done: done ?? 0,
            overdue: overdue ?? 0,
            doneThisWeek: doneThisWeek ?? 0,
        };
    },

    /** Count done tasks older than N days (for archive hint) */
    getArchivedDoneCount: async (olderThanDays = 7): Promise<number> => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);
        const { count } = await supabase
            .from('family_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'done')
            .lt('completed_at', cutoff.toISOString());
        return count ?? 0;
    },
};

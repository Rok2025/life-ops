import { TONES, type ToneTokenClasses } from '@/design-system/tokens';

// ── Family Member ──────────────────────────────────────────

export type MemberRole = 'parent' | 'child';

export type FamilyMember = {
    id: string;
    name: string;
    role: MemberRole;
    avatar_color: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
};

export type MemberBrief = Pick<FamilyMember, 'id' | 'name' | 'avatar_color'>;

// ── Family Task ────────────────────────────────────────────

export type TaskPriority = 'normal' | 'important' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type FamilyTask = {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    is_recurring: boolean;
    recurrence_rule: string | null;
    completed_at: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    /** Joined from family_task_assignees → family_members */
    assignees: MemberBrief[];
};

export type CreateTaskInput = {
    title: string;
    description?: string | null;
    category?: string | null;
    assignee_ids?: string[];
    priority?: TaskPriority;
    due_date?: string | null;
    created_by?: string | null;
};

export type UpdateTaskInput = {
    title?: string;
    description?: string | null;
    category?: string | null;
    assignee_ids?: string[];
    priority?: TaskPriority;
    due_date?: string | null;
    status?: TaskStatus;
    completed_at?: string | null;
};

// ── Config ─────────────────────────────────────────────────

export type TaskCategoryConfig = {
    value: string;
    label: string;
};

// ── Priority Config ────────────────────────────────────────

export type PriorityConfig = {
    label: string;
    emoji: string;
} & Pick<ToneTokenClasses, 'color' | 'bg'>;

export const PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
    normal: { label: '普通', emoji: '', color: 'text-text-secondary', bg: 'bg-bg-tertiary' },
    important: { label: '重要', emoji: '⭐', ...TONES.orange },
    urgent: { label: '紧急', emoji: '⚡', ...TONES.danger },
};

export const TASK_PRIORITIES: TaskPriority[] = ['normal', 'important', 'urgent'];

// ── Status Config ──────────────────────────────────────────

export type StatusConfig = {
    label: string;
    emoji: string;
} & Pick<ToneTokenClasses, 'color' | 'bg'>;

export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
    todo: { label: '待办', emoji: '📋', ...TONES.blue },
    in_progress: { label: '进行中', emoji: '🔄', ...TONES.warning },
    done: { label: '已完成', emoji: '✅', ...TONES.success },
};

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

// ── Filter ─────────────────────────────────────────────────

export type AssigneeFilter = string | 'all' | 'mine' | 'unassigned';

export type TaskFilter = {
    status: TaskStatus | 'all';
    assignee: AssigneeFilter;
    category: string | 'all';
};

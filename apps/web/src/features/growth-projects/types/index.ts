import { TONES, type ToneTokenClasses } from '@/design-system/tokens';

/** 成长领域 */
export type GrowthArea = 'ai' | 'english' | 'reading';

/** 项目范围标签 */
export type ProjectScope = 'annual' | 'quarterly' | 'monthly';

/** 项目状态 */
export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived';

/** 项目灵感/成果类型 */
export type ProjectNoteType = 'idea' | 'achievement' | 'note';

/** 领域配置 */
export type AreaConfig = {
    label: string;
    icon: string;
} & ToneTokenClasses;

/** 领域配置映射 */
export const AREA_CONFIG: Record<GrowthArea, AreaConfig> = {
    ai: { label: 'AI', icon: '🤖', ...TONES.accent },
    english: { label: '英语', icon: '🔤', ...TONES.blue },
    reading: { label: '阅读', icon: '📚', ...TONES.green },
};

/** 范围标签配置 */
export const SCOPE_CONFIG: Record<ProjectScope, { label: string } & ToneTokenClasses> = {
    annual: { label: '年度', ...TONES.purple },
    quarterly: { label: '季度', ...TONES.blue },
    monthly: { label: '月', ...TONES.green },
};

/** 状态配置 */
export const STATUS_CONFIG: Record<ProjectStatus, { label: string; dot: string } & ToneTokenClasses> = {
    active: { label: '进行中', dot: 'bg-accent', ...TONES.accent },
    completed: { label: '已完成', dot: 'bg-success', ...TONES.success },
    paused: { label: '暂停', dot: 'bg-warning', ...TONES.warning },
    archived: { label: '归档', dot: 'bg-text-tertiary', ...TONES.muted },
};

/** 项目灵感/成果类型配置 */
export const NOTE_TYPE_CONFIG: Record<ProjectNoteType, { label: string; emoji: string } & ToneTokenClasses> = {
    idea: { label: '灵感', emoji: '💡', ...TONES.yellow },
    achievement: { label: '成果', emoji: '🏆', ...TONES.green },
    note: { label: '笔记', emoji: '📝', ...TONES.blue },
};

/** 项目数据类型 */
export type Project = {
    id: string;
    area: GrowthArea;
    title: string;
    description: string | null;
    scope: ProjectScope;
    start_date: string | null;
    end_date: string | null;
    status: ProjectStatus;
    sort_order: number;
    created_at: string;
    updated_at: string;
};

/** 项目 + 统计（用于列表展示） */
export type ProjectWithStats = Project & {
    todo_total: number;
    todo_completed: number;
};

/** 创建项目输入 */
export type CreateProjectInput = {
    area: GrowthArea;
    title: string;
    description?: string;
    scope: ProjectScope;
    start_date?: string;
    end_date?: string;
};

/** 更新项目输入 */
export type UpdateProjectInput = {
    title?: string;
    description?: string | null;
    scope?: ProjectScope;
    start_date?: string | null;
    end_date?: string | null;
    status?: ProjectStatus;
    sort_order?: number;
};

/** 项目待办 */
export type ProjectTodo = {
    id: string;
    project_id: string;
    title: string;
    is_completed: boolean;
    completed_at: string | null;
    sort_order: number;
    created_at: string;
};

/** 创建待办输入 */
export type CreateTodoInput = {
    project_id: string;
    title: string;
};

/** 项目灵感/成果 */
export type ProjectNote = {
    id: string;
    project_id: string;
    todo_id: string | null;
    type: ProjectNoteType;
    content: string;
    created_at: string;
};

/** 创建灵感/成果输入 */
export type CreateNoteInput = {
    project_id: string;
    todo_id?: string;
    type: ProjectNoteType;
    content: string;
};

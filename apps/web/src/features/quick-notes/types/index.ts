import { TONES, type ToneTokenClasses } from '@/design-system/tokens';

export type NoteType = 'memo' | 'idea' | 'todo';
export type FilterType = 'all' | NoteType;
/** normal = 普通, important = 重要, urgent = 紧急, critical = 重要且紧急 */
export type TodoPriority = 'normal' | 'important' | 'urgent' | 'critical';

export type QuickNote = {
    id: string;
    note_date: string;
    type: NoteType;
    content: string;
    answer: string | null;
    is_answered: boolean;
    is_completed: boolean;
    priority: TodoPriority | null;
    created_at: string;
};

export type CreateNoteInput = {
    note_date: string;
    type: NoteType;
    content: string;
    answer: string | null;
    is_answered: boolean;
    is_completed?: boolean;
    priority?: TodoPriority | null;
};

export type UpdateNoteInput = Partial<CreateNoteInput> & {
    updated_at?: string;
};

export type NoteTypeConfig = {
    label: string;
    emoji: string;
    placeholder: string;
} & ToneTokenClasses;

export const NOTE_TYPE_CONFIG: Record<NoteType, NoteTypeConfig> = {
    memo: {
        label: '备忘',
        emoji: '📌',
        ...TONES.blue,
        placeholder: '记录一些待办、提醒...',
    },
    idea: {
        label: '灵感',
        emoji: '💡',
        ...TONES.yellow,
        placeholder: '记录你的好想法、好点子...',
    },
    todo: {
        label: '待办',
        emoji: '✅',
        ...TONES.green,
        placeholder: '记录你的待办事项...',
    },
};

export const NOTE_TYPES: NoteType[] = ['memo', 'idea', 'todo'];

export type PriorityConfig = {
    label: string;
    emoji: string;
    color: string;
    bg: string;
};

export const PRIORITY_CONFIG: Record<TodoPriority, PriorityConfig> = {
    normal: { label: '普通', emoji: '', color: 'text-text-secondary', bg: 'bg-bg-tertiary' },
    important: { label: '重要', emoji: '⭐', color: 'text-tone-orange', bg: 'bg-tone-orange/14' },
    urgent: { label: '紧急', emoji: '⚡', color: 'text-danger', bg: 'bg-danger/14' },
    critical: { label: '重要且紧急', emoji: '🔥', color: 'text-danger', bg: 'bg-danger/14' },
};

export const TODO_PRIORITIES: TodoPriority[] = ['normal', 'important', 'urgent', 'critical'];

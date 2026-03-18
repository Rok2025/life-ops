import { TONES, type ToneTokenClasses } from '@/design-system/tokens';

export type NoteType = 'memo' | 'idea' | 'todo';
export type FilterType = 'all' | NoteType;

export type QuickNote = {
    id: string;
    note_date: string;
    type: NoteType;
    content: string;
    answer: string | null;
    is_answered: boolean;
    created_at: string;
};

export type CreateNoteInput = {
    note_date: string;
    type: NoteType;
    content: string;
    answer: string | null;
    is_answered: boolean;
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

import type { StickyNote, Lightbulb, HelpCircle } from 'lucide-react';

export type NoteType = 'memo' | 'idea' | 'question';
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
    color: string;
    bg: string;
    placeholder: string;
};

export const NOTE_TYPE_CONFIG: Record<NoteType, NoteTypeConfig> = {
    memo: {
        label: '备忘',
        emoji: '📌',
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
        placeholder: '记录一些待办、提醒...',
    },
    idea: {
        label: '灵感',
        emoji: '💡',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        placeholder: '记录你的好想法、好点子...',
    },
    question: {
        label: '问答',
        emoji: '❓',
        color: 'text-green-400',
        bg: 'bg-green-500/20',
        placeholder: '记录你的疑问...',
    },
};

export const NOTE_TYPES: NoteType[] = ['memo', 'idea', 'question'];

import { TONES, type ToneTokenClasses } from '@/design-system/tokens';

// ── 又又基本信息 ───────────────────────────────────────────

/** 又又的生日，用于自动计算年龄 */
export const YOUYOU_BIRTHDAY = '2025-04-17';

// ── 成长日记 ───────────────────────────────────────────────

export type DiaryMood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export type MoodConfig = {
    label: string;
    emoji: string;
} & Pick<ToneTokenClasses, 'color' | 'bg'>;

export const MOOD_CONFIG: Record<DiaryMood, MoodConfig> = {
    great: { label: '超棒', emoji: '🤩', ...TONES.accent },
    good: { label: '开心', emoji: '😊', ...TONES.success },
    okay: { label: '一般', emoji: '😐', ...TONES.muted },
    bad: { label: '不好', emoji: '😟', ...TONES.warning },
    terrible: { label: '很糟', emoji: '😢', ...TONES.danger },
};

export type DiaryEntry = {
    id: string;
    date: string;
    mood: DiaryMood | null;
    highlight: string | null;
    learned: string | null;
    funny_quote: string | null;
    diet_note: string | null;
    sleep_note: string | null;
    content: string | null;
    created_at: string;
    updated_at: string;
};

export type CreateDiaryInput = {
    date: string;
    mood?: DiaryMood | null;
    highlight?: string | null;
    learned?: string | null;
    funny_quote?: string | null;
    diet_note?: string | null;
    sleep_note?: string | null;
    content?: string | null;
};

export type UpdateDiaryInput = Partial<Omit<CreateDiaryInput, 'date'>>;

// ── 里程碑 ─────────────────────────────────────────────────

export type MilestoneCategory = 'language' | 'motor' | 'cognitive' | 'social' | 'self_care' | 'other';

export type MilestoneCategoryConfig = {
    label: string;
    emoji: string;
} & Pick<ToneTokenClasses, 'color' | 'bg'>;

export const MILESTONE_CATEGORY_CONFIG: Record<MilestoneCategory, MilestoneCategoryConfig> = {
    language: { label: '语言', emoji: '🗣️', ...TONES.blue },
    motor: { label: '运动', emoji: '🏃', ...TONES.green },
    cognitive: { label: '认知', emoji: '🧠', ...TONES.purple },
    social: { label: '社交', emoji: '🤝', ...TONES.orange },
    self_care: { label: '自理', emoji: '🧹', ...TONES.cyan },
    other: { label: '其他', emoji: '✨', ...TONES.muted },
};

export type Milestone = {
    id: string;
    category: MilestoneCategory;
    title: string;
    description: string | null;
    expected_age_months: number | null;
    achieved_at: string | null;
    sort_order: number;
    created_at: string;
};

export type CreateMilestoneInput = {
    category: MilestoneCategory;
    title: string;
    description?: string | null;
    expected_age_months?: number | null;
};

export type UpdateMilestoneInput = {
    title?: string;
    description?: string | null;
    category?: MilestoneCategory;
    expected_age_months?: number | null;
    achieved_at?: string | null;
};

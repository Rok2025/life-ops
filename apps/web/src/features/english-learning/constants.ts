import type {
    PromptMode,
    EnglishTab,
    Difficulty,
    Familiarity,
    DailyAssignmentStatus,
    DailyAssignmentType,
} from './types';

// ---------- Prompt Mode Config ----------

export const PROMPT_MODES: { key: PromptMode; label: string; description: string }[] = [
    { key: 'concise', label: '简洁', description: '音标 + 核心释义 + 1个例句' },
    { key: 'detailed', label: '详细', description: '全量解析 + 词根 + 多例句' },
    { key: 'grammar', label: '语法', description: '语法结构 + 时态 + 句型分析' },
];

// ---------- Tab Config ----------

export const ENGLISH_TABS: { key: EnglishTab; label: string; icon: string }[] = [
    { key: 'projects', label: '项目管理', icon: '📋' },
    { key: 'learning', label: '学习助手', icon: '📝' },
    { key: 'cards', label: '闪卡复习', icon: '🃏' },
    { key: 'stats', label: '学习统计', icon: '📊' },
];

// ---------- Difficulty Config ----------

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string }> = {
    easy: { label: '简单', color: 'text-success' },
    medium: { label: '中等', color: 'text-warning' },
    hard: { label: '困难', color: 'text-danger' },
};

// ---------- Familiarity Config ----------

export const FAMILIARITY_LABELS: Record<Familiarity, string> = {
    0: '全新',
    1: '模糊',
    2: '认识',
    3: '熟悉',
    4: '掌握',
    5: '精通',
};

// ---------- Spaced Repetition Intervals (days) ----------

export const REVIEW_INTERVALS: Record<Familiarity, number> = {
    0: 0,    // Immediate
    1: 1,    // 1 day
    2: 3,    // 3 days
    3: 7,    // 1 week
    4: 14,   // 2 weeks
    5: 30,   // 1 month
};

export const ASSIGNMENT_TYPE_CONFIG: Record<DailyAssignmentType, { label: string }> = {
    new: { label: '今日新词' },
    review: { label: '回捞复习' },
    manual: { label: '手动加入' },
};

export const ASSIGNMENT_STATUS_CONFIG: Record<
    DailyAssignmentStatus,
    { label: string; pillClass: string; softClass: string }
> = {
    pending: {
        label: '待学习',
        pillClass: 'bg-bg-tertiary text-text-secondary',
        softClass: 'hover:bg-card-bg',
    },
    in_progress: {
        label: '学习中',
        pillClass: 'bg-warning/10 text-warning',
        softClass: 'hover:bg-warning/6',
    },
    completed: {
        label: '已完成',
        pillClass: 'bg-success/10 text-success',
        softClass: 'hover:bg-success/6',
    },
    skipped: {
        label: '已跳过',
        pillClass: 'bg-text-tertiary/10 text-text-tertiary',
        softClass: 'hover:bg-panel-bg',
    },
};

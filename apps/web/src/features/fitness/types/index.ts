import { DEFAULT_TONE, TONES, type ToneTokenClasses } from '@/design-system/tokens';

export type CategoryConfig = {
    label: string;
} & ToneTokenClasses;

/** 肌群分类配置 */
export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
    chest: { label: '胸部', ...TONES.danger },
    back: { label: '背部', ...TONES.blue },
    legs: { label: '腿部', ...TONES.green },
    shoulders: { label: '肩部', ...TONES.yellow },
    arms: { label: '手臂', ...TONES.purple },
    core: { label: '核心', ...TONES.orange },
    cardio: { label: '有氧', ...TONES.cyan },
};

export function getCategoryConfig(category: string): CategoryConfig {
    return CATEGORY_CONFIG[category] ?? { label: category, ...DEFAULT_TONE };
}

/** 单个训练动作 */
export type Exercise = {
    name: string;
    category: string;
    weight: number;
    sets: number;
    reps: number;
};

/** 单次训练 session */
export type WorkoutSession = {
    id: string;
    date: string;
    notes: string | null;
    exercises: Exercise[];
};

/** 按日期分组的训练记录 */
export type WorkoutsByDate = {
    date: string;
    sessions: WorkoutSession[];
};

/** 按月份分组的训练记录 */
export type WorkoutsByMonth = {
    month: string;
    label: string;
    sessions: WorkoutSession[];
};

/** 历史页统计 */
export type HistoryStats = {
    totalWorkouts: number;
    totalSets: number;
    totalVolume: number;
};

/** 训练动作类型 */
export type ExerciseType = {
    id: string;
    name: string;
    category: string;
};

/** 编辑态动作聚合数据 */
export type AggregatedExercise = {
    exerciseTypeId: string;
    name: string;
    category: string;
    weight: number;
    sets: number;
    reps: number;
};

/** 常练动作统计周期 */
export type TopExercisesPeriod = 'week' | 'month' | 'year';

/** 常练动作统计项 */
export type TopExercise = {
    exerciseTypeId: string;
    name: string;
    category: string;
    sessionCount: number;
    totalSets: number;
    totalVolume: number;
};

/** 本周统计数据 */
export type WeeklyStats = {
    count: number;
    monthCount: number;
    monthGoal: number;
    totalSets: number;
    monthTotalSets: number;
    totalVolume: number;
    monthTotalVolume: number;
    categoryBreakdown: Record<string, number>;
    monthCategoryBreakdown: Record<string, number>;
    trainedToday: boolean;
};

/** 每周训练目标天数 */
export const WEEKLY_GOAL = 3;

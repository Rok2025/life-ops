/** 肌群分类配置 */
export const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    chest: { label: '胸部', color: 'text-red-400', bg: 'bg-red-500/20' },
    back: { label: '背部', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    legs: { label: '腿部', color: 'text-green-400', bg: 'bg-green-500/20' },
    shoulders: { label: '肩部', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    arms: { label: '手臂', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    core: { label: '核心', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    cardio: { label: '有氧', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
};

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

/** 本周统计数据 */
export type WeeklyStats = {
    count: number;
    totalSets: number;
    totalVolume: number;
    categoryBreakdown: Record<string, number>;
    streak: number;
    trainedToday: boolean;
    lastWorkoutId: string | null;
};

/** 每周训练目标天数 */
export const WEEKLY_GOAL = 3;

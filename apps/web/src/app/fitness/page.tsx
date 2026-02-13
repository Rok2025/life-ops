import { supabase } from '@/lib/supabase';
import { Dumbbell, Plus, Calendar, ChevronRight, Flame, Target, TrendingUp, Copy, Eye, Edit3 } from 'lucide-react';
import Link from 'next/link';

// 获取本地日期字符串 (YYYY-MM-DD)，避免 toISOString 的 UTC 时区问题
function getLocalDateStr(date: Date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 类别中英文映射和颜色
const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
    chest: { label: '胸部', color: 'text-red-400', bg: 'bg-red-500/20' },
    back: { label: '背部', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    legs: { label: '腿部', color: 'text-green-400', bg: 'bg-green-500/20' },
    shoulders: { label: '肩部', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    arms: { label: '手臂', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    core: { label: '核心', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    cardio: { label: '有氧', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
};

type WorkoutSession = {
    id: string;
    date: string;
    notes: string | null;
    exercises: {
        name: string;
        category: string;
        weight: number;
        sets: number;
        reps: number;
    }[];
};

type WorkoutsByDate = {
    date: string;
    sessions: WorkoutSession[];
};

type WeeklyStats = {
    count: number;
    totalSets: number;
    totalVolume: number;
    categoryBreakdown: Record<string, number>;
    streak: number;
    trainedToday: boolean;
    lastWorkoutId: string | null;
};

// 从数据库获取训练记录
async function getWorkouts(): Promise<WorkoutsByDate[]> {
    const { data: sessions, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('id, workout_date, notes')
        .order('workout_date', { ascending: false })
        .limit(10);

    if (sessionError || !sessions) {
        console.error('获取训练记录失败:', sessionError);
        return [];
    }

    const workouts: WorkoutSession[] = await Promise.all(
        sessions.map(async (session) => {
            const { data: sets } = await supabase
                .from('workout_sets')
                .select('weight, reps, exercise_types(id, name, category)')
                .eq('session_id', session.id)
                .order('set_order');

            const exerciseMap = new Map<string, {
                name: string;
                category: string;
                weight: number;
                sets: number;
                reps: number;
            }>();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sets?.forEach((set: any) => {
                if (!set.exercise_types) return;
                const key = set.exercise_types.id;

                if (!exerciseMap.has(key)) {
                    exerciseMap.set(key, {
                        name: set.exercise_types.name,
                        category: set.exercise_types.category,
                        weight: set.weight || 0,
                        sets: 0,
                        reps: set.reps || 0
                    });
                }

                const exercise = exerciseMap.get(key)!;
                exercise.sets += 1;
            });

            return {
                id: session.id,
                date: session.workout_date,
                notes: session.notes,
                exercises: Array.from(exerciseMap.values())
            };
        })
    );

    const groupedByDate = new Map<string, WorkoutSession[]>();
    workouts.forEach(workout => {
        if (!groupedByDate.has(workout.date)) {
            groupedByDate.set(workout.date, []);
        }
        groupedByDate.get(workout.date)!.push(workout);
    });

    return Array.from(groupedByDate.entries()).map(([date, sessions]) => ({
        date,
        sessions
    }));
}

// 获取本周详细统计
async function getWeeklyStats(): Promise<WeeklyStats> {
    const now = new Date();
    const today = getLocalDateStr(now);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // 获取本周训练
    const { data: weekSessions } = await supabase
        .from('workout_sessions')
        .select('id, workout_date')
        .gte('workout_date', getLocalDateStr(startOfWeek))
        .order('workout_date', { ascending: false });

    const uniqueDates = new Set(weekSessions?.map(s => s.workout_date) || []);
    const trainedToday = uniqueDates.has(today);
    const lastWorkoutId = weekSessions?.[0]?.id || null;

    // 获取本周所有训练组
    let totalSets = 0;
    let totalVolume = 0;
    const categoryBreakdown: Record<string, number> = {};

    if (weekSessions && weekSessions.length > 0) {
        const sessionIds = weekSessions.map(s => s.id);
        const { data: sets } = await supabase
            .from('workout_sets')
            .select('weight, reps, exercise_types(category)')
            .in('session_id', sessionIds);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sets?.forEach((set: any) => {
            totalSets++;
            totalVolume += (set.weight || 0) * (set.reps || 0);
            const cat = set.exercise_types?.category || 'other';
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
        });
    }

    // 计算连续训练天数
    let streak = 0;
    const { data: allSessions } = await supabase
        .from('workout_sessions')
        .select('workout_date')
        .order('workout_date', { ascending: false })
        .limit(30);

    if (allSessions) {
        const dates = [...new Set(allSessions.map(s => s.workout_date))].sort().reverse();
        const checkDate = new Date(today);
        
        for (const dateStr of dates) {
            const expectedDate = getLocalDateStr(checkDate);
            if (dateStr === expectedDate) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (dateStr === getLocalDateStr(new Date(checkDate.getTime() - 86400000))) {
                // 如果今天还没训练，从昨天开始算
                checkDate.setDate(checkDate.getDate() - 1);
                if (dateStr === getLocalDateStr(checkDate)) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }
            } else {
                break;
            }
        }
    }

    return {
        count: uniqueDates.size,
        totalSets,
        totalVolume,
        categoryBreakdown,
        streak,
        trainedToday,
        lastWorkoutId
    };
}

// 格式化日期显示
function formatDate(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = getLocalDateStr(today);
    const yesterdayStr = getLocalDateStr(yesterday);

    if (dateStr === todayStr) return '今天';
    if (dateStr === yesterdayStr) return '昨天';

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];

    return `${month}月${day}日 ${weekday}`;
}

// 格式化体积 (kg)
function formatVolume(volume: number): string {
    if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}t`;
    }
    return `${volume}kg`;
}

export default async function FitnessPage() {
    const weeklyGoal = 3;
    const [workoutsByDate, stats] = await Promise.all([
        getWorkouts(),
        getWeeklyStats()
    ]);
    const progress = Math.round((stats.count / weeklyGoal) * 100);

    // 获取肌群分布的最大值用于计算百分比
    const maxCategoryCount = Math.max(...Object.values(stats.categoryBreakdown), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                        <Dumbbell size={24} className="text-success" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">健身领域</h1>
                        <p className="text-sm text-text-secondary">每周目标：{weeklyGoal} 次训练</p>
                    </div>
                </div>
            </header>

            {/* 快速操作区域 */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 今日训练状态 */}
                {!stats.trainedToday ? (
                    <Link 
                        href="/fitness/workout/new" 
                        className="card p-6 border-2 border-dashed border-accent/50 hover:border-accent hover:bg-accent/5 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={28} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary">开始今日训练</h3>
                                <p className="text-sm text-text-secondary">今天还没有训练记录</p>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className="card p-6 bg-success/10 border border-success/30">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                                <Target size={28} className="text-success" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-success">今日已完成 ✓</h3>
                                <p className="text-sm text-text-secondary">继续保持，你很棒！</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 重复上次训练 */}
                {stats.lastWorkoutId && (
                    <Link 
                        href={`/fitness/workout/new?copy=${stats.lastWorkoutId}`}
                        className="card p-6 hover:bg-bg-secondary transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Copy size={24} className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary">重复上次训练</h3>
                                <p className="text-sm text-text-secondary">快速复制最近一次训练内容</p>
                            </div>
                        </div>
                    </Link>
                )}
            </section>

            {/* 本周统计卡片 */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 训练天数 */}
                <div className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Calendar size={18} className="text-accent" />
                        <span className="text-sm text-text-secondary">本周训练</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">{stats.count}</span>
                        <span className="text-text-secondary">/ {weeklyGoal} 天</span>
                    </div>
                    <div className="mt-2 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-success rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* 训练组数 */}
                <div className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp size={18} className="text-blue-400" />
                        <span className="text-sm text-text-secondary">总组数</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">{stats.totalSets}</span>
                        <span className="text-text-secondary">组</span>
                    </div>
                </div>

                {/* 训练体积 */}
                <div className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Dumbbell size={18} className="text-orange-400" />
                        <span className="text-sm text-text-secondary">总负荷</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">{formatVolume(stats.totalVolume)}</span>
                    </div>
                </div>

                {/* 连续天数 */}
                <div className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Flame size={18} className="text-red-400" />
                        <span className="text-sm text-text-secondary">连续训练</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">{stats.streak}</span>
                        <span className="text-text-secondary">天</span>
                    </div>
                </div>
            </section>

            {/* 肌群分布 */}
            {Object.keys(stats.categoryBreakdown).length > 0 && (
                <section className="card p-4">
                    <h3 className="text-sm font-medium text-text-secondary mb-4">本周肌群训练分布</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(stats.categoryBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([category, count]) => {
                                const config = categoryConfig[category] || { label: category, color: 'text-gray-400', bg: 'bg-gray-500/20' };
                                const percentage = Math.round((count / maxCategoryCount) * 100);
                                return (
                                    <div key={category} className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                                            <span className={`text-sm font-bold ${config.color}`}>{count}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-text-primary">{config.label}</div>
                                            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mt-1">
                                                <div 
                                                    className={`h-full rounded-full ${config.bg.replace('/20', '/60')}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </section>
            )}

            {/* 最近训练记录 */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                        最近训练记录
                    </h2>
                    <div className="flex items-center gap-4">
                        <Link href="/fitness/workout/new" className="text-sm text-accent hover:underline flex items-center gap-1">
                            <Plus size={14} />
                            添加记录
                        </Link>
                        <Link href="/fitness/history" className="text-sm text-text-secondary hover:text-accent flex items-center gap-1">
                            查看全部
                            <ChevronRight size={14} />
                        </Link>
                    </div>
                </div>

                {workoutsByDate.length === 0 ? (
                    <div className="card p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                            <Dumbbell size={32} className="text-text-secondary" />
                        </div>
                        <p className="text-text-secondary mb-4">暂无训练记录</p>
                        <Link href="/fitness/workout/new" className="btn-primary inline-flex items-center gap-2">
                            <Plus size={18} />
                            开始第一次训练
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workoutsByDate.slice(0, 5).map((dayGroup) => (
                            <div key={dayGroup.date} className="card overflow-hidden">
                                {/* 日期标题栏 */}
                                <div className="px-4 py-3 bg-bg-secondary flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-accent" />
                                        <span className="font-medium text-text-primary">
                                            {formatDate(dayGroup.date)}
                                        </span>
                                        <span className="text-xs text-text-secondary">{dayGroup.date}</span>
                                    </div>
                                    <span className="text-xs text-text-secondary">
                                        {dayGroup.sessions.reduce((acc, s) => acc + s.exercises.length, 0)} 个动作
                                    </span>
                                </div>

                                {/* 当天的训练记录 */}
                                <div className="divide-y divide-border/50">
                                    {dayGroup.sessions.map((session) => (
                                        <div key={session.id} className="p-4">
                                            {/* 动作列表 - 紧凑展示 */}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {session.exercises.map((exercise, idx) => {
                                                    const config = categoryConfig[exercise.category] || { label: exercise.category, color: 'text-gray-400', bg: 'bg-gray-500/20' };
                                                    return (
                                                        <div 
                                                            key={idx} 
                                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}
                                                        >
                                                            <span className={`text-sm font-medium ${config.color}`}>
                                                                {exercise.name}
                                                            </span>
                                                            <span className="text-xs text-text-secondary">
                                                                {exercise.weight}kg×{exercise.sets}×{exercise.reps}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* 备注 */}
                                            {session.notes && (
                                                <p className="text-sm text-text-secondary mb-3 italic pl-1">
                                                    &quot;{session.notes}&quot;
                                                </p>
                                            )}

                                            {/* 操作按钮 */}
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={`/fitness/workout/detail?id=${session.id}`}
                                                    className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors"
                                                >
                                                    <Eye size={14} />
                                                    查看
                                                </Link>
                                                <Link
                                                    href={`/fitness/workout/detail?id=${session.id}&edit=true`}
                                                    className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors"
                                                >
                                                    <Edit3 size={14} />
                                                    编辑
                                                </Link>
                                                <Link
                                                    href={`/fitness/workout/new?copy=${session.id}`}
                                                    className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-purple-400 transition-colors"
                                                >
                                                    <Copy size={14} />
                                                    复制
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

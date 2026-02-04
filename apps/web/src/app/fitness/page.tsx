import { supabase } from '@/lib/supabase';
import { Dumbbell, Plus, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// 类别中英文映射
const categoryLabels: Record<string, string> = {
    chest: '胸部',
    back: '背部',
    legs: '腿部',
    shoulders: '肩部',
    arms: '手臂',
    core: '核心',
    cardio: '有氧',
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

// 从数据库获取训练记录
async function getWorkouts(): Promise<WorkoutsByDate[]> {
    // 获取训练会话
    const { data: sessions, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('id, workout_date, notes')
        .order('workout_date', { ascending: false })
        .limit(20);

    if (sessionError || !sessions) {
        console.error('获取训练记录失败:', sessionError);
        return [];
    }

    // 获取每个会话的动作详情
    const workouts: WorkoutSession[] = await Promise.all(
        sessions.map(async (session) => {
            const { data: sets } = await supabase
                .from('workout_sets')
                .select('weight, reps, exercise_types(id, name, category)')
                .eq('session_id', session.id)
                .order('set_order');

            // 聚合动作数据（按动作类型聚合）
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

    // 按日期分组
    const groupedByDate = new Map<string, WorkoutSession[]>();
    workouts.forEach(workout => {
        if (!groupedByDate.has(workout.date)) {
            groupedByDate.set(workout.date, []);
        }
        groupedByDate.get(workout.date)!.push(workout);
    });

    // 转换为数组
    return Array.from(groupedByDate.entries()).map(([date, sessions]) => ({
        date,
        sessions
    }));
}

// 获取本周训练天数（按不同日期统计）
async function getWeeklyCount() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 本周日
    startOfWeek.setHours(0, 0, 0, 0);

    // 查询本周的训练日期，用于统计不同天数
    const { data, error } = await supabase
        .from('workout_sessions')
        .select('workout_date')
        .gte('workout_date', startOfWeek.toISOString().split('T')[0]);

    if (error) {
        console.error('获取本周训练次数失败:', error);
        return 0;
    }

    // 统计不重复的日期数量
    const uniqueDates = new Set(data?.map(s => s.workout_date) || []);
    return uniqueDates.size;
}

// 格式化日期显示
function formatDate(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return '今天';
    if (dateStr === yesterdayStr) return '昨天';

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];

    return `${month}月${day}日 ${weekday}`;
}

export default async function FitnessPage() {
    const weeklyGoal = 3;
    const [workoutsByDate, currentCount] = await Promise.all([
        getWorkouts(),
        getWeeklyCount()
    ]);
    const progress = Math.round((currentCount / weeklyGoal) * 100);

    return (
        <div>
            {/* Header */}
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                        <Dumbbell size={24} className="text-success" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">健身领域</h1>
                        <p className="text-text-secondary">每周目标：{weeklyGoal} 次训练</p>
                    </div>
                </div>
                <Link href="/fitness/workout/new" className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    添加记录
                </Link>
            </header>

            {/* Overview Card */}
            <section className="mb-8">
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">本周概览</h2>
                    <div className="flex items-center gap-8">
                        <div>
                            <div className="text-4xl font-bold text-text-primary">
                                {currentCount}<span className="text-text-secondary text-2xl">/{weeklyGoal}</span>
                            </div>
                            <div className="text-sm text-text-secondary">天训练</div>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-text-secondary">进度</span>
                                <span className="font-medium text-text-primary">{progress}%</span>
                            </div>
                            <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-success rounded-full transition-all"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Workouts */}
            <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                        最近训练记录
                    </h2>
                    <Link href="/fitness/history" className="text-sm text-accent hover:underline">
                        查看全部历史 →
                    </Link>
                </div>

                {workoutsByDate.length === 0 ? (
                    <div className="card p-8 text-center text-text-secondary">
                        暂无训练记录，点击「添加记录」开始你的第一次训练
                    </div>
                ) : (
                    <div className="space-y-6">
                        {workoutsByDate.map((dayGroup) => (
                            <div key={dayGroup.date}>
                                {/* 日期标题 */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                                        <Calendar size={16} className="text-accent" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-text-primary">
                                            {formatDate(dayGroup.date)}
                                        </div>
                                        <div className="text-xs text-text-secondary">{dayGroup.date}</div>
                                    </div>
                                </div>

                                {/* 当天的训练记录 */}
                                <div className="space-y-3 ml-11">
                                    {dayGroup.sessions.map((session) => (
                                        <div key={session.id} className="card p-4">
                                            {/* 动作列表 */}
                                            <div className="space-y-2 mb-3">
                                                {session.exercises.map((exercise, idx) => (
                                                    <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                                                                {categoryLabels[exercise.category] || exercise.category}
                                                            </span>
                                                            <span className="font-medium text-text-primary">
                                                                {exercise.name}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-text-secondary">
                                                            {exercise.weight}kg × {exercise.sets}组 × {exercise.reps}次
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* 备注 */}
                                            {session.notes && (
                                                <div className="text-sm text-text-secondary mb-3 italic">
                                                    &quot;{session.notes}&quot;
                                                </div>
                                            )}

                                            {/* 查看详情链接 */}
                                            <Link
                                                href={`/fitness/workout/${session.id}?edit=true`}
                                                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                                            >
                                                编辑此记录
                                                <ChevronRight size={14} />
                                            </Link>
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

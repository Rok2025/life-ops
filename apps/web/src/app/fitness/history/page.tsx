import { supabase } from '@/lib/supabase';
import { Dumbbell, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// 类别配置
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

type WorkoutsByMonth = {
    month: string;
    label: string;
    sessions: WorkoutSession[];
};

// 从数据库获取所有训练记录
async function getAllWorkouts(): Promise<WorkoutsByMonth[]> {
    const { data: sessions, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('id, workout_date, notes')
        .order('workout_date', { ascending: false });

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

    // 按月份分组
    const groupedByMonth = new Map<string, WorkoutSession[]>();
    workouts.forEach(workout => {
        const monthKey = workout.date.substring(0, 7); // YYYY-MM
        if (!groupedByMonth.has(monthKey)) {
            groupedByMonth.set(monthKey, []);
        }
        groupedByMonth.get(monthKey)!.push(workout);
    });

    // 转换为数组并添加月份标签
    return Array.from(groupedByMonth.entries()).map(([month, sessions]) => {
        const [year, m] = month.split('-');
        const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        return {
            month,
            label: `${year}年${monthNames[parseInt(m)]}`,
            sessions
        };
    });
}

// 获取统计数据
async function getStats() {
    const { count: totalCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true });

    const { data: allSets } = await supabase
        .from('workout_sets')
        .select('weight, reps');

    let totalVolume = 0;
    let totalSets = 0;
    allSets?.forEach(set => {
        totalSets++;
        totalVolume += (set.weight || 0) * (set.reps || 0);
    });

    return {
        totalWorkouts: totalCount || 0,
        totalSets,
        totalVolume
    };
}

// 格式化日期
function formatDate(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日 ${weekday}`;
}

// 格式化体积
function formatVolume(volume: number): string {
    if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(1)}M kg`;
    }
    if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}t`;
    }
    return `${volume}kg`;
}

export default async function HistoryPage() {
    const [workoutsByMonth, stats] = await Promise.all([
        getAllWorkouts(),
        getStats()
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <Link
                    href="/fitness"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4"
                >
                    <ArrowLeft size={18} />
                    返回健身领域
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                            <Calendar size={24} className="text-accent" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">训练历史</h1>
                            <p className="text-sm text-text-secondary">查看所有训练记录</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* 总计统计 */}
            <section className="grid grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-text-primary">{stats.totalWorkouts}</div>
                    <div className="text-sm text-text-secondary">总训练次数</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-text-primary">{stats.totalSets}</div>
                    <div className="text-sm text-text-secondary">总训练组数</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-text-primary">{formatVolume(stats.totalVolume)}</div>
                    <div className="text-sm text-text-secondary">总训练负荷</div>
                </div>
            </section>

            {/* 历史记录列表 */}
            {workoutsByMonth.length === 0 ? (
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                        <Dumbbell size={32} className="text-text-secondary" />
                    </div>
                    <p className="text-text-secondary mb-4">暂无训练记录</p>
                    <Link href="/fitness/workout/new" className="btn-primary inline-block">
                        开始第一次训练
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {workoutsByMonth.map((monthGroup) => (
                        <section key={monthGroup.month}>
                            {/* 月份标题 */}
                            <div className="flex items-center gap-3 mb-4">
                                <h2 className="text-lg font-semibold text-text-primary">{monthGroup.label}</h2>
                                <span className="text-sm text-text-secondary">
                                    {monthGroup.sessions.length} 次训练
                                </span>
                            </div>

                            {/* 该月的训练记录 */}
                            <div className="space-y-3">
                                {monthGroup.sessions.map((session) => (
                                    <div key={session.id} className="card overflow-hidden">
                                        {/* 日期栏 */}
                                        <div className="px-4 py-3 bg-bg-secondary flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={16} className="text-accent" />
                                                <span className="font-medium text-text-primary">
                                                    {formatDate(session.date)}
                                                </span>
                                                <span className="text-xs text-text-secondary">{session.date}</span>
                                            </div>
                                            <span className="text-xs text-text-secondary">
                                                {session.exercises.length} 个动作
                                            </span>
                                        </div>

                                        {/* 动作内容 */}
                                        <div className="p-4">
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

                                            {session.notes && (
                                                <p className="text-sm text-text-secondary mb-3 italic">
                                                    &quot;{session.notes}&quot;
                                                </p>
                                            )}

                                            {/* 操作 */}
                                            <div className="flex items-center gap-4">
                                                <Link
                                                    href={`/fitness/workout/detail?id=${session.id}`}
                                                    className="text-sm text-accent hover:underline flex items-center gap-1"
                                                >
                                                    查看详情
                                                    <ChevronRight size={14} />
                                                </Link>
                                                <Link
                                                    href={`/fitness/workout/detail?id=${session.id}&edit=true`}
                                                    className="text-sm text-text-secondary hover:text-accent"
                                                >
                                                    编辑
                                                </Link>
                                                <Link
                                                    href={`/fitness/workout/new?copy=${session.id}`}
                                                    className="text-sm text-text-secondary hover:text-purple-400"
                                                >
                                                    复制
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

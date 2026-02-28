'use client';

import { Dumbbell, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CATEGORY_CONFIG } from '@/features/fitness/types';
import { useFitnessHistoryData } from '@/features/fitness';

function formatDate(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日 ${weekday}`;
}

function formatVolume(volume: number): string {
    if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(1)}M kg`;
    }
    if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}t`;
    }
    return `${volume}kg`;
}

export default function HistoryView() {
    const { workoutsByMonth, stats, loading } = useFitnessHistoryData();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-text-secondary">加载中...</div>
            </div>
        );
    }

    return (
        <div className="space-y-section">
            <header>
                <Link
                    href="/fitness"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-3"
                >
                    <ArrowLeft size={16} />
                    返回健身领域
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <Calendar size={20} className="text-accent" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text-primary">训练历史</h1>
                            <p className="text-sm text-text-secondary">查看所有训练记录</p>
                        </div>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-3 gap-3">
                <div className="card p-3 text-center">
                    <div className="text-2xl font-bold text-text-primary">{stats.totalWorkouts}</div>
                    <div className="text-sm text-text-secondary">总训练次数</div>
                </div>
                <div className="card p-3 text-center">
                    <div className="text-2xl font-bold text-text-primary">{stats.totalSets}</div>
                    <div className="text-sm text-text-secondary">总训练组数</div>
                </div>
                <div className="card p-3 text-center">
                    <div className="text-2xl font-bold text-text-primary">{formatVolume(stats.totalVolume)}</div>
                    <div className="text-sm text-text-secondary">总训练负荷</div>
                </div>
            </section>

            {workoutsByMonth.length === 0 ? (
                <div className="card p-card-lg text-center">
                    <div className="w-14 h-14 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                        <Dumbbell size={32} className="text-text-secondary" />
                    </div>
                    <p className="text-text-secondary mb-3">暂无训练记录</p>
                    <Link href="/fitness/workout/new" className="btn-primary inline-block">
                        开始第一次训练
                    </Link>
                </div>
            ) : (
                <div className="space-y-section">
                    {workoutsByMonth.map((monthGroup) => (
                        <section key={monthGroup.month}>
                            <div className="flex items-center gap-3 mb-3">
                                <h2 className="text-base font-semibold text-text-primary">{monthGroup.label}</h2>
                                <span className="text-sm text-text-secondary">
                                    {monthGroup.sessions.length} 次训练
                                </span>
                            </div>

                            <div className="space-y-2">
                                {monthGroup.sessions.map((session) => (
                                    <div key={session.id} className="card overflow-hidden">
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

                                        <div className="p-3">
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {session.exercises.map((exercise, idx) => {
                                                    const config = CATEGORY_CONFIG[exercise.category] || { label: exercise.category, color: 'text-gray-400', bg: 'bg-gray-500/20' };
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
                                                <p className="text-sm text-text-secondary mb-2 italic">
                                                    &quot;{session.notes}&quot;
                                                </p>
                                            )}

                                            <div className="flex items-center gap-3">
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

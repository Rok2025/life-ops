'use client';

import { useState } from 'react';
import { Dumbbell, Calendar, ArrowLeft, Eye, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { getCategoryConfig } from '@/features/fitness/types';
import type { WorkoutSession } from '@/features/fitness/types';
import { useFitnessHistoryData } from '@/features/fitness';
import { WorkoutDetailDialog } from './WorkoutDetailDialog';
import { Card, PageHero, getButtonClassName } from '@/components/ui';

function groupSessionsByDate(sessions: WorkoutSession[]) {
    const map = new Map<string, WorkoutSession[]>();
    for (const session of sessions) {
        const existing = map.get(session.date);
        if (existing) {
            existing.push(session);
        } else {
            map.set(session.date, [session]);
        }
    }
    return Array.from(map.entries()).map(([date, dateSessions]) => ({ date, sessions: dateSessions }));
}

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
    const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
    const [detailEditMode, setDetailEditMode] = useState(false);

    const openDetail = (sessionId: string, edit = false) => {
        setDetailSessionId(sessionId);
        setDetailEditMode(edit);
    };

    const closeDetail = () => {
        setDetailSessionId(null);
        setDetailEditMode(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-body-sm text-text-secondary">加载中...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="健身 / 历史"
                icon={<Calendar size={18} className="text-accent" />}
                title="训练历史"
                description="按日期回看训练记录、动作组合和累计负荷，方便复盘近期训练节奏。"
                stats={[
                    { label: '总训练次数', value: stats.totalWorkouts, meta: '累计', tone: 'accent' },
                    { label: '总训练组数', value: stats.totalSets, meta: '所有动作', tone: 'success' },
                    { label: '总训练负荷', value: formatVolume(stats.totalVolume), meta: '累计重量', tone: 'warning' },
                ]}
            >
                <Link
                    href="/fitness"
                    className="glass-mini-chip text-body-sm transition-colors duration-normal ease-standard hover:bg-card-bg"
                >
                    <ArrowLeft size={14} />
                    返回健身领域
                </Link>
            </PageHero>

            {workoutsByMonth.length === 0 ? (
                <Card className="p-card-lg text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                        <Dumbbell size={32} className="text-text-secondary" />
                    </div>
                    <p className="text-body text-text-primary">暂无训练记录</p>
                    <p className="mt-1 text-body-sm text-text-secondary">先记录一次训练，历史页就会开始沉淀你的长期数据。</p>
                    <Link
                        href="/fitness/workout/new"
                        className={getButtonClassName({
                            variant: 'tinted',
                            size: 'sm',
                            className: 'mt-4',
                        })}
                    >
                        开始第一次训练
                    </Link>
                </Card>
            ) : (
                <div className="space-y-4">
                    {workoutsByMonth.map((monthGroup) => {
                        const dayGroups = groupSessionsByDate(monthGroup.sessions);
                        return (
                            <section key={monthGroup.month}>
                                <div className="mb-3 flex items-center gap-3">
                                    <h2 className="text-body font-semibold text-text-primary">{monthGroup.label}</h2>
                                    <span className="glass-mini-chip text-caption">{monthGroup.sessions.length} 次训练</span>
                                </div>

                                <div className="space-y-2">
                                    {dayGroups.map((dayGroup) => (
                                        <Card key={dayGroup.date} variant="subtle" className="overflow-hidden p-0">
                                            <div className="flex items-center justify-between bg-panel-bg/90 px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Calendar size={16} className="text-accent" />
                                                    <span className="font-medium text-text-primary text-body-sm">
                                                        {formatDate(dayGroup.date)}
                                                    </span>
                                                    <span className="text-caption text-text-secondary">{dayGroup.date}</span>
                                                </div>
                                                <span className="text-caption text-text-secondary">
                                                    {dayGroup.sessions.reduce((acc, s) => acc + s.exercises.length, 0)} 个动作
                                                </span>
                                            </div>

                                            <div className="divide-y divide-border/60">
                                                {dayGroup.sessions.map((session) => (
                                                    <div key={session.id} className="p-3">
                                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                                            {session.exercises.map((exercise, idx) => {
                                                                const config = getCategoryConfig(exercise.category);
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-control ${config.bg}`}
                                                                    >
                                                                        <span className={`text-body-sm font-medium ${config.color}`}>
                                                                            {exercise.name}
                                                                        </span>
                                                                        <span className="text-caption text-text-secondary">
                                                                            {exercise.weight}kg×{exercise.sets}×{exercise.reps}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {session.notes && (
                                                            <p className="text-body-sm text-text-secondary mb-2 italic">
                                                                &quot;{session.notes}&quot;
                                                            </p>
                                                        )}

                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => openDetail(session.id)}
                                                                className="text-body-sm text-accent hover:underline flex items-center gap-1"
                                                            >
                                                                <Eye size={14} />
                                                                查看
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDetail(session.id, true)}
                                                                className="text-body-sm text-text-secondary hover:text-accent flex items-center gap-1"
                                                            >
                                                                <Edit3 size={14} />
                                                                编辑
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
            <WorkoutDetailDialog
                sessionId={detailSessionId}
                editMode={detailEditMode}
                onClose={closeDetail}
            />
        </div>
    );
}

import { Dumbbell, Plus, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDisplayDate } from '@/lib/utils/date';
import type { WorkoutsByDate } from '../types';
import { WorkoutCard } from './WorkoutCard';

interface WorkoutListProps {
    workoutsByDate: WorkoutsByDate[];
}

export function WorkoutList({ workoutsByDate }: WorkoutListProps) {
    return (
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
                                        {formatDisplayDate(dayGroup.date)}
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
                                    <WorkoutCard key={session.id} session={session} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

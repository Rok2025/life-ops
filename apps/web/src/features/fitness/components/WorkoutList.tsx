import { Dumbbell, Plus, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDisplayDate } from '@/lib/utils/date';
import type { WorkoutsByDate } from '../types';
import { WorkoutCard } from './WorkoutCard';
import { Button, Card } from '@/components/ui';

interface WorkoutListProps {
    workoutsByDate: WorkoutsByDate[];
    onView?: (sessionId: string) => void;
    onEdit?: (sessionId: string) => void;
    onAddWorkout?: () => void;
}

export function WorkoutList({ workoutsByDate, onView, onEdit, onAddWorkout }: WorkoutListProps) {
    return (
        <section>
            <div className="flex items-center justify-between mb-widget-header">
                <h2 className="text-body-sm font-medium text-text-secondary uppercase tracking-wide">
                    最近训练记录
                </h2>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onAddWorkout}
                        className="text-body-sm text-accent hover:underline flex items-center gap-1"
                    >
                        <Plus size={14} />
                        添加记录
                    </button>
                    <Link href="/fitness/history" className="text-body-sm text-text-secondary hover:text-accent flex items-center gap-1">
                        查看全部
                        <ChevronRight size={14} />
                    </Link>
                </div>
            </div>

            {workoutsByDate.length === 0 ? (
                <Card className="p-card-lg text-center">
                    <div className="w-14 h-14 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                        <Dumbbell size={32} className="text-text-secondary" />
                    </div>
                    <p className="text-body-sm text-text-secondary mb-3">暂无训练记录</p>
                    <Button type="button" onClick={onAddWorkout} className="gap-2">
                        <Plus size={18} />
                        开始第一次训练
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {workoutsByDate.slice(0, 5).map((dayGroup) => (
                        <Card key={dayGroup.date} className="overflow-hidden p-0">
                            {/* 日期标题栏 */}
                            <div className="px-4 py-3 bg-bg-secondary flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} className="text-accent" />
                                    <span className="font-medium text-text-primary">
                                        {formatDisplayDate(dayGroup.date)}
                                    </span>
                                    <span className="text-caption text-text-secondary">{dayGroup.date}</span>
                                </div>
                                <span className="text-caption text-text-secondary">
                                    {dayGroup.sessions.reduce((acc, s) => acc + s.exercises.length, 0)} 个动作
                                </span>
                            </div>

                            {/* 当天的训练记录 */}
                            <div className="divide-y divide-border/50">
                                {dayGroup.sessions.map((session) => (
                                    <WorkoutCard
                                        key={session.id}
                                        session={session}
                                        onView={onView}
                                        onEdit={onEdit}
                                    />
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    );
}

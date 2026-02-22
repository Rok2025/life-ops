import { Calendar, Copy, Eye, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { formatDisplayDate } from '@/lib/utils/date';
import type { WorkoutSession } from '../types';
import { CATEGORY_CONFIG } from '../types';

interface WorkoutCardProps {
    session: WorkoutSession;
}

export function WorkoutCard({ session }: WorkoutCardProps) {
    return (
        <div className="p-4">
            {/* 动作列表 */}
            <div className="flex flex-wrap gap-2 mb-3">
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
    );
}

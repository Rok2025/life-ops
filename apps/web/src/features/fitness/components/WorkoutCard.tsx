'use client';

import { Eye, Edit3 } from 'lucide-react';
import type { WorkoutSession } from '../types';
import { CATEGORY_CONFIG } from '../types';

interface WorkoutCardProps {
    session: WorkoutSession;
    onView?: (sessionId: string) => void;
    onEdit?: (sessionId: string) => void;
}

export function WorkoutCard({ session, onView, onEdit }: WorkoutCardProps) {
    return (
        <div className="p-3">
            {/* 动作列表 */}
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

            {/* 备注 */}
            {session.notes && (
                <p className="text-sm text-text-secondary mb-2 italic pl-1">
                    &quot;{session.notes}&quot;
                </p>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onView?.(session.id)}
                    className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors"
                >
                    <Eye size={14} />
                    查看
                </button>
                <button
                    type="button"
                    onClick={() => onEdit?.(session.id)}
                    className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors"
                >
                    <Edit3 size={14} />
                    编辑
                </button>
            </div>
        </div>
    );
}

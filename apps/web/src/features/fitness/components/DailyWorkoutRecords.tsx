'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getCategoryConfig } from '@/features/fitness';
import type { WorkoutSession } from '@/features/fitness';

/** 当天已有训练记录 — 紧凑展示，放在日期下方 */
export function DailyWorkoutRecords({
    sessions,
    onDelete,
    deletingId,
}: {
    sessions: WorkoutSession[];
    onDelete: (id: string) => void;
    deletingId: string | null;
}) {
    const [confirmId, setConfirmId] = useState<string | null>(null);

    if (sessions.length === 0) return null;

    const handleDelete = (id: string) => {
        if (confirmId !== id) {
            setConfirmId(id);
            return;
        }
        onDelete(id);
        setConfirmId(null);
    };

    return (
        <div className="mt-3">
            <p className="text-caption text-text-secondary mb-1.5">当天已有记录（新增动作将追加到该记录中）</p>
            <div className="space-y-1">
                {sessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-1.5 group">
                        <div className="flex flex-wrap gap-1.5 items-center flex-1 min-w-0">
                            {session.exercises.map((exercise, idx) => {
                                const config = getCategoryConfig(exercise.category);
                                return (
                                    <span
                                        key={idx}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-control text-caption ${config.bg}`}
                                    >
                                        <span className={`font-medium ${config.color}`}>{exercise.name}</span>
                                        <span className="text-text-secondary">
                                            {exercise.weight}kg×{exercise.sets}×{exercise.reps}
                                        </span>
                                    </span>
                                );
                            })}
                            {session.notes && (
                                <span className="text-caption text-text-secondary italic">
                                    &quot;{session.notes}&quot;
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleDelete(session.id)}
                            onBlur={() => setConfirmId(null)}
                            disabled={deletingId === session.id}
                            className={`shrink-0 p-1 rounded-control transition-colors duration-normal ease-standard text-caption ${
                                confirmId === session.id
                                    ? 'text-danger font-medium'
                                    : 'text-text-secondary opacity-0 group-hover:opacity-100 hover:text-danger'
                            } disabled:opacity-50`}
                            title="删除"
                        >
                            {deletingId === session.id ? (
                                <span className="text-caption">...</span>
                            ) : confirmId === session.id ? (
                                <span className="text-caption">确认?</span>
                            ) : (
                                <Trash2 size={12} />
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

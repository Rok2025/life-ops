'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { fitnessApi, useExerciseTypes, CATEGORY_CONFIG } from '@/features/fitness';
import type { AggregatedExercise, WorkoutSession } from '@/features/fitness';
import { useExerciseCategories } from '@/features/fitness/hooks/useExerciseCategories';
import { getLocalDateStr } from '@/lib/utils/date';

type ExerciseSet = {
    id: number;
    exerciseTypeId: string;
    exercise: string;
    category: string;
    weight: number;
    sets: number;
    reps: number;
};

export interface NewWorkoutFormProps {
    /** 保存成功后的回调 */
    onSaved?: () => void;
}

/** 当天已有训练记录 — 紧凑展示，放在日期下方 */
function DailyWorkoutRecords({
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
            <p className="text-xs text-text-secondary mb-1.5">当天已有记录（新增动作将追加到该记录中）</p>
            <div className="space-y-1">
                {sessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-1.5 group">
                        <div className="flex flex-wrap gap-1.5 items-center flex-1 min-w-0">
                            {session.exercises.map((exercise, idx) => {
                                const config = CATEGORY_CONFIG[exercise.category] || {
                                    label: exercise.category,
                                    color: 'text-gray-400',
                                    bg: 'bg-gray-500/20',
                                };
                                return (
                                    <span
                                        key={idx}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${config.bg}`}
                                    >
                                        <span className={`font-medium ${config.color}`}>{exercise.name}</span>
                                        <span className="text-text-secondary">
                                            {exercise.weight}kg×{exercise.sets}×{exercise.reps}
                                        </span>
                                    </span>
                                );
                            })}
                            {session.notes && (
                                <span className="text-xs text-text-secondary italic">
                                    &quot;{session.notes}&quot;
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleDelete(session.id)}
                            onBlur={() => setConfirmId(null)}
                            disabled={deletingId === session.id}
                            className={`shrink-0 p-1 rounded transition-colors text-xs ${
                                confirmId === session.id
                                    ? 'text-danger font-medium'
                                    : 'text-text-secondary opacity-0 group-hover:opacity-100 hover:text-danger'
                            } disabled:opacity-50`}
                            title="删除"
                        >
                            {deletingId === session.id ? (
                                <span className="text-[10px]">...</span>
                            ) : confirmId === session.id ? (
                                <span className="text-[10px]">确认?</span>
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

export default function NewWorkoutForm({ onSaved }: NewWorkoutFormProps) {
    const queryClient = useQueryClient();

    const [date, setDate] = useState(getLocalDateStr());
    const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);
    const [notes, setNotes] = useState('');

    const { exerciseTypes, categories, loading } = useExerciseTypes();
    const { categories: categoryLabels } = useExerciseCategories();

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const dailyWorkoutsQuery = useQuery({
        queryKey: ['fitness-daily-workouts', date],
        queryFn: () => fitnessApi.getWorkoutsByDate(date),
    });

    const getExercisesByCategory = (category: string) => {
        return exerciseTypes.filter(e => e.category === category);
    };

    const addExercise = () => {
        const defaultCategory = categories[0] || 'chest';
        const exercisesInCategory = getExercisesByCategory(defaultCategory);
        const defaultExercise = exercisesInCategory[0];

        setExerciseSets([
            ...exerciseSets,
            {
                id: Date.now(),
                exerciseTypeId: defaultExercise?.id || '',
                exercise: defaultExercise?.name || '',
                category: defaultCategory,
                weight: 60,
                sets: 4,
                reps: 12,
            },
        ]);
    };

    const updateExercise = (id: number, field: keyof ExerciseSet, value: string | number) => {
        setExerciseSets(exerciseSets.map(ex => {
            if (ex.id !== id) return ex;

            if (field === 'category') {
                const newCategory = value as string;
                const exercisesInCategory = getExercisesByCategory(newCategory);
                const firstExercise = exercisesInCategory[0];
                return {
                    ...ex,
                    category: newCategory,
                    exerciseTypeId: firstExercise?.id || '',
                    exercise: firstExercise?.name || '',
                };
            }

            if (field === 'exercise') {
                const selectedExercise = exerciseTypes.find(e => e.name === value);
                return {
                    ...ex,
                    exercise: value as string,
                    exerciseTypeId: selectedExercise?.id || '',
                };
            }

            return { ...ex, [field]: value };
        }));
    };

    const removeExercise = (id: number) => {
        setExerciseSets(exerciseSets.filter(ex => ex.id !== id));
    };

    const saveMutation = useMutation({
        mutationFn: () => {
            const exercises: AggregatedExercise[] = exerciseSets.map(ex => ({
                exerciseTypeId: ex.exerciseTypeId,
                name: ex.exercise,
                category: ex.category,
                weight: ex.weight,
                sets: ex.sets,
                reps: ex.reps,
            }));

            return fitnessApi.createWorkoutSessionWithSets({
                date,
                notes: notes || null,
                exercises,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fitness-daily-workouts', date] });
            queryClient.invalidateQueries({ queryKey: ['fitness-workouts'] });
            queryClient.invalidateQueries({ queryKey: ['fitness-weekly-stats'] });
            setExerciseSets([]);
            setNotes('');
            onSaved?.();
        },
        onError: (error) => {
            console.error('保存训练记录失败:', error);
            alert(`保存失败: ${error instanceof Error ? error.message : '请重试'}`);
        },
    });

    const deleteSessionMutation = useMutation({
        mutationFn: (sessionId: string) => fitnessApi.deleteWorkoutSession(sessionId),
        onMutate: (sessionId) => setDeletingId(sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fitness-daily-workouts', date] });
            queryClient.invalidateQueries({ queryKey: ['fitness-workouts'] });
            queryClient.invalidateQueries({ queryKey: ['fitness-weekly-stats'] });
        },
        onSettled: () => setDeletingId(null),
        onError: (error) => {
            console.error('删除训练记录失败:', error);
            alert(`删除失败: ${error instanceof Error ? error.message : '请重试'}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-text-secondary text-sm">加载中...</div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* 日期 + 当天记录 */}
            <div>
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-text-secondary shrink-0">日期</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>
                {!dailyWorkoutsQuery.isLoading && (
                    <DailyWorkoutRecords
                        sessions={dailyWorkoutsQuery.data ?? []}
                        onDelete={(id) => deleteSessionMutation.mutate(id)}
                        deletingId={deletingId}
                    />
                )}
            </div>

            {/* 训练动作 */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-text-secondary">训练动作</h3>
                    <button
                        type="button"
                        onClick={addExercise}
                        className="btn-primary flex items-center gap-1 text-xs px-3 py-1.5"
                    >
                        <Plus size={14} />
                        添加
                    </button>
                </div>

                {exerciseSets.length === 0 ? (
                    <p className="text-text-secondary text-center text-sm py-4">
                        点击「添加」开始记录训练
                    </p>
                ) : (
                    <div className="space-y-2">
                        {/* 列标题 */}
                        <div className="grid grid-cols-[1fr_1fr_60px_50px_50px_32px] gap-2 px-3 text-[10px] text-text-secondary">
                            <span>类别</span>
                            <span>动作</span>
                            <span className="text-center">kg</span>
                            <span className="text-center">组</span>
                            <span className="text-center">次</span>
                            <span />
                        </div>
                        {exerciseSets.map((exercise) => (
                            <div
                                key={exercise.id}
                                className="grid grid-cols-[1fr_1fr_60px_50px_50px_32px] gap-2 items-center bg-bg-tertiary rounded-lg px-3 py-2"
                            >
                                <select
                                    value={exercise.category}
                                    onChange={(e) => updateExercise(exercise.id, 'category', e.target.value)}
                                    className="px-2 py-1.5 rounded bg-card-bg border border-border text-text-primary text-xs truncate"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {categoryLabels[cat] || cat}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={exercise.exercise}
                                    onChange={(e) => updateExercise(exercise.id, 'exercise', e.target.value)}
                                    className="px-2 py-1.5 rounded bg-card-bg border border-border text-text-primary text-xs truncate"
                                >
                                    {getExercisesByCategory(exercise.category).map(ex => (
                                        <option key={ex.id} value={ex.name}>{ex.name}</option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    value={exercise.weight}
                                    onChange={(e) => updateExercise(exercise.id, 'weight', Number(e.target.value))}
                                    className="px-1 py-1.5 rounded bg-card-bg border border-border text-text-primary text-xs text-center"
                                    placeholder="kg"
                                />

                                <input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={(e) => updateExercise(exercise.id, 'sets', Number(e.target.value))}
                                    className="px-1 py-1.5 rounded bg-card-bg border border-border text-text-primary text-xs text-center"
                                    placeholder="组"
                                />

                                <input
                                    type="number"
                                    value={exercise.reps}
                                    onChange={(e) => updateExercise(exercise.id, 'reps', Number(e.target.value))}
                                    className="px-1 py-1.5 rounded bg-card-bg border border-border text-text-primary text-xs text-center"
                                    placeholder="次"
                                />

                                <button
                                    type="button"
                                    onClick={() => removeExercise(exercise.id)}
                                    className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 备注 */}
            <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="备注（可选）：训练心得、感受或特殊情况..."
                className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />

            {/* 成功提示 + 保存按钮 */}
            {saveMutation.isSuccess && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
                    <CheckCircle2 size={14} />
                    <span className="text-xs">已保存！可继续添加。</span>
                </div>
            )}

            <button
                type="submit"
                disabled={exerciseSets.length === 0 || saveMutation.isPending}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saveMutation.isPending ? '保存中...' : '保存训练记录'}
            </button>
        </form>
    );
}

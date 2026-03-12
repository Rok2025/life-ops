'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';
import { fitnessApi, useExerciseTypes, useWorkoutDetail, CATEGORY_CONFIG } from '@/features/fitness';
import type { AggregatedExercise } from '@/features/fitness';
import { useExerciseCategories } from '@/features/fitness/hooks/useExerciseCategories';

export default function WorkoutDetailView() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id') || '';
    const autoEdit = searchParams.get('edit') === 'true';

    const { session, sets, loading } = useWorkoutDetail(id);
    const { exerciseTypes, categories } = useExerciseTypes();

    const [isEditing, setIsEditing] = useState(false);
    const [editInitialized, setEditInitialized] = useState(false);

    const [editDate, setEditDate] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editExercises, setEditExercises] = useState<AggregatedExercise[]>([]);

    const { categories: categoryLabels } = useExerciseCategories();

    const aggregatedExercises = useMemo(
        () => fitnessApi.aggregateExercises(sets),
        [sets],
    );

    const startEditing = () => {
        if (!session) return;
        setEditDate(session.workout_date || '');
        setEditNotes(session.notes || '');
        setEditExercises(aggregatedExercises.map(ex => ({ ...ex })));
        setIsEditing(true);
    };

    useEffect(() => {
        if (autoEdit && !loading && session && !editInitialized) {
            const timer = window.setTimeout(() => {
                setEditDate(session.workout_date || '');
                setEditNotes(session.notes || '');
                setEditExercises(aggregatedExercises.map(ex => ({ ...ex })));
                setIsEditing(true);
                setEditInitialized(true);
            }, 0);

            return () => window.clearTimeout(timer);
        }
    }, [autoEdit, loading, session, editInitialized, aggregatedExercises]);

    const cancelEditing = () => {
        setIsEditing(false);
    };

    const getExercisesByCategory = (category: string) => {
        return exerciseTypes.filter(e => e.category === category);
    };

    const updateEditExercise = (index: number, field: keyof AggregatedExercise, value: string | number) => {
        setEditExercises(editExercises.map((ex, i) => {
            if (i !== index) return ex;

            if (field === 'category') {
                const newCategory = value as string;
                const exercisesInCategory = getExercisesByCategory(newCategory);
                const firstExercise = exercisesInCategory[0];
                return {
                    ...ex,
                    category: newCategory,
                    exerciseTypeId: firstExercise?.id || '',
                    name: firstExercise?.name || '',
                };
            }

            if (field === 'name') {
                const selectedExercise = exerciseTypes.find(e => e.name === value);
                return {
                    ...ex,
                    name: value as string,
                    exerciseTypeId: selectedExercise?.id || '',
                };
            }

            return { ...ex, [field]: value };
        }));
    };

    const addEditExercise = () => {
        const defaultCategory = categories[0] || 'chest';
        const exercisesInCategory = getExercisesByCategory(defaultCategory);
        const defaultExercise = exercisesInCategory[0];

        setEditExercises([
            ...editExercises,
            {
                exerciseTypeId: defaultExercise?.id || '',
                name: defaultExercise?.name || '',
                category: defaultCategory,
                weight: 60,
                sets: 4,
                reps: 12,
            },
        ]);
    };

    const removeEditExercise = (index: number) => {
        setEditExercises(editExercises.filter((_, i) => i !== index));
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!session) return;
            await fitnessApi.updateWorkoutSessionWithSets(session.id, {
                date: editDate,
                notes: editNotes || null,
                exercises: editExercises,
            });
        },
        onSuccess: async () => {
            setIsEditing(false);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['fitness-workout-session', id] }),
                queryClient.invalidateQueries({ queryKey: ['fitness-workout-sets', id] }),
                queryClient.invalidateQueries({ queryKey: ['fitness-history-workouts'] }),
                queryClient.invalidateQueries({ queryKey: ['fitness-history-stats'] }),
                queryClient.invalidateQueries({ queryKey: ['weekly-workout-days'] }),
            ]);
        },
        onError: (error) => {
            alert(`保存失败: ${error instanceof Error ? error.message : '请重试'}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!session) return;
            await fitnessApi.deleteWorkoutSession(session.id);
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['fitness-history-workouts'] }),
                queryClient.invalidateQueries({ queryKey: ['fitness-history-stats'] }),
                queryClient.invalidateQueries({ queryKey: ['weekly-workout-days'] }),
            ]);
            router.push('/fitness');
        },
        onError: (error) => {
            alert(`删除失败: ${error instanceof Error ? error.message : '请重试'}`);
        },
    });

    const handleSave = () => {
        if (!session) return;
        saveMutation.mutate();
    };

    const handleDelete = () => {
        if (!session || !confirm('确定要删除这条训练记录吗？')) return;
        deleteMutation.mutate();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-text-secondary">加载中...</div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-text-primary mb-4">训练记录不存在</h1>
                <Link href="/fitness" className="text-accent hover:underline">
                    返回健身领域
                </Link>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-header-bottom">
                <Link
                    href="/fitness"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-3"
                >
                    <ArrowLeft size={16} />
                    返回健身领域
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-text-primary">
                        {isEditing ? '编辑训练记录' : '训练详情'}
                    </h1>
                    {!isEditing && (
                        <button
                            onClick={startEditing}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Edit2 size={18} />
                            编辑
                        </button>
                    )}
                </div>
            </header>

            {isEditing ? (
                <div className="flex flex-col gap-4">
                    {/* 日期 */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-text-secondary shrink-0">日期</label>
                        <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>

                    {/* 训练动作 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-text-secondary">训练动作</h3>
                            <button
                                type="button"
                                onClick={addEditExercise}
                                className="btn-primary flex items-center gap-1 text-xs px-3 py-1.5"
                            >
                                <Plus size={14} />
                                添加
                            </button>
                        </div>

                        {editExercises.length === 0 ? (
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
                                {editExercises.map((exercise, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-[1fr_1fr_60px_50px_50px_32px] gap-2 items-center bg-bg-tertiary rounded-lg px-3 py-2"
                                    >
                                        <select
                                            value={exercise.category}
                                            onChange={(e) => updateEditExercise(index, 'category', e.target.value)}
                                            className="px-2 py-1.5 rounded bg-card-bg border border-border text-text-primary text-xs truncate"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {categoryLabels[cat] || cat}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={exercise.name}
                                            onChange={(e) => updateEditExercise(index, 'name', e.target.value)}
                                            className="px-2 py-1.5 rounded bg-card-bg border border-border text-text-primary text-xs truncate"
                                        >
                                            {getExercisesByCategory(exercise.category).map(ex => (
                                                <option key={ex.id} value={ex.name}>{ex.name}</option>
                                            ))}
                                        </select>

                                        <input
                                            type="number"
                                            value={exercise.weight}
                                            onChange={(e) => updateEditExercise(index, 'weight', Number(e.target.value))}
                                            className="px-1 py-1.5 rounded bg-card-bg border border-border text-text-primary text-xs text-center"
                                        />

                                        <input
                                            type="number"
                                            value={exercise.sets}
                                            onChange={(e) => updateEditExercise(index, 'sets', Number(e.target.value))}
                                            className="px-1 py-1.5 rounded bg-card-bg border border-border text-text-primary text-xs text-center"
                                        />

                                        <input
                                            type="number"
                                            value={exercise.reps}
                                            onChange={(e) => updateEditExercise(index, 'reps', Number(e.target.value))}
                                            className="px-1 py-1.5 rounded bg-card-bg border border-border text-text-primary text-xs text-center"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeEditExercise(index)}
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
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="备注（可选）：训练心得、感受或特殊情况..."
                        className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                        <button
                            onClick={cancelEditing}
                            className="flex-1 py-2.5 rounded-lg border border-border text-text-secondary text-sm hover:bg-bg-tertiary flex items-center justify-center gap-2"
                        >
                            <X size={16} />
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saveMutation.isPending || editExercises.length === 0}
                            className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saveMutation.isPending ? '保存中...' : '保存修改'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* 日期 */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-text-secondary shrink-0">日期</span>
                        <span className="text-sm text-text-primary">{session.workout_date}</span>
                        <span className="text-xs text-text-secondary ml-auto">
                            共 {aggregatedExercises.length} 个动作，{sets.length} 组
                        </span>
                    </div>

                    {/* 训练动作 */}
                    <div>
                        <h3 className="text-sm font-medium text-text-secondary mb-2">训练动作</h3>
                        <div className="space-y-2">
                            {/* 列标题 */}
                            <div className="grid grid-cols-[1fr_1fr_60px_50px_50px] gap-2 px-3 text-[10px] text-text-secondary">
                                <span>类别</span>
                                <span>动作</span>
                                <span className="text-center">kg</span>
                                <span className="text-center">组</span>
                                <span className="text-center">次</span>
                            </div>
                            {aggregatedExercises.map((exercise, index) => {
                                const config = CATEGORY_CONFIG[exercise.category] || {
                                    label: exercise.category,
                                    color: 'text-gray-400',
                                    bg: 'bg-gray-500/20',
                                };
                                return (
                                    <div
                                        key={index}
                                        className="grid grid-cols-[1fr_1fr_60px_50px_50px] gap-2 items-center bg-bg-tertiary rounded-lg px-3 py-2"
                                    >
                                        <span className={`text-xs font-medium ${config.color}`}>
                                            {categoryLabels[exercise.category] || exercise.category}
                                        </span>
                                        <span className="text-xs text-text-primary truncate">{exercise.name}</span>
                                        <span className="text-xs text-text-primary text-center">{exercise.weight}</span>
                                        <span className="text-xs text-text-primary text-center">{exercise.sets}</span>
                                        <span className="text-xs text-text-primary text-center">{exercise.reps}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 备注 */}
                    {session.notes && (
                        <div className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm">
                            {session.notes}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

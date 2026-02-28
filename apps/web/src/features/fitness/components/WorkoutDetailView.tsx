'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';
import { fitnessApi, useExerciseTypes, useWorkoutDetail } from '@/features/fitness';
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
                        <div className="flex items-center gap-2">
                            <button
                                onClick={startEditing}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Edit2 size={18} />
                                编辑
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-lg border border-danger text-danger hover:bg-danger/10"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {isEditing ? (
                <div>
                    <div className="card p-card mb-section">
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            训练日期
                        </label>
                        <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>

                    <div className="card p-card mb-section">
                        <div className="flex items-center justify-between mb-widget-header">
                            <h2 className="text-base font-semibold text-text-primary">训练动作</h2>
                            <button
                                type="button"
                                onClick={addEditExercise}
                                className="btn-primary flex items-center gap-2 text-sm py-2"
                            >
                                <Plus size={16} />
                                添加动作
                            </button>
                        </div>

                        <div className="space-y-3">
                            {editExercises.map((exercise, index) => (
                                <div key={index} className="p-3 bg-bg-tertiary rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-text-secondary">
                                            动作 #{index + 1}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeEditExercise(index)}
                                            className="text-danger hover:bg-danger/10 p-2 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">类别</label>
                                            <select
                                                value={exercise.category}
                                                onChange={(e) => updateEditExercise(index, 'category', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-card-bg border border-border text-text-primary text-sm"
                                            >
                                                {categories.map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {categoryLabels[cat] || cat}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">动作</label>
                                            <select
                                                value={exercise.name}
                                                onChange={(e) => updateEditExercise(index, 'name', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-card-bg border border-border text-text-primary text-sm"
                                            >
                                                {getExercisesByCategory(exercise.category).map(ex => (
                                                    <option key={ex.id} value={ex.name}>{ex.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">重量 (kg)</label>
                                            <input
                                                type="number"
                                                value={exercise.weight}
                                                onChange={(e) => updateEditExercise(index, 'weight', Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg bg-card-bg border border-border text-text-primary text-sm text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">组数</label>
                                            <input
                                                type="number"
                                                value={exercise.sets}
                                                onChange={(e) => updateEditExercise(index, 'sets', Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg bg-card-bg border border-border text-text-primary text-sm text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">次数</label>
                                            <input
                                                type="number"
                                                value={exercise.reps}
                                                onChange={(e) => updateEditExercise(index, 'reps', Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg bg-card-bg border border-border text-text-primary text-sm text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-card mb-section">
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            备注（可选）
                        </label>
                        <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="添加训练心得..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={cancelEditing}
                            className="flex-1 py-4 rounded-lg border border-border text-text-secondary hover:bg-bg-tertiary flex items-center justify-center gap-2"
                        >
                            <X size={18} />
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saveMutation.isPending || editExercises.length === 0}
                            className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saveMutation.isPending ? '保存中...' : '保存修改'}
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="card p-card mb-section">
                        <div className="text-xl font-bold text-text-primary mb-1">
                            {session.workout_date}
                        </div>
                        <div className="text-text-secondary">
                            共 {aggregatedExercises.length} 个动作，{sets.length} 组训练
                        </div>
                    </div>

                    <div className="card p-card mb-section">
                        <h2 className="text-base font-semibold text-text-primary mb-widget-header">训练动作</h2>
                        <div className="space-y-2">
                            {aggregatedExercises.map((exercise, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                                    <div>
                                        <div className="font-medium text-text-primary">{exercise.name}</div>
                                        <div className="text-sm text-text-secondary">
                                            {categoryLabels[exercise.category] || exercise.category}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-text-primary">
                                            {exercise.weight}kg × {exercise.sets}组 × {exercise.reps}次
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {session.notes && (
                        <div className="card p-card">
                            <h2 className="text-base font-semibold text-text-primary mb-1">备注</h2>
                            <p className="text-text-secondary">{session.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

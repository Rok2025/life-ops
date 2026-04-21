'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Dumbbell, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';
import { fitnessApi, useExerciseTypes, useWorkoutDetail, getCategoryConfig } from '@/features/fitness';
import type { AggregatedExercise } from '@/features/fitness';
import { useExerciseCategories } from '@/features/fitness/hooks/useExerciseCategories';
import { Button, Card, DatePicker, Input, PageHero, Select } from '@/components/ui';

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
                <div className="text-body-sm text-text-secondary">加载中...</div>
            </div>
        );
    }

    if (!session) {
        return (
            <Card className="p-card-lg text-center">
                <h1 className="mb-2 text-h2 text-text-primary">训练记录不存在</h1>
                <p className="text-body-sm text-text-secondary">这条记录可能已删除，或者当前链接已经失效。</p>
                <Link href="/fitness" className="mt-4 inline-flex text-body-sm text-accent hover:underline">
                    返回健身领域
                </Link>
            </Card>
        );
    }

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="健身 / 训练详情"
                icon={<Dumbbell size={18} className="text-success" />}
                title={isEditing ? '编辑训练记录' : '训练详情'}
                description={`训练日期：${session.workout_date}`}
                action={!isEditing ? (
                    <div className="flex items-center gap-2">
                        <Button onClick={startEditing} variant="tinted" size="sm" className="gap-2">
                            <Edit2 size={16} />
                            编辑
                        </Button>
                        <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending} className="gap-2">
                            <Trash2 size={16} />
                            删除
                        </Button>
                    </div>
                ) : null}
                stats={[
                    { label: '动作数', value: aggregatedExercises.length, meta: '已聚合', tone: 'accent' },
                    { label: '训练组数', value: sets.length, meta: '当前记录', tone: 'success' },
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

            {isEditing ? (
                <Card className="flex flex-col gap-4 p-card">
                    {/* 日期 */}
                    <div className="flex items-center gap-3">
                        <label className="text-body-sm font-medium text-text-secondary shrink-0">日期</label>
                        <DatePicker value={editDate} onChange={setEditDate} className="flex-1" />
                    </div>

                    {/* 训练动作 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-body-sm font-medium text-text-secondary">训练动作</h3>
                            <Button type="button" onClick={addEditExercise} variant="tinted" size="sm" className="gap-1">
                                <Plus size={14} />
                                添加
                            </Button>
                        </div>

                        {editExercises.length === 0 ? (
                            <p className="text-text-secondary text-center text-body-sm py-4">
                                点击「添加」开始记录训练
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {/* 列标题 */}
                                <div className="grid grid-cols-[1fr_1fr_60px_50px_50px_32px] gap-2 px-3 text-caption text-text-secondary">
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
                                        className="grid grid-cols-[1fr_1fr_60px_50px_50px_32px] items-center gap-2 rounded-control border border-glass-border bg-panel-bg px-3 py-2"
                                    >
                                        <Select
                                            value={exercise.category}
                                            onChange={(e) => updateEditExercise(index, 'category', e.target.value)}
                                            size="sm"
                                            className="bg-card-bg"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {categoryLabels[cat] || cat}
                                                </option>
                                            ))}
                                        </Select>

                                        <Select
                                            value={exercise.name}
                                            onChange={(e) => updateEditExercise(index, 'name', e.target.value)}
                                            size="sm"
                                            className="bg-card-bg"
                                        >
                                            {getExercisesByCategory(exercise.category).map(ex => (
                                                <option key={ex.id} value={ex.name}>{ex.name}</option>
                                            ))}
                                        </Select>

                                        <Input
                                            type="number"
                                            value={exercise.weight}
                                            onChange={(e) => updateEditExercise(index, 'weight', Number(e.target.value))}
                                            size="sm"
                                            className="bg-card-bg px-1 text-center"
                                        />

                                        <Input
                                            type="number"
                                            value={exercise.sets}
                                            onChange={(e) => updateEditExercise(index, 'sets', Number(e.target.value))}
                                            size="sm"
                                            className="bg-card-bg px-1 text-center"
                                        />

                                        <Input
                                            type="number"
                                            value={exercise.reps}
                                            onChange={(e) => updateEditExercise(index, 'reps', Number(e.target.value))}
                                            size="sm"
                                            className="bg-card-bg px-1 text-center"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeEditExercise(index)}
                                            className="p-1 text-danger hover:bg-danger/10 rounded-control transition-colors duration-normal ease-standard"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 备注 */}
                    <Input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="备注（可选）：训练心得、感受或特殊情况..."
                    />

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                        <Button onClick={cancelEditing} variant="ghost" className="flex-1 gap-2">
                            <X size={16} />
                            取消
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saveMutation.isPending || editExercises.length === 0}
                            className="flex-1 gap-2"
                        >
                            <Save size={16} />
                            {saveMutation.isPending ? '保存中...' : '保存修改'}
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card className="flex flex-col gap-4 p-card">
                    {/* 日期 */}
                    <div className="flex items-center gap-3">
                        <span className="text-body-sm font-medium text-text-secondary shrink-0">日期</span>
                        <span className="text-body-sm text-text-primary">{session.workout_date}</span>
                        <span className="text-caption text-text-secondary ml-auto">
                            共 {aggregatedExercises.length} 个动作，{sets.length} 组
                        </span>
                    </div>

                    {/* 训练动作 */}
                    <div>
                        <h3 className="text-body-sm font-medium text-text-secondary mb-2">训练动作</h3>
                        <div className="space-y-2">
                            {/* 列标题 */}
                            <div className="grid grid-cols-[1fr_1fr_60px_50px_50px] gap-2 px-3 text-caption text-text-secondary">
                                <span>类别</span>
                                <span>动作</span>
                                <span className="text-center">kg</span>
                                <span className="text-center">组</span>
                                <span className="text-center">次</span>
                            </div>
                            {aggregatedExercises.map((exercise, index) => {
                                const config = getCategoryConfig(exercise.category);
                                return (
                                    <div
                                        key={index}
                                        className="grid grid-cols-[1fr_1fr_60px_50px_50px] items-center gap-2 rounded-control border border-glass-border bg-panel-bg px-3 py-2"
                                    >
                                        <span className={`text-caption font-medium ${config.color}`}>
                                            {categoryLabels[exercise.category] || exercise.category}
                                        </span>
                                        <span className="text-caption text-text-primary truncate">{exercise.name}</span>
                                        <span className="text-caption text-text-primary text-center">{exercise.weight}</span>
                                        <span className="text-caption text-text-primary text-center">{exercise.sets}</span>
                                        <span className="text-caption text-text-primary text-center">{exercise.reps}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 备注 */}
                    {session.notes && (
                        <div className="rounded-control border border-glass-border bg-panel-bg px-3 py-2 text-body-sm text-text-primary">
                            {session.notes}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}

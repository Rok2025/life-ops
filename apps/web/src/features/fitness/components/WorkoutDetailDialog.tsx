'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Edit2, Plus, Trash2, Save } from 'lucide-react';
import { fitnessApi, useExerciseTypes, useWorkoutDetail, getCategoryConfig } from '@/features/fitness';
import type { AggregatedExercise } from '@/features/fitness';
import { useExerciseCategories } from '@/features/fitness/hooks/useExerciseCategories';
import { Button, Dialog, Input, Select } from '@/components/ui';

interface WorkoutDetailDialogProps {
    sessionId: string | null;
    editMode?: boolean;
    onClose: () => void;
}

/** Wrapper: renders nothing when closed, remounts inner via key to reset state */
export function WorkoutDetailDialog({ sessionId, editMode = false, onClose }: WorkoutDetailDialogProps) {
    if (!sessionId) return null;
    return <WorkoutDetailDialogInner key={sessionId} sessionId={sessionId} editMode={editMode} onClose={onClose} />;
}

function WorkoutDetailDialogInner({ sessionId, editMode, onClose }: { sessionId: string; editMode: boolean; onClose: () => void }) {
    const queryClient = useQueryClient();
    const { session, sets, loading } = useWorkoutDetail(sessionId);
    const { exerciseTypes, categories } = useExerciseTypes();
    const { categories: categoryLabels } = useExerciseCategories();

    const [isEditing, setIsEditing] = useState(false);
    const [editInitialized, setEditInitialized] = useState(false);
    const [editDate, setEditDate] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editExercises, setEditExercises] = useState<AggregatedExercise[]>([]);

    const aggregatedExercises = useMemo(
        () => fitnessApi.aggregateExercises(sets),
        [sets],
    );

    // Auto-enter edit mode once data is ready
    useEffect(() => {
        if (editMode && session && !loading && aggregatedExercises.length > 0 && !editInitialized) {
            const t = window.setTimeout(() => {
                setEditDate(session.workout_date || '');
                setEditNotes(session.notes || '');
                setEditExercises(aggregatedExercises.map(ex => ({ ...ex })));
                setIsEditing(true);
                setEditInitialized(true);
            }, 0);
            return () => window.clearTimeout(t);
        }
    }, [editMode, session, loading, aggregatedExercises, editInitialized]);

    const startEditing = () => {
        if (!session) return;
        setEditDate(session.workout_date || '');
        setEditNotes(session.notes || '');
        setEditExercises(aggregatedExercises.map(ex => ({ ...ex })));
        setIsEditing(true);
    };

    const cancelEditing = () => {
        if (editMode) { onClose(); } else { setIsEditing(false); }
    };

    const getExercisesByCategory = (category: string) =>
        exerciseTypes.filter(e => e.category === category);

    const updateEditExercise = (index: number, field: keyof AggregatedExercise, value: string | number) => {
        setEditExercises(prev => prev.map((ex, i) => {
            if (i !== index) return ex;
            if (field === 'category') {
                const inCat = getExercisesByCategory(value as string);
                const first = inCat[0];
                return { ...ex, category: value as string, exerciseTypeId: first?.id || '', name: first?.name || '' };
            }
            if (field === 'name') {
                const selected = exerciseTypes.find(e => e.name === value);
                return { ...ex, name: value as string, exerciseTypeId: selected?.id || '' };
            }
            return { ...ex, [field]: value };
        }));
    };

    const addEditExercise = () => {
        const cat = categories[0] || 'chest';
        const inCat = getExercisesByCategory(cat);
        const def = inCat[0];
        setEditExercises(prev => [...prev, { exerciseTypeId: def?.id || '', name: def?.name || '', category: cat, weight: 60, sets: 4, reps: 12 }]);
    };

    const removeEditExercise = (index: number) => {
        setEditExercises(prev => prev.filter((_, i) => i !== index));
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
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['fitness-workout-session', sessionId] }),
                queryClient.invalidateQueries({ queryKey: ['fitness-workout-sets', sessionId] }),
                queryClient.invalidateQueries({ queryKey: ['fitness-workouts'] }),
                queryClient.invalidateQueries({ queryKey: ['fitness-weekly-stats'] }),
                queryClient.invalidateQueries({ queryKey: ['fitness-history-workouts'] }),
                queryClient.invalidateQueries({ queryKey: ['fitness-history-stats'] }),
            ]);
            onClose();
        },
        onError: (error) => {
            alert(`保存失败: ${error instanceof Error ? error.message : '请重试'}`);
        },
    });

    const title = isEditing ? '编辑训练记录' : '训练详情';

    return (
        <Dialog
            open
            onClose={onClose}
            title={title}
            maxWidth="2xl"
            className="max-h-[85vh]"
            bodyClassName="min-h-0 flex-1 overflow-y-auto px-5 py-3"
            headerActions={!isEditing && !loading && session ? (
                <button
                    type="button"
                    onClick={startEditing}
                    className="rounded-control p-1.5 text-text-secondary transition-colors duration-normal ease-standard hover:bg-bg-tertiary hover:text-accent"
                    title="编辑"
                >
                    <Edit2 size={16} />
                </button>
            ) : undefined}
        >
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-text-secondary text-body-sm">加载中...</div>
                        </div>
                    ) : !session ? (
                        <div className="text-center py-8 text-text-secondary text-body-sm">训练记录不存在</div>
                    ) : isEditing ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <label className="text-body-sm font-medium text-text-secondary shrink-0">日期</label>
                                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="flex-1" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-body-sm font-medium text-text-secondary">训练动作</h3>
                                    <Button type="button" onClick={addEditExercise} size="sm" className="gap-1">
                                        <Plus size={14} />
                                        添加
                                    </Button>
                                </div>
                                {editExercises.length === 0 ? (
                                    <p className="text-text-secondary text-center text-body-sm py-4">点击「添加」开始记录训练</p>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-[1fr_1fr_60px_50px_50px_32px] gap-2 px-3 text-caption text-text-secondary">
                                            <span>类别</span><span>动作</span>
                                            <span className="text-center">kg</span><span className="text-center">组</span><span className="text-center">次</span><span />
                                        </div>
                                        {editExercises.map((exercise, index) => (
                                            <div key={index} className="grid grid-cols-[1fr_1fr_60px_50px_50px_32px] gap-2 items-center bg-bg-tertiary rounded-control px-3 py-2">
                                                <Select value={exercise.category} onChange={(e) => updateEditExercise(index, 'category', e.target.value)} size="sm" className="bg-card-bg">
                                                    {categories.map(cat => <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>)}
                                                </Select>
                                                <Select value={exercise.name} onChange={(e) => updateEditExercise(index, 'name', e.target.value)} size="sm" className="bg-card-bg">
                                                    {getExercisesByCategory(exercise.category).map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                                                </Select>
                                                <Input type="number" value={exercise.weight} onChange={(e) => updateEditExercise(index, 'weight', Number(e.target.value))} size="sm" className="bg-card-bg px-1 text-center" />
                                                <Input type="number" value={exercise.sets} onChange={(e) => updateEditExercise(index, 'sets', Number(e.target.value))} size="sm" className="bg-card-bg px-1 text-center" />
                                                <Input type="number" value={exercise.reps} onChange={(e) => updateEditExercise(index, 'reps', Number(e.target.value))} size="sm" className="bg-card-bg px-1 text-center" />
                                                <button type="button" onClick={() => removeEditExercise(index)} className="p-1 text-danger hover:bg-danger/10 rounded-control transition-colors duration-normal ease-standard">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Input
                                type="text"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="备注（可选）：训练心得、感受或特殊情况..."
                            />

                            <div className="flex gap-3">
                                <Button onClick={cancelEditing} variant="ghost" className="flex-1 gap-2">
                                    <X size={16} />
                                    取消
                                </Button>
                                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || editExercises.length === 0} className="flex-1 gap-2">
                                    <Save size={16} />
                                    {saveMutation.isPending ? '保存中...' : '保存修改'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-body-sm font-medium text-text-secondary shrink-0">日期</span>
                                <span className="text-body-sm text-text-primary">{session.workout_date}</span>
                                <span className="text-caption text-text-secondary ml-auto">共 {aggregatedExercises.length} 个动作，{sets.length} 组</span>
                            </div>

                            <div>
                                <h3 className="text-body-sm font-medium text-text-secondary mb-2">训练动作</h3>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-[1fr_1fr_60px_50px_50px] gap-2 px-3 text-caption text-text-secondary">
                                        <span>类别</span><span>动作</span>
                                        <span className="text-center">kg</span><span className="text-center">组</span><span className="text-center">次</span>
                                    </div>
                                    {aggregatedExercises.map((exercise, index) => {
                                        const config = getCategoryConfig(exercise.category);
                                        return (
                                            <div key={index} className="grid grid-cols-[1fr_1fr_60px_50px_50px] gap-2 items-center bg-bg-tertiary rounded-control px-3 py-2">
                                                <span className={`text-caption font-medium ${config.color}`}>{categoryLabels[exercise.category] || exercise.category}</span>
                                                <span className="text-caption text-text-primary truncate">{exercise.name}</span>
                                                <span className="text-caption text-text-primary text-center">{exercise.weight}</span>
                                                <span className="text-caption text-text-primary text-center">{exercise.sets}</span>
                                                <span className="text-caption text-text-primary text-center">{exercise.reps}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {session.notes && (
                                <div className="px-3 py-2 rounded-control bg-bg-tertiary border border-border text-text-primary text-body-sm">
                                    {session.notes}
                                </div>
                            )}
                        </div>
                    )}
        </Dialog>
    );
}

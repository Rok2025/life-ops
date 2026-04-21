'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { TONES } from '@/design-system/tokens';
import { fitnessApi, useExerciseTypes } from '@/features/fitness';
import type { AggregatedExercise } from '@/features/fitness';
import { useExerciseCategories } from '@/features/fitness/hooks/useExerciseCategories';
import { getLocalDateStr } from '@/lib/utils/date';
import { Button, DatePicker, Input, Select } from '@/components/ui';
import { DailyWorkoutRecords } from './DailyWorkoutRecords';

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
                <div className="text-text-secondary text-body-sm">加载中...</div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* 日期 + 当天记录 */}
            <div>
                <div className="flex items-center gap-3">
                    <label className="text-body-sm font-medium text-text-secondary shrink-0">日期</label>
                    <DatePicker value={date} onChange={setDate} className="flex-1" />
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
                    <h3 className="text-body-sm font-medium text-text-secondary">训练动作</h3>
                    <Button type="button" onClick={addExercise} variant="tinted" size="sm" className="gap-1">
                        <Plus size={14} />
                        添加
                    </Button>
                </div>

                {exerciseSets.length === 0 ? (
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
                        {exerciseSets.map((exercise) => (
                            <div
                                key={exercise.id}
                                className="grid grid-cols-[1fr_1fr_60px_50px_50px_32px] items-center gap-2 rounded-control border border-glass-border bg-panel-bg px-3 py-2"
                            >
                                <Select
                                    value={exercise.category}
                                    onChange={(e) => updateExercise(exercise.id, 'category', e.target.value)}
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
                                    value={exercise.exercise}
                                    onChange={(e) => updateExercise(exercise.id, 'exercise', e.target.value)}
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
                                    onChange={(e) => updateExercise(exercise.id, 'weight', Number(e.target.value))}
                                    size="sm"
                                    className="bg-card-bg px-1 text-center"
                                    placeholder="kg"
                                />

                                <Input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={(e) => updateExercise(exercise.id, 'sets', Number(e.target.value))}
                                    size="sm"
                                    className="bg-card-bg px-1 text-center"
                                    placeholder="组"
                                />

                                <Input
                                    type="number"
                                    value={exercise.reps}
                                    onChange={(e) => updateExercise(exercise.id, 'reps', Number(e.target.value))}
                                    size="sm"
                                    className="bg-card-bg px-1 text-center"
                                    placeholder="次"
                                />

                                <button
                                    type="button"
                                    onClick={() => removeExercise(exercise.id)}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="备注（可选）：训练心得、感受或特殊情况..."
            />

            {/* 成功提示 + 保存按钮 */}
            {saveMutation.isSuccess && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-control border ${TONES.success.bg} ${TONES.success.border} ${TONES.success.color}`}>
                    <CheckCircle2 size={14} />
                    <span className="text-caption">已保存！可继续添加。</span>
                </div>
            )}

            <Button
                type="submit"
                disabled={exerciseSets.length === 0 || saveMutation.isPending}
                className="w-full"
            >
                {saveMutation.isPending ? '保存中...' : '保存训练记录'}
            </Button>
        </form>
    );
}

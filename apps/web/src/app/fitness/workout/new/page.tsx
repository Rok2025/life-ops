'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Copy } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// 类别中英文映射
const categoryLabels: Record<string, string> = {
    chest: '胸部',
    back: '背部',
    legs: '腿部',
    shoulders: '肩部',
    arms: '手臂',
    core: '核心',
    cardio: '有氧',
};

type ExerciseType = {
    id: string;
    name: string;
    category: string;
};

type ExerciseSet = {
    id: number;
    exerciseTypeId: string;
    exercise: string;
    category: string;
    weight: number;
    sets: number;
    reps: number;
};

export default function NewWorkoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const copyFromId = searchParams.get('copy');
    
    const today = (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();
    const [date, setDate] = useState(today);
    const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // 从数据库加载的动作类型
    const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // 加载动作类型
    useEffect(() => {
        async function loadExerciseTypes() {
            const { data, error } = await supabase
                .from('exercise_types')
                .select('id, name, category')
                .order('category')
                .order('name');

            if (error) {
                console.error('加载动作类型失败:', error);
                return;
            }

            setExerciseTypes(data || []);

            // 提取不重复的类别
            const uniqueCategories = [...new Set(data?.map(e => e.category) || [])];
            setCategories(uniqueCategories);
            setLoading(false);
        }

        loadExerciseTypes();
    }, []);

    // 复制训练数据
    useEffect(() => {
        if (!copyFromId || exerciseTypes.length === 0 || isCopied) return;

        async function loadWorkoutToCopy() {
            // 获取要复制的训练会话
            const { data: session } = await supabase
                .from('workout_sessions')
                .select('notes')
                .eq('id', copyFromId)
                .single();

            if (session?.notes) {
                setNotes(session.notes);
            }

            // 获取训练组数据
            const { data: sets } = await supabase
                .from('workout_sets')
                .select('weight, reps, exercise_types(id, name, category)')
                .eq('session_id', copyFromId)
                .order('set_order');

            if (sets && sets.length > 0) {
                // 聚合相同动作的组
                const exerciseMap = new Map<string, ExerciseSet>();

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sets.forEach((set: any) => {
                    if (!set.exercise_types) return;
                    const key = set.exercise_types.id;

                    if (!exerciseMap.has(key)) {
                        exerciseMap.set(key, {
                            id: Date.now() + Math.random() * 1000,
                            exerciseTypeId: set.exercise_types.id,
                            exercise: set.exercise_types.name,
                            category: set.exercise_types.category,
                            weight: set.weight || 0,
                            sets: 0,
                            reps: set.reps || 0
                        });
                    }

                    const exercise = exerciseMap.get(key)!;
                    exercise.sets += 1;
                });

                setExerciseSets(Array.from(exerciseMap.values()));
            }

            setIsCopied(true);
        }

        loadWorkoutToCopy();
    }, [copyFromId, exerciseTypes, isCopied]);

    // 根据类别获取动作列表
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
            }
        ]);
    };

    const updateExercise = (id: number, field: keyof ExerciseSet, value: string | number) => {
        setExerciseSets(exerciseSets.map(ex => {
            if (ex.id !== id) return ex;

            // 如果更改了类别，同时更新动作为该类别的第一个动作
            if (field === 'category') {
                const newCategory = value as string;
                const exercisesInCategory = getExercisesByCategory(newCategory);
                const firstExercise = exercisesInCategory[0];
                return {
                    ...ex,
                    category: newCategory,
                    exerciseTypeId: firstExercise?.id || '',
                    exercise: firstExercise?.name || ''
                };
            }

            // 如果更改了动作，同时更新 exerciseTypeId
            if (field === 'exercise') {
                const selectedExercise = exerciseTypes.find(e => e.name === value);
                return {
                    ...ex,
                    exercise: value as string,
                    exerciseTypeId: selectedExercise?.id || ''
                };
            }

            return { ...ex, [field]: value };
        }));
    };

    const removeExercise = (id: number) => {
        setExerciseSets(exerciseSets.filter(ex => ex.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 1. 创建训练会话记录
            const { data: session, error: sessionError } = await supabase
                .from('workout_sessions')
                .insert({
                    workout_date: date,
                    notes: notes || null
                })
                .select('id')
                .single();

            if (sessionError) {
                console.error('创建训练会话失败:', sessionError);
                alert('保存失败: ' + sessionError.message);
                setSaving(false);
                return;
            }

            // 2. 批量插入训练组数据
            const workoutSetsData = exerciseSets.flatMap((exercise, exerciseIndex) => {
                // 根据组数生成多条记录
                return Array.from({ length: exercise.sets }, (_, setIndex) => ({
                    session_id: session.id,
                    exercise_type_id: exercise.exerciseTypeId,
                    set_order: exerciseIndex * 100 + setIndex + 1,
                    weight: exercise.weight,
                    reps: exercise.reps
                }));
            });

            const { error: setsError } = await supabase
                .from('workout_sets')
                .insert(workoutSetsData);

            if (setsError) {
                console.error('保存训练组失败:', setsError);
                alert('保存失败: ' + setsError.message);
                setSaving(false);
                return;
            }

            console.log('训练记录保存成功:', { sessionId: session.id, sets: workoutSetsData.length });
            router.push('/fitness');
        } catch (error) {
            console.error('保存训练记录失败:', error);
            alert('保存失败，请重试');
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-text-secondary">加载中...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <header className="mb-8">
                <Link
                    href="/fitness"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4"
                >
                    <ArrowLeft size={18} />
                    返回健身领域
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">
                            {copyFromId ? '复制训练记录' : '添加训练记录'}
                        </h1>
                        {copyFromId && (
                            <p className="text-sm text-purple-400 flex items-center gap-1 mt-1">
                                <Copy size={14} />
                                已复制上次训练内容，可直接修改
                            </p>
                        )}
                    </div>
                    <Link
                        href="/fitness/exercises"
                        className="text-sm text-accent hover:underline"
                    >
                        管理动作类型 →
                    </Link>
                </div>
            </header>

            <form onSubmit={handleSubmit}>
                {/* Date */}
                <div className="card p-6 mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        训练日期
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>

                {/* Exercise Sets */}
                <div className="card p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-text-primary">训练动作</h2>
                        <button
                            type="button"
                            onClick={addExercise}
                            className="btn-primary flex items-center gap-2 text-sm py-2"
                        >
                            <Plus size={16} />
                            添加动作
                        </button>
                    </div>

                    {exerciseSets.length === 0 ? (
                        <p className="text-text-secondary text-center py-8">
                            点击「添加动作」开始记录你的训练
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {exerciseSets.map((exercise, index) => (
                                <div key={exercise.id} className="p-4 bg-bg-tertiary rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium text-text-secondary">
                                            动作 #{index + 1}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeExercise(exercise.id)}
                                            className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {/* Category */}
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">类别</label>
                                            <select
                                                value={exercise.category}
                                                onChange={(e) => updateExercise(exercise.id, 'category', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-card-bg border border-border text-text-primary text-sm"
                                            >
                                                {categories.map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {categoryLabels[cat] || cat}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Exercise */}
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">动作</label>
                                            <select
                                                value={exercise.exercise}
                                                onChange={(e) => updateExercise(exercise.id, 'exercise', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-card-bg border border-border text-text-primary text-sm"
                                            >
                                                {getExercisesByCategory(exercise.category).map(ex => (
                                                    <option key={ex.id} value={ex.name}>{ex.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Weight */}
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">重量 (kg)</label>
                                            <input
                                                type="number"
                                                value={exercise.weight}
                                                onChange={(e) => updateExercise(exercise.id, 'weight', Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg bg-card-bg border border-border text-text-primary text-sm text-center"
                                            />
                                        </div>

                                        {/* Sets */}
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">组数</label>
                                            <input
                                                type="number"
                                                value={exercise.sets}
                                                onChange={(e) => updateExercise(exercise.id, 'sets', Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg bg-card-bg border border-border text-text-primary text-sm text-center"
                                            />
                                        </div>

                                        {/* Reps */}
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">次数</label>
                                            <input
                                                type="number"
                                                value={exercise.reps}
                                                onChange={(e) => updateExercise(exercise.id, 'reps', Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg bg-card-bg border border-border text-text-primary text-sm text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="card p-6 mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        备注（可选）
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="添加训练心得、感受或特殊情况..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={exerciseSets.length === 0 || saving}
                    className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? '保存中...' : '保存训练记录'}
                </button>
            </form>
        </div>
    );
}

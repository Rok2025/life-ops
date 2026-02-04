'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
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

type WorkoutSet = {
    id: string;
    set_order: number;
    weight: number | null;
    reps: number | null;
    exercise_types: {
        id: string;
        name: string;
        category: string;
    } | null;
};

type WorkoutSession = {
    id: string;
    workout_date: string;
    notes: string | null;
};

type ExerciseType = {
    id: string;
    name: string;
    category: string;
};

// 聚合后的动作数据
type AggregatedExercise = {
    exerciseTypeId: string;
    name: string;
    category: string;
    weight: number;
    sets: number;
    reps: number;
};

export default function WorkoutDetailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id') || '';
    const autoEdit = searchParams.get('edit') === 'true';

    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [sets, setSets] = useState<WorkoutSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editInitialized, setEditInitialized] = useState(false);

    // 编辑状态
    const [editDate, setEditDate] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editExercises, setEditExercises] = useState<AggregatedExercise[]>([]);

    // 动作类型数据
    const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    // 加载数据
    useEffect(() => {
        async function loadData() {
            // 加载动作类型
            const { data: typesData } = await supabase
                .from('exercise_types')
                .select('id, name, category')
                .order('category')
                .order('name');

            setExerciseTypes(typesData || []);
            setCategories([...new Set(typesData?.map(e => e.category) || [])]);

            // 加载训练会话
            const { data: sessionData, error: sessionError } = await supabase
                .from('workout_sessions')
                .select('*')
                .eq('id', id)
                .single();

            if (sessionError || !sessionData) {
                console.error('加载训练会话失败:', sessionError);
                setLoading(false);
                return;
            }

            setSession(sessionData);

            // 加载训练组
            const { data: setsData, error: setsError } = await supabase
                .from('workout_sets')
                .select('id, set_order, weight, reps, exercise_types(id, name, category)')
                .eq('session_id', id)
                .order('set_order');

            if (setsError) {
                console.error('加载训练组失败:', setsError);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setSets((setsData || []) as any);
            }

            setLoading(false);
        }

        loadData();
    }, [id]);

    // 聚合训练组为动作（按动作类型聚合）
    const aggregateExercises = (setsData: WorkoutSet[]): AggregatedExercise[] => {
        const exerciseMap = new Map<string, AggregatedExercise>();

        setsData.forEach(set => {
            if (!set.exercise_types) return;
            const key = set.exercise_types.id;

            if (!exerciseMap.has(key)) {
                exerciseMap.set(key, {
                    exerciseTypeId: set.exercise_types.id,
                    name: set.exercise_types.name,
                    category: set.exercise_types.category,
                    weight: set.weight || 0,
                    sets: 0,
                    reps: set.reps || 0
                });
            }

            const exercise = exerciseMap.get(key)!;
            exercise.sets += 1;
        });

        return Array.from(exerciseMap.values());
    };

    const aggregatedExercises = aggregateExercises(sets);

    // 进入编辑模式
    const startEditing = () => {
        setEditDate(session?.workout_date || '');
        setEditNotes(session?.notes || '');
        setEditExercises(aggregatedExercises.map(ex => ({ ...ex })));
        setIsEditing(true);
    };

    // 自动进入编辑模式（从列表页点击"编辑此记录"进入时）
    useEffect(() => {
        if (autoEdit && !loading && session && !editInitialized && aggregatedExercises.length >= 0) {
            setEditDate(session.workout_date || '');
            setEditNotes(session.notes || '');
            setEditExercises(aggregatedExercises.map(ex => ({ ...ex })));
            setIsEditing(true);
            setEditInitialized(true);
        }
    }, [autoEdit, loading, session, editInitialized, aggregatedExercises]);

    // 取消编辑
    const cancelEditing = () => {
        setIsEditing(false);
    };

    // 根据类别获取动作列表
    const getExercisesByCategory = (category: string) => {
        return exerciseTypes.filter(e => e.category === category);
    };

    // 更新编辑中的动作
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
                    name: firstExercise?.name || ''
                };
            }

            if (field === 'name') {
                const selectedExercise = exerciseTypes.find(e => e.name === value);
                return {
                    ...ex,
                    name: value as string,
                    exerciseTypeId: selectedExercise?.id || ''
                };
            }

            return { ...ex, [field]: value };
        }));
    };

    // 添加动作
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
                reps: 12
            }
        ]);
    };

    // 删除动作
    const removeEditExercise = (index: number) => {
        setEditExercises(editExercises.filter((_, i) => i !== index));
    };

    // 保存编辑
    const handleSave = async () => {
        if (!session) return;
        setSaving(true);

        try {
            // 更新会话
            const { error: sessionError } = await supabase
                .from('workout_sessions')
                .update({
                    workout_date: editDate,
                    notes: editNotes || null
                })
                .eq('id', session.id);

            if (sessionError) {
                alert('保存失败: ' + sessionError.message);
                setSaving(false);
                return;
            }

            // 删除旧的训练组
            await supabase
                .from('workout_sets')
                .delete()
                .eq('session_id', session.id);

            // 插入新的训练组
            const newSetsData = editExercises.flatMap((exercise, exerciseIndex) => {
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
                .insert(newSetsData);

            if (setsError) {
                alert('保存失败: ' + setsError.message);
                setSaving(false);
                return;
            }

            // 刷新页面数据
            router.refresh();
            window.location.reload();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，请重试');
            setSaving(false);
        }
    };

    // 删除训练记录
    const handleDelete = async () => {
        if (!session || !confirm('确定要删除这条训练记录吗？')) return;

        await supabase.from('workout_sets').delete().eq('session_id', session.id);
        await supabase.from('workout_sessions').delete().eq('id', session.id);

        router.push('/fitness');
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
                    <h1 className="text-3xl font-bold text-text-primary">
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
                // 编辑模式
                <div>
                    {/* Date */}
                    <div className="card p-6 mb-6">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            训练日期
                        </label>
                        <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>

                    {/* Exercises */}
                    <div className="card p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-text-primary">训练动作</h2>
                            <button
                                type="button"
                                onClick={addEditExercise}
                                className="btn-primary flex items-center gap-2 text-sm py-2"
                            >
                                <Plus size={16} />
                                添加动作
                            </button>
                        </div>

                        <div className="space-y-4">
                            {editExercises.map((exercise, index) => (
                                <div key={index} className="p-4 bg-bg-tertiary rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
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

                                    <div className="grid grid-cols-2 gap-4 mb-4">
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

                                    <div className="grid grid-cols-3 gap-4">
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

                    {/* Notes */}
                    <div className="card p-6 mb-6">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            备注（可选）
                        </label>
                        <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="添加训练心得..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                    </div>

                    {/* Actions */}
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
                            disabled={saving || editExercises.length === 0}
                            className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? '保存中...' : '保存修改'}
                        </button>
                    </div>
                </div>
            ) : (
                // 查看模式
                <div>
                    {/* Date & Info */}
                    <div className="card p-6 mb-6">
                        <div className="text-2xl font-bold text-text-primary mb-2">
                            {session.workout_date}
                        </div>
                        <div className="text-text-secondary">
                            共 {aggregatedExercises.length} 个动作，{sets.length} 组训练
                        </div>
                    </div>

                    {/* Exercises */}
                    <div className="card p-6 mb-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-4">训练动作</h2>
                        <div className="space-y-3">
                            {aggregatedExercises.map((exercise, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
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

                    {/* Notes */}
                    {session.notes && (
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-text-primary mb-2">备注</h2>
                            <p className="text-text-secondary">{session.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

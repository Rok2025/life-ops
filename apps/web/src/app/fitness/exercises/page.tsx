'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
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

const allCategories = Object.keys(categoryLabels);

type ExerciseType = {
    id: string;
    name: string;
    category: string;
    tracking_mode: string;
    default_unit: string | null;
};

export default function ExercisesPage() {
    const [exercises, setExercises] = useState<ExerciseType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // 新增动作表单
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('chest');
    const [saving, setSaving] = useState(false);

    // 编辑状态
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // 加载动作类型
    const loadExercises = async () => {
        const { data, error } = await supabase
            .from('exercise_types')
            .select('*')
            .order('category')
            .order('name');

        if (error) {
            console.error('加载动作类型失败:', error);
            return;
        }

        setExercises(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadExercises();
    }, []);

    // 添加动作
    const handleAdd = async () => {
        if (!newName.trim()) return;
        setSaving(true);

        const { error } = await supabase
            .from('exercise_types')
            .insert({
                name: newName.trim(),
                category: newCategory,
                tracking_mode: 'weight_reps',
                default_unit: 'kg'
            });

        if (error) {
            console.error('添加动作失败:', error);
            alert('添加失败: ' + error.message);
        } else {
            setNewName('');
            setShowAddForm(false);
            await loadExercises();
        }
        setSaving(false);
    };

    // 更新动作名称
    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;

        const { error } = await supabase
            .from('exercise_types')
            .update({ name: editName.trim() })
            .eq('id', id);

        if (error) {
            console.error('更新动作失败:', error);
            alert('更新失败: ' + error.message);
        } else {
            setEditingId(null);
            await loadExercises();
        }
    };

    // 删除动作
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`确定要删除动作「${name}」吗？`)) return;

        const { error } = await supabase
            .from('exercise_types')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('删除动作失败:', error);
            alert('删除失败: ' + error.message);
        } else {
            await loadExercises();
        }
    };

    // 按类别分组
    const exercisesByCategory = exercises.reduce((acc, ex) => {
        if (!acc[ex.category]) acc[ex.category] = [];
        acc[ex.category].push(ex);
        return acc;
    }, {} as Record<string, ExerciseType[]>);

    // 筛选显示的类别
    const displayCategories = selectedCategory
        ? [selectedCategory]
        : Object.keys(exercisesByCategory);

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
                    href="/fitness/workout/new"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4"
                >
                    <ArrowLeft size={18} />
                    返回添加训练
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-text-primary">动作类型管理</h1>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        添加动作
                    </button>
                </div>
            </header>

            {/* Add Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-semibold text-text-primary mb-4">添加新动作</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">类别</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
                                >
                                    {allCategories.map(cat => (
                                        <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">动作名称</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="请输入动作名称"
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="flex-1 py-2 rounded-lg border border-border text-text-secondary hover:bg-bg-tertiary"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!newName.trim() || saving}
                                className="flex-1 btn-primary py-2 disabled:opacity-50"
                            >
                                {saving ? '保存中...' : '确定添加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === null
                            ? 'bg-accent text-white'
                            : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                        }`}
                >
                    全部
                </button>
                {allCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat
                                ? 'bg-accent text-white'
                                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        {categoryLabels[cat]}
                    </button>
                ))}
            </div>

            {/* Exercise List by Category */}
            <div className="space-y-6">
                {displayCategories.map(category => (
                    <div key={category} className="card p-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-accent"></span>
                            {categoryLabels[category] || category}
                            <span className="text-sm font-normal text-text-secondary">
                                ({exercisesByCategory[category]?.length || 0} 个动作)
                            </span>
                        </h2>
                        <div className="space-y-2">
                            {exercisesByCategory[category]?.map(exercise => (
                                <div
                                    key={exercise.id}
                                    className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
                                >
                                    {editingId === exercise.id ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 px-2 py-1 rounded bg-card-bg border border-border text-text-primary mr-2"
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="text-text-primary">{exercise.name}</span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {editingId === exercise.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleUpdate(exercise.id)}
                                                    className="p-2 text-success hover:bg-success/10 rounded-lg"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-2 text-text-secondary hover:bg-bg-secondary rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(exercise.id);
                                                        setEditName(exercise.name);
                                                    }}
                                                    className="p-2 text-text-secondary hover:bg-bg-secondary rounded-lg"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(exercise.id, exercise.name)}
                                                    className="p-2 text-danger hover:bg-danger/10 rounded-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

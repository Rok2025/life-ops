'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Plus, Trash2, Edit2, Check, X,
    ChevronDown, ChevronUp,
    ToggleLeft, ToggleRight, Dumbbell,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { configApi } from '../api/configApi';
import type { ConfigItem } from '../types';

// ---------- Types ----------

type ExerciseType = {
    id: string;
    name: string;
    category: string;
    tracking_mode: string;
    default_unit: string | null;
};

interface ExerciseManagerProps {
    /** 预加载的部位配置 */
    initialCategories: ConfigItem[];
    /** 预加载的动作列表 */
    initialExercises: ExerciseType[];
}

// ---------- Tabs ----------

type Tab = 'exercises' | 'categories';

// ---------- Component ----------

export default function ExerciseManager({ initialCategories, initialExercises }: ExerciseManagerProps) {
    const [expanded, setExpanded] = useState(true);
    const [tab, setTab] = useState<Tab>('exercises');

    // ========== Category state ==========
    const [categories, setCategories] = useState<ConfigItem[]>(initialCategories);
    const [newCatLabel, setNewCatLabel] = useState('');

    const activeCategories = categories.filter(c => c.is_active);
    const categoryLabels: Record<string, string> = {};
    for (const c of categories) {
        categoryLabels[c.value] = c.label;
    }
    const allCatValues = activeCategories.map(c => c.value);

    const reloadCategories = useCallback(async () => {
        try {
            const data = await configApi.getAllByScope('exercise_category');
            setCategories(data);
        } catch (err) {
            console.error('加载训练部位失败:', err);
        }
    }, []);

    const addCatMutation = useMutation({
        mutationFn: async (label: string) => {
            const maxOrder = categories.reduce((max, i) => Math.max(max, i.sort_order), 0);
            await configApi.create({
                scope: 'exercise_category',
                value: label,
                label,
                sort_order: maxOrder + 1,
            });
        },
        onSuccess: () => { setNewCatLabel(''); reloadCategories(); },
    });

    const toggleCatMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            configApi.toggleActive(id, isActive),
        onSuccess: () => reloadCategories(),
    });

    const deleteCatMutation = useMutation({
        mutationFn: (id: string) => configApi.delete(id),
        onSuccess: () => reloadCategories(),
    });

    const handleAddCategory = useCallback(() => {
        const trimmed = newCatLabel.trim();
        if (!trimmed) return;
        if (categories.some(i => i.label === trimmed || i.value === trimmed)) {
            alert('该部位已存在');
            return;
        }
        addCatMutation.mutate(trimmed);
    }, [newCatLabel, categories, addCatMutation]);

    const handleDeleteCategory = useCallback((id: string) => {
        if (!confirm('删除后不可恢复，确定删除？')) return;
        deleteCatMutation.mutate(id);
    }, [deleteCatMutation]);

    // 编辑部位
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editCatLabel, setEditCatLabel] = useState('');

    const updateCatMutation = useMutation({
        mutationFn: async ({ id, label }: { id: string; label: string }) => {
            await configApi.update(id, { value: label, label });
        },
        onSuccess: () => { setEditingCatId(null); reloadCategories(); },
    });

    const handleStartEditCategory = useCallback((cat: ConfigItem) => {
        setEditingCatId(cat.id);
        setEditCatLabel(cat.label);
    }, []);

    const handleSaveEditCategory = useCallback(() => {
        const trimmed = editCatLabel.trim();
        if (!trimmed || !editingCatId) return;
        updateCatMutation.mutate({ id: editingCatId, label: trimmed });
    }, [editCatLabel, editingCatId, updateCatMutation]);

    // ========== Exercise state ==========
    const [exercises, setExercises] = useState<ExerciseType[]>(initialExercises);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const effectiveNewCategory = newCategory || allCatValues[0] || '';

    const loadExercises = useCallback(async () => {
        const { data, error } = await supabase
            .from('exercise_types')
            .select('*')
            .order('category')
            .order('name');
        if (error) {
            console.error('加载训练动作失败:', error);
            return;
        }
        setExercises(data || []);
    }, []);

    const handleAddExercise = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        const { error } = await supabase
            .from('exercise_types')
            .insert({
                name: newName.trim(),
                category: effectiveNewCategory,
                tracking_mode: 'weight_reps',
                default_unit: 'kg',
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

    const handleUpdateExercise = useCallback(async (id: string) => {
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
    }, [editName, loadExercises]);

    const handleDeleteExercise = useCallback(async (id: string, name: string) => {
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
    }, [loadExercises]);

    // 按类别分组
    const exercisesByCategory = exercises.reduce((acc, ex) => {
        if (!acc[ex.category]) acc[ex.category] = [];
        acc[ex.category].push(ex);
        return acc;
    }, {} as Record<string, ExerciseType[]>);

    const displayCategories = selectedCategory
        ? [selectedCategory]
        : Object.keys(exercisesByCategory);

    // ========== Render ==========

    return (
        <div className="card">
            {/* Header */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between p-4 hover:bg-bg-tertiary/50 rounded-t-xl transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Dumbbell size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-text-primary">训练配置</h3>
                    <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
                        {activeCategories.length} 部位 · {exercises.length} 动作
                    </span>
                </div>
                {expanded
                    ? <ChevronUp size={18} className="text-text-secondary" />
                    : <ChevronDown size={18} className="text-text-secondary" />}
            </button>

            {expanded && (
                <div className="px-4 pb-4">
                    {/* Tab 切换 */}
                    <div className="flex border-b border-border mb-4">
                        <button
                            onClick={() => setTab('exercises')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                tab === 'exercises'
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            训练动作
                            <span className="ml-1.5 text-xs text-text-tertiary">({exercises.length})</span>
                        </button>
                        <button
                            onClick={() => setTab('categories')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                tab === 'categories'
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            训练部位
                            <span className="ml-1.5 text-xs text-text-tertiary">({activeCategories.length}/{categories.length})</span>
                        </button>
                    </div>

                    {/* ===== Tab: 训练动作 ===== */}
                    {tab === 'exercises' && (
                        <div className="space-y-4">
                            {/* Category filter + Add */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex flex-wrap gap-1.5 flex-1">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                            selectedCategory === null
                                                ? 'bg-accent text-white'
                                                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        全部
                                    </button>
                                    {allCatValues.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                selectedCategory === cat
                                                    ? 'bg-accent text-white'
                                                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                                            }`}
                                        >
                                            {categoryLabels[cat] || cat}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 shrink-0"
                                >
                                    <Plus size={14} />
                                    添加
                                </button>
                            </div>

                            {/* Exercise list by category */}
                            <div className="space-y-4">
                                {displayCategories.map(category => (
                                    <div key={category}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-2 h-2 rounded-full bg-accent" />
                                            <span className="text-sm font-medium text-text-primary">
                                                {categoryLabels[category] || category}
                                            </span>
                                            <span className="text-xs text-text-tertiary">
                                                ({exercisesByCategory[category]?.length || 0})
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {exercisesByCategory[category]?.map(exercise => (
                                                <div
                                                    key={exercise.id}
                                                    className="flex items-center justify-between px-3 py-2 bg-bg-tertiary rounded-lg"
                                                >
                                                    {editingId === exercise.id ? (
                                                        <input
                                                            type="text"
                                                            value={editName}
                                                            onChange={e => setEditName(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') handleUpdateExercise(exercise.id); }}
                                                            className="flex-1 px-2 py-1 rounded bg-card-bg border border-border text-text-primary text-sm mr-2"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-text-primary">{exercise.name}</span>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        {editingId === exercise.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateExercise(exercise.id)}
                                                                    className="p-1 text-success hover:bg-success/10 rounded"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingId(null)}
                                                                    className="p-1 text-text-secondary hover:bg-bg-secondary rounded"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => { setEditingId(exercise.id); setEditName(exercise.name); }}
                                                                    className="p-1 text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary rounded"
                                                                >
                                                                    <Edit2 size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteExercise(exercise.id, exercise.name)}
                                                                    className="p-1 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {displayCategories.length === 0 && (
                                    <p className="text-sm text-text-tertiary text-center py-4">暂无动作</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ===== Tab: 训练部位 ===== */}
                    {tab === 'categories' && (
                        <div className="space-y-3">
                            <p className="text-sm text-text-tertiary">管理健身训练的肌群分类。停用后对应部位不再显示。</p>

                            {/* Category list */}
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                                            cat.is_active
                                                ? 'border-border bg-bg-tertiary'
                                                : 'border-border/50 bg-bg-tertiary/50 opacity-60'
                                        }`}
                                    >
                                        {editingCatId === cat.id ? (
                                            <input
                                                type="text"
                                                value={editCatLabel}
                                                onChange={e => setEditCatLabel(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleSaveEditCategory(); if (e.key === 'Escape') setEditingCatId(null); }}
                                                className="flex-1 px-2 py-1 rounded bg-card-bg border border-border text-text-primary text-sm mr-2"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className={`flex-1 text-sm ${cat.is_active ? 'text-text-primary' : 'text-text-secondary line-through'}`}>
                                                {cat.label}
                                            </span>
                                        )}
                                        <span className="text-xs text-text-tertiary">
                                            {exercisesByCategory[cat.value]?.length ?? 0} 个动作
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {editingCatId === cat.id ? (
                                                <>
                                                    <button
                                                        onClick={handleSaveEditCategory}
                                                        className="p-1 text-success hover:bg-success/10 rounded"
                                                        title="保存"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCatId(null)}
                                                        className="p-1 text-text-secondary hover:bg-bg-secondary rounded"
                                                        title="取消"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleStartEditCategory(cat)}
                                                        className="p-1 text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary rounded"
                                                        title="编辑"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleCatMutation.mutate({ id: cat.id, isActive: !cat.is_active })}
                                                        className={`p-1 rounded transition-colors ${
                                                            cat.is_active
                                                                ? 'text-success hover:bg-success/10'
                                                                : 'text-text-tertiary hover:bg-bg-secondary'
                                                        }`}
                                                        title={cat.is_active ? '停用' : '启用'}
                                                    >
                                                        {cat.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        disabled={deleteCatMutation.isPending}
                                                        className="p-1 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded transition-colors disabled:opacity-50"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <p className="text-sm text-text-tertiary text-center py-4">暂无部位</p>
                                )}
                            </div>

                            {/* Add new category */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCatLabel}
                                    onChange={e => setNewCatLabel(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                                    placeholder="输入新部位名称..."
                                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                                />
                                <button
                                    onClick={handleAddCategory}
                                    disabled={!newCatLabel.trim() || addCatMutation.isPending}
                                    className="btn-primary px-3 py-2 text-sm flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Plus size={14} />
                                    添加
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Exercise Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card p-6 w-full max-w-md mx-4">
                        <h2 className="text-lg font-semibold text-text-primary mb-4">添加新动作</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">部位</label>
                                <select
                                    value={effectiveNewCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
                                >
                                    {allCatValues.map(cat => (
                                        <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">动作名称</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddExercise(); } }}
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
                                onClick={handleAddExercise}
                                disabled={!newName.trim() || saving}
                                className="flex-1 btn-primary py-2 disabled:opacity-50"
                            >
                                {saving ? '保存中...' : '确定添加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

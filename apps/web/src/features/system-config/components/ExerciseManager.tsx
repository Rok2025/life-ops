'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Plus, Trash2, Edit2, Check, X,
    ChevronDown, ChevronUp,
    ToggleLeft, ToggleRight, Dumbbell,
} from 'lucide-react';
import { configApi } from '../api/configApi';
import { exerciseTypesApi } from '../api/exerciseTypesApi';
import type { ConfigItem } from '../types';
import { Button, Card, Dialog, Input, Select } from '@/components/ui';

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
        try {
            const data = await exerciseTypesApi.getAll();
            setExercises(data);
        } catch (error) {
            console.error('加载训练动作失败:', error);
        }
    }, []);

    const handleAddExercise = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            await exerciseTypesApi.create({
                name: newName.trim(),
                category: effectiveNewCategory,
                tracking_mode: 'weight_reps',
                default_unit: 'kg',
            });
            setNewName('');
            setShowAddForm(false);
            await loadExercises();
        } catch (error) {
            console.error('添加动作失败:', error);
            alert(`添加失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateExercise = useCallback(async (id: string) => {
        if (!editName.trim()) return;
        try {
            await exerciseTypesApi.updateName(id, editName.trim());
            setEditingId(null);
            await loadExercises();
        } catch (error) {
            console.error('更新动作失败:', error);
            alert(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }, [editName, loadExercises]);

    const handleDeleteExercise = useCallback(async (id: string, name: string) => {
        if (!confirm(`确定要删除动作「${name}」吗？`)) return;
        try {
            await exerciseTypesApi.delete(id);
            await loadExercises();
        } catch (error) {
            console.error('删除动作失败:', error);
            alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
        <Card variant="subtle" className="overflow-hidden p-0">
            {/* Header */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="flex w-full items-center justify-between p-4 transition-colors duration-normal ease-standard hover:bg-panel-bg/90"
            >
                <div className="flex items-center gap-3">
                    <Dumbbell size={18} className="text-accent" />
                    <h3 className="text-body font-semibold text-text-primary">训练配置</h3>
                    <span className="glass-mini-chip text-caption">
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
                    <div className="mb-4">
                        <div className="glass-filter-bar inline-flex items-center">
                        <button
                            onClick={() => setTab('exercises')}
                            className={`glass-filter-chip text-body-sm ${
                                tab === 'exercises'
                                    ? 'glass-filter-chip-active font-medium text-text-primary'
                                    : ''
                            }`}
                        >
                            训练动作
                            <span className="ml-1.5 text-caption text-text-tertiary">({exercises.length})</span>
                        </button>
                        <button
                            onClick={() => setTab('categories')}
                            className={`glass-filter-chip text-body-sm ${
                                tab === 'categories'
                                    ? 'glass-filter-chip-active font-medium text-text-primary'
                                    : ''
                            }`}
                        >
                            训练部位
                            <span className="ml-1.5 text-caption text-text-tertiary">({activeCategories.length}/{categories.length})</span>
                        </button>
                        </div>
                    </div>

                    {/* ===== Tab: 训练动作 ===== */}
                    {tab === 'exercises' && (
                        <div className="space-y-4">
                            {/* Category filter + Add */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="glass-filter-bar flex flex-1 flex-wrap items-center">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={`glass-filter-chip text-caption ${
                                            selectedCategory === null
                                                ? 'glass-filter-chip-active font-medium'
                                                : ''
                                        }`}
                                    >
                                        全部
                                    </button>
                                    {allCatValues.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`glass-filter-chip text-caption ${
                                                selectedCategory === cat
                                                    ? 'glass-filter-chip-active font-medium'
                                                    : ''
                                            }`}
                                        >
                                            {categoryLabels[cat] || cat}
                                        </button>
                                    ))}
                                </div>
                                <Button onClick={() => setShowAddForm(true)} variant="tinted" size="sm" className="gap-1 shrink-0">
                                    <Plus size={14} />
                                    添加
                                </Button>
                            </div>

                            {/* Exercise list by category */}
                            <div className="space-y-4">
                                {displayCategories.map(category => (
                                    <div key={category}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-2 h-2 rounded-full bg-accent" />
                                            <span className="text-body-sm font-medium text-text-primary">
                                                {categoryLabels[category] || category}
                                            </span>
                                            <span className="text-caption text-text-tertiary">
                                                ({exercisesByCategory[category]?.length || 0})
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {exercisesByCategory[category]?.map(exercise => (
                                                <div
                                                    key={exercise.id}
                                                    className="glass-list-row flex items-center justify-between px-3 py-2"
                                                >
                                                    {editingId === exercise.id ? (
                                                        <Input
                                                            type="text"
                                                            value={editName}
                                                            onChange={e => setEditName(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') handleUpdateExercise(exercise.id); }}
                                                            size="sm"
                                                            className="mr-2 flex-1 bg-card-bg"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-body-sm text-text-primary">{exercise.name}</span>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        {editingId === exercise.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateExercise(exercise.id)}
                                                                    className="p-1 text-success hover:bg-success/10 rounded-control transition-colors duration-normal ease-standard"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="rounded-control p-1 text-text-secondary transition-colors duration-normal ease-standard hover:bg-panel-bg"
                                                            >
                                                                    <X size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => { setEditingId(exercise.id); setEditName(exercise.name); }}
                                                                    className="rounded-control p-1 text-text-tertiary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-text-secondary"
                                                                >
                                                                    <Edit2 size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteExercise(exercise.id, exercise.name)}
                                                                    className="p-1 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-control transition-colors duration-normal ease-standard"
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
                                    <div className="rounded-lg border border-dashed border-glass-border bg-panel-bg/65 px-4 py-5 text-center text-body-sm text-text-tertiary">
                                        暂无动作
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ===== Tab: 训练部位 ===== */}
                    {tab === 'categories' && (
                        <div className="space-y-3">
                            <p className="text-body-sm text-text-tertiary">管理健身训练的肌群分类。停用后对应部位不再显示。</p>

                            {/* Category list */}
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        className={`glass-list-row flex items-center gap-3 px-3 py-2.5 ${
                                            cat.is_active
                                                ? ''
                                                : 'opacity-60'
                                        }`}
                                    >
                                        {editingCatId === cat.id ? (
                                            <Input
                                                type="text"
                                                value={editCatLabel}
                                                onChange={e => setEditCatLabel(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleSaveEditCategory(); if (e.key === 'Escape') setEditingCatId(null); }}
                                                size="sm"
                                                className="mr-2 flex-1 bg-card-bg"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className={`flex-1 text-body-sm ${cat.is_active ? 'text-text-primary' : 'text-text-secondary line-through'}`}>
                                                {cat.label}
                                            </span>
                                        )}
                                        <span className="text-caption text-text-tertiary">
                                            {exercisesByCategory[cat.value]?.length ?? 0} 个动作
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {editingCatId === cat.id ? (
                                                <>
                                                    <button
                                                        onClick={handleSaveEditCategory}
                                                        className="p-1 text-success hover:bg-success/10 rounded-control transition-colors duration-normal ease-standard"
                                                        title="保存"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCatId(null)}
                                                        className="rounded-control p-1 text-text-secondary transition-colors duration-normal ease-standard hover:bg-panel-bg"
                                                        title="取消"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleStartEditCategory(cat)}
                                                        className="rounded-control p-1 text-text-tertiary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-text-secondary"
                                                        title="编辑"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleCatMutation.mutate({ id: cat.id, isActive: !cat.is_active })}
                                                        className={`p-1 rounded-control transition-colors duration-normal ease-standard ${
                                                            cat.is_active
                                                                ? 'text-success hover:bg-success/10'
                                                                : 'text-text-tertiary hover:bg-panel-bg'
                                                        }`}
                                                        title={cat.is_active ? '停用' : '启用'}
                                                    >
                                                        {cat.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        disabled={deleteCatMutation.isPending}
                                                        className="p-1 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-control transition-colors duration-normal ease-standard disabled:opacity-50"
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
                                    <div className="rounded-lg border border-dashed border-glass-border bg-panel-bg/65 px-4 py-5 text-center text-body-sm text-text-tertiary">
                                        暂无部位
                                    </div>
                                )}
                            </div>

                            {/* Add new category */}
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={newCatLabel}
                                    onChange={e => setNewCatLabel(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                                    placeholder="输入新部位名称..."
                                    className="flex-1"
                                />
                                <Button onClick={handleAddCategory} disabled={!newCatLabel.trim() || addCatMutation.isPending} variant="tinted" size="sm" className="gap-1">
                                    <Plus size={14} />
                                    添加
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Exercise Modal */}
            <Dialog
                open={showAddForm}
                onClose={() => setShowAddForm(false)}
                title="添加新动作"
                maxWidth="md"
                bodyClassName="flex min-h-0 flex-1 flex-col"
            >
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleAddExercise();
                    }}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="space-y-4 px-5 py-4">
                        <div>
                            <label className="mb-1 block text-caption text-text-secondary">部位</label>
                            <Select
                                value={effectiveNewCategory}
                                onChange={e => setNewCategory(e.target.value)}
                            >
                                {allCatValues.map(cat => (
                                    <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="mb-1 block text-caption text-text-secondary">动作名称</label>
                            <Input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="请输入动作名称"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 border-t border-border bg-bg-primary px-5 py-3">
                        <Button type="button" onClick={() => setShowAddForm(false)} variant="ghost">
                            取消
                        </Button>
                        <Button type="submit" disabled={!newName.trim() || saving}>
                            {saving ? '保存中...' : '确定添加'}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </Card>
    );
}

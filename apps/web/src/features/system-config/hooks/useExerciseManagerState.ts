'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { configApi } from '../api/configApi';
import { exerciseTypesApi } from '../api/exerciseTypesApi';
import type { ConfigItem } from '../types';

export type ExerciseType = {
    id: string;
    name: string;
    category: string;
    tracking_mode: string;
    default_unit: string | null;
};

export type Tab = 'exercises' | 'categories';

export function useExerciseManagerState(
    initialCategories: ConfigItem[],
    initialExercises: ExerciseType[],
) {
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

    return {
        // UI
        expanded, setExpanded, tab, setTab,
        // Categories
        categories, activeCategories, allCatValues, categoryLabels,
        newCatLabel, setNewCatLabel, handleAddCategory, isAddCatPending: addCatMutation.isPending,
        editingCatId, setEditingCatId, editCatLabel, setEditCatLabel,
        handleStartEditCategory, handleSaveEditCategory,
        toggleCatMutation, handleDeleteCategory, isDeleteCatPending: deleteCatMutation.isPending,
        // Exercises
        exercises, exercisesByCategory, displayCategories,
        selectedCategory, setSelectedCategory,
        showAddForm, setShowAddForm,
        newName, setNewName, newCategory, setNewCategory, effectiveNewCategory,
        handleAddExercise, saving,
        editingId, setEditingId, editName, setEditName,
        handleUpdateExercise, handleDeleteExercise,
    };
}

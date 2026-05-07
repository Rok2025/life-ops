'use client';

import { useCallback, useMemo, useState } from 'react';
import {
    FileText,
    FolderTree,
    Pencil,
    Plus,
    Star,
    Trash2,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import CommandCategoryFormDialog from './CommandCategoryFormDialog';
import CommandTemplateFormDialog from './CommandTemplateFormDialog';
import { useCommandCategories, useCommandMutations, useCommandTemplates } from '../hooks/useCommands';
import type {
    CommandCategory,
    CommandCategoryFormValues,
    CommandTemplate,
    CommandTemplateFormValues,
} from '../types';
import { Button, Card, SegmentedControl, SectionHeader } from '@/components/ui';

type CommandSettingsView = 'categories' | 'templates';

interface CommandSettingsProps {
    initialView?: CommandSettingsView;
}

function resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
        if (error.message.includes('command_categories') || error.message.includes('command_templates')) {
            return '数据库缺少命令中心相关表，请先执行迁移：supabase/migrations/20260506_create_command_center.sql';
        }
        if (error.message.includes('violates foreign key constraint')) {
            return '分类下仍有命令模板，请先移动或删除这些模板。';
        }
        return error.message;
    }
    return fallback;
}

function parseTags(value: string): string[] {
    return value
        .split(/[，,]/)
        .map(tag => tag.trim())
        .filter(Boolean);
}

export default function CommandSettings({ initialView = 'templates' }: CommandSettingsProps) {
    const [view, setView] = useState<CommandSettingsView>(initialView);
    const categoriesQuery = useCommandCategories(false);
    const templatesQuery = useCommandTemplates(false);

    const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
    const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);

    if (categoriesQuery.isLoading || templatesQuery.isLoading) {
        return (
            <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                加载命令配置中...
            </Card>
        );
    }

    if (categoriesQuery.isError || templatesQuery.isError) {
        return (
            <Card variant="subtle" className="p-card text-body-sm text-danger">
                {resolveErrorMessage(categoriesQuery.error ?? templatesQuery.error, '加载命令配置失败')}
            </Card>
        );
    }

    return (
        <Card variant="subtle" className="space-y-4 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <SectionHeader
                    title="命令配置"
                    description="维护命令分类和模板，展示页会实时读取启用项。"
                />
                <SegmentedControl
                    value={view}
                    onChange={value => setView(value as CommandSettingsView)}
                    options={[
                        { value: 'templates', label: '命令模板', icon: <FileText size={14} /> },
                        { value: 'categories', label: '命令分类', icon: <FolderTree size={14} /> },
                    ]}
                    aria-label="命令配置视图"
                />
            </div>

            {view === 'categories' ? (
                <CommandCategoryManager categories={categories} />
            ) : (
                <CommandTemplateManager categories={categories} templates={templates} />
            )}
        </Card>
    );
}

function CommandCategoryManager({ categories }: { categories: CommandCategory[] }) {
    const [editingCategory, setEditingCategory] = useState<CommandCategory | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const {
        createCategoryMutation,
        updateCategoryMutation,
        deleteCategoryMutation,
        setDefaultCategoryMutation,
    } = useCommandMutations();

    const handleCreate = useCallback(() => {
        setEditingCategory(null);
        setSubmitError(null);
        setFormOpen(true);
    }, []);

    const handleEdit = useCallback((category: CommandCategory) => {
        setEditingCategory(category);
        setSubmitError(null);
        setFormOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setFormOpen(false);
        setEditingCategory(null);
        setSubmitError(null);
    }, []);

    const handleSubmit = useCallback((values: CommandCategoryFormValues) => {
        setSubmitError(null);
        const input = {
            name: values.name,
            slug: values.slug,
            description: values.description || null,
            sort_order: values.sortOrder,
            is_active: values.isActive,
        };

        const setDefaultAndClose = (categoryId: string) => {
            if (!values.isDefault) {
                handleClose();
                return;
            }

            setDefaultCategoryMutation.mutate(categoryId, {
                onSuccess: handleClose,
                onError: error => setSubmitError(resolveErrorMessage(error, '设置默认分类失败')),
            });
        };

        if (editingCategory) {
            updateCategoryMutation.mutate(
                { id: editingCategory.id, input },
                {
                    onSuccess: category => setDefaultAndClose(category.id),
                    onError: error => setSubmitError(resolveErrorMessage(error, '保存分类失败')),
                },
            );
            return;
        }

        createCategoryMutation.mutate(input, {
            onSuccess: category => setDefaultAndClose(category.id),
            onError: error => setSubmitError(resolveErrorMessage(error, '创建分类失败')),
        });
    }, [
        createCategoryMutation,
        editingCategory,
        handleClose,
        setDefaultCategoryMutation,
        updateCategoryMutation,
    ]);

    const handleDelete = useCallback((category: CommandCategory) => {
        if (!confirm(`确认删除命令分类「${category.name}」吗？`)) return;
        deleteCategoryMutation.mutate(category.id, {
            onError: error => alert(resolveErrorMessage(error, '删除分类失败')),
        });
    }, [deleteCategoryMutation]);

    const handleToggle = useCallback((category: CommandCategory) => {
        updateCategoryMutation.mutate({
            id: category.id,
            input: { is_active: !category.is_active },
        });
    }, [updateCategoryMutation]);

    const handleSetDefault = useCallback((category: CommandCategory) => {
        if (category.is_default) return;
        setDefaultCategoryMutation.mutate(category.id);
    }, [setDefaultCategoryMutation]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="text-body-sm text-text-tertiary">
                    默认分类会作为命令页首次进入时的视图。
                </div>
                <Button type="button" onClick={handleCreate} variant="tinted" size="sm" className="gap-1">
                    <Plus size={16} />
                    新建分类
                </Button>
            </div>

            <div className="space-y-1.5">
                {categories.map(category => (
                    <div
                        key={category.id}
                        className={`glass-list-row flex items-center gap-3 px-3 py-2.5 ${category.is_active ? '' : 'opacity-60'}`}
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-body-sm font-semibold text-text-primary">{category.name}</span>
                                {category.is_default ? (
                                    <span className="glass-mini-chip text-caption text-accent">默认</span>
                                ) : null}
                                <span className="text-caption text-text-tertiary">{category.slug}</span>
                            </div>
                            {category.description ? (
                                <p className="mt-1 truncate text-caption text-text-tertiary">
                                    {category.description}
                                </p>
                            ) : null}
                        </div>

                        <span className="hidden text-caption tabular-nums text-text-tertiary sm:block">
                            #{category.sort_order}
                        </span>

                        <button
                            type="button"
                            onClick={() => handleSetDefault(category)}
                            disabled={category.is_default}
                            className="rounded-control p-1.5 text-warning transition-colors hover:bg-warning/10 disabled:text-text-tertiary disabled:hover:bg-transparent"
                            title={category.is_default ? '当前默认分类' : '设为默认分类'}
                        >
                            <Star size={16} fill={category.is_default ? 'currentColor' : 'none'} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleToggle(category)}
                            className={`rounded-control p-1.5 transition-colors ${category.is_active ? 'text-success hover:bg-success/10' : 'text-text-tertiary hover:bg-panel-bg'}`}
                            title={category.is_active ? '停用' : '启用'}
                        >
                            {category.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleEdit(category)}
                            className="rounded-control p-1.5 text-text-tertiary transition-colors hover:bg-panel-bg hover:text-text-primary"
                            title="编辑"
                        >
                            <Pencil size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            className="rounded-control p-1.5 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
                            title="删除"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                ))}
                {categories.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-glass-border px-4 py-6 text-center text-body-sm text-text-tertiary">
                        还没有命令分类。
                    </div>
                ) : null}
            </div>

            {formOpen ? (
                <CommandCategoryFormDialog
                    key={editingCategory?.id ?? 'new-command-category'}
                    editingCategory={editingCategory}
                    submitting={
                        createCategoryMutation.isPending
                        || updateCategoryMutation.isPending
                        || setDefaultCategoryMutation.isPending
                    }
                    submitError={submitError}
                    onClose={handleClose}
                    onSubmit={handleSubmit}
                />
            ) : null}
        </div>
    );
}

function CommandTemplateManager({
    categories,
    templates,
}: {
    categories: CommandCategory[];
    templates: CommandTemplate[];
}) {
    const [editingTemplate, setEditingTemplate] = useState<CommandTemplate | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const {
        createTemplateMutation,
        updateTemplateMutation,
        deleteTemplateMutation,
        toggleTemplateMutation,
    } = useCommandMutations();

    const visibleTemplates = useMemo(() => {
        if (categoryFilter === 'all') return templates;
        return templates.filter(template => template.category_id === categoryFilter);
    }, [categoryFilter, templates]);

    const handleCreate = useCallback(() => {
        setEditingTemplate(null);
        setSubmitError(null);
        setFormOpen(true);
    }, []);

    const handleEdit = useCallback((template: CommandTemplate) => {
        setEditingTemplate(template);
        setSubmitError(null);
        setFormOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setEditingTemplate(null);
        setFormOpen(false);
        setSubmitError(null);
    }, []);

    const handleSubmit = useCallback((values: CommandTemplateFormValues) => {
        setSubmitError(null);
        const input = {
            category_id: values.categoryId,
            command_text: values.commandText,
            summary: values.summary,
            tags: parseTags(values.tags),
            sort_order: values.sortOrder,
            is_favorite: values.isFavorite,
            is_active: values.isActive,
        };

        if (editingTemplate) {
            updateTemplateMutation.mutate(
                { id: editingTemplate.id, input },
                {
                    onSuccess: handleClose,
                    onError: error => setSubmitError(resolveErrorMessage(error, '保存命令模板失败')),
                },
            );
            return;
        }

        createTemplateMutation.mutate(input, {
            onSuccess: handleClose,
            onError: error => setSubmitError(resolveErrorMessage(error, '创建命令模板失败')),
        });
    }, [createTemplateMutation, editingTemplate, handleClose, updateTemplateMutation]);

    const handleDelete = useCallback((template: CommandTemplate) => {
        if (!confirm(`确认删除命令「${template.command_text}」吗？`)) return;
        deleteTemplateMutation.mutate(template.id, {
            onError: error => alert(resolveErrorMessage(error, '删除命令模板失败')),
        });
    }, [deleteTemplateMutation]);

    const handleToggleFavorite = useCallback((template: CommandTemplate) => {
        updateTemplateMutation.mutate({
            id: template.id,
            input: { is_favorite: !template.is_favorite },
        });
    }, [updateTemplateMutation]);

    const activeCount = templates.filter(template => template.is_active).length;
    const favoriteCount = templates.filter(template => template.is_favorite).length;

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-caption text-text-tertiary">
                    <span className="glass-mini-chip">{activeCount} 启用</span>
                    <span className="glass-mini-chip">{favoriteCount} 高频</span>
                    <span className="glass-mini-chip">{visibleTemplates.length} 当前可见</span>
                </div>

                <Button
                    type="button"
                    onClick={handleCreate}
                    variant="tinted"
                    size="sm"
                    className="gap-1"
                    disabled={categories.length === 0}
                >
                    <Plus size={16} />
                    新建模板
                </Button>
            </div>

            <div className="glass-filter-bar flex flex-wrap items-center">
                <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`glass-filter-chip text-caption ${categoryFilter === 'all' ? 'glass-filter-chip-active font-medium text-text-primary' : ''}`}
                >
                    全部
                </button>
                {categories.map(category => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() => setCategoryFilter(category.id)}
                        className={`glass-filter-chip text-caption ${categoryFilter === category.id ? 'glass-filter-chip-active font-medium text-text-primary' : ''}`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className="space-y-1.5">
                {visibleTemplates.map(template => (
                    <div
                        key={template.id}
                        className={`glass-list-row flex items-center gap-3 px-3 py-2.5 ${template.is_active ? '' : 'opacity-60'}`}
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <code className="break-all text-code font-semibold text-text-primary">
                                    {template.command_text}
                                </code>
                                <span className="glass-mini-chip text-caption">
                                    {template.category?.name ?? '未分类'}
                                </span>
                                {template.is_favorite ? (
                                    <span className="text-caption font-medium text-warning">高频</span>
                                ) : null}
                            </div>
                            <p className="mt-1 truncate text-caption text-text-tertiary">
                                {template.summary}
                            </p>
                        </div>

                        <span className="hidden text-caption tabular-nums text-text-tertiary lg:block">
                            复制 {template.copy_count}
                        </span>

                        <button
                            type="button"
                            onClick={() => handleToggleFavorite(template)}
                            className={`rounded-control p-1.5 transition-colors ${template.is_favorite ? 'text-warning hover:bg-warning/10' : 'text-text-tertiary hover:bg-panel-bg'}`}
                            title={template.is_favorite ? '取消高频' : '设为高频'}
                        >
                            <Star size={16} fill={template.is_favorite ? 'currentColor' : 'none'} />
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleTemplateMutation.mutate({ id: template.id, isActive: !template.is_active })}
                            className={`rounded-control p-1.5 transition-colors ${template.is_active ? 'text-success hover:bg-success/10' : 'text-text-tertiary hover:bg-panel-bg'}`}
                            title={template.is_active ? '停用' : '启用'}
                        >
                            {template.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleEdit(template)}
                            className="rounded-control p-1.5 text-text-tertiary transition-colors hover:bg-panel-bg hover:text-text-primary"
                            title="编辑"
                        >
                            <Pencil size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDelete(template)}
                            className="rounded-control p-1.5 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
                            title="删除"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                ))}
                {visibleTemplates.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-glass-border px-4 py-6 text-center text-body-sm text-text-tertiary">
                        当前分类下还没有命令模板。
                    </div>
                ) : null}
            </div>

            {formOpen ? (
                <CommandTemplateFormDialog
                    key={editingTemplate?.id ?? 'new-command-template'}
                    categories={categories}
                    editingTemplate={editingTemplate}
                    submitting={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    submitError={submitError}
                    onClose={handleClose}
                    onSubmit={handleSubmit}
                />
            ) : null}
        </div>
    );
}

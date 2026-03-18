'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Bot,
    ChevronDown,
    ChevronUp,
    Pencil,
    Plus,
    ToggleLeft,
    ToggleRight,
    Trash2,
} from 'lucide-react';
import EnglishPromptFormDialog from './EnglishPromptFormDialog';
import { ENGLISH_PROMPT_MODE_META } from '../types';
import { useEnglishPromptBindings, useEnglishPromptMutations, useEnglishPromptTemplates } from '../hooks/useEnglishPrompts';
import type { EnglishPromptMode, EnglishPromptTemplate, EnglishPromptTemplateFormValues } from '../types';
import { Button, Card, Select } from '@/components/ui';

function resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
        if (error.message.includes('english_prompt_templates')) {
            return '数据库缺少英语提示词相关表，请先执行迁移：supabase/migrations/20260312_create_english_prompt_management.sql';
        }
        return error.message;
    }
    return fallback;
}

export default function EnglishPromptManager() {
    const [expanded, setExpanded] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<EnglishPromptTemplate | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const templatesQuery = useEnglishPromptTemplates();
    const bindingsQuery = useEnglishPromptBindings();
    const {
        createTemplateMutation,
        updateTemplateMutation,
        deleteTemplateMutation,
        toggleTemplateMutation,
        setBindingMutation,
    } = useEnglishPromptMutations();

    const templates = useMemo(
        () => templatesQuery.data ?? [],
        [templatesQuery.data],
    );
    const bindings = useMemo(
        () => bindingsQuery.data ?? [],
        [bindingsQuery.data],
    );

    const bindingMap = useMemo(
        () => Object.fromEntries(bindings.map(binding => [binding.mode, binding])),
        [bindings],
    );

    const templateOptionsByMode = useMemo(() => {
        return Object.fromEntries(
            ENGLISH_PROMPT_MODE_META.map(meta => {
                const selectedTemplateId = bindingMap[meta.key]?.template_id ?? null;
                const options = templates.filter(template => {
                    if (!template.supported_modes.includes(meta.key)) return false;
                    return template.is_active || template.id === selectedTemplateId;
                });
                return [meta.key, options];
            }),
        ) as Record<EnglishPromptMode, EnglishPromptTemplate[]>;
    }, [bindingMap, templates]);

    const selectedCount = bindings.filter(binding => !!binding.template_id).length;

    const handleCreate = useCallback(() => {
        setEditingTemplate(null);
        setSubmitError(null);
        setFormOpen(true);
    }, []);

    const handleEdit = useCallback((template: EnglishPromptTemplate) => {
        setEditingTemplate(template);
        setSubmitError(null);
        setFormOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setFormOpen(false);
        setEditingTemplate(null);
        setSubmitError(null);
    }, []);

    const handleSubmit = useCallback((values: EnglishPromptTemplateFormValues) => {
        setSubmitError(null);

        const input = {
            title: values.title,
            description: values.description || null,
            content: values.content,
            supported_modes: values.supportedModes,
            is_active: values.isActive,
        };

        if (editingTemplate) {
            updateTemplateMutation.mutate(
                { id: editingTemplate.id, input },
                {
                    onSuccess: handleCloseDialog,
                    onError: (error) => {
                        setSubmitError(resolveErrorMessage(error, '保存失败，请稍后重试'));
                    },
                },
            );
            return;
        }

        createTemplateMutation.mutate(input, {
            onSuccess: handleCloseDialog,
            onError: (error) => {
                setSubmitError(resolveErrorMessage(error, '创建失败，请稍后重试'));
            },
        });
    }, [createTemplateMutation, editingTemplate, handleCloseDialog, updateTemplateMutation]);

    const handleDelete = useCallback((template: EnglishPromptTemplate) => {
        if (!confirm(`确认删除英语提示词「${template.title}」吗？`)) return;
        deleteTemplateMutation.mutate(template.id);
    }, [deleteTemplateMutation]);

    const handleBindingChange = useCallback((mode: EnglishPromptMode, templateId: string | null) => {
        setBindingMutation.mutate({ mode, templateId });
    }, [setBindingMutation]);

    const handleReload = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['english-prompt-templates'] });
        queryClient.invalidateQueries({ queryKey: ['english-prompt-bindings'] });
    }, [queryClient]);

    return (
        <Card variant="subtle" className="overflow-hidden p-0">
            <button
                onClick={() => setExpanded(prev => !prev)}
                className="flex w-full items-center justify-between p-4 transition-colors duration-normal ease-standard hover:bg-panel-bg/90"
            >
                <div className="flex items-center gap-3">
                    <Bot size={18} className="text-accent" />
                    <h3 className="text-body font-semibold text-text-primary">英语提示词配置</h3>
                    <span className="glass-mini-chip text-caption">
                        {selectedCount} / {ENGLISH_PROMPT_MODE_META.length} 已绑定
                    </span>
                </div>
                {expanded
                    ? <ChevronUp size={18} className="text-text-secondary" />
                    : <ChevronDown size={18} className="text-text-secondary" />}
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-4">
                    <p className="text-body-sm text-text-tertiary">
                        独立管理英语模块专用提示词，并为简洁 / 详细 / 语法三种模式分别选择生效模板。
                    </p>

                    {(templatesQuery.isError || bindingsQuery.isError) && (
                        <div className="rounded-card border border-danger/25 bg-danger/8 px-3 py-2 text-body-sm text-danger">
                            {resolveErrorMessage(templatesQuery.error ?? bindingsQuery.error, '加载英语提示词配置失败')}
                            <button
                                type="button"
                                onClick={handleReload}
                                className="ml-2 underline underline-offset-2"
                            >
                                重试
                            </button>
                        </div>
                    )}

                    <div className="grid gap-3 lg:grid-cols-3">
                        {ENGLISH_PROMPT_MODE_META.map(meta => {
                            const selectedBinding = bindingMap[meta.key];
                            const options = templateOptionsByMode[meta.key] ?? [];

                            return (
                                <div key={meta.key} className="rounded-inner-card border border-glass-border bg-panel-bg/78 p-3 space-y-2 shadow-sm">
                                    <div>
                                        <p className="text-body-sm font-medium text-text-primary">{meta.label}</p>
                                        <p className="text-caption text-text-tertiary mt-1">{meta.description}</p>
                                    </div>
                                    <Select
                                        value={selectedBinding?.template_id ?? ''}
                                        onChange={event => handleBindingChange(meta.key, event.target.value || null)}
                                        disabled={bindingsQuery.isLoading || setBindingMutation.isPending}
                                    >
                                        <option value="">使用内置默认提示词</option>
                                        {options.map(template => (
                                            <option key={template.id} value={template.id}>
                                                {template.title}{template.is_active ? '' : '（已停用）'}
                                            </option>
                                        ))}
                                    </Select>
                                    <p className="text-caption text-text-tertiary">
                                        当前：{selectedBinding?.template?.title ?? '未绑定，自带默认提示词'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h4 className="text-body-sm font-medium text-text-primary">英语提示词模板</h4>
                            <p className="text-caption text-text-tertiary mt-1">
                                这里只管理英语模块专用提示词，不与通用提示词库共用。
                            </p>
                        </div>
                        <Button type="button" onClick={handleCreate} variant="tinted" size="sm" className="gap-1">
                            <Plus size={16} />
                            新建英语提示词
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {templatesQuery.isLoading ? (
                            <div className="rounded-[1rem] border border-glass-border bg-panel-bg/70 px-4 py-5 text-body-sm text-text-secondary">
                                加载英语提示词中...
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="rounded-[1rem] border border-dashed border-glass-border px-4 py-6 text-body-sm text-text-tertiary text-center">
                                还没有英语提示词模板，先新建一个即可绑定到模式。
                            </div>
                        ) : (
                            templates.map(template => {
                                const selectedModes = ENGLISH_PROMPT_MODE_META
                                    .filter(meta => bindingMap[meta.key]?.template_id === template.id)
                                    .map(meta => meta.label);

                                return (
                                    <div
                                        key={template.id}
                                        className={`glass-list-row px-4 py-3 ${
                                            template.is_active
                                                ? ''
                                                : 'opacity-70'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <h5 className="text-body-sm font-medium text-text-primary">{template.title}</h5>
                                                    {template.supported_modes.map(mode => (
                                                        <span
                                                            key={mode}
                                                            className="text-caption px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                                                        >
                                                            {ENGLISH_PROMPT_MODE_META.find(item => item.key === mode)?.label ?? mode}
                                                        </span>
                                                    ))}
                                                    {selectedModes.map(label => (
                                                        <span
                                                            key={`${template.id}-${label}`}
                                                            className="text-caption px-2 py-0.5 rounded-full bg-success/10 text-success"
                                                        >
                                                            当前绑定：{label}
                                                        </span>
                                                    ))}
                                                </div>
                                                {template.description && (
                                                    <p className="text-caption text-text-tertiary mt-1">{template.description}</p>
                                                )}
                                                <p className="text-caption text-text-secondary mt-2 max-h-20 overflow-hidden whitespace-pre-wrap">
                                                    {template.content}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleTemplateMutation.mutate({
                                                        id: template.id,
                                                        isActive: !template.is_active,
                                                    })}
                                                    className={`p-1 rounded-control transition-colors duration-normal ease-standard ${
                                                        template.is_active
                                                            ? 'text-success hover:bg-success/10'
                                                            : 'text-text-tertiary hover:bg-bg-secondary'
                                                    }`}
                                                    title={template.is_active ? '停用' : '启用'}
                                                >
                                                    {template.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(template)}
                                                    className="p-1 rounded-control text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors duration-normal ease-standard"
                                                    title="编辑"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(template)}
                                                    className="p-1 rounded-control text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors duration-normal ease-standard"
                                                    title="删除"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {formOpen && (
                <EnglishPromptFormDialog
                    key={editingTemplate?.id ?? 'new-english-prompt'}
                    editingTemplate={editingTemplate}
                    submitting={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    submitError={submitError}
                    onClose={handleCloseDialog}
                    onSubmit={handleSubmit}
                />
            )}
        </Card>
    );
}

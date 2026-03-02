'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Sparkles, Star } from 'lucide-react';
import { usePromptTemplateMutations } from '../hooks/usePromptTemplateMutations';
import { usePromptTemplates } from '../hooks/usePromptTemplates';
import PromptTemplateList from './PromptTemplateList';
import PromptTemplateDetail from './PromptTemplateDetail';
import PromptTemplateFormDialog from './PromptTemplateFormDialog';
import type { PromptTemplate, PromptTemplateFormValues } from '../types';

async function copyToClipboard(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    if (typeof document === 'undefined') {
        throw new Error('Clipboard API unavailable');
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

export default function PromptLibraryPage() {
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
    const [copyingId, setCopyingId] = useState<string | null>(null);
    const [copyMessage, setCopyMessage] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    const { data: templates = [], isLoading, isError, refetch } = usePromptTemplates({
        search,
        tag: selectedTag ?? undefined,
        favoritesOnly,
    });

    const {
        createMutation,
        updateMutation,
        deleteMutation,
        toggleFavoriteMutation,
        recordUseMutation,
        duplicateMutation,
    } = usePromptTemplateMutations();

    useEffect(() => {
        if (templates.length === 0) {
            setSelectedId(null);
            return;
        }

        if (!selectedId || !templates.some(template => template.id === selectedId)) {
            setSelectedId(templates[0].id);
        }
    }, [selectedId, templates]);

    const selectedTemplate = useMemo(
        () => templates.find(template => template.id === selectedId) ?? null,
        [templates, selectedId],
    );

    const allTags = useMemo(
        () => [...new Set(templates.flatMap(template => template.tags))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
        [templates],
    );

    const handleCreate = useCallback(() => {
        setEditingTemplate(null);
        setFormOpen(true);
    }, []);

    const handleEdit = useCallback((template: PromptTemplate) => {
        setEditingTemplate(template);
        setFormOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setFormOpen(false);
        setEditingTemplate(null);
    }, []);

    const handleSubmit = useCallback((values: PromptTemplateFormValues) => {
        if (editingTemplate) {
            updateMutation.mutate(
                {
                    id: editingTemplate.id,
                    input: {
                        title: values.title,
                        description: values.description || null,
                        content: values.content,
                        tags: values.tags,
                        is_favorite: values.is_favorite,
                    },
                },
                { onSuccess: handleCloseDialog },
            );
            return;
        }

        createMutation.mutate(
            {
                title: values.title,
                description: values.description || null,
                content: values.content,
                tags: values.tags,
                is_favorite: values.is_favorite,
            },
            { onSuccess: handleCloseDialog },
        );
    }, [createMutation, editingTemplate, handleCloseDialog, updateMutation]);

    const handleDelete = useCallback((template: PromptTemplate) => {
        if (!confirm(`确认删除模板「${template.title}」吗？`)) return;

        setDeletingId(template.id);
        deleteMutation.mutate(template.id, {
            onSuccess: () => {
                if (selectedId === template.id) {
                    setSelectedId(null);
                }
            },
            onSettled: () => setDeletingId(null),
        });
    }, [deleteMutation, selectedId]);

    const handleCopy = useCallback(async (template: PromptTemplate) => {
        setCopyingId(template.id);
        try {
            await copyToClipboard(template.content);
            recordUseMutation.mutate({ id: template.id, currentCount: template.use_count });
            setCopyMessage(`已复制「${template.title}」`);
            window.setTimeout(() => setCopyMessage(null), 1600);
        } catch {
            setCopyMessage('复制失败，请手动复制');
            window.setTimeout(() => setCopyMessage(null), 1800);
        } finally {
            setCopyingId(null);
        }
    }, [recordUseMutation]);

    return (
        <div className="space-y-section">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                        <Sparkles size={20} className="text-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">提示词库</h1>
                        <p className="text-sm text-text-secondary">维护高频提示词模板，支持搜索、收藏和一键复制</p>
                    </div>
                </div>
                <button type="button" onClick={handleCreate} className="btn-primary flex items-center gap-1 text-sm">
                    <Plus size={16} />
                    新建模板
                </button>
            </div>

            <div className="card p-card space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                    <div className="relative">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="搜索标题或内容..."
                            className="w-full rounded-lg border border-border bg-bg-tertiary py-2 pl-9 pr-3 text-sm text-text-primary outline-none focus:border-accent"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setFavoritesOnly(prev => !prev)}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                            favoritesOnly
                                ? 'border-yellow-400 bg-yellow-400/10 text-yellow-500'
                                : 'border-border text-text-secondary hover:bg-bg-tertiary'
                        }`}
                    >
                        <span className="inline-flex items-center gap-1">
                            <Star size={14} className={favoritesOnly ? 'fill-yellow-400 text-yellow-400' : ''} />
                            仅看收藏
                        </span>
                    </button>
                </div>

                {allTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSelectedTag(null)}
                            className={`rounded-md px-2 py-1 text-xs ${
                                !selectedTag ? 'bg-accent/15 text-accent' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                            }`}
                        >
                            全部标签
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => setSelectedTag(prev => (prev === tag ? null : tag))}
                                className={`rounded-md px-2 py-1 text-xs ${
                                    selectedTag === tag
                                        ? 'bg-accent/15 text-accent'
                                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                                }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {copyMessage && (
                <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
                    {copyMessage}
                </div>
            )}

            {isError ? (
                <div className="rounded-xl border border-danger/30 bg-danger/10 p-card text-sm text-danger">
                    加载失败，请稍后重试。
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="ml-2 underline underline-offset-2"
                    >
                        重新加载
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
                    <div>
                        {isLoading ? (
                            <div className="rounded-xl border border-border bg-bg-secondary/40 p-card text-sm text-text-secondary">
                                加载模板中...
                            </div>
                        ) : (
                            <PromptTemplateList
                                templates={templates}
                                selectedId={selectedId}
                                onSelect={setSelectedId}
                                onToggleFavorite={template =>
                                    toggleFavoriteMutation.mutate({
                                        id: template.id,
                                        isFavorite: !template.is_favorite,
                                    })
                                }
                                onDuplicate={template => duplicateMutation.mutate(template)}
                                onDelete={handleDelete}
                                pendingDeleteId={deletingId}
                            />
                        )}
                    </div>

                    <PromptTemplateDetail
                        template={selectedTemplate}
                        onEdit={handleEdit}
                        onCopy={handleCopy}
                        onDuplicate={template => duplicateMutation.mutate(template)}
                        copyingId={copyingId}
                    />
                </div>
            )}

            <PromptTemplateFormDialog
                open={formOpen}
                editingTemplate={editingTemplate}
                submitting={createMutation.isPending || updateMutation.isPending}
                onClose={handleCloseDialog}
                onSubmit={handleSubmit}
            />
        </div>
    );
}

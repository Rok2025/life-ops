'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Sparkles, Star } from 'lucide-react';
import { usePromptTemplateMutations } from '../hooks/usePromptTemplateMutations';
import { usePromptTemplates } from '../hooks/usePromptTemplates';
import PromptTemplateList from './PromptTemplateList';
import PromptTemplateDetail from './PromptTemplateDetail';
import PromptTemplateFormDialog from './PromptTemplateFormDialog';
import { resolveSubmitErrorMessage, copyToClipboard } from '../utils';
import type { PromptTemplate, PromptTemplateFormValues } from '../types';
import { TONES } from '@/design-system/tokens';
import { Button, Card, Input, PageHero, SectionHeader } from '@/components/ui';

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
    const [submitError, setSubmitError] = useState<string | null>(null);

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
    const favoritesCount = useMemo(
        () => templates.filter(template => template.is_favorite).length,
        [templates],
    );

    const handleCreate = useCallback(() => {
        setEditingTemplate(null);
        setSubmitError(null);
        setFormOpen(true);
    }, []);

    const handleEdit = useCallback((template: PromptTemplate) => {
        setEditingTemplate(template);
        setSubmitError(null);
        setFormOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setFormOpen(false);
        setEditingTemplate(null);
        setSubmitError(null);
    }, []);

    const handleSubmit = useCallback((values: PromptTemplateFormValues) => {
        setSubmitError(null);
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
                {
                    onSuccess: handleCloseDialog,
                    onError: (error) => {
                        setSubmitError(resolveSubmitErrorMessage(error, '保存失败，请稍后重试'));
                    },
                },
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
            {
                onSuccess: handleCloseDialog,
                onError: (error) => {
                    setSubmitError(resolveSubmitErrorMessage(error, '创建失败，请稍后重试'));
                },
            },
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
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="成长 / 提示词"
                icon={<Sparkles size={18} className="text-accent" />}
                title="提示词库"
                description="维护高频模板、快速检索和一键复制，让常用提示词沉淀成稳定资产。"
                action={
                    <Button type="button" onClick={handleCreate} variant="tinted" size="sm" className="gap-1">
                        <Plus size={16} />
                        新建模板
                    </Button>
                }
                stats={[
                    { label: '模板总数', value: templates.length, meta: selectedId ? '已选模板' : '等待选择', tone: 'accent' },
                    { label: '收藏模板', value: favoritesCount, meta: favoritesOnly ? '仅看收藏' : '全部可见', tone: 'warning' },
                    { label: '标签维度', value: allTags.length, meta: selectedTag ? `#${selectedTag}` : '全部标签', tone: 'success' },
                ]}
            />

            <Card variant="subtle" className="space-y-4 p-card">
                <SectionHeader
                    title="筛选模板"
                    description="按内容、收藏状态和标签快速定位常用模板。"
                />

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                    <div className="relative">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <Input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="搜索标题或内容..."
                            className="pl-9 pr-3"
                        />
                    </div>

                    <Button
                        type="button"
                        onClick={() => setFavoritesOnly(prev => !prev)}
                        variant={favoritesOnly ? 'tinted' : 'secondary'}
                        size="sm"
                        className="gap-1.5"
                    >
                        <Star size={14} className={favoritesOnly ? `${TONES.yellow.fill} ${TONES.yellow.color}` : ''} />
                        仅看收藏
                    </Button>
                </div>

                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <div className="glass-filter-bar flex flex-wrap items-center">
                            <button
                                type="button"
                                onClick={() => setSelectedTag(null)}
                                className={`glass-filter-chip text-caption ${!selectedTag ? 'glass-filter-chip-active' : ''}`}
                            >
                                全部标签
                            </button>
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setSelectedTag(prev => (prev === tag ? null : tag))}
                                    className={`glass-filter-chip text-caption ${selectedTag === tag ? 'glass-filter-chip-active' : ''}`}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {copyMessage && (
                <Card className="border-accent/20 bg-accent/8 px-3 py-2 text-body-sm text-accent">
                    {copyMessage}
                </Card>
            )}

            {isError ? (
                <Card className="border-danger/25 bg-danger/8 p-card text-body-sm text-danger">
                    加载失败，请稍后重试。
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="ml-2 underline underline-offset-2"
                    >
                        重新加载
                    </button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
                    <div>
                        {isLoading ? (
                            <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                                加载模板中...
                            </Card>
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

            {formOpen && (
                <PromptTemplateFormDialog
                    key={editingTemplate?.id ?? 'new'}
                    editingTemplate={editingTemplate}
                    submitting={createMutation.isPending || updateMutation.isPending}
                    submitError={submitError}
                    onClose={handleCloseDialog}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
}

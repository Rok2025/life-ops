'use client';

import { useCallback, useMemo, useState } from 'react';
import { Command, Search, TerminalSquare } from 'lucide-react';
import CommandCard from './CommandCard';
import { useCommandCategories, useCommandMutations, useCommandTemplates } from '../hooks/useCommands';
import type { CommandTemplate } from '../types';
import { Card, Input, PageHero } from '@/components/ui';

const ALL_CATEGORY = '__all__';

function resolveErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        if (error.message.includes('command_categories') || error.message.includes('command_templates')) {
            return '数据库缺少命令中心相关表，请先执行迁移：supabase/migrations/20260506_create_command_center.sql';
        }
        return error.message;
    }
    return '加载命令中心失败';
}

function matchesQuery(command: CommandTemplate, query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    const haystack = [
        command.command_text,
        command.summary,
        command.category?.name ?? '',
        ...command.tags,
    ].join(' ').toLowerCase();

    return haystack.includes(normalizedQuery);
}

export default function CommandCenterPage() {
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const categoriesQuery = useCommandCategories(true);
    const templatesQuery = useCommandTemplates(true);
    const { recordCopyMutation } = useCommandMutations();

    const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
    const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
    const defaultCategory = categories.find(category => category.is_default) ?? categories[0] ?? null;
    const activeSlug = selectedSlug ?? defaultCategory?.slug ?? ALL_CATEGORY;

    const filteredTemplates = useMemo(() => {
        return templates.filter(template => {
            const categorySlug = template.category?.slug;
            const matchesCategory = activeSlug === ALL_CATEGORY || categorySlug === activeSlug;
            return matchesCategory && matchesQuery(template, query);
        });
    }, [activeSlug, query, templates]);

    const favoriteCount = templates.filter(template => template.is_favorite).length;
    const categoryCount = categories.length;
    const activeCategoryName = activeSlug === ALL_CATEGORY
        ? '全部'
        : categories.find(category => category.slug === activeSlug)?.name ?? '默认';

    const handleCopy = useCallback(async (command: CommandTemplate) => {
        try {
            await navigator.clipboard.writeText(command.command_text);
            setCopiedId(command.id);
            recordCopyMutation.mutate({ id: command.id, copyCount: command.copy_count });
            window.setTimeout(() => setCopiedId(current => current === command.id ? null : current), 1600);
        } catch (error) {
            console.error('复制命令失败:', error);
        }
    }, [recordCopyMutation]);

    if (categoriesQuery.isLoading || templatesQuery.isLoading) {
        return (
            <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                加载命令中...
            </Card>
        );
    }

    if (categoriesQuery.isError || templatesQuery.isError) {
        return (
            <Card variant="subtle" className="p-card text-body-sm text-danger">
                {resolveErrorMessage(categoriesQuery.error ?? templatesQuery.error)}
            </Card>
        );
    }

    return (
        <div className="space-y-3 xl:space-y-4">
            <PageHero
                compact
                eyebrow="系统 / 命令"
                icon={<TerminalSquare size={18} className="text-accent" />}
                title="命令"
                description="常用命令速查板：一句话说明，点一下复制。默认展示高频启用，其它分类用于快速查询。"
                stats={[
                    { label: '命令', value: templates.length, meta: activeCategoryName, tone: 'accent' },
                    { label: '高频', value: favoriteCount, meta: '默认优先', tone: 'warning' },
                    { label: '分类', value: categoryCount, meta: '可配置', tone: 'success' },
                    { label: '当前', value: filteredTemplates.length, meta: query ? '搜索结果' : '可见', tone: 'blue' },
                ]}
            />

            <Card variant="subtle" className="p-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="relative xl:w-[360px]">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <Input
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            placeholder="搜索 audit、smartui、rok ctx..."
                            className="pl-9"
                        />
                    </div>

                    <div className="glass-filter-bar flex flex-wrap items-center">
                        <button
                            type="button"
                            onClick={() => setSelectedSlug(ALL_CATEGORY)}
                            className={`glass-filter-chip text-caption ${activeSlug === ALL_CATEGORY ? 'glass-filter-chip-active font-medium text-text-primary' : ''}`}
                        >
                            全部
                        </button>
                        {categories.map(category => (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => setSelectedSlug(category.slug)}
                                className={`glass-filter-chip text-caption ${activeSlug === category.slug ? 'glass-filter-chip-active font-medium text-text-primary' : ''}`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {filteredTemplates.length === 0 ? (
                <Card variant="subtle" className="p-card text-center text-body-sm text-text-tertiary">
                    没有找到匹配命令，可以在系统配置里新增或启用命令模板。
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {filteredTemplates.map(command => (
                        <CommandCard
                            key={command.id}
                            command={command}
                            copied={copiedId === command.id}
                            onCopy={handleCopy}
                        />
                    ))}
                </div>
            )}

            <div className="flex items-center gap-2 text-caption text-text-tertiary">
                <Command size={14} />
                <span>分类、排序和命令内容都可以在系统配置 / 命令中维护。</span>
            </div>
        </div>
    );
}

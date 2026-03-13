'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { configApi } from '../api/configApi';
import { ConfigItemRow } from './ConfigItemRow';
import type { ConfigItem, ScopeMeta } from '../types';
import { Button, Card, Input } from '@/components/ui';

interface ConfigScopeSectionProps {
    meta: ScopeMeta;
    initialItems: ConfigItem[];
}

export function ConfigScopeSection({ meta, initialItems }: ConfigScopeSectionProps) {
    const [items, setItems] = useState<ConfigItem[]>(initialItems);
    const [expanded, setExpanded] = useState(true);
    const [newLabel, setNewLabel] = useState('');

    const reload = useCallback(async () => {
        try {
            const data = await configApi.getAllByScope(meta.scope);
            setItems(data);
        } catch (err) {
            console.error(`加载配置 [${meta.scope}] 失败:`, err);
        }
    }, [meta.scope]);

    const addMutation = useMutation({
        mutationFn: async (label: string) => {
            const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0);
            await configApi.create({
                scope: meta.scope,
                value: label,
                label,
                sort_order: maxOrder + 1,
            });
        },
        onSuccess: () => {
            setNewLabel('');
            reload();
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            configApi.toggleActive(id, isActive),
        onSuccess: () => reload(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => configApi.delete(id),
        onSuccess: () => reload(),
    });

    const handleAdd = useCallback(() => {
        const trimmed = newLabel.trim();
        if (!trimmed) return;
        if (items.some(i => i.label === trimmed || i.value === trimmed)) {
            alert('该配置项已存在');
            return;
        }
        addMutation.mutate(trimmed);
    }, [newLabel, items, addMutation]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    }, [handleAdd]);

    const handleDelete = useCallback((id: string) => {
        if (!confirm('删除后不可恢复，确定删除？')) return;
        deleteMutation.mutate(id);
    }, [deleteMutation]);

    const handleToggle = useCallback((id: string, isActive: boolean) => {
        toggleMutation.mutate({ id, isActive });
    }, [toggleMutation]);

    const activeCount = items.filter(i => i.is_active).length;

    return (
        <Card variant="subtle" className="overflow-hidden p-0">
            {/* Header */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="flex w-full items-center justify-between p-4 transition-colors duration-normal ease-standard hover:bg-panel-bg/90"
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-body font-semibold text-text-primary">{meta.label}</h3>
                    <span className="glass-mini-chip text-caption">
                        {activeCount} / {items.length}
                    </span>
                </div>
                {expanded ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}
            </button>

            {expanded && (
                <div className="space-y-3 px-4 pb-4">
                    <p className="text-body-sm text-text-tertiary">{meta.description}</p>

                    {/* Items list */}
                    <div className="space-y-1.5">
                        {items.map(item => (
                            <ConfigItemRow
                                key={item.id}
                                item={item}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                                deleting={deleteMutation.isPending}
                            />
                        ))}
                        {items.length === 0 && (
                            <div className="rounded-[1rem] border border-dashed border-glass-border bg-panel-bg/65 px-4 py-5 text-center text-body-sm text-text-tertiary">
                                暂无配置项
                            </div>
                        )}
                    </div>

                    {/* Add new */}
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入新配置项名称..."
                            className="flex-1"
                        />
                        <Button onClick={handleAdd} disabled={!newLabel.trim() || addMutation.isPending} variant="tinted" size="sm" className="gap-1">
                            <Plus size={14} />
                            添加
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}

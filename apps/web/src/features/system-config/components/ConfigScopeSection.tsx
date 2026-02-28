'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { configApi } from '../api/configApi';
import { ConfigItemRow } from './ConfigItemRow';
import type { ConfigItem, ScopeMeta } from '../types';

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
        <div className="card">
            {/* Header */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between p-4 hover:bg-bg-tertiary/50 rounded-t-xl transition-colors"
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-text-primary">{meta.label}</h3>
                    <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
                        {activeCount} / {items.length}
                    </span>
                </div>
                {expanded ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3">
                    <p className="text-sm text-text-tertiary">{meta.description}</p>

                    {/* Items list */}
                    <div className="space-y-2">
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
                            <p className="text-sm text-text-tertiary text-center py-4">暂无配置项</p>
                        )}
                    </div>

                    {/* Add new */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入新配置项名称..."
                            className="flex-1 px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newLabel.trim() || addMutation.isPending}
                            className="btn-primary px-3 py-2 text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                            <Plus size={14} />
                            添加
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

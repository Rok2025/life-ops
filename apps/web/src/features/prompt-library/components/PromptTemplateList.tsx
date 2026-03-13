'use client';

import { Star, Copy, Trash2 } from 'lucide-react';
import type { PromptTemplate } from '../types';
import { TONES } from '@/design-system/tokens';

interface PromptTemplateListProps {
    templates: PromptTemplate[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onToggleFavorite: (template: PromptTemplate) => void;
    onDuplicate: (template: PromptTemplate) => void;
    onDelete: (template: PromptTemplate) => void;
    pendingDeleteId?: string | null;
}

export default function PromptTemplateList({
    templates,
    selectedId,
    onSelect,
    onToggleFavorite,
    onDuplicate,
    onDelete,
    pendingDeleteId,
}: PromptTemplateListProps) {
    if (templates.length === 0) {
        return (
            <div className="rounded-card border border-glass-border bg-panel-bg/70 p-card text-body-sm text-text-secondary">
                当前筛选条件下没有模板。
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {templates.map((template) => {
                const isSelected = selectedId === template.id;
                const preview = template.content.replace(/\s+/g, ' ').slice(0, 90);

                return (
                    <button
                        key={template.id}
                        type="button"
                        onClick={() => onSelect(template.id)}
                        className={`glass-list-row w-full rounded-card p-3 text-left ${
                            isSelected
                                ? 'border-selection-border bg-selection-bg'
                                : ''
                        }`}
                    >
                        <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-body-sm font-semibold text-text-primary">{template.title}</span>
                                    {template.is_favorite && <Star size={14} className={`shrink-0 ${TONES.yellow.fill} ${TONES.yellow.color}`} />}
                                </div>
                                {template.description && (
                                    <p className="mt-1 line-clamp-1 text-caption text-text-secondary">{template.description}</p>
                                )}
                                <p className="mt-1 line-clamp-2 text-caption text-text-tertiary">{preview}</p>
                                <div className="mt-2 flex items-center gap-2 text-caption text-text-tertiary">
                                    <span>使用 {template.use_count} 次</span>
                                    <span>·</span>
                                    <span>{new Date(template.updated_at).toLocaleDateString('zh-CN')}</span>
                                </div>
                                {template.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {template.tags.slice(0, 3).map(tag => (
                                            <span
                                                key={`${template.id}-${tag}`}
                                                className="rounded-control bg-panel-bg px-1.5 py-0.5 text-caption text-text-secondary"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div
                                className="ml-1 flex shrink-0 items-center gap-1"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={() => onToggleFavorite(template)}
                                    className="rounded-control p-1.5 text-text-secondary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-text-primary"
                                    title={template.is_favorite ? '取消收藏' : '收藏'}
                                >
                                    <Star
                                        size={14}
                                        className={template.is_favorite ? `${TONES.yellow.fill} ${TONES.yellow.color}` : ''}
                                    />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDuplicate(template)}
                                    className="rounded-control p-1.5 text-text-secondary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-text-primary"
                                    title="复制模板"
                                >
                                    <Copy size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(template)}
                                    disabled={pendingDeleteId === template.id}
                                    className="rounded-control p-1.5 text-text-secondary hover:bg-danger/10 hover:text-danger disabled:opacity-50 transition-colors duration-normal ease-standard"
                                    title="删除"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

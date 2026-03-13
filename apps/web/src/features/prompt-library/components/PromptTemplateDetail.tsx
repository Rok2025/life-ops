'use client';

import { CalendarClock, Clipboard, Copy, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PromptTemplate } from '../types';
import { Button, Card } from '@/components/ui';

interface PromptTemplateDetailProps {
    template: PromptTemplate | null;
    onEdit: (template: PromptTemplate) => void;
    onCopy: (template: PromptTemplate) => void;
    onDuplicate: (template: PromptTemplate) => void;
    copyingId?: string | null;
}

export default function PromptTemplateDetail({
    template,
    onEdit,
    onCopy,
    onDuplicate,
    copyingId,
}: PromptTemplateDetailProps) {
    if (!template) {
        return (
            <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                从左侧选择一个模板查看详情。
            </Card>
        );
    }

    return (
        <Card className="p-card space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary">{template.title}</h2>
                    {template.description && (
                        <p className="mt-1 text-body-sm text-text-secondary">{template.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(template)}
                        className="rounded-control border border-glass-border bg-panel-bg px-2.5 py-1.5 text-caption text-text-secondary transition-colors duration-normal ease-standard hover:bg-card-bg"
                    >
                        <span className="inline-flex items-center gap-1">
                            <Pencil size={14} /> 编辑
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDuplicate(template)}
                        className="rounded-control border border-glass-border bg-panel-bg px-2.5 py-1.5 text-caption text-text-secondary transition-colors duration-normal ease-standard hover:bg-card-bg"
                    >
                        <span className="inline-flex items-center gap-1">
                            <Copy size={14} /> 复制副本
                        </span>
                    </button>
                    <Button
                        type="button"
                        onClick={() => onCopy(template)}
                        size="sm"
                        disabled={copyingId === template.id}
                        className="gap-1"
                    >
                        <Clipboard size={14} />
                        {copyingId === template.id ? '复制中...' : '复制内容'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-caption text-text-tertiary">
                <span className="inline-flex items-center gap-1 rounded-control bg-panel-bg px-2 py-1">
                    <CalendarClock size={12} /> 更新于 {new Date(template.updated_at).toLocaleString('zh-CN')}
                </span>
                <span className="rounded-control bg-panel-bg px-2 py-1">使用 {template.use_count} 次</span>
                {template.last_used_at && (
                    <span className="rounded-control bg-panel-bg px-2 py-1">
                        最近复制 {new Date(template.last_used_at).toLocaleString('zh-CN')}
                    </span>
                )}
                {template.tags.map(tag => (
                    <span key={tag} className="rounded-control bg-accent/10 px-2 py-1 text-accent">
                        #{tag}
                    </span>
                ))}
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-card border border-glass-border bg-panel-bg p-4">
                <div className="prose-custom">
                    {template.content.trim() ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{template.content}</ReactMarkdown>
                    ) : (
                        <p className="text-body-sm italic text-text-tertiary">暂无内容</p>
                    )}
                </div>
            </div>
        </Card>
    );
}

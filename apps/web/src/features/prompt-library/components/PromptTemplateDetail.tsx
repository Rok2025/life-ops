'use client';

import { CalendarClock, Clipboard, Copy, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PromptTemplate } from '../types';

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
            <div className="rounded-xl border border-border bg-bg-secondary/40 p-card text-sm text-text-secondary">
                从左侧选择一个模板查看详情。
            </div>
        );
    }

    return (
        <div className="card p-card space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary">{template.title}</h2>
                    {template.description && (
                        <p className="mt-1 text-sm text-text-secondary">{template.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(template)}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:bg-bg-tertiary"
                    >
                        <span className="inline-flex items-center gap-1">
                            <Pencil size={14} /> 编辑
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDuplicate(template)}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:bg-bg-tertiary"
                    >
                        <span className="inline-flex items-center gap-1">
                            <Copy size={14} /> 复制副本
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onCopy(template)}
                        className="btn-primary px-2.5 py-1.5 text-xs"
                        disabled={copyingId === template.id}
                    >
                        <span className="inline-flex items-center gap-1">
                            <Clipboard size={14} />
                            {copyingId === template.id ? '复制中...' : '复制内容'}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                <span className="inline-flex items-center gap-1 rounded-lg bg-bg-tertiary px-2 py-1">
                    <CalendarClock size={12} /> 更新于 {new Date(template.updated_at).toLocaleString('zh-CN')}
                </span>
                <span className="rounded-lg bg-bg-tertiary px-2 py-1">使用 {template.use_count} 次</span>
                {template.last_used_at && (
                    <span className="rounded-lg bg-bg-tertiary px-2 py-1">
                        最近复制 {new Date(template.last_used_at).toLocaleString('zh-CN')}
                    </span>
                )}
                {template.tags.map(tag => (
                    <span key={tag} className="rounded-lg bg-accent/10 px-2 py-1 text-accent">
                        #{tag}
                    </span>
                ))}
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-xl border border-border bg-bg-secondary p-4">
                <div className="prose-custom">
                    {template.content.trim() ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{template.content}</ReactMarkdown>
                    ) : (
                        <p className="text-sm italic text-text-tertiary">暂无内容</p>
                    )}
                </div>
            </div>
        </div>
    );
}

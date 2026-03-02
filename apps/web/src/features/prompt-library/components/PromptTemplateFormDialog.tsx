'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { PromptTemplate, PromptTemplateFormValues } from '../types';

interface PromptTemplateFormDialogProps {
    open: boolean;
    editingTemplate: PromptTemplate | null;
    submitting: boolean;
    onClose: () => void;
    onSubmit: (values: PromptTemplateFormValues) => void;
}

function parseTags(raw: string): string[] {
    return [...new Set(raw
        .split(/[\n,]/)
        .map(part => part.trim())
        .filter(Boolean)
        .slice(0, 10))];
}

export default function PromptTemplateFormDialog({
    open,
    editingTemplate,
    submitting,
    onClose,
    onSubmit,
}: PromptTemplateFormDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);

    const isEditing = !!editingTemplate;

    useEffect(() => {
        if (!open) return;

        setTitle(editingTemplate?.title ?? '');
        setDescription(editingTemplate?.description ?? '');
        setContent(editingTemplate?.content ?? '');
        setTagsInput((editingTemplate?.tags ?? []).join(', '));
        setIsFavorite(editingTemplate?.is_favorite ?? false);
    }, [open, editingTemplate]);

    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!title.trim() || !content.trim()) return;

        onSubmit({
            title: title.trim(),
            description: description.trim(),
            content: content.trim(),
            tags: parseTags(tagsInput),
            is_favorite: isFavorite,
        });
    }, [content, description, isFavorite, onSubmit, tagsInput, title]);

    useEffect(() => {
        if (!open) return;

        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeydown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeydown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    const tagsPreview = useMemo(() => parseTags(tagsInput), [tagsInput]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative mx-4 w-full max-w-2xl rounded-2xl border border-border bg-bg-primary shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <h2 className="text-base font-bold text-text-primary">
                        {isEditing ? '编辑提示词模板' : '新建提示词模板'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
                    <div>
                        <label className="mb-1 block text-xs text-text-secondary">标题 *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={event => setTitle(event.target.value)}
                            placeholder="例如：需求改动实施模板"
                            className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-text-secondary">描述</label>
                        <input
                            type="text"
                            value={description}
                            onChange={event => setDescription(event.target.value)}
                            placeholder="简要说明这个模板适用场景"
                            className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-text-secondary">标签（逗号或换行分隔）</label>
                        <textarea
                            value={tagsInput}
                            onChange={event => setTagsInput(event.target.value)}
                            rows={2}
                            placeholder="开发协作, 需求模板, PRD"
                            className="w-full resize-none rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                        />
                        {tagsPreview.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {tagsPreview.map(tag => (
                                    <span key={tag} className="rounded-md bg-accent/10 px-1.5 py-0.5 text-xs text-accent">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-text-secondary">模板内容 *</label>
                        <textarea
                            value={content}
                            onChange={event => setContent(event.target.value)}
                            rows={16}
                            placeholder="输入你的提示词模板..."
                            className="w-full rounded-xl border border-border bg-bg-tertiary px-3 py-2 font-mono text-sm leading-relaxed text-text-primary outline-none focus:border-accent"
                            required
                        />
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
                        <input
                            type="checkbox"
                            checked={isFavorite}
                            onChange={event => setIsFavorite(event.target.checked)}
                            className="h-4 w-4 rounded"
                        />
                        默认收藏
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !title.trim() || !content.trim()}
                            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                        >
                            {submitting ? '保存中...' : isEditing ? '保存' : '创建'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

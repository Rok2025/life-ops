'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Columns2, Edit3, Eye, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PromptTemplate, PromptTemplateFormValues } from '../types';

interface PromptTemplateFormDialogProps {
    editingTemplate: PromptTemplate | null;
    submitting: boolean;
    submitError: string | null;
    onClose: () => void;
    onSubmit: (values: PromptTemplateFormValues) => void;
}

type EditorMode = 'edit' | 'preview' | 'split';

function parseTags(raw: string): string[] {
    return [...new Set(raw
        .split(/[\n,，]/)
        .map(part => part.trim())
        .filter(Boolean)
        .slice(0, 10))];
}

export default function PromptTemplateFormDialog({
    editingTemplate,
    submitting,
    submitError,
    onClose,
    onSubmit,
}: PromptTemplateFormDialogProps) {
    const [title, setTitle] = useState(() => editingTemplate?.title ?? '');
    const [description, setDescription] = useState(() => editingTemplate?.description ?? '');
    const [content, setContent] = useState(() => editingTemplate?.content ?? '');
    const [tagsInput, setTagsInput] = useState(() => (editingTemplate?.tags ?? []).join(', '));
    const [isFavorite, setIsFavorite] = useState(() => editingTemplate?.is_favorite ?? false);
    const [editorMode, setEditorMode] = useState<EditorMode>('split');

    const isEditing = !!editingTemplate;

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
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeydown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeydown);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const tagsPreview = useMemo(() => parseTags(tagsInput), [tagsInput]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative mx-4 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-primary shadow-2xl">
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

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                        {submitError && (
                            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                                {submitError}
                            </div>
                        )}
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
                            <div className="mb-1 flex items-center justify-between">
                                <label className="block text-xs text-text-secondary">模板内容 *</label>
                                <div className="inline-flex items-center rounded-lg bg-bg-tertiary p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setEditorMode('edit')}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                                            editorMode === 'edit'
                                                ? 'bg-bg-primary text-text-primary shadow-sm'
                                                : 'text-text-tertiary hover:text-text-secondary'
                                        }`}
                                    >
                                        <Edit3 size={12} />
                                        编辑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditorMode('split')}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                                            editorMode === 'split'
                                                ? 'bg-bg-primary text-text-primary shadow-sm'
                                                : 'text-text-tertiary hover:text-text-secondary'
                                        }`}
                                    >
                                        <Columns2 size={12} />
                                        分栏
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditorMode('preview')}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                                            editorMode === 'preview'
                                                ? 'bg-bg-primary text-text-primary shadow-sm'
                                                : 'text-text-tertiary hover:text-text-secondary'
                                        }`}
                                    >
                                        <Eye size={12} />
                                        预览
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-border bg-bg-tertiary">
                                <div className={`grid ${editorMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                    {editorMode !== 'preview' && (
                                        <textarea
                                            value={content}
                                            onChange={event => setContent(event.target.value)}
                                            rows={14}
                                            placeholder="输入你的提示词模板（Markdown）..."
                                            className={`w-full resize-none bg-transparent px-3 py-2 font-mono text-sm leading-relaxed text-text-primary outline-none ${
                                                editorMode === 'split' ? 'md:border-r md:border-border' : ''
                                            }`}
                                        />
                                    )}
                                    {editorMode !== 'edit' && (
                                        <div className="min-h-[250px] overflow-y-auto bg-bg-secondary">
                                            <div className="prose-custom px-4 py-3">
                                                {content.trim() ? (
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                                                ) : (
                                                    <p className="text-sm italic text-text-tertiary">Markdown 预览将在这里显示</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-border px-3 py-1 text-right text-[11px] text-text-tertiary">
                                    {content.length} 字符 · {content.split('\n').length} 行
                                </div>
                            </div>
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
                    </div>

                    <div className="flex justify-end gap-2 border-t border-border bg-bg-primary px-5 py-3">
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

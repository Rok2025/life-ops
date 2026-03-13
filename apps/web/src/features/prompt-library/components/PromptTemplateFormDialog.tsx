'use client';

import { useCallback, useMemo, useState } from 'react';
import { Columns2, Edit3, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PromptTemplate, PromptTemplateFormValues } from '../types';
import { Button, Dialog, Input } from '@/components/ui';

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

    const tagsPreview = useMemo(() => parseTags(tagsInput), [tagsInput]);

    return (
        <Dialog
            open
            onClose={onClose}
            title={isEditing ? '编辑提示词模板' : '新建提示词模板'}
            maxWidth="2xl"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                        {submitError && (
                            <div className="rounded-card border border-danger/30 bg-danger/10 px-3 py-2 text-body-sm text-danger">
                                {submitError}
                            </div>
                        )}
                        <div>
                            <label className="mb-1 block text-caption text-text-secondary">标题 *</label>
                            <Input
                                type="text"
                                value={title}
                                onChange={event => setTitle(event.target.value)}
                                placeholder="例如：需求改动实施模板"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-caption text-text-secondary">描述</label>
                            <Input
                                type="text"
                                value={description}
                                onChange={event => setDescription(event.target.value)}
                                placeholder="简要说明这个模板适用场景"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-caption text-text-secondary">标签（逗号或换行分隔）</label>
                            <Input
                                multiline
                                value={tagsInput}
                                onChange={event => setTagsInput(event.target.value)}
                                rows={2}
                                placeholder="开发协作, 需求模板, PRD"
                                className="resize-none"
                            />
                            {tagsPreview.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {tagsPreview.map(tag => (
                                        <span key={tag} className="rounded-control bg-accent/10 px-1.5 py-0.5 text-caption text-accent">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="mb-1 flex items-center justify-between">
                                <label className="block text-caption text-text-secondary">模板内容 *</label>
                                <div className="inline-flex items-center rounded-control bg-bg-tertiary p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setEditorMode('edit')}
                                        className={`inline-flex items-center gap-1 rounded-control px-2 py-1 text-caption transition-colors duration-normal ease-standard ${
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
                                        className={`inline-flex items-center gap-1 rounded-control px-2 py-1 text-caption transition-colors duration-normal ease-standard ${
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
                                        className={`inline-flex items-center gap-1 rounded-control px-2 py-1 text-caption transition-colors duration-normal ease-standard ${
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

                            <div className="overflow-hidden rounded-card border border-border bg-bg-tertiary">
                                <div className={`grid ${editorMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                    {editorMode !== 'preview' && (
                                        <Input
                                            multiline
                                            value={content}
                                            onChange={event => setContent(event.target.value)}
                                            rows={14}
                                            placeholder="输入你的提示词模板（Markdown）..."
                                            className={`resize-none rounded-none border-0 bg-transparent font-mono leading-relaxed ${
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
                                                    <p className="text-body-sm italic text-text-tertiary">Markdown 预览将在这里显示</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-border px-3 py-1 text-right text-caption text-text-tertiary">
                                    {content.length} 字符 · {content.split('\n').length} 行
                                </div>
                            </div>
                        </div>

                        <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
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
                    <Button type="button" onClick={onClose} variant="ghost" size="sm">
                        取消
                    </Button>
                    <Button type="submit" disabled={submitting || !title.trim() || !content.trim()} size="sm">
                        {submitting ? '保存中...' : isEditing ? '保存' : '创建'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

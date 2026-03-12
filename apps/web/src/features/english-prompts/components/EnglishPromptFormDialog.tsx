'use client';

import { useCallback, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { ENGLISH_PROMPT_MODE_META } from '../types';
import type { EnglishPromptMode, EnglishPromptTemplate, EnglishPromptTemplateFormValues } from '../types';

interface EnglishPromptFormDialogProps {
    editingTemplate: EnglishPromptTemplate | null;
    submitting: boolean;
    submitError: string | null;
    onClose: () => void;
    onSubmit: (values: EnglishPromptTemplateFormValues) => void;
}

export default function EnglishPromptFormDialog({
    editingTemplate,
    submitting,
    submitError,
    onClose,
    onSubmit,
}: EnglishPromptFormDialogProps) {
    const [title, setTitle] = useState(() => editingTemplate?.title ?? '');
    const [description, setDescription] = useState(() => editingTemplate?.description ?? '');
    const [content, setContent] = useState(() => editingTemplate?.content ?? '');
    const [supportedModes, setSupportedModes] = useState<EnglishPromptMode[]>(
        () => editingTemplate?.supported_modes ?? ['concise'],
    );
    const [isActive, setIsActive] = useState(() => editingTemplate?.is_active ?? true);

    const isEditing = !!editingTemplate;

    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!title.trim() || !content.trim() || supportedModes.length === 0) return;

        onSubmit({
            title: title.trim(),
            description: description.trim(),
            content: content.trim(),
            supportedModes,
            isActive,
        });
    }, [content, description, isActive, onSubmit, supportedModes, title]);

    const selectedModeLabels = useMemo(
        () => ENGLISH_PROMPT_MODE_META
            .filter(item => supportedModes.includes(item.key))
            .map(item => item.label),
        [supportedModes],
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative mx-4 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-primary shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <div>
                        <h2 className="text-base font-bold text-text-primary">
                            {isEditing ? '编辑英语提示词' : '新建英语提示词'}
                        </h2>
                        <p className="text-xs text-text-tertiary mt-1">
                            为英语学习模块维护专用提示词，并绑定到简洁 / 详细 / 语法模式
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
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
                                placeholder="例如：商务英语简洁解析"
                                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                                autoFocus
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-text-secondary">描述</label>
                            <input
                                type="text"
                                value={description}
                                onChange={event => setDescription(event.target.value)}
                                placeholder="说明这个提示词适合什么场景"
                                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs text-text-secondary">适用模式 *</label>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {ENGLISH_PROMPT_MODE_META.map(item => {
                                    const checked = supportedModes.includes(item.key);

                                    return (
                                        <label
                                            key={item.key}
                                            className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                                                checked
                                                    ? 'border-accent bg-accent/10 text-text-primary'
                                                    : 'border-border bg-bg-tertiary text-text-secondary'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => setSupportedModes(prev => (
                                                        checked
                                                            ? prev.filter(mode => mode !== item.key)
                                                            : [...prev, item.key]
                                                    ))}
                                                    className="mt-0.5 h-4 w-4 rounded"
                                                />
                                                <div>
                                                    <p className="font-medium">{item.label}</p>
                                                    <p className="text-xs text-text-tertiary mt-1">{item.description}</p>
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                            {selectedModeLabels.length > 0 && (
                                <p className="mt-2 text-xs text-text-tertiary">
                                    已选模式：{selectedModeLabels.join(' / ')}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-text-secondary">提示词内容 *</label>
                            <textarea
                                value={content}
                                onChange={event => setContent(event.target.value)}
                                rows={16}
                                placeholder="输入英语模块专用提示词..."
                                className="w-full resize-y rounded-xl border border-border bg-bg-tertiary px-3 py-3 font-mono text-sm leading-relaxed text-text-primary outline-none focus:border-accent"
                                required
                            />
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={event => setIsActive(event.target.checked)}
                                className="h-4 w-4 rounded"
                            />
                            启用该提示词模板
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
                            disabled={submitting || !title.trim() || !content.trim() || supportedModes.length === 0}
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

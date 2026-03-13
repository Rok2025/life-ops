'use client';

import { useCallback, useMemo, useState } from 'react';
import { ENGLISH_PROMPT_MODE_META } from '../types';
import type { EnglishPromptMode, EnglishPromptTemplate, EnglishPromptTemplateFormValues } from '../types';
import { Button, Dialog, Input } from '@/components/ui';

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
        <Dialog
            open
            onClose={onClose}
            title={isEditing ? '编辑英语提示词' : '新建英语提示词'}
            maxWidth="2xl"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                        <p className="text-caption text-text-tertiary">
                            为英语学习模块维护专用提示词，并绑定到简洁 / 详细 / 语法模式
                        </p>
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
                                placeholder="例如：商务英语简洁解析"
                                autoFocus
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-caption text-text-secondary">描述</label>
                            <Input
                                type="text"
                                value={description}
                                onChange={event => setDescription(event.target.value)}
                                placeholder="说明这个提示词适合什么场景"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-caption text-text-secondary">适用模式 *</label>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {ENGLISH_PROMPT_MODE_META.map(item => {
                                    const checked = supportedModes.includes(item.key);

                                    return (
                                        <label
                                            key={item.key}
                                            className={`rounded-card border px-3 py-3 text-body-sm transition-colors duration-normal ease-standard ${
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
                                                    <p className="text-caption text-text-tertiary mt-1">{item.description}</p>
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                            {selectedModeLabels.length > 0 && (
                                <p className="mt-2 text-caption text-text-tertiary">
                                    已选模式：{selectedModeLabels.join(' / ')}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-caption text-text-secondary">提示词内容 *</label>
                            <Input
                                multiline
                                value={content}
                                onChange={event => setContent(event.target.value)}
                                rows={16}
                                placeholder="输入英语模块专用提示词..."
                                className="resize-y rounded-card font-mono leading-relaxed"
                                required
                            />
                        </div>

                        <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
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
                    <Button type="button" onClick={onClose} variant="ghost" size="sm">
                        取消
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || !title.trim() || !content.trim() || supportedModes.length === 0}
                        size="sm"
                    >
                        {submitting ? '保存中...' : isEditing ? '保存' : '创建'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

'use client';

import { useCallback, useState } from 'react';
import type { CommandCategory, CommandTemplate, CommandTemplateFormValues } from '../types';
import { Button, Checkbox, Dialog, Input, Select } from '@/components/ui';

interface CommandTemplateFormDialogProps {
    categories: CommandCategory[];
    editingTemplate: CommandTemplate | null;
    submitting: boolean;
    submitError: string | null;
    onClose: () => void;
    onSubmit: (values: CommandTemplateFormValues) => void;
}

export default function CommandTemplateFormDialog({
    categories,
    editingTemplate,
    submitting,
    submitError,
    onClose,
    onSubmit,
}: CommandTemplateFormDialogProps) {
    const firstCategoryId = categories[0]?.id ?? '';
    const [categoryId, setCategoryId] = useState(() => editingTemplate?.category_id ?? firstCategoryId);
    const [commandText, setCommandText] = useState(() => editingTemplate?.command_text ?? '');
    const [summary, setSummary] = useState(() => editingTemplate?.summary ?? '');
    const [tags, setTags] = useState(() => editingTemplate?.tags.join(', ') ?? '');
    const [sortOrder, setSortOrder] = useState(() => editingTemplate?.sort_order ?? 0);
    const [isFavorite, setIsFavorite] = useState(() => editingTemplate?.is_favorite ?? false);
    const [isActive, setIsActive] = useState(() => editingTemplate?.is_active ?? true);

    const isEditing = !!editingTemplate;

    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!categoryId || !commandText.trim() || !summary.trim()) return;

        onSubmit({
            categoryId,
            commandText: commandText.trim(),
            summary: summary.trim(),
            tags: tags.trim(),
            sortOrder,
            isFavorite,
            isActive,
        });
    }, [categoryId, commandText, isActive, isFavorite, onSubmit, sortOrder, summary, tags]);

    return (
        <Dialog
            open
            onClose={onClose}
            title={isEditing ? '编辑命令模板' : '新建命令模板'}
            maxWidth="2xl"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {submitError ? (
                        <div className="rounded-card border border-danger/30 bg-danger/10 px-3 py-2 text-body-sm text-danger">
                            {submitError}
                        </div>
                    ) : null}

                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">分类 *</label>
                        <Select
                            value={categoryId}
                            onChange={event => setCategoryId(event.target.value)}
                            required
                        >
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}{category.is_active ? '' : '（已停用）'}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">命令 *</label>
                        <Input
                            value={commandText}
                            onChange={event => setCommandText(event.target.value)}
                            placeholder="例如：rok ctx show"
                            className="font-mono"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">一句话介绍 *</label>
                        <Input
                            value={summary}
                            onChange={event => setSummary(event.target.value)}
                            placeholder="例如：查看当前 rok 本地上下文"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">标签</label>
                        <Input
                            value={tags}
                            onChange={event => setTags(event.target.value)}
                            placeholder="用逗号分隔，例如：rok, context"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">排序</label>
                        <Input
                            type="number"
                            value={sortOrder}
                            onChange={event => setSortOrder(Number(event.target.value))}
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Checkbox
                            checked={isFavorite}
                            onChange={event => setIsFavorite(event.target.checked)}
                            label="高频命令"
                            description="用于默认视图和排序优先级"
                        />
                        <Checkbox
                            checked={isActive}
                            onChange={event => setIsActive(event.target.checked)}
                            label="启用模板"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border bg-bg-primary px-5 py-3">
                    <Button type="button" onClick={onClose} variant="ghost" size="sm">
                        取消
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || !categoryId || !commandText.trim() || !summary.trim()}
                        size="sm"
                    >
                        {submitting ? '保存中...' : isEditing ? '保存' : '创建'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

'use client';

import { useCallback, useState } from 'react';
import type { CommandCategory, CommandCategoryFormValues } from '../types';
import { Button, Checkbox, Dialog, Input } from '@/components/ui';

interface CommandCategoryFormDialogProps {
    editingCategory: CommandCategory | null;
    submitting: boolean;
    submitError: string | null;
    onClose: () => void;
    onSubmit: (values: CommandCategoryFormValues) => void;
}

export default function CommandCategoryFormDialog({
    editingCategory,
    submitting,
    submitError,
    onClose,
    onSubmit,
}: CommandCategoryFormDialogProps) {
    const [name, setName] = useState(() => editingCategory?.name ?? '');
    const [slug, setSlug] = useState(() => editingCategory?.slug ?? '');
    const [description, setDescription] = useState(() => editingCategory?.description ?? '');
    const [sortOrder, setSortOrder] = useState(() => editingCategory?.sort_order ?? 0);
    const [isActive, setIsActive] = useState(() => editingCategory?.is_active ?? true);
    const [isDefault, setIsDefault] = useState(() => editingCategory?.is_default ?? false);

    const isEditing = !!editingCategory;

    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name.trim() || !slug.trim()) return;

        onSubmit({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim(),
            sortOrder,
            isActive,
            isDefault,
        });
    }, [description, isActive, isDefault, name, onSubmit, slug, sortOrder]);

    return (
        <Dialog
            open
            onClose={onClose}
            title={isEditing ? '编辑命令分类' : '新建命令分类'}
            maxWidth="lg"
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
                        <label className="mb-1 block text-caption text-text-secondary">分类名称 *</label>
                        <Input
                            value={name}
                            onChange={event => setName(event.target.value)}
                            placeholder="例如：高频启用"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">分类标识 *</label>
                        <Input
                            value={slug}
                            onChange={event => setSlug(event.target.value)}
                            placeholder="例如：high-frequency"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">简介</label>
                        <Input
                            value={description}
                            onChange={event => setDescription(event.target.value)}
                            placeholder="一句话说明这个分类的用途"
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
                            checked={isActive}
                            onChange={event => setIsActive(event.target.checked)}
                            label="启用分类"
                        />
                        <Checkbox
                            checked={isDefault}
                            disabled={editingCategory?.is_default}
                            onChange={event => setIsDefault(event.target.checked)}
                            label="设为默认分类"
                            description={editingCategory?.is_default ? '当前默认分类' : undefined}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border bg-bg-primary px-5 py-3">
                    <Button type="button" onClick={onClose} variant="ghost" size="sm">
                        取消
                    </Button>
                    <Button type="submit" disabled={submitting || !name.trim() || !slug.trim()} size="sm">
                        {submitting ? '保存中...' : isEditing ? '保存' : '创建'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { youyouApi } from '../api/youyouApi';
import { MILESTONE_CATEGORY_CONFIG } from '../types';
import type { MilestoneCategory, CreateMilestoneInput } from '../types';
import { Button, Dialog, Input, Select } from '@/components/ui';

interface MilestoneFormDialogProps {
    open: boolean;
    onClose: () => void;
}

export function MilestoneFormDialog({ open, onClose }: MilestoneFormDialogProps) {
    const queryClient = useQueryClient();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<MilestoneCategory>('language');
    const [expectedAgeMonths, setExpectedAgeMonths] = useState('');

    useEffect(() => {
        if (!open) return;
        queueMicrotask(() => {
            setTitle('');
            setDescription('');
            setCategory('language');
            setExpectedAgeMonths('');
        });
    }, [open]);

    const createMutation = useMutation({
        mutationFn: (input: CreateMilestoneInput) => youyouApi.createMilestone(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-milestones'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-milestone-stats'] });
            onClose();
        },
    });

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            const trimmed = title.trim();
            if (!trimmed) return;

            createMutation.mutate({
                category,
                title: trimmed,
                description: description || null,
                expected_age_months: expectedAgeMonths ? parseInt(expectedAgeMonths, 10) : null,
            });
        },
        [title, description, category, expectedAgeMonths, createMutation],
    );

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="新增里程碑"
            maxWidth="lg"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-4 px-5 py-4">
                    {/* 标题 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">里程碑名称 *</label>
                        <Input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="例如：能自己穿鞋"
                            autoFocus
                            required
                        />
                    </div>

                    {/* 类别 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">类别</label>
                        <Select
                            value={category}
                            onChange={e => setCategory(e.target.value as MilestoneCategory)}
                        >
                            {(Object.keys(MILESTONE_CATEGORY_CONFIG) as MilestoneCategory[]).map(cat => (
                                <option key={cat} value={cat}>
                                    {MILESTONE_CATEGORY_CONFIG[cat].emoji} {MILESTONE_CATEGORY_CONFIG[cat].label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* 描述 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">描述</label>
                        <Input
                            multiline
                            rows={2}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="补充说明（可选）"
                        />
                    </div>

                    {/* 预期月龄 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">预期月龄（可选）</label>
                        <Input
                            type="number"
                            value={expectedAgeMonths}
                            onChange={e => setExpectedAgeMonths(e.target.value)}
                            placeholder="例如 24（表示 2 岁左右）"
                            min="0"
                            max="120"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-glass-border px-5 py-3">
                    <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                        取消
                    </Button>
                    <Button type="submit" size="sm" disabled={!title.trim() || createMutation.isPending}>
                        {createMutation.isPending ? '保存中...' : '保存'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

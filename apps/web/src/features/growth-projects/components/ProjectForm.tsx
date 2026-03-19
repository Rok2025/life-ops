'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import { SCOPE_CONFIG, STATUS_CONFIG } from '../types';
import type { GrowthArea, ProjectWithStats, ProjectScope, ProjectStatus, CreateProjectInput, UpdateProjectInput } from '../types';
import { Button, Dialog, Input, SegmentedControl, Select } from '@/components/ui';

interface ProjectFormProps {
    open: boolean;
    onClose: () => void;
    area: GrowthArea;
    editingProject?: ProjectWithStats | null;
}

export function ProjectForm({ open, onClose, area, editingProject }: ProjectFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!editingProject;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scope, setScope] = useState<ProjectScope>('monthly');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<ProjectStatus>('active');

    useEffect(() => {
        queueMicrotask(() => {
            if (editingProject) {
                setTitle(editingProject.title);
                setDescription(editingProject.description ?? '');
                setScope(editingProject.scope);
                setStartDate(editingProject.start_date ?? '');
                setEndDate(editingProject.end_date ?? '');
                setStatus(editingProject.status);
            } else {
                setTitle('');
                setDescription('');
                setScope('monthly');
                setStartDate('');
                setEndDate('');
                setStatus('active');
            }
        });
    }, [editingProject]);

    const createMutation = useMutation({
        mutationFn: (input: CreateProjectInput) => projectsApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', area] });
            onClose();
        },
        onError: (error) => console.error('创建项目失败:', error),
    });

    const updateMutation = useMutation({
        mutationFn: (input: UpdateProjectInput) => projectsApi.update(editingProject!.id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', area] });
            onClose();
        },
        onError: (error) => console.error('更新项目失败:', error),
    });

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;

        if (isEditing) {
            updateMutation.mutate({
                title: trimmed,
                description: description || null,
                scope,
                start_date: startDate || null,
                end_date: endDate || null,
                status,
            });
        } else {
            createMutation.mutate({
                area,
                title: trimmed,
                description: description || undefined,
                scope,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            });
        }
    }, [title, description, scope, startDate, endDate, status, area, isEditing, createMutation, updateMutation]);

    if (!open) return null;

    const saving = createMutation.isPending || updateMutation.isPending;
    const scopeOptions = (Object.keys(SCOPE_CONFIG) as ProjectScope[]).map((scopeKey) => ({
        value: scopeKey,
        label: SCOPE_CONFIG[scopeKey].label,
    }));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={isEditing ? '编辑项目' : '新建项目'}
            maxWidth="lg"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-4 px-5 py-4">
                    {/* 标题 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">项目名称 *</label>
                        <Input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="输入项目名称"
                            autoFocus
                            required
                        />
                    </div>

                    {/* 描述 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">描述</label>
                        <Input
                            multiline
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="项目描述（可选）"
                            rows={2}
                            className="resize-none"
                        />
                    </div>

                    {/* Scope + Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">项目范围 *</label>
                            <SegmentedControl
                                value={scope}
                                onChange={(next) => setScope(next as ProjectScope)}
                                options={scopeOptions}
                                fullWidth
                                aria-label="项目范围"
                            />
                        </div>
                        {isEditing && (
                            <div>
                                <label className="block text-caption text-text-secondary mb-1">状态</label>
                                <Select
                                    value={status}
                                    onChange={e => setStatus(e.target.value as ProjectStatus)}
                                >
                                    {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map(s => (
                                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                    ))}
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* 日期 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">开始日期</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">结束日期</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* 按钮 */}
                <div className="flex justify-end gap-2 border-t border-border bg-bg-primary px-5 py-3">
                    <Button type="button" onClick={onClose} variant="ghost" size="sm">
                        取消
                    </Button>
                    <Button type="submit" disabled={saving || !title.trim()} size="sm">
                        {saving ? '保存中...' : isEditing ? '保存' : '创建'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

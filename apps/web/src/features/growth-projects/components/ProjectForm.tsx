'use client';

import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import { SCOPE_CONFIG, STATUS_CONFIG } from '../types';
import type { GrowthArea, ProjectWithStats, ProjectScope, ProjectStatus, CreateProjectInput, UpdateProjectInput } from '../types';

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

    // ESC 关闭
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    const saving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg mx-4 bg-bg-primary border border-border rounded-2xl shadow-2xl">
                {/* 顶栏 */}
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-border">
                    <h2 className="text-base font-bold text-text-primary">
                        {isEditing ? '编辑项目' : '新建项目'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* 表单 */}
                <form onSubmit={handleSubmit} className="px-5 py-3 space-y-3">
                    {/* 标题 */}
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">项目名称 *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="输入项目名称"
                            className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent"
                            autoFocus
                            required
                        />
                    </div>

                    {/* 描述 */}
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">描述</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="项目描述（可选）"
                            rows={2}
                            className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent resize-none"
                        />
                    </div>

                    {/* Scope + Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">项目范围 *</label>
                            <div className="flex items-center gap-1.5">
                                {(Object.keys(SCOPE_CONFIG) as ProjectScope[]).map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setScope(s)}
                                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                                            scope === s
                                                ? 'border-accent bg-accent/15 text-accent font-medium'
                                                : 'border-border bg-bg-tertiary text-text-secondary hover:border-text-tertiary'
                                        }`}
                                    >
                                        {SCOPE_CONFIG[s].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {isEditing && (
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">状态</label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value as ProjectStatus)}
                                    className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary outline-none focus:border-accent"
                                >
                                    {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map(s => (
                                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* 日期 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">开始日期</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">结束日期</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    {/* 按钮 */}
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !title.trim()}
                            className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                        >
                            {saving ? '保存中...' : isEditing ? '保存' : '创建'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

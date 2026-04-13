'use client';

import { useState } from 'react';
import { AlertTriangle, Calendar, Clock3, Edit2, Target, Trash2, MoreHorizontal } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import { DISPLAY_STATUS_CONFIG, SCOPE_CONFIG } from '../types';
import type { ProjectWithStats, GrowthArea } from '../types';
import { getProjectProgressMetrics } from '../utils/projectProgress';
import { Card } from '@/components/ui';

interface ProjectCardProps {
    project: ProjectWithStats;
    area: GrowthArea;
    selected?: boolean;
    onSelect: (project: ProjectWithStats) => void;
    onEdit: (project: ProjectWithStats) => void;
}

export function ProjectCard({ project, area, selected, onSelect, onEdit }: ProjectCardProps) {
    const queryClient = useQueryClient();
    const [showMenu, setShowMenu] = useState(false);

    const scopeConfig = SCOPE_CONFIG[project.scope];
    const metrics = getProjectProgressMetrics(project);
    const displayStatusConfig = DISPLAY_STATUS_CONFIG[metrics.displayStatus];

    const deleteMutation = useMutation({
        mutationFn: () => projectsApi.delete(project.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', area] });
        },
    });

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`确定删除项目「${project.title}」？相关的待办和灵感也会一并删除。`)) return;
        deleteMutation.mutate();
    };

    return (
        <div role="button" tabIndex={0} onClick={() => onSelect(project)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(project); } }}>
            <Card
                className={`p-3 cursor-pointer transition-all duration-normal ease-standard ${
                    selected
                        ? `${displayStatusConfig.cardClassName} border-selection-border shadow-sm ring-1 ring-selection-border/55`
                        : `${displayStatusConfig.cardClassName} hover:-translate-y-0.5`
                }`}
            >
            {/* 顶部行：状态点 + scope 标签 + 标题 + 操作 */}
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${displayStatusConfig.dot}`} title={metrics.statusLabel} />
                <span className={`text-caption px-1.5 py-0.5 rounded-control ${scopeConfig.bg} ${scopeConfig.color} shrink-0`}>
                    {scopeConfig.label}
                </span>
                <span className="text-body-sm font-medium text-text-primary flex-1 min-w-0 truncate">
                    {project.title}
                </span>
                {/* 更多操作 */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="rounded-control p-1 text-text-tertiary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-text-secondary"
                    >
                        <MoreHorizontal size={14} />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="glass-popover absolute right-0 top-full z-20 mt-1 min-w-[100px] rounded-card py-1">
                                <button
                                    onClick={() => { onEdit(project); setShowMenu(false); }}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-body-sm text-text-primary transition-colors duration-normal ease-standard hover:bg-panel-bg"
                                >
                                    <Edit2 size={12} /> 编辑
                                </button>
                                <button
                                    onClick={e => { handleDelete(e); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-body-sm text-danger hover:bg-danger/10 flex items-center gap-2 transition-colors duration-normal ease-standard"
                                >
                                    <Trash2 size={12} /> 删除
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 描述预览 */}
            {project.description && (
                <p className="mt-1 text-caption text-text-tertiary truncate">{project.description}</p>
            )}

            <div className="mt-2 flex items-center gap-2 text-caption">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${displayStatusConfig.bg} ${displayStatusConfig.border} ${displayStatusConfig.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${displayStatusConfig.dot}`} />
                    {metrics.statusLabel}
                </span>
                {metrics.isTodoLagging ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-warning">
                        <AlertTriangle size={12} />
                        进度偏慢
                    </span>
                ) : null}
            </div>

            {/* 底部信息：日期 + 待办进度 */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-tertiary">
                {metrics.dateRangeLabel && (
                    <span className="flex items-center gap-0.5">
                        <Calendar size={10} />
                        {metrics.dateRangeLabel}
                    </span>
                )}
                {project.todo_total > 0 && (
                    <span className="flex items-center gap-1">
                        <Target size={10} />
                        {project.todo_completed}/{project.todo_total}
                    </span>
                )}
                {metrics.displayStatus === 'not_started' && (
                    <span className="flex items-center gap-1">
                        <Clock3 size={10} />
                        {metrics.scheduleLabel}
                    </span>
                )}
            </div>

            {metrics.isTrackedByDate && (
                <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between gap-2 text-caption">
                        <span className={displayStatusConfig.color}>时间进度 {metrics.scheduleProgress}%</span>
                        <span className={metrics.displayStatus === 'overdue' ? 'text-danger' : 'text-text-secondary'}>
                            {metrics.scheduleLabel}
                        </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary/90">
                        <div
                            className={`h-full rounded-full transition-all duration-normal ease-standard ${displayStatusConfig.progressBar}`}
                            style={{ width: `${metrics.scheduleProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {project.todo_total > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-caption text-text-secondary">
                    <span className="shrink-0">任务进度</span>
                    <span className="shrink-0">{metrics.todoProgress}%</span>
                    <div className="max-w-[96px] flex-1 overflow-hidden rounded-full bg-bg-tertiary/90 h-1">
                        <div
                            className="h-full rounded-full bg-accent transition-all duration-normal ease-standard"
                            style={{ width: `${metrics.todoProgress}%` }}
                        />
                    </div>
                    {metrics.isTrackedByDate ? (
                        <span className={metrics.isTodoLagging ? 'text-warning' : 'text-text-tertiary'}>
                            对比时间
                        </span>
                    ) : null}
                </div>
            )}
            </Card>
        </div>
    );
}

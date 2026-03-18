'use client';

import { useState } from 'react';
import { Calendar, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import { SCOPE_CONFIG, STATUS_CONFIG } from '../types';
import type { ProjectWithStats, GrowthArea } from '../types';
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
    const statusConfig = STATUS_CONFIG[project.status];

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

    const todoProgress = project.todo_total > 0
        ? Math.round((project.todo_completed / project.todo_total) * 100)
        : 0;

    return (
        <div role="button" tabIndex={0} onClick={() => onSelect(project)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(project); } }}>
            <Card
                className={`p-3 cursor-pointer transition-all duration-normal ease-standard ${
                    selected ? 'border-selection-border bg-selection-bg shadow-sm' : 'bg-card-bg hover:-translate-y-0.5'
                }`}
            >
            {/* 顶部行：状态点 + scope 标签 + 标题 + 操作 */}
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`} title={statusConfig.label} />
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

            {/* 底部行：日期 + 待办进度 */}
            <div className="mt-1.5 flex items-center gap-3 text-caption text-text-tertiary">
                {(project.start_date || project.end_date) && (
                    <span className="flex items-center gap-0.5">
                        <Calendar size={10} />
                        {project.start_date?.slice(5)} ~ {project.end_date?.slice(5)}
                    </span>
                )}
                {project.todo_total > 0 && (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="shrink-0">{project.todo_completed}/{project.todo_total}</span>
                        <div className="max-w-[80px] flex-1 overflow-hidden rounded-full bg-bg-tertiary/90 h-1">
                            <div
                                className="h-full bg-accent rounded-full transition-all duration-normal ease-standard"
                                style={{ width: `${todoProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
            </Card>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Calendar, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import { SCOPE_CONFIG, STATUS_CONFIG } from '../types';
import type { ProjectWithStats, GrowthArea } from '../types';

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
        <div
            onClick={() => onSelect(project)}
            className={`rounded-xl p-3 cursor-pointer transition-all border ${
                selected
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-border bg-bg-secondary hover:shadow-md hover:border-border'
            }`}
        >
            {/* 顶部行：状态点 + scope 标签 + 标题 + 操作 */}
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`} title={statusConfig.label} />
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${scopeConfig.bg} ${scopeConfig.color} shrink-0`}>
                    {scopeConfig.label}
                </span>
                <span className="text-sm font-medium text-text-primary flex-1 min-w-0 truncate">
                    {project.title}
                </span>
                {/* 更多操作 */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 text-text-tertiary hover:text-text-secondary rounded transition-colors"
                    >
                        <MoreHorizontal size={14} />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 z-20 bg-bg-secondary border border-border rounded-lg shadow-lg py-1 min-w-[100px]">
                                <button
                                    onClick={() => { onEdit(project); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm text-text-primary hover:bg-bg-tertiary flex items-center gap-2"
                                >
                                    <Edit2 size={12} /> 编辑
                                </button>
                                <button
                                    onClick={e => { handleDelete(e); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-sm text-danger hover:bg-danger/10 flex items-center gap-2"
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
                <p className="mt-1 text-xs text-text-tertiary truncate">{project.description}</p>
            )}

            {/* 底部行：日期 + 待办进度 */}
            <div className="mt-1.5 flex items-center gap-3 text-[10px] text-text-tertiary">
                {(project.start_date || project.end_date) && (
                    <span className="flex items-center gap-0.5">
                        <Calendar size={10} />
                        {project.start_date?.slice(5)} ~ {project.end_date?.slice(5)}
                    </span>
                )}
                {project.todo_total > 0 && (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="shrink-0">{project.todo_completed}/{project.todo_total}</span>
                        <div className="flex-1 h-1 bg-bg-tertiary rounded-full overflow-hidden max-w-[80px]">
                            <div
                                className="h-full bg-accent rounded-full transition-all duration-300"
                                style={{ width: `${todoProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

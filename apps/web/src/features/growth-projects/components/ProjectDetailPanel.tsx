'use client';

import { useState, useEffect } from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useProjectTodos } from '../hooks/useProjectTodos';
import { useProjectNotes } from '../hooks/useProjectNotes';
import { TodoList } from './TodoList';
import { NoteList } from './NoteList';
import { SCOPE_CONFIG, STATUS_CONFIG } from '../types';
import type { ProjectWithStats } from '../types';

interface ProjectDetailPanelProps {
    project: ProjectWithStats;
    /** 移动端返回按钮回调 */
    onBack?: () => void;
}

export function ProjectDetailPanel({ project, onBack }: ProjectDetailPanelProps) {
    const { data: todos = [], isLoading: todosLoading } = useProjectTodos(project.id);
    const { data: notes = [], isLoading: notesLoading } = useProjectNotes(project.id);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const scopeConfig = SCOPE_CONFIG[project.scope];
    const statusConfig = STATUS_CONFIG[project.status];

    const timeProgress = (() => {
        if (!project.start_date || !project.end_date) return null;
        const start = new Date(project.start_date).getTime();
        const end = new Date(project.end_date).getTime();
        if (now < start) return 0;
        if (now > end) return 100;
        return Math.round(((now - start) / (end - start)) * 100);
    })();

    const todoProgress = project.todo_total > 0
        ? Math.round((project.todo_completed / project.todo_total) * 100)
        : 0;

    return (
        <div className="h-full flex flex-col">
            {/* 项目头部信息 */}
            <div className="space-y-3 border-b border-border/70 bg-panel-bg/78 p-card">
                {/* 移动端返回 + 标题行 */}
                <div className="flex items-start gap-2">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="md:hidden p-1 -ml-1 text-text-secondary hover:text-text-primary rounded-control transition-colors duration-normal ease-standard"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-caption px-1.5 py-0.5 rounded-control border ${scopeConfig.bg} ${scopeConfig.border} ${scopeConfig.color} shrink-0`}>
                                {scopeConfig.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-caption px-1.5 py-0.5 rounded-control border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} shrink-0`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                {statusConfig.label}
                            </span>
                        </div>
                        <h2 className="text-h3 text-text-primary mt-1">{project.title}</h2>
                    </div>
                </div>

                {/* 日期 + 进度 */}
                <div className="space-y-1.5">
                    {(project.start_date || project.end_date) && (
                        <div className="flex items-center gap-1 text-caption text-text-secondary">
                            <Calendar size={12} />
                            <span>{project.start_date ?? '?'} ~ {project.end_date ?? '?'}</span>
                        </div>
                    )}

                    {project.todo_total > 0 && (
                        <div>
                            <div className="flex items-center justify-between text-caption text-text-secondary mb-1">
                                <span>任务进度 {project.todo_completed}/{project.todo_total}</span>
                                <span>{todoProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent rounded-full transition-all duration-normal ease-standard"
                                    style={{ width: `${todoProgress}%` }}
                                />
                            </div>
                            {timeProgress !== null && (
                                <div className="flex justify-between mt-0.5">
                                    <span className="text-caption text-text-tertiary">任务 {todoProgress}%</span>
                                    <span className={`text-caption ${timeProgress > todoProgress ? 'text-warning' : 'text-text-tertiary'}`}>
                                        时间 {timeProgress}%
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 描述 */}
                {project.description && (
                    <p className="text-body-sm text-text-secondary leading-relaxed">{project.description}</p>
                )}
            </div>

            {/* 待办 + 灵感分区 */}
            <div className="flex-1 overflow-y-auto">
                {todosLoading || notesLoading ? (
                    <div className="p-card text-body-sm text-text-tertiary">加载中...</div>
                ) : (
                    <div className="divide-y divide-border/70">
                        {/* 待办事项区块 */}
                        <div className="p-card">
                            <TodoList projectId={project.id} todos={todos} />
                        </div>

                        {/* 灵感 & 成果区块 */}
                        <div className="p-card">
                            <NoteList projectId={project.id} notes={notes} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/** 空选状态占位 */
export function ProjectDetailEmpty() {
    return (
        <div className="h-full flex items-center justify-center text-text-tertiary">
            <div className="text-center">
                <div className="glass-icon-badge mx-auto mb-3 h-12 w-12 rounded-full text-xl">📋</div>
                <p className="text-body-sm text-text-secondary">选择一个项目查看详情</p>
                <p className="mt-1 text-caption text-text-tertiary">待办、灵感和时间进度会在这里展开。</p>
            </div>
        </div>
    );
}

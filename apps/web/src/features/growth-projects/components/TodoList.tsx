'use client';

import { useState, useCallback } from 'react';
import { Check, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChipGroup, DatePicker } from '@/components/ui';
import { formatDisplayDate, getLocalDateStr } from '@/lib/utils/date';
import { projectsApi } from '../api/projectsApi';
import type { ProjectTodo } from '../types';
import { handleCommandEnterFormSubmit } from '@/lib/shortcuts';
import { PRIORITY_CONFIG, TODO_PRIORITIES } from '@/features/quick-notes/types';
import type { TodoPriority } from '@/features/quick-notes/types';
import { buildCreateProjectTodoInput } from '../lib/projectTodoForm';

const PRIORITY_OPTIONS = TODO_PRIORITIES.map((priority) => {
    const config = PRIORITY_CONFIG[priority];
    return {
        value: priority,
        label: config.emoji ? `${config.emoji} ${config.label}` : config.label,
    };
});

interface TodoItemProps {
    todo: ProjectTodo;
    projectId: string;
    highlighted?: boolean;
}

export function TodoItem({ todo, projectId, highlighted = false }: TodoItemProps) {
    const queryClient = useQueryClient();
    const priority = todo.priority ?? 'normal';
    const priorityCfg = PRIORITY_CONFIG[priority];

    const toggleMutation = useMutation({
        mutationFn: () => projectsApi.toggleTodo(todo.id, !todo.is_completed),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-todos', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => projectsApi.deleteTodo(todo.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-todos', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    return (
        <div
            className={[
                'glass-list-row flex items-center gap-2 px-2 py-1.5',
                todo.is_completed ? 'opacity-50' : '',
                highlighted ? 'border-accent/35 bg-accent/10 ring-1 ring-accent/24' : '',
            ].filter(Boolean).join(' ')}
        >
            <button
                onClick={() => toggleMutation.mutate()}
                className={`w-4 h-4 rounded-control border flex items-center justify-center shrink-0 transition-colors duration-normal ease-standard ${
                    todo.is_completed
                        ? 'bg-success border-success text-white'
                        : 'border-border hover:border-accent'
                }`}
            >
                {todo.is_completed && <Check size={10} />}
            </button>
            <span className={`text-body-sm flex-1 min-w-0 truncate ${todo.is_completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                {todo.title}
            </span>
            <div className="hidden items-center gap-1.5 sm:flex">
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${priorityCfg.bg} ${priorityCfg.color}`}>
                    {priorityCfg.emoji ? `${priorityCfg.emoji} ${priorityCfg.label}` : priorityCfg.label}
                </span>
                <span className="rounded-full bg-bg-tertiary px-1.5 py-0.5 text-[11px] text-text-secondary">
                    {todo.execute_date ? formatDisplayDate(todo.execute_date) : '未安排'}
                </span>
            </div>
            <button
                onClick={() => deleteMutation.mutate()}
                className="p-0.5 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-control transition-colors duration-normal ease-standard shrink-0"
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
}

interface TodoListProps {
    projectId: string;
    todos: ProjectTodo[];
    highlightedTodoId?: string | null;
}

export function TodoList({ projectId, todos, highlightedTodoId = null }: TodoListProps) {
    const queryClient = useQueryClient();
    const [newTitle, setNewTitle] = useState('');
    const [executeDate, setExecuteDate] = useState(getLocalDateStr());
    const [priority, setPriority] = useState<TodoPriority>('normal');
    const [showCompleted, setShowCompleted] = useState(false);

    const activeTodos = todos.filter(t => !t.is_completed);
    const completedTodos = todos.filter(t => t.is_completed);
    const highlightedCompleted = completedTodos.some((todo) => todo.id === highlightedTodoId);

    const createMutation = useMutation({
        mutationFn: (title: string) => projectsApi.createTodo(buildCreateProjectTodoInput({
            projectId,
            title,
            executeDate,
            priority,
        })),
        onSuccess: () => {
            setNewTitle('');
            setExecuteDate(getLocalDateStr());
            setPriority('normal');
            queryClient.invalidateQueries({ queryKey: ['project-todos', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newTitle.trim();
        if (!trimmed) return;
        createMutation.mutate(trimmed);
    }, [newTitle, createMutation]);

    return (
        <div>
            <div className="mb-2 text-caption font-medium uppercase tracking-wide text-text-secondary">
                待办事项 ({activeTodos.length}{completedTodos.length > 0 ? ` · ✓${completedTodos.length}` : ''})
            </div>

            {/* 活跃待办 */}
            {activeTodos.length > 0 ? (
                <div className="space-y-0.5">
                    {activeTodos.map(todo => (
                        <TodoItem key={todo.id} todo={todo} projectId={projectId} highlighted={todo.id === highlightedTodoId} />
                    ))}
                </div>
            ) : (
                <p className="text-caption text-text-tertiary py-2 px-2">暂无待办事项</p>
            )}

            {/* 添加待办 */}
            <form onSubmit={handleSubmit} onKeyDown={handleCommandEnterFormSubmit} className="glass-list-row mt-2 space-y-2 px-2 py-2">
                <div className="flex items-center gap-1.5">
                    <Plus size={14} className="shrink-0 text-text-tertiary" />
                    <input
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="添加待办...（⌘ Enter）"
                        className="flex-1 text-body-sm bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary"
                    />
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <DatePicker
                        value={executeDate}
                        onChange={setExecuteDate}
                        clearable
                        placeholder="暂不指定执行日期"
                        ariaLabel="项目待办执行日期"
                    />
                    <ChipGroup<TodoPriority>
                        label="项目待办优先级"
                        name={`project-todo-priority-${projectId}`}
                        value={priority}
                        options={PRIORITY_OPTIONS}
                        onChange={setPriority}
                    />
                </div>
            </form>

            {/* 已完成待办（折叠区） */}
            {completedTodos.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/40">
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-1 text-caption text-text-tertiary hover:text-text-secondary transition-colors duration-normal ease-standard"
                    >
                        {showCompleted ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        已完成 ({completedTodos.length})
                    </button>
                    {(showCompleted || highlightedCompleted) && (
                        <div className="mt-1 space-y-0.5">
                            {completedTodos.map(todo => (
                                <TodoItem key={todo.id} todo={todo} projectId={projectId} highlighted={todo.id === highlightedTodoId} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useCallback } from 'react';
import { Check, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import type { ProjectTodo } from '../types';

interface TodoItemProps {
    todo: ProjectTodo;
    projectId: string;
}

export function TodoItem({ todo, projectId }: TodoItemProps) {
    const queryClient = useQueryClient();

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
        <div className={`glass-list-row flex items-center gap-2 px-2 py-1.5 ${todo.is_completed ? 'opacity-50' : ''}`}>
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
}

export function TodoList({ projectId, todos }: TodoListProps) {
    const queryClient = useQueryClient();
    const [newTitle, setNewTitle] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);

    const activeTodos = todos.filter(t => !t.is_completed);
    const completedTodos = todos.filter(t => t.is_completed);

    const createMutation = useMutation({
        mutationFn: (title: string) => projectsApi.createTodo({ project_id: projectId, title }),
        onSuccess: () => {
            setNewTitle('');
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
                        <TodoItem key={todo.id} todo={todo} projectId={projectId} />
                    ))}
                </div>
            ) : (
                <p className="text-caption text-text-tertiary py-2 px-2">暂无待办事项</p>
            )}

            {/* 添加待办 */}
            <form onSubmit={handleSubmit} className="glass-list-row mt-2 flex items-center gap-1.5 px-2 py-2">
                <Plus size={14} className="shrink-0 text-text-tertiary" />
                <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="添加待办..."
                    className="flex-1 text-body-sm bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary"
                />
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
                    {showCompleted && (
                        <div className="mt-1 space-y-0.5">
                            {completedTodos.map(todo => (
                                <TodoItem key={todo.id} todo={todo} projectId={projectId} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

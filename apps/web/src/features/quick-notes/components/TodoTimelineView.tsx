'use client';

import Link from 'next/link';
import { ArrowLeft, History, ListTodo } from 'lucide-react';
import { Card, SectionHeader, getButtonClassName } from '@/components/ui';
import { formatDisplayDate, formatFullDate, getLocalDateStr } from '@/lib/utils/date';
import { useTodos } from '../hooks/useTodos';
import type { QuickNote, TodoPriority } from '../types';
import { PRIORITY_CONFIG } from '../types';

interface TodoTimelineViewProps {
    embedded?: boolean;
    onRequestClose?: () => void;
}

const PRIORITY_ORDER: Record<TodoPriority, number> = {
    critical: 0,
    urgent: 1,
    important: 2,
    normal: 3,
};

type TimelineSource = 'execute' | 'completed' | 'created';

function getTimelineDateKey(todo: QuickNote) {
    if (todo.execute_date) return todo.execute_date;
    if (todo.completed_at) return getLocalDateStr(new Date(todo.completed_at));
    return getLocalDateStr(new Date(todo.created_at));
}

function getTimelineSource(todo: QuickNote): TimelineSource {
    if (todo.execute_date) return 'execute';
    if (todo.completed_at) return 'completed';
    return 'created';
}

function compareTodos(a: QuickNote, b: QuickNote) {
    if (a.is_completed !== b.is_completed) {
        return Number(a.is_completed) - Number(b.is_completed);
    }

    if (!a.is_completed) {
        const executeA = a.execute_date ? new Date(`${a.execute_date}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        const executeB = b.execute_date ? new Date(`${b.execute_date}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        if (executeA !== executeB) return executeA - executeB;

        const priorityA = PRIORITY_ORDER[a.priority ?? 'normal'];
        const priorityB = PRIORITY_ORDER[b.priority ?? 'normal'];
        if (priorityA !== priorityB) return priorityA - priorityB;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    const completedA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
    const completedB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
    if (completedA !== completedB) return completedB - completedA;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function getTodoStatus(todo: QuickNote, today: string) {
    if (todo.is_completed) {
        return { label: '已完成', className: 'bg-success/10 text-success' };
    }
    if (!todo.execute_date) {
        return { label: '未安排', className: 'bg-bg-tertiary text-text-secondary' };
    }
    if (todo.execute_date < today) {
        return { label: '已逾期', className: 'bg-warning/10 text-warning' };
    }
    if (todo.execute_date === today) {
        return { label: '今天', className: 'bg-accent/10 text-accent' };
    }
    return { label: '待执行', className: 'bg-selection-bg text-accent' };
}

function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function getTimelineMeta(todo: QuickNote) {
    const source = getTimelineSource(todo);

    switch (source) {
        case 'execute':
            return {
                label: '执行',
                value: formatDisplayDate(todo.execute_date ?? getTimelineDateKey(todo)),
            };
        case 'completed': {
            const dateKey = getTimelineDateKey(todo);
            return {
                label: '完成',
                value: formatDisplayDate(dateKey),
            };
        }
        case 'created':
        default: {
            const dateKey = getTimelineDateKey(todo);
            return {
                label: '创建',
                value: formatDisplayDate(dateKey),
            };
        }
    }
}

function buildTimelineGroups(todos: QuickNote[], today: string) {
    const groups = new Map<string, QuickNote[]>();

    for (const todo of todos) {
        const key = getTimelineDateKey(todo);
        const existing = groups.get(key) ?? [];
        existing.push(todo);
        groups.set(key, existing);
    }

    return Array.from(groups.entries())
        .sort(([dateA], [dateB]) => (dateA === dateB ? 0 : dateA > dateB ? -1 : 1))
        .map(([date, items]) => {
            const sortedItems = [...items].sort(compareTodos);
            const openCount = sortedItems.filter((todo) => !todo.is_completed).length;
            const completedCount = sortedItems.length - openCount;

            return {
                key: date,
                title: formatFullDate(date),
                subtitle: date === today ? '今天' : date < today ? '更早记录' : '后续安排',
                todos: sortedItems,
                openCount,
                completedCount,
                isToday: date === today,
            };
        });
}

function getTodoInlineSummary(todo: QuickNote) {
    const meta = getTimelineMeta(todo);
    const priority = todo.priority ?? 'normal';
    const priorityCfg = PRIORITY_CONFIG[priority];
    const parts = [] as string[];

    if (priority !== 'normal') {
        parts.push(priorityCfg.emoji ? `${priorityCfg.emoji} ${priorityCfg.label}` : priorityCfg.label);
    }

    parts.push(`${meta.label} ${meta.value}`);

    if (todo.completed_at) {
        parts.push(`完 ${formatTime(todo.completed_at)}`);
    }

    return parts.join(' · ');
}

function TodoTimelineRow({ todo, today }: { todo: QuickNote; today: string }) {
    const status = getTodoStatus(todo, today);
    const summary = getTodoInlineSummary(todo);
    const isOverdue = !todo.is_completed && Boolean(todo.execute_date && todo.execute_date < today);

    return (
        <div
            className={[
                'glass-list-row grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2 px-2.5 py-1.5 md:grid-cols-[10px_minmax(0,1.25fr)_minmax(0,0.9fr)_auto]',
                isOverdue ? 'border-warning/18' : 'border-white/5',
            ].filter(Boolean).join(' ')}
        >
            <span
                aria-hidden="true"
                className={[
                    'h-2 w-2 shrink-0 rounded-full',
                    todo.is_completed
                        ? 'bg-success'
                        : isOverdue
                            ? 'bg-warning'
                            : todo.execute_date === today
                                ? 'bg-accent'
                                : 'bg-text-tertiary/45',
                ].join(' ')}
            />

            <div className={[
                'truncate text-body-sm font-medium',
                todo.is_completed ? 'text-text-secondary line-through' : 'text-text-primary',
            ].join(' ')}>
                {todo.content}
            </div>

            <div className="hidden truncate text-caption text-text-tertiary md:block">
                {summary}
            </div>

            <div className="flex items-center justify-end gap-1.5">
                <span className="hidden text-caption text-text-tertiary lg:inline">{formatTime(todo.created_at)}</span>
                <span className={`rounded-full px-1.5 py-0 text-caption font-medium ${status.className}`}>
                    {status.label}
                </span>
            </div>
        </div>
    );
}

export function TodoTimelineView({ embedded = false, onRequestClose }: TodoTimelineViewProps) {
    const today = getLocalDateStr();
    const { data: todos = [], isLoading, error } = useTodos();
    const timelineGroups = buildTimelineGroups(todos, today);
    const openTodos = todos.filter((todo) => !todo.is_completed).length;
    const completedTodos = todos.length - openTodos;
    const timelineStats = [
        { label: '全部记录', value: todos.length, valueClassName: 'text-text-primary' },
        { label: '待执行', value: openTodos, valueClassName: 'text-warning' },
        { label: '已完成', value: completedTodos, valueClassName: 'text-success' },
        { label: '时间分组', value: timelineGroups.length, valueClassName: 'text-accent' },
    ];

    const timelineContent = isLoading ? (
        <div className="px-1 py-10 text-center text-body-sm text-text-secondary">加载中...</div>
    ) : error ? (
        <div className="rounded-inner-card border border-danger/24 bg-danger/7 px-4 py-4 text-body-sm text-danger">
            读取全部待办记录失败，请稍后再试。
        </div>
    ) : todos.length === 0 ? (
        <div className="rounded-inner-card border border-glass-border/55 bg-linear-to-r from-selection-bg/28 to-panel-bg/78 px-4 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/14">
                        <ListTodo size={18} />
                    </div>
                    <div>
                        <p className="text-body font-medium text-text-primary">还没有任何待办记录</p>
                        <p className="mt-1 text-body-sm text-text-secondary">
                            {embedded
                                ? '关闭弹窗后就可以在当前页右上角直接新建待办。'
                                : '先回到待办页创建一条，后面这里会自动按时间聚合。'}
                        </p>
                    </div>
                </div>

                {embedded ? (
                    <button
                        type="button"
                        onClick={onRequestClose}
                        className={getButtonClassName({
                            variant: 'tinted',
                            size: 'sm',
                            className: 'gap-2',
                        })}
                    >
                        <ArrowLeft size={14} />
                        关闭弹窗
                    </button>
                ) : (
                    <Link
                        href="/todos"
                        className={getButtonClassName({
                            variant: 'tinted',
                            size: 'sm',
                            className: 'gap-2',
                        })}
                    >
                        <ArrowLeft size={14} />
                        去创建待办
                    </Link>
                )}
            </div>
        </div>
    ) : (
        <div className="space-y-1.5">
            {timelineGroups.map((group) => (
                <div key={group.key} className="overflow-hidden rounded-inner-card border border-glass-border/45 bg-panel-bg/56 shadow-none">
                    <div className="grid gap-0 lg:grid-cols-[164px_minmax(0,1fr)]">
                        <div className="border-b border-glass-border/35 bg-bg-tertiary/22 px-3 py-2 lg:border-b-0 lg:border-r">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <div className="text-body-sm font-semibold text-text-primary">{group.title}</div>
                                <span className={[
                                    'inline-flex items-center rounded-full px-1.5 py-0 text-caption font-medium',
                                    group.isToday
                                        ? 'bg-accent/10 text-accent'
                                        : 'bg-panel-bg/85 text-text-secondary',
                                ].join(' ')}>
                                    {group.subtitle}
                                </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-1 text-caption text-text-secondary">
                                <span className="rounded-full bg-warning/8 px-1.5 py-0.5 text-warning">待 {group.openCount}</span>
                                <span className="rounded-full bg-success/8 px-1.5 py-0.5 text-success">完 {group.completedCount}</span>
                                <span className="rounded-full bg-panel-bg/90 px-1.5 py-0.5 text-text-secondary">共 {group.todos.length}</span>
                            </div>
                        </div>

                        <div className="space-y-0.5 px-2 py-2">
                            {group.todos.map((todo) => (
                                <TodoTimelineRow key={todo.id} todo={todo} today={today} />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className={embedded ? 'flex h-full min-h-0 flex-col gap-3 p-4 md:p-5' : 'space-y-4 pb-6 xl:space-y-5'}>
            <Card variant="subtle" className={embedded ? 'shrink-0 space-y-2.5 p-3.5' : 'p-card space-y-4'}>
                {embedded ? (
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/14">
                            <History size={16} />
                        </div>
                        <p className="text-body-sm font-medium text-text-primary">按时间查看全部待办</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5">
                                <div className="glass-icon-badge shrink-0">
                                    <History size={16} className="text-accent" />
                                </div>
                                <div>
                                    <h1 className="text-h2 text-text-primary">全部待办记录</h1>
                                </div>
                            </div>
                        </div>

                        <Link
                            href="/todos"
                            className={getButtonClassName({
                                variant: 'secondary',
                                size: 'sm',
                                className: 'gap-2',
                            })}
                        >
                            <ArrowLeft size={16} />
                            返回待办页
                        </Link>
                    </div>
                )}

                <div className="rounded-inner-card border border-glass-border/55 bg-panel-bg/76 px-2.5 py-1.5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:gap-x-5">
                        {timelineStats.map((stat) => (
                            <div key={stat.label} className="inline-flex items-baseline gap-1.5 whitespace-nowrap rounded-full px-1.5 py-0.5">
                                <span className="text-caption text-text-secondary">{stat.label}</span>
                                <span className={`text-body-sm font-semibold ${stat.valueClassName}`}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <Card variant="subtle" className={embedded ? 'min-h-0 flex-1 overflow-hidden p-0' : 'p-0'}>
                {embedded ? (
                    <div className="flex h-full min-h-0 flex-col p-4">
                        <div className="shrink-0">
                            <SectionHeader
                                title="时间线视图"
                                right={<span className="glass-mini-chip text-body-sm">{timelineGroups.length} 组</span>}
                            />
                        </div>
                        <div className="scrollbar-none mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                            {timelineContent}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 p-card">
                        <SectionHeader
                            title="时间线视图"
                            right={<span className="glass-mini-chip text-body-sm">{timelineGroups.length} 组</span>}
                        />
                        {timelineContent}
                    </div>
                )}
            </Card>
        </div>
    );
}

export default TodoTimelineView;
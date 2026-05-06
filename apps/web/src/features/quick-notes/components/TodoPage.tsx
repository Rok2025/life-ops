'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    Edit2,
    History,
    ListTodo,
    Plus,
    Trash2,
} from 'lucide-react';
import { formatDisplayDate, formatFullDate, getLocalDateStr, getWeekDateRange } from '@/lib/utils/date';
import { Button, Card, Dialog, SectionHeader, SegmentedControl } from '@/components/ui';
import type { SegmentedControlOption } from '@/components/ui';
import { notesApi } from '../api/notesApi';
import { useTodos } from '../hooks/useTodos';
import type { QuickNote, TodoPriority } from '../types';
import { PRIORITY_CONFIG } from '../types';
import { OverflowTooltipText } from './OverflowTooltipText';
import { TodoFormDialog, type TodoFormValues } from './TodoFormDialog';
import { TodoTimelineView } from './TodoTimelineView';

type TodoStatusFilter = 'open' | 'all' | 'completed';
type TodoScope = 'all' | 'today' | 'week' | 'month' | 'overdue' | 'unscheduled' | 'date';
type CalendarDaySummary = {
    total: number;
    open: number;
    completed: number;
};
type DateRange = {
    start: string;
    end: string;
};
type TodoDateGroup = {
    key: string;
    title: string;
    chip: {
        label: string;
        className: string;
    };
    openCount: number;
    todos: QuickNote[];
};
type TodoMetricTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const STATUS_OPTIONS: SegmentedControlOption[] = [
    { value: 'open', label: '待执行' },
    { value: 'all', label: '全部' },
    { value: 'completed', label: '已完成' },
];

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const PRIORITY_ORDER: Record<TodoPriority, number> = {
    critical: 0,
    urgent: 1,
    important: 2,
    normal: 3,
};

type ErrorWithMessage = {
    message?: string;
    details?: string;
    hint?: string;
};

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

function formatTodoError(error: unknown) {
    const fallback = '请稍后重试。';
    if (!error || typeof error !== 'object') return fallback;

    const { message, details, hint } = error as ErrorWithMessage;
    const parts = [message, details, hint].filter(Boolean);
    const rawMessage = parts.join(' ').trim();
    if (!rawMessage) return fallback;

    const normalized = rawMessage.toLowerCase();
    if (
        normalized.includes('execute_date')
        || normalized.includes('completed_at')
        || normalized.includes('priority')
        || normalized.includes('type')
        || normalized.includes('quick_notes_type_check')
        || normalized.includes('column')
    ) {
        return `${rawMessage} 当前数据库里的待办字段可能还没同步，请在项目根目录执行 supabase db push 后再试。`;
    }

    return rawMessage;
}

function getFirstDayOfMonth(year: number, month: number) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function toDateStr(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatMonthDay(dateStr: string) {
    const date = new Date(`${dateStr}T00:00:00`);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getMonthDateRange(date: Date = new Date()): DateRange {
    const year = date.getFullYear();
    const month = date.getMonth();
    return {
        start: toDateStr(year, month, 1),
        end: toDateStr(year, month, getDaysInMonth(year, month)),
    };
}

function isDateInRange(dateStr: string | null, start: string, end: string) {
    return Boolean(dateStr && dateStr >= start && dateStr <= end);
}

function getDateGroupTitle(dateStr: string | null, today: string) {
    if (!dateStr) return '未安排';
    if (dateStr === today) return '今天';
    return formatFullDate(dateStr);
}

function getDateGroupChip(dateStr: string | null, today: string, weekRange: DateRange, monthRange: DateRange, openCount: number) {
    if (!dateStr) {
        return {
            label: '未安排',
            className: 'bg-bg-tertiary text-text-secondary ring-text-primary/10',
        };
    }
    if (openCount > 0 && dateStr < today) {
        return {
            label: '逾期',
            className: 'bg-warning/10 text-warning ring-warning/18',
        };
    }
    if (dateStr === today) {
        return {
            label: '今天',
            className: 'bg-accent/10 text-accent ring-accent/18',
        };
    }
    if (isDateInRange(dateStr, weekRange.start, weekRange.end)) {
        return {
            label: '本周',
            className: 'bg-success/10 text-success ring-success/18',
        };
    }
    if (isDateInRange(dateStr, monthRange.start, monthRange.end)) {
        return {
            label: '本月',
            className: 'bg-selection-bg text-accent ring-selection-border',
        };
    }
    if (dateStr < today) {
        return {
            label: '历史',
            className: 'bg-bg-tertiary text-text-secondary ring-text-primary/10',
        };
    }
    return {
        label: '已排期',
        className: 'bg-panel-bg text-text-secondary ring-text-primary/10',
    };
}

function buildTodoDateGroups(todos: QuickNote[], today: string, weekRange: DateRange, monthRange: DateRange): TodoDateGroup[] {
    const groupMap = new Map<string, QuickNote[]>();

    for (const todo of todos) {
        const key = todo.execute_date ?? 'unscheduled';
        const current = groupMap.get(key) ?? [];
        current.push(todo);
        groupMap.set(key, current);
    }

    return Array.from(groupMap.entries())
        .sort(([a], [b]) => {
            if (a === 'unscheduled') return 1;
            if (b === 'unscheduled') return -1;
            return a.localeCompare(b);
        })
        .map(([key, groupTodos]) => {
            const dateStr = key === 'unscheduled' ? null : key;
            const openCount = groupTodos.filter((todo) => !todo.is_completed).length;

            return {
                key,
                title: getDateGroupTitle(dateStr, today),
                chip: getDateGroupChip(dateStr, today, weekRange, monthRange, openCount),
                openCount,
                todos: groupTodos,
            };
        });
}

function isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;

    const tagName = target.tagName;
    return target.isContentEditable
        || tagName === 'INPUT'
        || tagName === 'TEXTAREA'
        || tagName === 'SELECT'
        || Boolean(target.closest('[contenteditable="true"]'));
}

function getScopeButtonClass(active: boolean) {
    return [
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-medium whitespace-nowrap transition-colors duration-normal ease-standard',
        active
            ? 'border-selection-border bg-selection-bg text-accent'
            : 'border-glass-border bg-panel-bg text-text-secondary hover:bg-card-bg hover:text-text-primary',
    ].join(' ');
}

function getFocusPanelClass(tone: TodoMetricTone) {
    if (tone === 'danger') return 'border-danger/25 bg-danger/8 shadow-danger/10';
    if (tone === 'warning') return 'border-warning/25 bg-warning/10 shadow-warning/10';
    if (tone === 'success') return 'border-success/25 bg-success/10 shadow-success/10';
    return 'border-accent/20 bg-selection-bg/45 shadow-accent/8';
}

function getMetricButtonClass(active: boolean, tone: TodoMetricTone) {
    const base = 'rounded-inner-card border px-3 py-3 text-left transition-colors duration-normal ease-standard hover:bg-card-bg';
    if (active) return `${base} border-selection-border bg-selection-bg text-accent`;
    if (tone === 'danger') return `${base} border-danger/20 bg-danger/7 text-danger`;
    if (tone === 'warning') return `${base} border-warning/20 bg-warning/8 text-warning`;
    if (tone === 'success') return `${base} border-success/20 bg-success/8 text-success`;
    if (tone === 'accent') return `${base} border-accent/18 bg-selection-bg/45 text-accent`;
    return `${base} border-glass-border bg-panel-bg/75 text-text-primary`;
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

function getTodoDateLabel(todo: QuickNote, today: string) {
    if (!todo.execute_date) {
        return { label: '未安排', className: 'text-text-secondary' };
    }
    if (!todo.is_completed && todo.execute_date < today) {
        return { label: `逾期 ${formatDisplayDate(todo.execute_date)}`, className: 'text-warning' };
    }
    if (!todo.is_completed && todo.execute_date === today) {
        return { label: '今天', className: 'text-accent' };
    }
    return { label: formatDisplayDate(todo.execute_date), className: 'text-text-secondary' };
}

function buildCalendarSummaryMap(todos: QuickNote[]) {
    const summaryMap = new Map<string, CalendarDaySummary>();

    for (const todo of todos) {
        if (!todo.execute_date) continue;

        const current = summaryMap.get(todo.execute_date) ?? { total: 0, open: 0, completed: 0 };
        current.total += 1;
        if (todo.is_completed) {
            current.completed += 1;
        } else {
            current.open += 1;
        }
        summaryMap.set(todo.execute_date, current);
    }

    return summaryMap;
}

function getScopeSummaryLabel(scope: TodoScope, selectedDate: string | null) {
    if (scope === 'date' && selectedDate) {
        return formatDisplayDate(selectedDate);
    }

    switch (scope) {
        case 'today':
            return '今天';
        case 'week':
            return '本周';
        case 'month':
            return '本月';
        case 'overdue':
            return '逾期';
        case 'unscheduled':
            return '未安排';
        case 'all':
        default:
            return '全部';
    }
}

function getStatusSummaryLabel(statusFilter: TodoStatusFilter) {
    switch (statusFilter) {
        case 'completed':
            return '已完成';
        case 'open':
            return '待执行';
        case 'all':
        default:
            return '全部状态';
    }
}

function getEmptyStateCopy(scope: TodoScope, statusFilter: TodoStatusFilter, selectedDate: string | null) {
    if (scope === 'date' && selectedDate) {
        return {
            title: `${formatDisplayDate(selectedDate)} 暂时没有结果`,
            description: '可以给这一天补一条待办，或者切回全部继续浏览整个时间线。',
        };
    }
    if (scope === 'today') {
        return statusFilter === 'completed'
            ? {
                title: '今天还没有完成记录',
                description: '如果已经做完任务，勾选完成后就会出现在这里。',
            }
            : {
                title: '今天这一栏已经清空',
                description: '可以补一条今天要推进的事项，或者切去全部看看其他日期。',
            };
    }
    if (scope === 'week') {
        return {
            title: '本周没有匹配的待办',
            description: '可以切回全部看看其他安排，或者给本周补一条要推进的事项。',
        };
    }
    if (scope === 'month') {
        return {
            title: '本月没有匹配的待办',
            description: '可以切回全部看看完整时间线，或者给本月补一条计划。',
        };
    }
    if (scope === 'overdue') {
        return {
            title: '当前没有逾期待办',
            description: '这一组已经清干净了，可以切回全部继续安排后面的事项。',
        };
    }
    if (scope === 'unscheduled') {
        return {
            title: '没有未安排执行日的待办',
            description: '当前所有未完成事项都已经安排了日期，日历节奏是完整的。',
        };
    }
    if (statusFilter === 'completed') {
        return {
            title: '还没有已完成待办',
            description: '完成后勾选一下，这里就会逐步积累你的已办记录。',
        };
    }
    if (statusFilter === 'open') {
        return {
            title: '当前没有待执行待办',
            description: '你可以直接新建一条，或者查看全部确认最近的完成记录。',
        };
    }
    return {
        title: '当前筛选下没有待办',
        description: '切换筛选看看，或者直接新建一条新的待办。',
    };
}

function TodoListRow({
    todo,
    today,
    showDate = true,
    onToggleCompleted,
    onEdit,
    onDelete,
}: {
    todo: QuickNote;
    today: string;
    showDate?: boolean;
    onToggleCompleted: (id: string, completed: boolean) => void;
    onEdit: (todo: QuickNote) => void;
    onDelete: (id: string) => void;
}) {
    const priority = todo.priority ?? 'normal';
    const priorityCfg = PRIORITY_CONFIG[priority];
    const status = getTodoStatus(todo, today);
    const dateInfo = getTodoDateLabel(todo, today);
    const isOverdue = !todo.is_completed && Boolean(todo.execute_date && todo.execute_date < today);

    return (
        <div
            className={[
                'glass-list-row relative z-0 grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 hover:z-20 focus-within:z-20',
                showDate
                    ? 'md:grid-cols-[36px_minmax(0,1fr)_110px_110px_84px_56px]'
                    : 'md:grid-cols-[36px_minmax(0,1fr)_110px_84px_56px]',
                todo.is_completed ? 'opacity-75' : '',
                isOverdue ? 'border-warning/30' : '',
            ].filter(Boolean).join(' ')}
        >
            <button
                type="button"
                onClick={() => onToggleCompleted(todo.id, !todo.is_completed)}
                className={[
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors duration-normal ease-standard',
                    todo.is_completed
                        ? 'border-success bg-success text-white'
                        : 'border-glass-border hover:border-accent',
                ].join(' ')}
                aria-label={todo.is_completed ? '标记为未完成' : '标记为已完成'}
            >
                {todo.is_completed ? <Check size={10} /> : null}
            </button>

            <div className="min-w-0">
                <OverflowTooltipText
                    text={todo.content}
                    className={[
                        'truncate text-body-sm font-medium',
                        todo.is_completed ? 'text-text-secondary line-through' : 'text-text-primary',
                    ].join(' ')}
                />
                <div className="mt-1 flex flex-wrap items-center gap-2 text-caption text-text-secondary md:hidden">
                    {showDate ? <span className={dateInfo.className}>{dateInfo.label}</span> : null}
                    <span className={`rounded-full px-2 py-0.5 ${priorityCfg.bg} ${priorityCfg.color}`}>
                        {priorityCfg.emoji ? `${priorityCfg.emoji} ${priorityCfg.label}` : priorityCfg.label}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 ${status.className}`}>{status.label}</span>
                </div>
            </div>

            {showDate ? (
                <div className={`hidden text-body-sm md:block ${dateInfo.className}`}>
                    {dateInfo.label}
                </div>
            ) : null}

            <div className="hidden md:flex">
                <span className={`rounded-full px-2 py-0.5 text-caption ${priorityCfg.bg} ${priorityCfg.color}`}>
                    {priorityCfg.emoji ? `${priorityCfg.emoji} ${priorityCfg.label}` : priorityCfg.label}
                </span>
            </div>

            <div className="hidden md:flex">
                <span className={`rounded-full px-2 py-0.5 text-caption ${status.className}`}>{status.label}</span>
            </div>

            <div className="flex items-center justify-end gap-1">
                <button
                    type="button"
                    onClick={() => onEdit(todo)}
                    className="rounded-control p-1 text-text-secondary transition-colors duration-normal ease-standard hover:bg-bg-tertiary hover:text-text-primary"
                    aria-label="编辑待办"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(todo.id)}
                    className="rounded-control p-1 text-danger transition-colors duration-normal ease-standard hover:bg-danger/10"
                    aria-label="删除待办"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

function TodoCalendarPanel({
    todos,
    today,
    selectedDate,
    onSelectDate,
}: {
    todos: QuickNote[];
    today: string;
    selectedDate: string | null;
    onSelectDate: (date: string | null) => void;
}) {
    const todayParts = today.split('-').map(Number);
    const [viewYear, setViewYear] = useState(todayParts[0]);
    const [viewMonth, setViewMonth] = useState(todayParts[1] - 1);

    const summaryMap = buildCalendarSummaryMap(todos);
    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const monthEntries = Array.from(summaryMap.entries()).filter(([date]) => date.startsWith(monthKey));
    const monthTotal = monthEntries.reduce((sum, [, summary]) => sum + summary.total, 0);
    const monthOpen = monthEntries.reduce((sum, [, summary]) => sum + summary.open, 0);

    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const totalDays = getDaysInMonth(viewYear, viewMonth);

    const goToPrevMonth = () => {
        setViewMonth((current) => {
            if (current === 0) {
                setViewYear((year) => year - 1);
                return 11;
            }
            return current - 1;
        });
    };

    const goToNextMonth = () => {
        setViewMonth((current) => {
            if (current === 11) {
                setViewYear((year) => year + 1);
                return 0;
            }
            return current + 1;
        });
    };

    return (
        <Card variant="subtle" className="p-card space-y-4">
            <SectionHeader
                title="待办日历"
                description={`${viewYear}年${viewMonth + 1}月 · ${monthTotal} 项已排期 · ${monthOpen} 项待处理`}
                right={(
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={goToPrevMonth}
                            className="rounded-control p-1.5 text-text-secondary transition-colors duration-normal ease-standard hover:bg-bg-tertiary hover:text-text-primary"
                            aria-label="上一个月"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={goToNextMonth}
                            className="rounded-control p-1.5 text-text-secondary transition-colors duration-normal ease-standard hover:bg-bg-tertiary hover:text-text-primary"
                            aria-label="下一个月"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            />

            <div className="grid grid-cols-7 gap-1.5 text-center">
                {WEEKDAYS.map((weekday) => (
                    <div key={weekday} className="py-1 text-caption text-text-secondary">
                        {weekday}
                    </div>
                ))}

                {Array.from({ length: firstDay }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {Array.from({ length: totalDays }).map((_, index) => {
                    const day = index + 1;
                    const dateStr = toDateStr(viewYear, viewMonth, day);
                    const summary = summaryMap.get(dateStr);
                    const hasData = Boolean(summary);
                    const hasOpen = (summary?.open ?? 0) > 0;
                    const isOverdue = hasOpen && dateStr < today;
                    const isCompletedOnly = hasData && !hasOpen;
                    const isSelected = selectedDate === dateStr;
                    const isToday = today === dateStr;

                    return (
                        <button
                            key={dateStr}
                            type="button"
                            onClick={() => onSelectDate(isSelected ? null : dateStr)}
                            title={summary
                                ? `${dateStr} · 共 ${summary.total} 项，待处理 ${summary.open} 项`
                                : dateStr}
                            className={[
                                'relative flex aspect-square w-full items-center justify-center rounded-control px-2 py-1.5 transition-colors duration-normal ease-standard',
                                isSelected ? 'bg-selection-bg/72 shadow-sm ring-2 ring-accent/55 ring-offset-1 ring-offset-bg-primary' : '',
                                hasOpen
                                    ? isOverdue
                                        ? 'bg-danger/10 ring-1 ring-danger/35 hover:bg-danger/14'
                                        : 'bg-accent/12 ring-1 ring-accent/28 hover:bg-accent/16'
                                    : isCompletedOnly
                                        ? 'bg-success/10 ring-1 ring-success/30 hover:bg-success/14'
                                        : isToday
                                            ? 'bg-panel-bg/90 ring-1 ring-accent/35 hover:bg-panel-bg'
                                            : 'hover:bg-panel-bg/70',
                            ].join(' ')}
                        >
                            <span className={[
                                'text-body-sm font-medium',
                                hasOpen
                                    ? isOverdue
                                        ? 'text-danger'
                                        : 'text-accent'
                                    : isCompletedOnly
                                        ? 'text-success'
                                        : isToday
                                            ? 'text-accent'
                                            : 'text-text-primary',
                            ].join(' ')}>
                                {day}
                            </span>

                            {isToday ? (
                                <span
                                    aria-hidden="true"
                                    className={[
                                        'absolute bottom-1.5 h-1.5 w-1.5 rounded-full',
                                        isSelected ? 'bg-text-primary' : 'bg-accent',
                                    ].join(' ')}
                                />
                            ) : null}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-panel-bg px-2.5 py-1 text-caption font-medium text-text-primary ring-1 ring-text-primary/12">
                    今天
                </span>
                <span className="inline-flex items-center rounded-full bg-accent/12 px-2.5 py-1 text-caption font-medium text-accent ring-1 ring-accent/18">
                    待处理
                </span>
                <span className="inline-flex items-center rounded-full bg-danger/12 px-2.5 py-1 text-caption font-medium text-danger ring-1 ring-danger/18">
                    已逾期
                </span>
                <span className="inline-flex items-center rounded-full bg-success/12 px-2.5 py-1 text-caption font-medium text-success ring-1 ring-success/18">
                    已清空
                </span>
            </div>
        </Card>
    );
}

export default function TodoPage() {
    const queryClient = useQueryClient();
    const today = getLocalDateStr();
    const [statusFilter, setStatusFilter] = useState<TodoStatusFilter>('open');
    const [scope, setScope] = useState<TodoScope>('all');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState<QuickNote | null>(null);
    const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
    const { data: todos = [], isLoading, error: todosError } = useTodos();
    const weekRange = getWeekDateRange();
    const monthRange = getMonthDateRange();

    const refreshTodos = useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['todos'] }),
            queryClient.invalidateQueries({ queryKey: ['incomplete-todo-count'] }),
            queryClient.invalidateQueries({ queryKey: ['notes'] }),
            queryClient.invalidateQueries({ queryKey: ['notes-count'] }),
        ]);
    }, [queryClient]);

    const handleMutationError = useCallback((action: string, error: unknown) => {
        console.error(`${action}失败:`, error);
        alert(`${action}失败：${formatTodoError(error)}`);
    }, []);

    const createMutation = useMutation({
        mutationFn: (payload: TodoFormValues) => notesApi.createTodo(payload),
        onSuccess: async () => {
            setCreateDialogOpen(false);
            setStatusFilter('open');
            await refreshTodos();
        },
        onError: (error) => handleMutationError('添加待办', error),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, completed }: { id: string; completed: boolean }) => notesApi.toggleCompleted(id, completed),
        onSuccess: async () => refreshTodos(),
        onError: (error) => handleMutationError('更新待办状态', error),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => notesApi.delete(id),
        onSuccess: async () => refreshTodos(),
        onError: (error) => handleMutationError('删除待办', error),
    });

    const updateMutation = useMutation({
        mutationFn: (payload: { id: string; content: string; execute_date: string | null; priority: TodoPriority | null }) => {
            return notesApi.update(payload.id, {
                content: payload.content,
                execute_date: payload.execute_date,
                priority: payload.priority,
            });
        },
        onSuccess: async () => {
            setEditingTodo(null);
            await refreshTodos();
        },
        onError: (error) => handleMutationError('保存待办', error),
    });

    const handleDelete = useCallback((id: string) => {
        if (!confirm('确定删除这条待办吗？')) return;
        deleteMutation.mutate(id);
    }, [deleteMutation]);

    const sortedTodos = [...todos].sort(compareTodos);
    const openTodos = sortedTodos.filter((todo) => !todo.is_completed);
    const todayOpenTodos = openTodos.filter((todo) => todo.execute_date === today);
    const overdueOpenTodos = openTodos.filter((todo) => todo.execute_date && todo.execute_date < today);
    const futureOpenTodos = openTodos.filter((todo) => todo.execute_date && todo.execute_date > today);
    const unscheduledOpenTodos = openTodos.filter((todo) => !todo.execute_date);
    const todayScheduledTodos = sortedTodos.filter((todo) => todo.execute_date === today).length;
    const todayTodos = todayOpenTodos.length;
    const weekTodos = openTodos.filter((todo) => isDateInRange(todo.execute_date, weekRange.start, weekRange.end)).length;
    const weekCompletedTodos = sortedTodos.filter((todo) => todo.is_completed && isDateInRange(todo.execute_date, weekRange.start, weekRange.end)).length;
    const monthTodos = openTodos.filter((todo) => isDateInRange(todo.execute_date, monthRange.start, monthRange.end)).length;
    const monthCompletedTodos = sortedTodos.filter((todo) => todo.is_completed && isDateInRange(todo.execute_date, monthRange.start, monthRange.end)).length;
    const todayCompletedTodos = sortedTodos.filter((todo) => todo.execute_date === today && todo.is_completed).length;
    const overdueTodos = overdueOpenTodos.length;
    const unscheduledTodos = unscheduledOpenTodos.length;
    const selectedDateTodos = selectedDate ? sortedTodos.filter((todo) => todo.execute_date === selectedDate) : [];
    const todosErrorMessage = todosError ? formatTodoError(todosError) : null;
    const focusTodo = overdueOpenTodos[0] ?? todayOpenTodos[0] ?? futureOpenTodos[0] ?? unscheduledOpenTodos[0] ?? null;
    const focusState = (() => {
        if (overdueOpenTodos.length > 0 && focusTodo) {
            return {
                tone: 'danger' as const,
                eyebrow: '先清风险',
                title: `${overdueOpenTodos.length} 项逾期`,
                description: focusTodo.content,
                meta: focusTodo.execute_date ? `最早 ${formatDisplayDate(focusTodo.execute_date)}` : '未设置执行日',
                actionLabel: '查看逾期',
                actionScope: 'overdue' as const,
            };
        }
        if (todayOpenTodos.length > 0 && focusTodo) {
            return {
                tone: 'warning' as const,
                eyebrow: '今日焦点',
                title: `${todayOpenTodos.length} 项待处理`,
                description: focusTodo.content,
                meta: `${todayCompletedTodos} 项已完成`,
                actionLabel: '查看今天',
                actionScope: 'today' as const,
            };
        }
        if (futureOpenTodos.length > 0 && focusTodo) {
            const isFocusInWeek = isDateInRange(focusTodo.execute_date, weekRange.start, weekRange.end);
            const isFocusInMonth = isDateInRange(focusTodo.execute_date, monthRange.start, monthRange.end);

            return {
                tone: 'accent' as const,
                eyebrow: '下一件排期',
                title: focusTodo.execute_date ? formatDisplayDate(focusTodo.execute_date) : '近期安排',
                description: focusTodo.content,
                meta: `本周 ${weekTodos} 项待处理`,
                actionLabel: isFocusInWeek ? '查看本周' : isFocusInMonth ? '查看本月' : '查看全部',
                actionScope: isFocusInWeek ? 'week' as const : isFocusInMonth ? 'month' as const : 'all' as const,
            };
        }
        if (unscheduledOpenTodos.length > 0 && focusTodo) {
            return {
                tone: 'neutral' as const,
                eyebrow: '需要补日期',
                title: `${unscheduledOpenTodos.length} 项未安排`,
                description: focusTodo.content,
                meta: '补上执行日后会进入日历',
                actionLabel: '查看未安排',
                actionScope: 'unscheduled' as const,
            };
        }
        return {
            tone: 'success' as const,
            eyebrow: '今日焦点',
            title: '当前已清空',
            description: '今天没有待处理事项，可以继续保持节奏，或提前安排下一件事。',
            meta: `${monthCompletedTodos} 项本月已完成`,
            actionLabel: '查看全部',
            actionScope: 'all' as const,
        };
    })();
    const overviewMetrics = [
        { scope: 'week' as const, label: '本周待处理', value: weekTodos, meta: `已完成 ${weekCompletedTodos}`, tone: 'success' as const },
        { scope: 'month' as const, label: '本月待处理', value: monthTodos, meta: `已完成 ${monthCompletedTodos}`, tone: 'accent' as const },
        { scope: 'overdue' as const, label: '逾期', value: overdueTodos, meta: overdueTodos > 0 ? '需要优先清理' : '没有风险', tone: 'danger' as const },
        { scope: 'unscheduled' as const, label: '未安排', value: unscheduledTodos, meta: unscheduledTodos > 0 ? '需要补执行日' : '排期完整', tone: 'neutral' as const },
    ];
    const scopeButtons = [
        { value: 'all' as const, label: '全部', count: sortedTodos.length },
        { value: 'today' as const, label: '今天', count: todayTodos },
        { value: 'week' as const, label: '本周', count: weekTodos },
        { value: 'month' as const, label: '本月', count: monthTodos },
        { value: 'overdue' as const, label: '逾期', count: overdueTodos },
        { value: 'unscheduled' as const, label: '未安排', count: unscheduledTodos },
    ];

    const visibleTodos = sortedTodos.filter((todo) => {
        if (statusFilter === 'open' && todo.is_completed) return false;
        if (statusFilter === 'completed' && !todo.is_completed) return false;

        switch (scope) {
            case 'today':
                return todo.execute_date === today;
            case 'week':
                return isDateInRange(todo.execute_date, weekRange.start, weekRange.end);
            case 'month':
                return isDateInRange(todo.execute_date, monthRange.start, monthRange.end);
            case 'overdue':
                return !todo.is_completed && Boolean(todo.execute_date && todo.execute_date < today);
            case 'unscheduled':
                return !todo.is_completed && !todo.execute_date;
            case 'date':
                return selectedDate ? todo.execute_date === selectedDate : true;
            case 'all':
            default:
                return true;
        }
    });
    const visibleTodoGroups = buildTodoDateGroups(visibleTodos, today, weekRange, monthRange);

    const createDialogDefaults: Partial<TodoFormValues> = {
        execute_date: scope === 'date' && selectedDate ? selectedDate : today,
        priority: 'normal',
    };
    const emptyStateCopy = getEmptyStateCopy(scope, statusFilter, selectedDate);
    const activeScopeLabel = getScopeSummaryLabel(scope, selectedDate);
    const activeStatusLabel = getStatusSummaryLabel(statusFilter);

    const listDescription = (() => {
        if (scope === 'date' && selectedDate) {
            return `已聚焦到这一天，右侧只显示当天待办。`;
        }
        if (scope === 'today') {
            return '只看今天需要推进的安排。';
        }
        if (scope === 'week') {
            return `只看本周 ${formatMonthDay(weekRange.start)} - ${formatMonthDay(weekRange.end)} 的安排。`;
        }
        if (scope === 'month') {
            return '只看本月已安排执行日期的待办。';
        }
        if (scope === 'overdue') {
            return '只看已经到期但还没处理完的待办。';
        }
        if (scope === 'unscheduled') {
            return '这些待办还没有执行日期，不会进入日历。';
        }
        return '按执行日期分组展示，不同日期的事项会各自收在同一个日期下面。';
    })();

    const handleSelectScope = (nextScope: Exclude<TodoScope, 'date'>) => {
        setScope(nextScope);
        setSelectedDate(null);
    };

    const handleSelectDate = (date: string | null) => {
        if (!date) {
            setSelectedDate(null);
            setScope('all');
            return;
        }

        if (scope === 'date' && selectedDate === date) {
            setSelectedDate(null);
            setScope('all');
            return;
        }

        setSelectedDate(date);
        setScope('date');
    };

    const openCreateDialog = useCallback(() => {
        setEditingTodo(null);
        setCreateDialogOpen(true);
    }, [setCreateDialogOpen, setEditingTodo]);

    const resetToAllTodos = useCallback(() => {
        setSelectedDate(null);
        setScope('all');
        setStatusFilter('all');
    }, [setScope, setSelectedDate, setStatusFilter]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (createDialogOpen || editingTodo || timelineDialogOpen) return;
            if (isEditableTarget(event.target)) return;

            const lowerKey = event.key.toLowerCase();
            if (!event.metaKey && !event.ctrlKey && !event.altKey && event.shiftKey && lowerKey === 'n') {
                event.preventDefault();
                openCreateDialog();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [createDialogOpen, editingTodo, openCreateDialog, timelineDialogOpen]);

    return (
        <div className="space-y-4 xl:space-y-5">
            <Card variant="subtle" className="p-card space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <div className="glass-icon-badge shrink-0">
                                <ListTodo size={16} className="text-accent" />
                            </div>
                            <div>
                                <h1 className="text-h2 text-text-primary">待办</h1>
                                <p className="mt-0.5 text-caption text-text-secondary">
                                    查看、筛选和处理待办，创建收进弹窗。
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-1.5 rounded-full border-white/70 bg-white/82 px-3 shadow-[0_10px_24px_rgb(15_23_42/8%)] backdrop-blur-xl hover:-translate-y-px hover:bg-white/92"
                            onClick={() => setTimelineDialogOpen(true)}
                            title="查看全部待办记录"
                        >
                            <History size={15} className="text-accent" />
                            全部记录
                        </Button>

                        <Button
                            variant="tinted"
                            size="sm"
                            className="gap-2"
                            onClick={openCreateDialog}
                            title="新建待办（Shift+N）"
                        >
                            <Plus size={16} />
                            新建待办
                            <span className="hidden text-caption text-accent/70 md:inline">Shift+N</span>
                        </Button>
                    </div>
                </div>

                {todosErrorMessage ? (
                    <div className="rounded-inner-card border border-danger/30 bg-danger/8 px-4 py-3 text-body-sm text-danger">
                        待办数据加载失败：{todosErrorMessage}
                    </div>
                ) : null}

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.9fr)]">
                    <div className={`rounded-inner-card border px-4 py-4 shadow-sm ${getFocusPanelClass(focusState.tone)}`}>
                        <div className="flex h-full flex-col justify-between gap-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-caption font-medium text-text-secondary">{focusState.eyebrow}</div>
                                    <div className="mt-2 flex flex-wrap items-end gap-2">
                                        <span className="text-[2rem] font-semibold leading-none text-text-primary">{focusState.title}</span>
                                        <span className="pb-1 text-caption text-text-tertiary">{focusState.meta}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSelectScope(focusState.actionScope)}
                                    className="shrink-0 rounded-full border border-glass-border bg-white/62 px-2.5 py-1 text-caption font-medium text-text-secondary transition-colors duration-normal ease-standard hover:bg-white/88 hover:text-text-primary"
                                >
                                    {focusState.actionLabel}
                                </button>
                            </div>

                            <OverflowTooltipText
                                text={focusState.description}
                                className="truncate text-body-sm font-medium text-text-primary"
                            />

                            <div className="grid grid-cols-3 gap-2 border-t border-glass-border/70 pt-3 text-caption">
                                <div>
                                    <div className="text-text-tertiary">今日待处理</div>
                                    <div className="mt-1 font-semibold text-warning">{todayTodos}</div>
                                </div>
                                <div>
                                    <div className="text-text-tertiary">今日已完成</div>
                                    <div className="mt-1 font-semibold text-success">{todayCompletedTodos}</div>
                                </div>
                                <div>
                                    <div className="text-text-tertiary">今日总数</div>
                                    <div className="mt-1 font-semibold text-accent">{todayScheduledTodos}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {overviewMetrics.map((item) => (
                            <button
                                key={item.scope}
                                type="button"
                                onClick={() => handleSelectScope(item.scope)}
                                className={getMetricButtonClass(scope === item.scope, item.tone)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-caption text-text-secondary">{item.label}</span>
                                    <span className="text-[11px] text-current/70">{item.meta}</span>
                                </div>
                                <div className="mt-2 text-h2 font-semibold leading-none">{item.value}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-inner-card border border-glass-border bg-panel-bg/74 px-3 py-2.5">
                    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="pl-0.5 text-caption font-medium uppercase tracking-wide text-text-tertiary">范围</span>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {scopeButtons.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        className={getScopeButtonClass(scope === item.value)}
                                        onClick={() => handleSelectScope(item.value)}
                                    >
                                        <span>{item.label}</span>
                                        <span className="text-[11px] text-current/70">{item.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            <span className="pl-0.5 text-caption font-medium uppercase tracking-wide text-text-tertiary">状态</span>
                            <SegmentedControl
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value as TodoStatusFilter)}
                                options={STATUS_OPTIONS}
                                size="sm"
                                wrap
                                className="border-0! bg-transparent! p-0! shadow-none!"
                                optionClassName="min-w-[64px]"
                                aria-label="待办状态筛选"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start">
                <Card variant="subtle" className="overflow-hidden p-0 xl:order-2">
                    <div className="space-y-4 p-card">
                        <SectionHeader
                            title="全部待办"
                            description={listDescription}
                            right={(
                                <div className="flex items-center gap-2">
                                    {scope === 'date' && selectedDate ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="px-2.5"
                                            onClick={() => handleSelectDate(null)}
                                        >
                                            返回全部
                                        </Button>
                                    ) : null}
                                    <span className="glass-mini-chip text-body-sm">{visibleTodos.length} 项</span>
                                </div>
                            )}
                        >
                            {scope === 'date' && selectedDate ? (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-selection-border bg-selection-bg px-3 py-1 text-body-sm font-medium text-accent">
                                        <CalendarDays size={14} />
                                        {formatFullDate(selectedDate)}
                                    </span>
                                    <span className="text-caption text-text-secondary">共 {selectedDateTodos.length} 项</span>
                                </div>
                            ) : null}
                        </SectionHeader>

                        {isLoading ? (
                            <div className="px-1 py-10 text-center text-body-sm text-text-secondary">加载中...</div>
                        ) : todosErrorMessage ? (
                            <div className="rounded-inner-card border border-danger/30 bg-danger/8 px-4 py-4 text-body-sm text-danger">
                                还没能成功读取待办列表：{todosErrorMessage}
                            </div>
                        ) : sortedTodos.length === 0 ? (
                            <div className="rounded-inner-card border border-glass-border bg-linear-to-r from-selection-bg/40 to-panel-bg/84 px-4 py-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/14">
                                            <CalendarDays size={18} />
                                        </div>
                                        <div>
                                            <p className="text-body font-medium text-text-primary">还没有待办事项</p>
                                            <p className="mt-1 text-body-sm text-text-secondary">先加一条新的待办，后面这里就会按时间持续滚动和汇总。</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                        <Button variant="tinted" size="sm" className="gap-2" onClick={openCreateDialog}>
                                            <Plus size={14} />
                                            新建待办
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="hidden grid-cols-[36px_minmax(0,1fr)_110px_84px_56px] gap-3 border-b border-glass-border px-3 pb-2 text-caption uppercase tracking-wide text-text-tertiary md:grid">
                                    <span className="whitespace-nowrap">完成</span>
                                    <span>内容</span>
                                    <span>优先级</span>
                                    <span>状态</span>
                                    <span className="text-right">操作</span>
                                </div>

                                {visibleTodos.length === 0 ? (
                                    <div className="rounded-inner-card border border-glass-border bg-linear-to-r from-panel-bg/88 to-bg-tertiary/54 px-4 py-4">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-panel-bg text-text-secondary ring-1 ring-glass-border">
                                                    <ListTodo size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-body font-medium text-text-primary">{emptyStateCopy.title}</p>
                                                        <span className="glass-mini-chip text-caption">{activeScopeLabel}</span>
                                                        <span className="glass-mini-chip text-caption">{activeStatusLabel}</span>
                                                    </div>
                                                    <p className="mt-1 text-body-sm text-text-secondary">{emptyStateCopy.description}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                            <Button variant="tinted" size="sm" className="gap-2" onClick={openCreateDialog}>
                                                <Plus size={14} />
                                                新建待办
                                            </Button>
                                            <Button variant="secondary" size="sm" onClick={resetToAllTodos}>
                                                重置筛选
                                            </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {visibleTodoGroups.map((group) => (
                                            <section
                                                key={group.key}
                                                className="overflow-hidden rounded-inner-card border border-glass-border bg-panel-bg/60"
                                            >
                                                <div className="flex flex-col gap-2 border-b border-glass-border/70 bg-bg-tertiary/42 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                        <CalendarDays size={14} className="shrink-0 text-accent" />
                                                        <span className="text-body-sm font-semibold text-text-primary">{group.title}</span>
                                                        <span
                                                            className={[
                                                                'inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium ring-1',
                                                                group.chip.className,
                                                            ].join(' ')}
                                                        >
                                                            {group.chip.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-caption text-text-secondary">
                                                        {group.openCount > 0 ? `${group.openCount} 待处理` : '已清空'} · 共 {group.todos.length} 项
                                                    </span>
                                                </div>

                                                <div className="space-y-1.5 p-1.5">
                                                    {group.todos.map((todo) => (
                                                        <TodoListRow
                                                            key={todo.id}
                                                            todo={todo}
                                                            today={today}
                                                            showDate={false}
                                                            onToggleCompleted={(id, completed) => toggleMutation.mutate({ id, completed })}
                                                            onEdit={(nextTodo) => {
                                                                setCreateDialogOpen(false);
                                                                setEditingTodo(nextTodo);
                                                            }}
                                                            onDelete={handleDelete}
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Card>

                <div className="space-y-4 xl:order-1">
                    <TodoCalendarPanel
                        todos={sortedTodos}
                        today={today}
                        selectedDate={scope === 'date' ? selectedDate : null}
                        onSelectDate={handleSelectDate}
                    />
                </div>
            </div>

            {createDialogOpen ? (
                <TodoFormDialog
                    open
                    mode="create"
                    initialValues={createDialogDefaults}
                    saving={createMutation.isPending}
                    onClose={() => setCreateDialogOpen(false)}
                    onSave={(values) => createMutation.mutate(values)}
                />
            ) : null}

            {editingTodo ? (
                <TodoFormDialog
                    open
                    mode="edit"
                    todo={editingTodo}
                    saving={updateMutation.isPending}
                    onClose={() => setEditingTodo(null)}
                    onSave={(values) => {
                        updateMutation.mutate({
                            id: editingTodo.id,
                            content: values.content,
                            execute_date: values.execute_date,
                            priority: values.priority,
                        });
                    }}
                />
            ) : null}

            <Dialog
                open={timelineDialogOpen}
                onClose={() => setTimelineDialogOpen(false)}
                title={(
                    <span className="flex items-center gap-2">
                        <History size={16} className="text-accent" />
                        全部待办记录
                    </span>
                )}
                maxWidth="5xl"
                className="max-h-[calc(100vh-1.25rem)]"
                bodyClassName="min-h-0 flex-1 overflow-hidden"
            >
                <TodoTimelineView embedded onRequestClose={() => setTimelineDialogOpen(false)} />
            </Dialog>
        </div>
    );
}

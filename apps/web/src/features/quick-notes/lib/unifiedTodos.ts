import type { GrowthArea, ProjectTodoWithProject } from '../../growth-projects/types';
import type { QuickNote, TodoPriority } from '../types';

export type UnifiedTodoSource = 'standalone' | 'project';
export type UnifiedTodoSourceFilter = 'all' | UnifiedTodoSource | GrowthArea;

export type CalendarDaySummary = {
    total: number;
    open: number;
    completed: number;
};

export type UnifiedTodo = {
    id: string;
    source: UnifiedTodoSource;
    sourceId: string;
    content: string;
    is_completed: boolean;
    priority: TodoPriority | null;
    execute_date: string | null;
    completed_at: string | null;
    created_at: string;
    sourceLabel: string;
    projectId: string | null;
    projectTitle: string | null;
    projectArea: GrowthArea | null;
    projectHref: string | null;
};

const PRIORITY_ORDER: Record<TodoPriority, number> = {
    critical: 0,
    urgent: 1,
    important: 2,
    normal: 3,
};

const AREA_LABELS: Record<GrowthArea, string> = {
    ai: 'AI',
    english: '英语',
    reading: '阅读',
};

export function getProjectTodoHref(area: GrowthArea | null | undefined, projectId: string, todoId: string): string {
    const safeArea = area ?? 'ai';

    if (safeArea === 'english') {
        const params = new URLSearchParams({
            tab: 'projects',
            project: projectId,
            todo: todoId,
        });
        return `/growth/english?${params.toString()}`;
    }

    const params = new URLSearchParams({
        project: projectId,
        todo: todoId,
    });
    return `/growth/${safeArea}?${params.toString()}`;
}

export function normalizeStandaloneTodo(todo: QuickNote): UnifiedTodo {
    return {
        id: `standalone:${todo.id}`,
        source: 'standalone',
        sourceId: todo.id,
        content: todo.content,
        is_completed: todo.is_completed,
        priority: todo.priority,
        execute_date: todo.execute_date,
        completed_at: todo.completed_at,
        created_at: todo.created_at,
        sourceLabel: '独立待办',
        projectId: null,
        projectTitle: null,
        projectArea: null,
        projectHref: null,
    };
}

export function normalizeProjectTodo(todo: ProjectTodoWithProject): UnifiedTodo {
    const project = todo.growth_projects;
    const area = project?.area ?? null;
    const projectTitle = project?.title ?? '未命名项目';
    const areaLabel = area ? AREA_LABELS[area] : '项目';

    return {
        id: `project:${todo.id}`,
        source: 'project',
        sourceId: todo.id,
        content: todo.title,
        is_completed: todo.is_completed,
        priority: todo.priority ?? 'normal',
        execute_date: todo.execute_date,
        completed_at: todo.completed_at,
        created_at: todo.created_at,
        sourceLabel: `${areaLabel} / ${projectTitle}`,
        projectId: todo.project_id,
        projectTitle,
        projectArea: area,
        projectHref: getProjectTodoHref(area, todo.project_id, todo.id),
    };
}

export function buildUnifiedCalendarSummaryMap(todos: UnifiedTodo[]): Map<string, CalendarDaySummary> {
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

export function compareUnifiedTodos(a: UnifiedTodo, b: UnifiedTodo): number {
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

export function matchesUnifiedTodoSource(todo: UnifiedTodo, sourceFilter: UnifiedTodoSourceFilter): boolean {
    if (sourceFilter === 'all') return true;
    if (sourceFilter === 'standalone') return todo.source === 'standalone';
    if (sourceFilter === 'project') return todo.source === 'project';
    return todo.projectArea === sourceFilter;
}

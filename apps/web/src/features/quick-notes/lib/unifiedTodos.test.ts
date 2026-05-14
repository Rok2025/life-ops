import { describe, expect, it } from 'vitest';

import {
    buildUnifiedCalendarSummaryMap,
    getProjectTodoHref,
    normalizeProjectTodo,
    normalizeStandaloneTodo,
} from './unifiedTodos';
import type { QuickNote } from '../types';

const standaloneTodo: QuickNote = {
    id: 'note-1',
    note_date: '2026-05-14',
    type: 'todo',
    content: '打印香港办卡文件',
    answer: null,
    is_answered: false,
    is_completed: false,
    completed_at: null,
    priority: 'important',
    execute_date: '2026-05-14',
    created_at: '2026-05-14T01:00:00.000Z',
    updated_at: '2026-05-14T01:00:00.000Z',
};

describe('unified todo helpers', () => {
    it('normalizes standalone quick_notes todos', () => {
        const todo = normalizeStandaloneTodo(standaloneTodo);

        expect(todo).toMatchObject({
            id: 'standalone:note-1',
            source: 'standalone',
            sourceId: 'note-1',
            content: '打印香港办卡文件',
            sourceLabel: '独立待办',
            execute_date: '2026-05-14',
            priority: 'important',
        });
    });

    it('normalizes project todos with project labels and hrefs', () => {
        const todo = normalizeProjectTodo({
            id: 'todo-1',
            project_id: 'project-1',
            title: '完成 Agent 工作流整理',
            is_completed: false,
            completed_at: null,
            execute_date: '2026-05-15',
            priority: 'urgent',
            sort_order: 1,
            created_at: '2026-05-14T02:00:00.000Z',
            growth_projects: {
                id: 'project-1',
                title: 'Agent 系统建设',
                area: 'ai',
                status: 'active',
            },
        });

        expect(todo).toMatchObject({
            id: 'project:todo-1',
            source: 'project',
            sourceId: 'todo-1',
            content: '完成 Agent 工作流整理',
            sourceLabel: 'AI / Agent 系统建设',
            projectHref: '/growth/ai?project=project-1&todo=todo-1',
            execute_date: '2026-05-15',
            priority: 'urgent',
        });
    });

    it('links english project todos directly to the projects tab', () => {
        expect(getProjectTodoHref('english', 'project-2', 'todo-2')).toBe(
            '/growth/english?tab=projects&project=project-2&todo=todo-2',
        );
    });

    it('builds calendar summaries from standalone and project todos together', () => {
        const scheduledProjectTodo = normalizeProjectTodo({
            id: 'todo-3',
            project_id: 'project-3',
            title: '整理阅读卡片',
            is_completed: true,
            completed_at: '2026-05-14T03:00:00.000Z',
            execute_date: '2026-05-14',
            priority: 'normal',
            sort_order: 1,
            created_at: '2026-05-12T02:00:00.000Z',
            growth_projects: {
                id: 'project-3',
                title: '复杂系统阅读',
                area: 'reading',
                status: 'active',
            },
        });

        const summary = buildUnifiedCalendarSummaryMap([
            normalizeStandaloneTodo(standaloneTodo),
            scheduledProjectTodo,
        ]);

        expect(summary.get('2026-05-14')).toEqual({
            total: 2,
            open: 1,
            completed: 1,
        });
    });
});

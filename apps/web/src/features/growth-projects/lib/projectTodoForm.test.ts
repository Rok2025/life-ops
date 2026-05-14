import { describe, expect, it } from 'vitest';

import { buildCreateProjectTodoInput } from './projectTodoForm';

describe('buildCreateProjectTodoInput', () => {
    it('keeps schedule and priority when creating a project todo', () => {
        expect(buildCreateProjectTodoInput({
            projectId: 'project-1',
            title: '整理项目待办',
            executeDate: '2026-05-14',
            priority: 'important',
        })).toEqual({
            project_id: 'project-1',
            title: '整理项目待办',
            execute_date: '2026-05-14',
            priority: 'important',
        });
    });
});

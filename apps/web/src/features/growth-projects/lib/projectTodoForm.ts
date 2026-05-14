import type { CreateTodoInput } from '../types';
import type { TodoPriority } from '@/features/quick-notes/types';

export type ProjectTodoCreateFormValues = {
    projectId: string;
    title: string;
    executeDate: string | null;
    priority: TodoPriority;
};

export function buildCreateProjectTodoInput(values: ProjectTodoCreateFormValues): CreateTodoInput {
    return {
        project_id: values.projectId,
        title: values.title.trim(),
        execute_date: values.executeDate || null,
        priority: values.priority,
    };
}

import { projectsApi } from '../../growth-projects';
import { notesApi } from './notesApi';
import {
    compareUnifiedTodos,
    normalizeProjectTodo,
    normalizeStandaloneTodo,
} from '../lib/unifiedTodos';
import type { UnifiedTodo } from '../lib/unifiedTodos';

export const unifiedTodosApi = {
    /** 获取独立待办与项目待办的统一列表 */
    getTodos: async (): Promise<UnifiedTodo[]> => {
        const [standaloneTodos, projectTodos] = await Promise.all([
            notesApi.getTodos(),
            projectsApi.getInboxTodos(),
        ]);

        return [
            ...standaloneTodos.map(normalizeStandaloneTodo),
            ...projectTodos.map(normalizeProjectTodo),
        ].sort(compareUnifiedTodos);
    },
};

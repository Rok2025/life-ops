import { selectRows } from '../../lib/supabase-rest.mjs';

function incrementCount(target, key) {
  if (!key) return;
  target[key] = (target[key] ?? 0) + 1;
}

export const listProjectsTool = {
  name: 'list_projects',
  description:
    'List growth projects with todo stats, optionally filtered by area, status, or scope.',
  kind: 'read',
  async execute(input = {}, context) {
    const limit = Math.max(1, Math.min(Number(input.limit ?? 30) || 30, 100));

    const query = {
      select:
        'id,area,title,description,scope,start_date,end_date,status,sort_order,created_at,updated_at',
      order: 'area.asc,sort_order.asc,created_at.desc',
      limit: String(limit),
    };

    if (typeof input.area === 'string' && input.area) {
      query.area = `eq.${input.area}`;
    }

    if (typeof input.status === 'string' && input.status) {
      query.status = `eq.${input.status}`;
    }

    if (typeof input.scope === 'string' && input.scope) {
      query.scope = `eq.${input.scope}`;
    }

    const projects = await selectRows({
      config: context.config,
      table: 'growth_projects',
      authToken: context.authToken,
      query,
    });

    if (projects.length === 0) {
      return {
        total: 0,
        filters: {
          area: input.area ?? null,
          status: input.status ?? null,
          scope: input.scope ?? null,
          limit,
        },
        countsByArea: {},
        countsByStatus: {},
        items: [],
      };
    }

    const projectIds = projects.map((project) => project.id);
    const todoRows = await selectRows({
      config: context.config,
      table: 'project_todos',
      authToken: context.authToken,
      query: {
        select: 'project_id,is_completed',
        project_id: `in.(${projectIds.join(',')})`,
      },
    });

    const todoStats = new Map();
    for (const todo of todoRows) {
      const stat = todoStats.get(todo.project_id) ?? { total: 0, completed: 0 };
      stat.total += 1;
      if (todo.is_completed) stat.completed += 1;
      todoStats.set(todo.project_id, stat);
    }

    const countsByArea = {};
    const countsByStatus = {};

    const items = projects.map((project) => {
      incrementCount(countsByArea, project.area);
      incrementCount(countsByStatus, project.status);

      const stats = todoStats.get(project.id) ?? { total: 0, completed: 0 };
      return {
        ...project,
        todo_total: stats.total,
        todo_completed: stats.completed,
      };
    });

    return {
      total: items.length,
      filters: {
        area: input.area ?? null,
        status: input.status ?? null,
        scope: input.scope ?? null,
        limit,
      },
      countsByArea,
      countsByStatus,
      items,
    };
  },
};

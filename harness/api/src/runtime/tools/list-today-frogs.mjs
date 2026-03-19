import { getLocalDateString } from '../../lib/date.mjs';
import { selectRows } from '../../lib/supabase-rest.mjs';

export const listTodayFrogsTool = {
  name: 'list_today_frogs',
  description: 'List the frogs for a target date, defaulting to today in a chosen timezone.',
  kind: 'read',
  async execute(input = {}, context) {
    const timezone = input.timezone ?? context.defaultTimezone ?? 'Asia/Shanghai';
    const date = input.date ?? getLocalDateString(timezone);

    const items = await selectRows({
      config: context.config,
      table: 'daily_frogs',
      authToken: context.authToken,
      query: {
        select: 'id,title,description,is_completed,frog_date,completed_at,created_at',
        frog_date: `eq.${date}`,
        order: 'created_at.asc',
      },
    });

    const total = items.length;
    const completed = items.filter((item) => item.is_completed).length;

    return {
      date,
      timezone,
      total,
      completed,
      items,
    };
  },
};

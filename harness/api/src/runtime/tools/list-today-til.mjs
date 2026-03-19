import { getLocalDateString } from '../../lib/date.mjs';
import { selectRows } from '../../lib/supabase-rest.mjs';

export const listTodayTilTool = {
  name: 'list_today_til',
  description: 'List the TIL entries for a target date, defaulting to today in a chosen timezone.',
  kind: 'read',
  async execute(input = {}, context) {
    const timezone = input.timezone ?? context.defaultTimezone ?? 'Asia/Shanghai';
    const date = input.date ?? getLocalDateString(timezone);

    const items = await selectRows({
      config: context.config,
      table: 'daily_til',
      authToken: context.authToken,
      query: {
        select: 'id,content,category,til_date,created_at',
        til_date: `eq.${date}`,
        order: 'created_at.desc',
      },
    });

    const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];

    return {
      date,
      timezone,
      total: items.length,
      categories,
      items,
    };
  },
};

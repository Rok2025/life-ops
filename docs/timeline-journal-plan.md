# 流水记实施方案

## 背景

当前系统已经有主页、全局搜索和洞察页，但它们分别承担今日工作台、关键词检索和周期健康度分析，不适合作为一个按日期浏览全系统记录的入口。

「流水记」用于把各个领域和板块的记录按日期收拢起来，支持从过去到今天的时间流水浏览，帮助日常回看和周末复盘快速获得整体印象。

## 第一阶段目标

- 新增侧边栏入口：`流水记`。
- 新增页面：`/timeline`。
- 默认展示最近 7 天，到今天为止。
- 页面打开后默认滚动定位到今天。
- 按日期从过去到今天分组展示全系统记录。
- 支持今天、昨天、近 7 天、近 30 天、自定义范围。
- 支持按领域筛选：全部、输入、成长、又又、健身、输出、英语、家庭。
- 每条记录保留跳转链接，可回到原模块查看上下文。

## 数据范围

第一阶段纳入以下来源：

- 随手记与待办：`quick_notes`
- 三只青蛙：`daily_frogs`
- TIL：`daily_til`
- 健身训练：`workout_sessions`
- 输出记录：`outputs`
- 成长项目、项目待办、项目笔记：`growth_projects`、`project_todos`、`project_notes`
- 又又记录：`youyou_diary`、`youyou_milestones`、`youyou_growth_records`、`youyou_vaccinations`、`youyou_medical_records`
- 英语学习：`english_queries`、`english_cards`
- 家庭任务：`family_tasks`

待办日期语义：

- 已完成待办优先使用 `completed_at`
- 否则使用 `execute_date`
- 最后退回 `note_date` 或 `created_at`

## 技术方案

新增 Supabase RPC：

```sql
get_global_timeline(
  p_date_from date,
  p_date_to date,
  p_source_types text[],
  p_result_limit integer
)
```

统一返回结构：

```ts
{
  source_type: string;
  source_id: string;
  domain: string;
  event_type: string;
  title: string;
  snippet: string;
  occurred_date: string;
  occurred_at: string | null;
  href: string;
  metadata: Record<string, unknown>;
}
```

前端新增 feature：

```text
apps/web/src/features/timeline/
  api/timelineApi.ts
  hooks/useTimeline.ts
  types/index.ts
  components/TimelinePage.tsx
  components/TimelineDaySection.tsx
  components/TimelineItem.tsx
  index.ts
```

路由入口保持瘦层：

```text
apps/web/src/app/timeline/page.tsx
```

## 后续阶段

第二阶段增加周/月复盘视图：

- 周复盘：本周完成、延期、输出、训练、学习、家庭事项。
- 月复盘：领域投入、成果产出、趋势变化。
- 先使用规则汇总，待数据结构稳定后再接入 AI 总结。

第三阶段增加复盘生成与保存：

- 生成周报/月报草稿。
- 支持保存复盘结论。
- 支持从复盘结论生成下周行动项。

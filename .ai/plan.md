# 随手记备注和灵感全部查看功能实现方案

## Step-by-step
1. 锁定改动范围：只修改 `quick-notes` 前端模块，不修改数据库表结构，不修改全局配置，不调整现有录入流程。
2. 在 `apps/web/src/features/quick-notes/api/notesApi.ts` 新增 `getNotesTimeline()` 方法，仅查询 `memo`、`idea` 两类数据。
3. 在 `apps/web/src/features/quick-notes/api/notesApi.ts` 中为 `getNotesTimeline()` 增加排序：`note_date DESC`、`created_at DESC`。
4. 新增 `apps/web/src/features/quick-notes/hooks/useNotesTimeline.ts`，封装“备注 + 灵感全部查看”的查询逻辑。
5. 新增 `apps/web/src/features/quick-notes/components/NotesTimelineView.tsx`，实现时间线页面主体。
6. 在 `NotesTimelineView.tsx` 中按 `note_date` 做日期分组。
7. 在 `NotesTimelineView.tsx` 中按 `created_at` 对组内记录倒序排列。
8. 在 `NotesTimelineView.tsx` 中为每条记录展示：类型标签、内容、创建时间。
9. 在 `NotesTimelineView.tsx` 中增加顶部统计：全部记录数、备注数、灵感数、时间分组数。
10. 在 `NotesTimelineView.tsx` 中增加筛选能力：`全部 / 备注 / 灵感`。
11. 在 `NotesTimelineView.tsx` 中补齐空状态和加载失败状态。
12. 修改 `apps/web/src/features/quick-notes/components/NotesWidget.tsx`，在随手记卡片头部增加“全部记录”按钮。
13. 修改 `apps/web/src/features/quick-notes/components/NotesWidget.tsx`，新增弹窗开关状态并接入 `Dialog`。
14. 在 `NotesWidget.tsx` 中点击“全部记录”后打开 `NotesTimelineView` 弹窗。
15. 修改 `apps/web/src/features/quick-notes/index.ts`，导出 `NotesTimelineView` 和 `useNotesTimeline`。
16. 验证同一天多条记录展示顺序是否正确。
17. 验证跨天记录是否按时间线倒序分组。
18. 验证筛选“备注 / 灵感”是否只影响列表展示，不影响统计和原有新增、编辑、删除功能。
19. 验证首页随手记原有按天查看、记录新增、编辑、删除功能保持可用。

## 影响文件
- `apps/web/src/features/quick-notes/api/notesApi.ts`
- `apps/web/src/features/quick-notes/components/NotesWidget.tsx`
- `apps/web/src/features/quick-notes/index.ts`
- `apps/web/src/features/quick-notes/hooks/useNotesTimeline.ts`
- `apps/web/src/features/quick-notes/components/NotesTimelineView.tsx`

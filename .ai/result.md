# 随手记备注和灵感全部查看功能 - 执行结果

## 修改的文件

### 1. `apps/web/src/features/quick-notes/api/notesApi.ts`
- **Step 2-3**: 新增 `getNotesTimeline()` 方法
  - 仅查询 `memo` 和 `idea` 两类数据（排除 `todo`）
  - 排序：`note_date DESC`, `created_at DESC`

### 2. `apps/web/src/features/quick-notes/hooks/useNotesTimeline.ts` (新建)
- **Step 4**: 创建 `useNotesTimeline` hook
  - 封装 `notesApi.getNotesTimeline()` 的查询逻辑
  - 使用 React Query 的 `useQuery`

### 3. `apps/web/src/features/quick-notes/components/NotesTimelineView.tsx` (新建)
- **Step 5-11**: 实现时间线页面组件
  - 按 `note_date` 做日期分组
  - 组内按 `created_at` 倒序排列
  - 每条记录展示：类型标签、内容、创建时间
  - 顶部统计：全部记录数、备注数、灵感数、时间分组数
  - 筛选能力：全部 / 备注 / 灵感
  - 空状态和加载失败状态

### 4. `apps/web/src/features/quick-notes/components/NotesWidget.tsx`
- **Step 12**: 在随手记卡片头部增加"全部记录"按钮
- **Step 13**: 新增弹窗开关状态并接入 `Dialog`
- **Step 14**: 点击"全部记录"后打开 `NotesTimelineView` 弹窗

### 5. `apps/web/src/features/quick-notes/index.ts`
- **Step 15**: 导出 `NotesTimelineView` 和 `useNotesTimeline`

## 功能验证要点 (Step 16-19)
1. 同一天多条记录展示顺序是否正确（按 `created_at` 倒序）
2. 跨天记录是否按时间线倒序分组
3. 筛选"备注 / 灵感"是否只影响列表展示，不影响统计
4. 原有新增、编辑、删除功能保持可用
5. 首页随手记原有按天查看功能保持可用

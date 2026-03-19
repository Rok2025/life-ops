# Life OPS Harness

> 目标：把 `life-ops` 从“个人控制台网站”演进为“模型可操作的生活管理环境”。
>
> 这个目录是 harness 的独立孵化区。
> 在真正接入 `apps/web`、Supabase 正式迁移和后台服务前，相关契约、SQL 草案、运行时设计都先收敛在这里。

## 1. 这次改造到底在做什么

参考 `learn-claude-code` 的思路，`harness` 不是聊天 UI，而是：

- tools：模型可以安全调用的系统能力
- knowledge：模型按需加载的业务知识和规则
- observation：任务、会话、工具调用、审批、结果都可追踪
- action interface：模型不仅能回答，还能发起和推进任务
- permissions：高风险写操作要经过审批和审计

对应到 `life-ops`，这意味着：

- 前端继续存在，但不再是唯一主角
- 现有 feature 要从“页面模块”升级成“工具能力”
- Supabase 里的业务数据要成为 agent 的工作上下文
- agent 的运行过程要被持久化，而不是只留在一次请求里

## 2. 对当前仓库的判断

当前项目已经具备做 harness 的好基础：

- `apps/web` 已经是薄壳页面 + feature-based 结构
- 各 feature 有独立 `api/` 层，适合直接包成 tools
- Supabase 已经承载核心业务数据
- 已经有英语学习 AI function、提示词库、项目管理、输出管理等能力

当前项目最大的结构性限制：

- Web 端是静态导出部署形态
- 还没有长期在线的 agent runtime
- 还没有 session / run / approval / tool log 等 agent 运行数据表

## 3. 当前孵化架构

当前阶段先把 harness 完整隔离在 `harness/` 目录内，避免影响 `apps/web`：

1. `apps/web`
   - 保留现有 Life OPS 页面
   - 当前不承载 harness UI

2. `harness/core`
   - 共享类型、契约、状态枚举
   - 为后续 API、worker、UI 共用

3. `harness/api`
   - 最小可运行 HTTP runtime
   - 当前提供 `POST /sessions/:id/runs`
   - 当前已接入 `list_today_frogs`

4. `harness/ui`
   - 独立本地调试面板
   - 用于验证 `health / tools / runs`
   - 不依赖 `apps/web`

5. `harness/dev`
   - 一键启动 `harness/api` 和 `harness/ui`
   - 保持本地联调也在 `harness/` 内完成

6. `harness/sql`
   - agent runtime 数据表草案
   - 成熟前不进入正式 `supabase/migrations`

未来如果 harness 形态稳定，再考虑是否拆出独立 worker 或接回正式产品入口。

## 4. Life OPS v1 该做哪些工具

第一批不要做“全能代理”，只做高价值、低歧义工具。

### 日计划域

- `list_today_frogs`
- `create_frog`
- `complete_frog`
- `list_today_til`
- `create_til`

### 项目推进域

- `list_projects`
- `create_project`
- `list_project_todos`
- `create_project_todo`
- `create_project_note`

### 输出域

- `list_outputs`
- `create_output_draft`
- `link_output_to_project`

### 英语学习域

- `run_english_query`
- `save_english_card`
- `list_due_cards`

### 健身域

- `list_recent_workouts`
- `get_weekly_fitness_stats`

## 5. 推荐的分阶段顺序

### Phase 0：骨架与约束

- 建立 `harness-core` 契约
- 新增 runtime 数据表草案
- 明确 v1 边界和审批规则

### Phase 1：最小 loop

- 做单 agent loop
- 做 session / message / run 存储
- 跑通 3-5 个只读工具

### Phase 2：可执行写操作

- 接入审批请求
- 先开放低风险新增
- 删除与批量改动继续强审批

### Phase 3：plan-first

- 每次用户请求先产出 plan
- 前端展示 step 状态
- 支持失败、阻塞、继续执行

### Phase 4：knowledge loading

- 按需加载 `docs/`、系统配置、提示词模板
- 做会话摘要与上下文压缩

### Phase 5：后台任务

- 晨间计划
- 晚间复盘
- 项目停滞提醒
- 英语复习提醒

## 6. 当前这个提交已经落下的第一步

这一步只做“不会破坏现有业务”的基础设施：

- 新增 `harness/core`
- 新增 `harness/api`
- 新增 `harness/ui`
- 新增 `harness/dev`
- 新增 harness runtime 数据表草案
- 新增本地 runtime store：`harness/.runtime/runtime-store.json`
- 新增本路线文档

下一步最值得继续做的是：

1. 补 session / run 持久化
2. 增加第二个只读工具：`list_today_til`
3. 给 `harness/ui` 补 run history 和 timeline
4. 再接第一个写工具和审批流

## 7. 当前先不要做的事

- 不要先做多 agent
- 不要先做复杂 memory
- 不要先做文件/浏览器自动化
- 不要先重写现有业务页面

先把“单 agent + 工具 + 审批 + 追踪”跑通，才是真正的 harness 起点。

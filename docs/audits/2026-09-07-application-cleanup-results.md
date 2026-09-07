# 前后端应用清理执行记录

> 后续进度：用户已另行授权线上永久删除，现已发布并清理线上无关业务对象。下文保留应用清理阶段的历史边界，当前结果以[生产清理记录](2026-09-07-production-cleanup-results.md)为准。

- 日期：2026-09-07
- 分支：`codex/fitness-finance-only`，基于 `bf2b126`，工作目录不变。
- 状态：应用代码清理完成，尚未提交、推送或部署；数据库及线上资源未改动。
- 对应：[实施方案](../fitness-finance-simplification-plan.md)、[依赖审计](2026-09-07-fitness-finance-dependency-audit.md)。

## 完成内容

- 删除 14 个废弃 feature 模块及对应路由，只剩 `auth`、`cli-api`、`finance`、`fitness`、`system-config`。
- 删除命令中心、实验 harness 四个包及 SQL 草案、英语 Edge Functions 本地源码、英语解析调试脚本。
- 删除已无引用的旧首页/导航/快捷键/日历等组件和旧模块专属 Markdown、又又样式；共删除 247 个已跟踪文件。
- 根地址跳转现有健身页；左侧仅健身与财务，窄屏增加两块业务的直接导航。
- 保留时间节奏、本月剩余、年度剩余，移除右侧旧业务快捷按钮和待办查询。
- 设置只管理训练部位、训练动作，提供开发者访问入口；去除英语、命令、家庭等设置和查询。配置或动作更新后同步查询缓存，避免切换设置页后回到旧列表。
- 简化导航链接，移除“子页面处于同模块就阻止点击”的逻辑，使训练历史能通过健身导航返回概览。
- 移除 6 个直接依赖（3 个 dnd-kit 包、react-markdown、remark-gfm、rehype-highlight）以及无关 lockfile 依赖；删除 harness workspace 和默认启动项。没有升级框架。
- 保留正式 CLI、所有 /api/v1/*、设备授权和撤销能力。CLI 执行文件、服务端业务文件、HTTP Route Handlers、健身/财务核心数据 API 与基准版本一致。
- README、Web README、设计系统示例和 .ai 当前说明已同步；原设计文档与数据库迁移保留为历史来源。

## 验证证据

| 检查 | 结果 |
| --- | --- |
| 改动前 Web 测试 | 56 个中 55 通过、1 失败；失败为财务测试断言固定 2026 年 5 月，但未固定系统日期 |
| 基线处理 | 为财务组件测试统一固定时间，测试后恢复真实计时器；未改变生产财务行为或降低断言要求 |
| 最终 pnpm test | Web 15 个文件 / 50 个测试通过；CLI 4 个测试通过，共 54 个 |
| pnpm --filter web lint | 0 error；1 个原有 warning：ChipGroup.radioName 未使用。基线为 5 个 warning |
| pnpm --filter web build | 生产构建和 TypeScript 检查通过；仅生成保留路由及框架 404/icon 路由 |
| pnpm install --frozen-lockfile --ignore-scripts | 通过，lockfile 与现有 workspace 对齐 |
| 运行代码表/RPC 扫描 | 表引用仅为审计保留的 16 张表，RPC 仅 cli_claim_idempotency_key 和 cli_log_fitness_workout |
| 关键文件对照 | CLI 实现、API 路由、健身/财务核心数据逻辑及 supabase/migrations 与基准无改动 |
| Git diff 格式检查 | 通过；保留原有 supabase/.temp/cli-latest 无关改动 |

新增加的应用壳测试使用真实布局/时间组件与合成身份，验证两块导航、设置入口、时间信息、隐藏面板及根地址跳转。不是登录后的真实数据库端到端测试。

CLI 测试执行实际命令文件，对临时本地模拟 HTTP 服务发请求，验证身份/工具发现地址、Bearer 传递、两种写入工具输入与回执、每次新调用产生不同幂等键，以及同次传输重试复用原键和请求体。只使用合成记录和 Token，不访问 Keychain 或线上账本；未模拟服务端数据库事务，因此不证明 exactly-once。

## 浏览器与 HTTP 验证

使用本地产物启动生产服务器（127.0.0.1:19999）及独立 agent-browser 会话验证：

- 根地址进入登录页；登录页非空，能显示邮箱、密码、登录/注册按钮，未发现框架错误浮层或页面横向溢出。
- 未登录访问 /fitness、/finance、/settings 会到登录页。
- /growth/english、/todos、/commands、/timeline、/search、/output、/family 返回 HTTP 404。
- 未授权请求 /api/v1/tools 和 /api/v1/cli/whoami 返回 HTTP 401。

没有使用或索取生产登录凭据，没有登录真实账户后执行训练/账单写入。登录后的真实数据浏览、编辑、权限隔离和完整业务链路仍需后续验收；不能把未登录页面检查等同于全功能通过。

## 明确保留到后续的工作

1. **数据库删除**：28 张候选表、2 个视图、5 个函数、专属策略和配置行均未删除；所有历史 migrations 完整保留。
2. **线上资源**：已部署英语函数、avatars 文件/bucket、线上 Secret 尚未下线或删除。本地源码删除不会自动清理这些资源。
3. **既有核心问题**：健身网页创建 session 未提交必填 user_id、健身数据库 RLS/授权缺口未在本轮修复；没有改动数据逻辑来掩盖这些问题。
4. **发布前置条件**：迁移记录校准、真实可恢复备份、Storage 归档、外部调用者核查、生产删除清单审阅及发布窗口仍待落实。
5. **工程遗留**：ChipGroup lint warning 和 Storybook 对 Next.js 16 的既有 peer 提示未扩大处理。

用户授权的顺序是先应用代码、后数据库。后续无需重新询问是否允许本轮代码删除；生产历史数据删除则依据最终对象/数据量/归档/恢复证据单独确认。

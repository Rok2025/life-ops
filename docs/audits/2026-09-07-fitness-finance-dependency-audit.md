# 健身与财务彻底收缩：依赖审计

- 审计日期：2026-09-07
- 代码基准：`main`，HEAD `bf2b126`；工作区已有文档改动与 `supabase/.temp/cli-latest` 改动，均未重置。
- 状态：只读审计完成；代码删除、数据库迁移、部署、备份恢复演练均未执行。
- 方法：核对本地路由、模块引用、CLI 与笔记端调用契约，再读取已关联的线上 life-ops 项目数据库目录、函数定义、权限及迁移记录。没有读取账单、训练、笔记正文、Token 或密钥值。
- 配套：[实施方案](../fitness-finance-simplification-plan.md)、[数据库元数据快照](2026-09-07-fitness-finance-schema-inventory.json)。

## 1. 结论

可以把运行中的业务范围收缩到健身与财务。当前 public schema 有 44 张表、2 个视图、8 个函数；建议保留 16 张表及其中必要配置行，删除候选为 28 张表、2 个视图、5 个函数，以及 2 个英语 Edge Functions。

保留表没有外键指向待删表；保留的两个 CLI RPC 未引用待删业务表。全局搜索和流水记函数同时引用健身及大量废弃模块，应整体移除，不能保留旧函数后直接删它们所引用的表。

以上是依赖审计后的目标清单，不是现在可以直接执行的 DROP 清单。执行前仍须核对实际数据影响、外部调用、迁移版本、备份与恢复路径。

## 2. 真实架构及调用关系

```text
Brain 三个录入 Skill / 支付宝导入脚本
  → packages/cli/bin/lifeops.mjs
  → Next.js /api/v1/*
  → features/cli-api/server.ts
      ├─ 财务：finance_accounts → finance_transactions
      ├─ 健身：exercise_types → cli_log_fitness_workout
      │                          → workout_sessions / workout_sets
      └─ 授权、幂等、审计：4 张 cli_* 表 + cli_claim_idempotency_key

网页健身 → fitnessApi → Supabase 数据 API / 服务端客户端 → 3 张健身表
网页财务 → FinanceAccessGate → financeApi → 8 张 finance_* 表
设置 → 动作管理 / system_configs.exercise_category

harness/*：独立实验运行时，仅注册 frogs / TIL / projects 三个读取工具
command-center：命令模板与分类管理，与正式 lifeops CLI 无依赖关系
```

这里的后端包含 Next.js Route Handlers、Server Actions、Supabase 表/RPC/权限/Edge Functions，以及独立实验 harness，不是单一后端目录。`.ai/conext/project.md` 仍描述 Spring Boot、Next.js 15，与当前代码及 Next.js 16 依赖不符，应在实施时修正文档。

### 核心保留证据

| 能力 | 代码位置 | 依赖 |
| --- | --- | --- |
| 健身查看、统计、编辑 | `apps/web/src/features/fitness/api/fitnessApi.ts`、`api/server.ts` | 三张健身表；训练部位来自 system-config |
| 财务概览、交易、账户、负债、预算 | `apps/web/src/features/finance/api/financeApi.ts` | 八张 finance_* 表；不能仅保留 transactions |
| 财务访问验证 | `apps/web/src/features/finance/components/FinanceAccessGate.tsx` | `features/auth`；不是一张独立权限表 |
| CLI 服务 | `apps/web/src/features/cli-api/server.ts`、`types.ts`、`actions.ts` | 两个工具、三个 scope、四张 CLI 表、两个 RPC |
| 网页身份及会话 | `app/(app)/layout.tsx`、`lib/auth/server.ts`、`lib/supabase/*`、`proxy.ts` | Supabase Auth、浏览器/SSR/admin 客户端 |
| 时间卡片 | `components/layout/SummaryPanel.tsx`、`lib/horizons.ts` | 日期计算；移除待办查询后不依赖旧业务 |

## 3. 代码与部署清理清单

### 保留与裁剪

- 保留 `features/fitness`、`finance`、`auth`、`cli-api`。
- 裁剪 `features/system-config`：保留动作管理、训练部位、基础配置 API；删除英语提示词、家庭分类、输出分类、TIL 分类、项目范围、命令模板及又又照片设置。当前没有独立的财务 ConfigScope，不虚构一个新配置模块。
- 保留 `packages/cli`、公共认证、React Query、必要 UI/布局、主题、日期工具和时间面板；公共组件逐个检查引用后删除无用部分。
- 保留 `/fitness` 及其 history、exercises、workout/new、workout/detail；保留 `/finance`、`/settings`、`/developer`、`/login`、`/auth/callback`、`/cli/authorize` 和全部现有 `/api/v1/*` 路由。
- 根地址改为进入现有健身页，作为方案默认选择，不代表已核实健身访问频率更高。

### 删除候选

| 目录或资源 | 清理内容及理由 |
| --- | --- |
| `features/dashboard`、`daily-frogs`、`daily-til` | 综合首页及每日行动/学习业务 |
| `features/growth-projects`、`quick-notes`、`output` | 项目、待办、笔记、输出存在交叉引用，整组清理 |
| `features/english-learning`、`english-prompts`、`prompt-library` | 英语学习与提示词业务 |
| `features/family`、`youyou` | 家庭与育儿业务 |
| `features/search`、`timeline` | 跨旧模块聚合入口及 RPC 调用 |
| `features/command-center` | 模板管理；正式 CLI 不引用它 |
| `app/(app)/growth`、`todos`、`output`、`family`、`search`、`timeline`、`commands` | 删除整组路由及 loading/error/layout；历史 URL 明确返回 404，不留空壳 |
| `harness/core`、`api`、`ui`、`dev`、`sql` | 实验运行时及草案；现有注册工具不含健身/财务，正式 CLI 不经过它 |
| `supabase/functions/ai-english*` 及无引用的 `_shared/cors.ts` | 本地源码与线上函数均需清理，删目录不会自动下线线上函数 |
| `@dnd-kit/core`、`sortable`、`utilities` | 当前源码引用只在家庭任务看板；删除看板后清理依赖 |
| `react-markdown`、`remark-gfm`、`rehype-highlight` | 前两者当前引用在输出与提示词模块，后者未发现源码引用；全库复核后移除 |

删除 harness 时同步根 `package.json` 的 dev filter、`pnpm-workspace.yaml` 的 `harness/*`、lockfile 和启动说明。保留 web + CLI 的 workspace；不同时拆除 Turborepo 或替换技术栈。harness 本地运行记录/环境文件如存在，先作私有归档，不纳入普通代码批量删除。

连带核对顶栏、侧栏、右侧快捷按钮、路由标题、主动预加载、快捷键说明、样式、图片 remotePatterns、测试和 Storybook 引用。只删除归属于废弃模块的内容；不能把剩余通用测试工具一并删除。

## 4. 数据库对象清单

### 保留 16 张表

| 分组 | 精确表名 |
| --- | --- |
| 健身（3） | `exercise_types`、`workout_sessions`、`workout_sets` |
| 财务（8） | `finance_profiles`、`finance_accounts`、`finance_liabilities`、`finance_credit_card_bills`、`finance_payment_schedules`、`finance_transactions`、`finance_budgets`、`finance_monthly_snapshots` |
| CLI（4） | `cli_device_authorizations`、`cli_access_tokens`、`cli_idempotency_keys`、`cli_api_audit_logs` |
| 配置（1） | `system_configs`，保留 `scope = 'exercise_category'` |

保留 `auth` 和 Supabase 平台 schema、必要扩展，不按“非健身/财务名称”清理平台对象。保留表的主键、外键、索引、约束、默认值、授权和业务需要的 RLS 策略随表保留，权限缺陷另行修复。

保留函数：

- `cli_claim_idempotency_key(uuid,text,text)`。
- `cli_log_fitness_workout(uuid,date,text,jsonb)`。
- `finance_set_updated_at()`，及 8 张财务表上的更新时间触发器。

前两个 RPC 线上当前仅 `service_role` 可执行，`anon`、`authenticated` 不可执行；改造不得放宽。保留 `idx_workout_sessions_user_date`、`idx_finance_accounts_user_name` 等必要唯一索引。

### 删除候选 28 张表

| 分组 | 精确表名 |
| --- | --- |
| 行动、学习、领域目标（4） | `daily_frogs`、`daily_til`、`quick_notes`、`area_goals` |
| 成长、项目、输出（4） | `growth_projects`、`project_todos`、`project_notes`、`outputs` |
| 提示词（1） | `prompt_templates` |
| 英语（8） | `english_queries`、`english_cards`、`english_daily_summaries`、`english_prompt_templates`、`english_prompt_mode_bindings`、`english_word_bank`、`english_daily_assignments`、`english_learning_logs` |
| 家庭（3） | `family_members`、`family_tasks`、`family_task_assignees` |
| 又又（5） | `youyou_diary`、`youyou_milestones`、`youyou_growth_records`、`youyou_vaccinations`、`youyou_medical_records` |
| 命令中心（2） | `command_categories`、`command_templates` |
| 聚合目标（1） | `analytics_targets` |

`area_goals` 与 `analytics_targets` 未发现核心模块消费引用；将它们列为删除候选不等于已排除仓库外调用者。当前全局搜索/流水记读取健身，但核心健身页面不依赖它们。财务分类中的 `family`、`childcare` 是有效收支分类，不能因为删除家庭/又又模块而删除分类或交易。

### 其他对象

- 删除视图：`v_analytics_targets_active`、`v_analytics_targets_by_area`，均只依赖 analytics_targets。
- 删除函数：`search_global(text,text[],date,date,integer)`、`get_global_timeline(date,date,text[],integer)`、`command_center_set_updated_at()`、`update_analytics_targets_updated_at()`、`youyou_set_updated_at()`。
- 删除专属触发器：analytics_targets 的 1 个、command_* 的 2 个、youyou_* 的 3 个；名称见元数据快照。删表时随表删除对应索引和 RLS 策略，不操作保留表的策略。
- 删除配置行的精确 scope：`til_category`、`project_scope`、`output_type`、`family_task_category`、`youyou-photo`。实施时重新枚举，新增未知 scope 不自动纳入删除。
- 线上两个 ACTIVE Edge Functions：`ai-english` v7、`ai-english-summary` v6。下线后检查 `AI_PROVIDER`、`AI_API_KEY`、`AI_MODEL` 的其他使用者，确认专属后再清理 Secret；本次未读取 Secret。
- Storage：当前仅发现公开 bucket `avatars`，含 1 个对象。仓库消费在 youyou/photoApi，不能凭 bucket 名字当作账户头像依赖，也不能仅凭一个引用就直接删文件。核对对象用途和外部引用、单独导出原文件后，再删除对象、bucket 及其 4 个专属策略。数据库 dump 不含对象文件。
- 当前未发现 `cron.job`、public 表的 publication 配置、其他非平台 schema 或跨 schema 指向 public 表的外键。不代表已检查 Vercel、其他电脑或外部调度器；发布前仍需核查外部任务。
- `harness/sql` 中的 `agent_sessions`、`agent_messages`、`agent_runs`、`approval_requests`、`tool_call_logs` 在线上 public 不存在；只能删本地草案，不能宣称已删线上运行时表。

## 5. 笔记系统兼容契约

已读取 Brain 中 `lifeops-fitness-entry`、`lifeops-expense-entry`、`lifeops-alipay-import` 的当前 Skill 文本与导入脚本入口。未读取私有导入台账或原始账单。这三条已知链路只经正式 lifeops CLI，不依赖命令中心、搜索、流水记或 harness。

| 项目 | 必须保持 |
| --- | --- |
| CLI 安装与身份 | `lifeops` 命令名、Keychain service/account、现有设备 Token；不清空 cli_* 表 |
| 服务地址 | 当前默认 `https://life-ops-web.vercel.app`，允许 `LIFEOPS_API_URL` 覆盖；地址是否已被本机覆盖未读取 |
| 基础命令 | `login`、`logout`、`whoami`、`tools`、`run`，`--json`、`--input JSON` 与 `--input @file` |
| 授权 scopes | `tools:read`、`finance:write`、`fitness:write` |
| 财务工具 | `log_finance_transaction`；`occurred_date`、`amount`、`transaction_type`、`category`、`merchant`、`note`、`account_name` |
| 健身工具 | `log_fitness_workout`；`workout_date`、`notes`、`exercises[{exercise_name,weight,sets,reps}]` |
| JSON 回执 | 顶层 `toolName`、`confirmation`、`data`、`replayed`；错误 `{error}` 和当前 400/401/403/404 语义 |
| 财务结果 | `data.transaction.id`、`data.accountResolution`；唯一匹配账户才绑定，否则记为未绑定并明确回执 |
| 健身结果 | `data.workout.session_id`、`data.workout.created_sets`；动作名精确匹配，同用户同日追加组数 |
| 日期与精度 | 缺省日期按 Asia/Shanghai；金额归一到两位小数；训练重量、组数、次数维持既有含义 |

必须保留的 HTTP 路由：

- `POST /api/v1/cli/device/start`、`POST /api/v1/cli/device/token`。
- `POST /api/v1/cli/tokens/revoke`、`GET /api/v1/cli/whoami`。
- `GET /api/v1/tools`、`POST /api/v1/tools/log_finance_transaction`、`POST /api/v1/tools/log_fitness_workout`。
- `/cli/authorize` 页面及 approve/revoke Server Actions、`/developer` 设备管理页。

当前客户端每次新 run 生成新的幂等键，同一次 HTTP 请求内部网络重试复用该键。它不能阻止用户重新运行整条命令造成业务重复。当前 CLI 也没有历史流水读取或修改命令。财务写入、幂等完成标记和审计插入是分步操作，并非一个数据库事务；不能把保留现状描述为已证明 exactly-once。故障窗口测试和是否修复事务边界应单列，不混同业务清理收益。

日常文字/截图消费 Skill 默认账户是支付宝；CSV 导入 Skill 刻意不传 account_name。两者按当前规则保留，不在本次收缩中统一。CSV 私有去重台账引用已有交易 ID，不能清空或重新生成交易 ID，也不能修改或删除 Brain 私有台账。

已知 Skill 展示的是解析、确认和单向调用；未发现自动回写笔记或双向同步契约。不能将笔记正文当作可完整恢复数据库的备份。暂以数据库记录作为网页展示依据，不增加同步机制。

## 6. 改造前必须正视的现状

### 6.1 迁移记录不一致

本地 26 个迁移文件、线上 25 条迁移记录，差异如下：

| 迁移 | 本地版本 | 线上记录 |
| --- | --- | --- |
| cli_api_foundation | `20260801091522` | `20260801093253` |
| add_fitness_cli_write | `20260802130000` | `20260801174113` |
| add_finance_payment_accounts | `20260520004925` | 未发现对应记录；不等于能断定账户数据不存在 |

仓库 migrations 未找到 exercise_types、workout_sessions、workout_sets 的初始 CREATE TABLE。旧迁移还包含空表保护的 CLI 重建脚本、要求恰好一个 auth 用户的健身归属回填，不能假设空库从头重放必然成功。线上健身 RPC 当前使用修复后的 target_session_id，必须对比定义，不能用版本号缺口推断该重跑哪份 SQL。

在数据库清理前，先校准版本映射和 schema 基线，验证空环境初始化方案及现有库升级方案。历史迁移保留为来源记录；不随废弃功能删旧迁移，不盲目 db push、repair、reset 或重放有数据回填的脚本。

### 6.2 文档中的备份路径未核实存在

README / docs/supabase-backup.md 声称外置备份已运行，但本机 `/Users/freeman/Documents/06-Back` 不存在，指定 backup.sh、latest.dump、LaunchAgent plist 均未找到。未检查其他主机或云平台备份，不能断言完全没有备份，也不能据文档当作已完成保护。

删库前需要实际可访问的专门归档、恢复演练和 Storage 对象导出。删除前的归档不得被旧文档中的 14 天滚动清理自动覆盖或移除。数据库删除后仅回滚代码无法恢复旧业务；不能用整库旧备份直接覆盖删除后新产生的财务/训练数据。

### 6.3 备用健身录入存在契约缺口

`fitnessApi.ts` 新建 session 分支只提交 workout_date 和 notes；线上 workout_sessions.user_id 是 NOT NULL、没有默认值，也未发现补齐它的业务触发器。根据代码和线上 schema，该分支缺少必填字段。未执行真实写入复现，不报告线上写入测试通过。已有同日 session 的追加分支与新日期创建分支须分别验证。

当前健身读取/编辑也未显式按 user_id 限定；线上 3 张健身表 RLS 均未开启，anon/authenticated 有表级读写授权。这是实际配置证据；未进行匿名网络读取探测，也未检查 Data API 暴露设置。网页登录保护不能替代数据库权限边界。上线前应修复用户归属与访问控制，验证未登录和跨用户访问；动作库是共享还是私有需按产品语义设计，不能给没有 user_id 的表硬套同一策略。

### 6.4 还未取得的运行证据

本次没有启动 dev server、执行完整构建/业务测试、写入线上样例、撤销设备 Token、停用函数或恢复备份。未核查全部外部调用者、云环境配置、旧模块数据行数及具体删除量。这些是后续发布/删除关卡的待办，不是依赖审计已证明的事实。

## 7. 建议推进顺序

先冻结本审计清单与兼容契约，补齐 schema/备份基线和现有健身缺口；再移除应用旧模块与 harness；在隔离环境执行精确数据库清理、验证两条完整业务链路；最后审阅具体删除对象及影响，发布应用、下线专属云函数并应用新迁移。清理使用明确对象与依赖顺序，避免无审查的 DROP CASCADE。

“彻底删除”指当前运行代码和生产业务对象不再承载废弃模块；Git 历史、必要迁移来源、删除前私有归档可以保留。这不要求重写 Git 历史或抹掉恢复证据。

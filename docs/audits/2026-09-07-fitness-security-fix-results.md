# 健身录入、事务和权限修复结果

- 日期：2026-09-07；已完成生产部署及数据库迁移。
- 站点：https://life-ops-web.vercel.app
- 部署：`dpl_83N3j51KEeyic33QehyFkeaVtarA`（READY，已 promote）。
- Supabase 项目：`owhckhngopdwbqgxtmpy`，未操作其他项目。

## 行为变化

1. 网页新建、编辑和删除训练统一调用 feature 内的 Server Actions；使用用户的 SSR Supabase client，并通过 `auth.getUser()` 验证登录。输入参数不能指定写入用户，传入的额外 user_id 会被丢弃。
2. `fitness_save_workout` 是 SECURITY INVOKER 函数，使用 `auth.uid()` 取得归属。新建按 `(user_id, workout_date)` upsert，重复日期追加到本人同一天；编辑先锁定本人的 session，再整体替换训练组。任意失败回滚日期、备注和组数据。
3. `fitness_delete_workout` 仅删除本人的 session，使用现有外键级联，在同一事务内删除训练组。清空动作后仍可保存、随后删除该训练记录。
4. Server Action 和数据库都验证输入；限制有效日期、UUID、非负重量/次数、整数的组数/次数及负载大小。重量按现有 numeric(6,2) 字段限制为 0–9999.99，每个动作最多 100 组，一次最多 100 个动作、1000 组。
5. `workout_sessions` 和 `workout_sets` 开启 RLS，分别按本人归属及父 session 归属校验读写；UPDATE 同时检查旧记录和更新后记录，不能转移所有者或把自己的组挂到别人的 session。
6. `exercise_types` 和 `system_configs` 撤销匿名访问。登录用户可读取动作与训练部位；只有维护者能增删改。移除了原先“所有登录用户可修改训练部位”的宽泛策略。
7. 新增非公开 schema `lifeops_private` 中的 `fitness_maintainers` 支撑表：迁移确认线上只有一个 Auth 用户后，将该已有用户设为维护者。新注册用户不会自动成为维护者，也不能自行插入维护者记录。未改写 Auth 用户资料或 JWT metadata。

普通登录角色只能执行两个受 RLS 约束的新网页 RPC；已有 CLI RPC 仍只向 service_role 开放，定义、参数、动作名称映射、Token/scopes 和回执保持不变。没有将 service-role key 放入浏览器，也没有向普通用户开放可指定 p_user_id 的特权 RPC。

## 上线顺序与迁移

1. 新建删除后、修复前的私有完整备份：`/Users/freeman/.local/share/life-ops/archives/2026-09-07-fitness-security/before-security.dump`。
2. 用 PostgreSQL 17 隔离库恢复业务/Auth 基线，验证新增函数、角色策略、失败回滚和并发；不写入生产虚构训练。
3. 执行兼容接口迁移 `20260907012626_secure_fitness_writes_and_policies.sql`。
4. 发布新网页，验证新部署的登录入口及现有 CLI 身份/工具接口，然后切换正式域名。
5. 执行权限迁移 `20260907013104_fitness_row_security.sql`，最后检查真实匿名 HTTP 请求、目录、保留数据和 CLI。

两份迁移分别由 Supabase apply_migration 执行，本地文件名和 SQL 内容均已核对与线上记录一致。没有重放旧迁移。权限迁移会在用户数或旧策略清单不符时停止，避免猜测维护者或保留未知宽泛策略。

## 验证证据

| 检查 | 结果 |
| --- | --- |
| Web 单元/组件测试 | 60 项通过，其中新增 10 项 Server Action 测试 |
| CLI 测试 | 4 项通过 |
| 实际数据库权限与事务 | `supabase/tests/fitness_security.sql` 通过；匿名拒绝、两个合成用户隔离、阻止伪造/转移归属、维护权限与防提权均通过 |
| 故障注入 | 在编辑删旧组之后由触发器令新组写入失败，旧日期/备注/5 组数据全部恢复；新建失败不留下空 session |
| 同日并发首次写入 | 两个独立连接同时写入，最终 1 条 session、6 组，顺序 1–6 不重复、不丢失 |
| 原有 CLI 写入兼容 | 隔离库使用 service_role 调用原函数，追加成功，session_id/created_sets 回执通过断言 |
| 生产数据核对 | 16 张原有表在修复前后行数和全部行内容指纹完全一致；已有 CLI 函数定义的指纹不变 |
| 真实匿名 HTTP HEAD | workout_sessions、workout_sets、exercise_types、system_configs 均从 200 变为 401，未读取记录内容 |
| 线上所有者角色只读检查 | 本人的训练、训练组、动作库、训练部位及维护者身份可读 |
| 现有真实 CLI 授权 | whoami/tools 正常，完整响应与修复前一致；未撤销/更换设备 Token |
| 构建 | 本地及 Vercel 生产构建、生产 TypeScript 检查通过 |
| lint | 0 错误；保留 ChipGroup 中 radioName 未使用的原有警告 |

单独运行全量 `tsc --noEmit` 时曾遇到旧 `.next/dev/types` 路由残留及原有测试 mock 类型错误；没有通过忽略生产类型错误来绕过检查，之后本地和云端 Next 生产构建均正常通过。测试基线问题未混入本轮代码修复。

数据库测试使用隔离环境中的身份声明模拟，不等同于完整 Auth 登录端到端测试；生产只做真实授权的 CLI 只读检查和角色/匿名访问验证。未在真实训练中插入测试数据，也未宣称已完成生产网页实际写入演示。

## 安全检查结果与后续边界

Supabase Security Advisor 中的 3 项 `rls_disabled_in_public` 错误已消失，未新增安全告警。仍保留与本轮健身修复不同的既有项目：

- 财务更新时间函数未固定 search_path：[修复指引](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)。
- Auth 密码泄漏检测未开启：[官方说明](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)。
- CLI 幂等表启用 RLS 但没有普通用户策略的 INFO 提示：该表由服务端管理，保持客户端默认拒绝；[说明](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)。

原有 CLI 的应用级幂等记录与业务事务仍是分步执行，本轮没有声称将整个 CLI 链路变为 exactly-once。未来需要增加动作库维护者时，必须通过管理员操作明确授予私有维护者记录，不能改回“所有登录用户可写”。

## 恢复边界

旧网页版本能够读取本人数据，但旧的新日期写入缺口依然存在；不要为回滚网页而关闭 RLS。优先修正新函数或应用。若确需恢复原策略，应先在隔离环境核对备份中的权限，不要整库覆盖新增记录。所有恢复归档及身份相关验证产物保存在仓库之外，未上传到 Git 或 Vercel。

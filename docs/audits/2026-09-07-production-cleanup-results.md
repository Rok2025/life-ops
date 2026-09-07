# 健身与财务收缩：线上清理结果

> 后续修复：下文所列健身录入/RLS 缺口已解决并上线，当前状态见[健身修复结果](2026-09-07-fitness-security-fix-results.md)。下文保留清理阶段的历史记录。

- 日期：2026-09-07（北京时间）。
- 用户授权：`所有非健身和财务的数据都可以从线上永久删除`。本轮已执行该授权，无需再次逐表确认。
- 状态：精简版已发布，线上无关业务对象已删除，保留数据核对通过。工作区尚未 Git 提交或推送。
- 生产站点：https://life-ops-web.vercel.app
- 部署：`dpl_B8fSSMn48bypqXKZgzn4HSNHN9FW`，状态 READY；已执行 promote。
- Supabase：`owhckhngopdwbqgxtmpy`（life-ops）。未操作 yoyo 或其他项目。

## 已执行

| 对象 | 结果 |
| --- | --- |
| 业务表 | 44 → 16，删除审计清单中的 28 张无关业务表 |
| public 视图 | 删除 2 个 analytics 视图，剩余 0 |
| public 函数 | 删除 5 个无关函数，保留 2 个 CLI RPC 和 finance_set_updated_at |
| 表内对象 | 废弃表专属触发器、索引、外键及 RLS 策略随表删除 |
| system_configs | 删除废弃 scope 行，只保留 exercise_category |
| Edge Functions | ai-english、ai-english-summary 已删除，当前函数列表为空 |
| 英语专属 Secret | AI_API_KEY、AI_MODEL、AI_PROVIDER 已删除；平台 Secret 保留 |
| Storage | 1 个已归档对象及 avatars bucket 通过 Storage API 删除；剩余对象、bucket 均为 0 |
| Storage 策略 | avatars_auth_delete/insert/update、avatars_public_read 已删除 |

保留 3 张健身表、8 张财务表、4 张 CLI 表及 system_configs。Auth 和平台 schema、登录凭据、CLI 授权、幂等、审计，以及财务 family/childcare 分类交易均保留。

## 删除前保护与恢复演练

私有归档位置：`/Users/freeman/.local/share/life-ops/archives/2026-09-07-cleanup/`。该目录在 Git 和部署包之外，目录权限 700、文件权限 600。

- `database-final-before.dump`：删除前最终完整 PostgreSQL 自定义格式归档，包含权限和所有权元数据。
- `business-auth.dump`：用于实际恢复演练的 public/auth 归档；另有早期完整归档。
- `storage-object-0.bin` 与 `storage-manifest.json`：照片文件、原始对象路径及 SHA-256；删除前再次下载比对 SHA-256 一致。
- `supabase/functions/`：删除前从线上下载的两个 Edge Function 源码。
- `checksums.json`、恢复日志、前后数据指纹及迁移记录：私有验证证据，不纳入仓库。

使用独立 PostgreSQL 17.11 集群和私有 Unix socket 恢复 public/auth：44 张业务表恢复成功；运行清理迁移后剩余 16 张。将时区统一为 UTC、排序固定为 C 后，16 张保留表的行数和全部行内容指纹与线上一致。另恢复 Storage schema，验证策略清理迁移成功。

演练验证了业务/Auth 数据及对象文件归档，未声称已完整启动 Supabase Auth、Storage 等整套平台服务。恢复英语功能还需重新配置已删除的 AI Secret。此次归档不是自动定时备份。

本机安装了 PostgreSQL 17.11 用于演练，使用独立目录；未切换现有 PostgreSQL 14 的命令链接，未注册或启动开机服务。演练结束后临时数据库已停止。

## 迁移及发布顺序

1. Vercel 重新登录并核对现有 life-ops-web 项目，根目录 apps/web。
2. 新增 `.vercelignore` 排除本地财务导出、环境文件、备份和 Supabase 运维目录；dry-run 核实 204 个应用文件，不含私有导出。修正首次构建中排除规则误匹配嵌套 Supabase 客户端目录的问题。
3. 为 Turbo 声明应用使用的环境变量；重新云端构建和 TypeScript 检查通过。
4. 在正式切换前验证新部署登录页、旧路由及已有授权的 CLI 只读接口，然后 promote 至正式域名。
5. 完成最终归档，下线旧 Edge Functions，再执行精确数据库删除迁移。
6. 验证照片归档一致，通过 Storage API 删除对象/bucket，再删除对应策略和英语专属 Secret。

新增迁移（本地文件名已对齐实际线上版本）：

- `20260907010628_remove_non_fitness_finance_business.sql`
- `20260907010707_remove_unused_avatar_storage_policies.sql`

由 Supabase apply_migration 单独执行，没有 db push，没有重放历史迁移。旧迁移的两组版本差异和账户种子记录缺失仍属于历史问题，不冒充已修复。现有备份可用于恢复，不表示旧 migrations 已可从空库完整初始化。

删除迁移校验精确的 44 表清单和配置 scope；在同一事务中锁定相关表阻止并发写入，保存 16 张保留表的行数/全部行内容指纹，删除后逐表比较。锁等待最多 10 秒，语句最多 120 秒，任何未知依赖或保留数据差异都会失败回滚。没有 DROP CASCADE。

## 验证结果与边界

- 线上目录核对：16 表、0 个旧视图、3 个保留函数，配置 scope 仅 exercise_category；0 个 Edge Functions、0 个 Storage 对象/bucket、0 个 avatars 策略。
- 删除事务内的 16 表完整记录校验通过；删除后与发布前独立快照对比也完全一致。
- 正式域名登录页 HTTP 200；旧英语页和命令中心 HTTP 404。
- 通过现有 Keychain 授权执行真实 CLI whoami/tools；用户、设备、权限、过期信息以及两个工具的完整响应结构与删除前一致。
- Vercel cron definitions 为空；原审计未发现 pg_cron。不代表已核查所有可能的第三方外部调用者。
- 本地 50 个 Web 测试与 4 个 CLI 测试通过，云端生产构建和 TypeScript 通过。
- 未向真实训练或账本插入虚构数据，未做生产写入演示；登录后的网页全面验收、跨用户权限与端到端写入测试尚未完成。

既有的健身网页新建 session 缺少 user_id、健身三表权限/RLS 问题仍按原审计单独待修复。本轮完成业务删除，不将这些缺口标记为已解决。

## 恢复边界

删表后不能只回滚到旧版网站：旧版依赖已删除的对象。需要先在隔离库恢复私有归档，再选择性恢复旧业务对象和文件，保留删除后新增的健身/财务数据；不要直接整库覆盖生产。历史设计与迁移文件保留为来源记录，不是仍运行的模块。

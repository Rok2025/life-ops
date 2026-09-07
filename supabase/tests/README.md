# 健身权限和事务集成测试

测试使用真实 PostgreSQL 的约束、角色、RLS、事务和并发连接，不依赖模拟数据库返回值。

准备独立 PostgreSQL 17 数据库 `lifeops_fitness_test`，从私有的 public/auth 归档恢复基线并应用当前清理、健身写入和权限迁移。初始化权限迁移时需只有已核实的单一系统所有者；测试脚本随后生成两个合成用户。测试需要本地数据库所有者权限，以及与 Supabase 一致的 `anon`、`authenticated`、`service_role` 角色（后者具备 BYPASSRLS）。不连接生产库。

```sh
export PGHOST=/path/to/private/socket
export PGPORT=55439
export PGUSER=local_database_owner
export PGDATABASE=lifeops_fitness_test
export PSQL=/path/to/postgresql17/bin/psql

"$PSQL" -X -v ON_ERROR_STOP=1 -f supabase/tests/fitness_security.sql
python3 supabase/tests/test_fitness_concurrency.py
```

- `fitness_security.sql` 校验数据库名后，在事务内生成合成用户/动作/配置；测试结束全部回滚。它覆盖匿名拒绝、缺少 JWT、本人新建/追加/编辑/删除、同日不同用户隔离、伪造/转移所有者、跨用户训练组写入、维护者授权及阻止自行提权。
- 回滚测试通过临时触发器，在旧组删除后让新组插入失败，验证日期、备注和旧组一起恢复；同时验证新建失败不会留下空 session。
- 现有 CLI 写入 RPC 以 service_role 调用，校验 session_id/created_sets 回执及追加能力；普通登录角色不能直接调用这个特权 RPC。
- 并发脚本用两个独立连接同时首次保存同一天，验证只生成 1 个 session、保留全部 6 组、顺序不重复；最后清理自己创建的合成数据。

这些测试在 SQL 层模拟已验证 JWT 的身份声明，不替代完整 Supabase Auth 登录或浏览器端到端测试。Server Action 的身份验证、输入校验、RPC 参数和错误传播由 `apps/web/src/features/fitness/actions.test.ts` 覆盖。

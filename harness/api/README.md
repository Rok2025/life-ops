# Harness API

`harness/api` 是 `life-ops` harness runtime 的最小可运行入口。

当前版本提供：

- `GET /health`
- `GET /tools`
- `GET /sessions/:sessionId/runs`
- `POST /sessions/:sessionId/runs`
- 只读工具 `list_today_frogs`
- 只读工具 `list_today_til`
- 只读工具 `list_projects`

## 运行

```bash
pnpm --filter @life-ops/harness-api start
```

默认端口是 `4318`。

环境变量按这个优先级读取：

1. 进程环境变量
2. `harness/api/.env.local`
3. `harness/.env.local`
4. `apps/web/.env.local`

支持的变量：

```bash
HARNESS_API_HOST=127.0.0.1
HARNESS_API_PORT=4318
HARNESS_DEFAULT_TIMEZONE=Asia/Shanghai
HARNESS_RUNTIME_DIR=./harness/.runtime
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

也兼容现有前端使用的：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 示例请求

先看某个 session 的历史：

```bash
curl http://localhost:4318/sessions/demo-session/runs?limit=8
```

```bash
curl -X POST http://localhost:4318/sessions/demo/runs \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "看看今天的青蛙",
    "input": {
      "timezone": "Asia/Shanghai"
    }
  }'
```

也可以显式指定工具：

```json
{
  "message": "查询今日青蛙",
  "toolName": "list_today_frogs",
  "input": {
    "date": "2026-03-18",
    "timezone": "Asia/Shanghai"
  }
}
```

```json
{
  "message": "看看今天的 TIL",
  "toolName": "list_today_til",
  "input": {
    "date": "2026-03-18",
    "timezone": "Asia/Shanghai"
  }
}
```

```json
{
  "message": "看看项目",
  "toolName": "list_projects",
  "input": {
    "area": "ai",
    "status": "active",
    "limit": 10
  }
}
```

如果后续前端要透传 Supabase 登录态，可以把用户 token 放到：

- `Authorization: Bearer <token>`

当前 `POST /sessions/:sessionId/runs` 还是最小 scaffold：

- 没接 LLM
- session/run 先持久化到 `harness/.runtime/runtime-store.json`
- 先走确定性的 intent 识别 + tool 执行

下一步最适合继续补的是：

1. session / run 持久化
2. `list_project_todos`
3. 审批流和写工具
4. 真实数据库持久化

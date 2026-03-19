# Harness UI

`harness/ui` 是独立于 `apps/web` 的本地调试界面，用来验证 `harness/api` 是否可用。

当前能力：

- 检查 API health
- 拉取已注册 tools
- 发起 `POST /sessions/:id/runs`
- 展示 plan、tool calls、assistant message
- 展示 run diagnostics 和常见失败提示
- 展示服务端持久化的最近 run 历史，支持点击回放

## 运行

先启动 API：

```bash
pnpm --filter @life-ops/harness-api start
```

再启动 UI：

```bash
pnpm --filter @life-ops/harness-ui start
```

默认地址：

- UI: `http://127.0.0.1:4319`
- API: `http://127.0.0.1:4318`

也可以直接用一键启动器：

```bash
pnpm --filter @life-ops/harness-dev start
```

可选环境变量：

```bash
HARNESS_UI_HOST=127.0.0.1
HARNESS_UI_PORT=4319
HARNESS_UI_API_BASE=http://127.0.0.1:4318
```

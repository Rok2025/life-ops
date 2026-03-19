# Harness Dev

`harness/dev` 提供本地联调入口，用一个命令同时拉起 `harness/api` 和 `harness/ui`。

## 运行

```bash
pnpm --filter @life-ops/harness-dev start
```

默认会同时启动：

- API: `http://127.0.0.1:4318`
- UI: `http://127.0.0.1:4319`

支持直接透传已有环境变量：

```bash
HARNESS_API_HOST=127.0.0.1
HARNESS_API_PORT=4318
HARNESS_UI_HOST=127.0.0.1
HARNESS_UI_PORT=4319
HARNESS_UI_API_BASE=http://127.0.0.1:4318
```

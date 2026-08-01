# Life OPS CLI 对外调用实施方案（v1）

> 背景：Life OPS 需要成为可由 AI-Output-Brain、终端和自动化程序调用的个人系统。系统对外提供版本化 API，官方 `lifeops` CLI 是第一个客户端；自然语言由调用端 Skill 解析，CLI 只负责可靠执行。

> 实施状态：v1 代码、迁移和本机 CLI 已完成；线上生效仍需执行该迁移、在 Vercel 配置 `SUPABASE_SECRET_KEY` 并部署。

## v1 目标

- 新增受保护的 `/api/v1` CLI API、设备授权、Token 撤销与审计能力。
- 新增 `packages/cli` 官方客户端，支持 `login/logout/whoami/tools/run`。
- 首批开放 `log_finance_transaction`，以 AI-Output-Brain 的自然语言 Skill 为调用入口。
- 每个外部请求都有 scope、用户归属、幂等键和审计记录。

## 架构与授权

1. **安装不等于授权**：`lifeops login` 启动设备授权式流程，浏览器登录 Life OPS 并确认设备与 scopes。
2. **CLI 只保存设备 Token**：Token 仅保存在 macOS Keychain；Supabase Secret Key 仅放在 Vercel 环境变量。
3. **API 是系统能力，CLI 是官方客户端**：API 仅允许已注册 Tool，不能转发任意 SQL 或函数名。
4. **自然语言不进入 API**：AI-Output-Brain Skill 先转换为 `{ toolName, input }`，CLI 再执行。
5. **幂等优先**：CLI 每次写入生成 `Idempotency-Key`；服务端原子声明该键，重试返回原结果而不是重复记账。

## 本期实现清单

### 1. Supabase 数据基础

- [x] `cli_device_authorizations`：10 分钟有效的一次性设备代码。
- [x] `cli_access_tokens`：只保存 Token 哈希、scope、设备名、过期和撤销状态。
- [x] `cli_idempotency_keys`：原子幂等声明和请求结果缓存。
- [x] `cli_api_audit_logs`：调用审计。

### 2. Vercel API

- [x] `POST /api/v1/cli/device/start`
- [x] `POST /api/v1/cli/device/token`
- [x] `POST /api/v1/cli/tokens/revoke`
- [x] `GET /api/v1/cli/whoami`
- [x] `GET /api/v1/tools`
- [x] `POST /api/v1/tools/log_finance_transaction`

### 3. 财务 Tool
- 输入：
  - `occurred_date?`（默认当天，Asia/Shanghai）
  - `amount`（必填，>0）
  - `transaction_type?`（默认 `expense`，可选 `expense/income/repayment/transfer`）
  - `category?`（默认 `other`）
  - `merchant?`、`note?`
  - `account_name?`（按 `user_id + name` 查 `finance_accounts`，转成 `account_id`；查不到时回执明确提示，但不阻断写入）
- 逻辑：
  - [x] 校验金额、日期、交易类型和文本长度，非法输入不落库。
  - [x] 若给了 `account_name`，按当前 Token 的用户解析 `account_id`。
  - [x] 通过 Vercel server-only Supabase client 写入 `finance_transactions`。
  - [x] 返回写入后的行和人类可读确认。
- scope：`finance:write`。
- 用户 ID 只能由已验证的 CLI Token 获得，忽略外部 payload 的 `user_id`。
- `account_name` 未匹配时不阻断，但在回执中明确说明未绑定账户。

### 4. 健身 Tool（明确后置）

当前健身 session 没有可靠的 `user_id` 归属，不能在外部 API 中开放。后续先完成 session 所有权迁移和单事务 RPC，再开放 `fitness:write`。

### 5. 官方 CLI

- [x] `lifeops login/logout/whoami/tools/run`
- [x] 默认配置不含敏感信息；Token 放在 Keychain。
- [x] `--json` 供 AI-Output-Brain Skill 和自动化消费。

### 6. 系统内授权管理

- [x] `/developer` 页面显示已授权设备、scope、到期和最近使用时间。
- [x] 支持撤销单个设备；撤销后下一次 API 调用立即返回 401。

## 上线前配置

在 Vercel 项目配置：

```text
SUPABASE_SECRET_KEY=<server-only secret>
NEXT_PUBLIC_SUPABASE_URL=<existing value>
```

将 `SUPABASE_SECRET_KEY` 保持为 Vercel server-only 环境变量，绝不加 `NEXT_PUBLIC_` 前缀。

## 验证清单

- `lifeops login` 成功后 Token 只存在 Keychain。
- 未登录、过期、已撤销 Token 均返回 401。
- 相同幂等键重复调用返回同一确认结果，不重复新增交易。
- Token 仅能写入自己的 `finance_transactions`。
- CLI、Route Handler、审计日志和错误信息都不输出任何 Secret Key 或完整 Token。

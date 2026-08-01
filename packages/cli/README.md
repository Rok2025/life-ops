# Life OPS CLI

`lifeops` 是 Life OPS API 的官方命令行客户端。它只保存可撤销的设备 Token，永远不保存 Supabase Secret Key。

## 本地安装

```bash
pnpm --dir packages/cli link --global
lifeops login
```

登录会打开 Life OPS 的设备授权页。Token 存在 macOS Keychain；运行自动化时也可以暂时设置 `LIFEOPS_TOKEN`，但不要把它提交到仓库。

## 命令

```bash
lifeops whoami
lifeops tools
lifeops run log_finance_transaction --input @transaction.json
lifeops logout
```

`--json` 输出机器可读 JSON。所有写请求会自动带随机 `Idempotency-Key`。

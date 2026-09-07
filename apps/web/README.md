# Life OPS Web

Next.js 16 App Router 应用，只保留健身、财务与必要的设置、登录、CLI 授权页面。根地址进入现有健身页；时间节奏、本月剩余、年度剩余继续保留。

## 本地运行

在项目根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm dev
```

访问 http://localhost:9999 。环境配置和部署要求见[项目 README](../../README.md)。

## 验证

```bash
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web build
pnpm --filter @life-ops/cli test
```

CLI 测试只访问临时本地模拟服务，不读取 Keychain，也不写入真实账本或训练数据。

## 当前边界

应用精简版已上线，线上旧表、旧函数和 avatars 存储已清理；详见[生产结果](../../docs/audits/2026-09-07-production-cleanup-results.md)。健身备用录入、事务和权限缺口已修复上线，见[修复结果](../../docs/audits/2026-09-07-fitness-security-fix-results.md)。

详见[实施方案](../../docs/fitness-finance-simplification-plan.md)和[验证记录](../../docs/audits/2026-09-07-application-cleanup-results.md)。

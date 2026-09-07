# 项目上下文

## 当前定位

Life OPS 只维护健身与财务，笔记系统通过正式 lifeops CLI 录入，网页负责查看、核对与必要备用操作。时间节奏、本月剩余、年度剩余保留。

## 真实技术栈

- Web：Next.js 16 App Router、TypeScript、React 19、Tailwind CSS 4。
- 后端：Next.js Route Handlers / Server Actions + Supabase PostgreSQL / Auth。
- CLI：packages/cli/bin/lifeops.mjs，调用 /api/v1/*。
- 包管理：pnpm 9.15.0 + Turborepo；workspace 仅 apps/* 和 packages/*。

## 改造边界

已按用户授权完成前后端精简、生产发布和线上无关数据删除。保留 16 张业务/支撑表，旧云函数和 avatars 存储已清理。生产结果见 docs/audits/2026-09-07-production-cleanup-results.md。

保留 CLI 地址、输入输出契约、Token、幂等及审计能力。保护无关工作区改动和私有配置；不擅自提交或推送。

## 入口

- 实施方案：docs/fitness-finance-simplification-plan.md
- 审计：docs/audits/2026-09-07-fitness-finance-dependency-audit.md
- 执行记录：docs/audits/2026-09-07-application-cleanup-results.md

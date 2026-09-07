# Life OPS

> 健身与财务的数据查看、备用操作和 CLI 服务

**Life OPS** 只维护健身与财务两块业务。笔记系统通过 CLI 录入，网页用于查看、核对和必要的备用操作。

精简版已上线；线上 28 张无关业务表、旧英语云函数及 avatars 存储已清理，16 张保留表数据核对通过。详见[生产清理结果](docs/audits/2026-09-07-production-cleanup-results.md)。

健身网页录入、原子保存和用户权限已修复上线，详见[修复与验证记录](docs/audits/2026-09-07-fitness-security-fix-results.md)。

## ✨ 特性

- 🏠 **三栏布局**：侧边栏导航 + 主内容区 + 时间节奏面板
- 💪 **健身追踪**：训练记录、动作库、进度统计
- 💰 **财务查看**：交易、账户、负债、预算与月度快照
- ⏳ **时间节奏**：本周时间、本月剩余、年度剩余
- 🔌 **CLI 接口**：健身与财务写入、设备授权、幂等记录与调用审计
- 🎨 **深色/浅色主题**：跟随系统自动切换

## 🛠 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Next.js 16 (App Router) + TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth |
| 包管理 | pnpm + Turborepo |

## 🚀 快速开始

### 环境要求

- Node.js 20.9+（满足当前 Next.js 与 CLI 要求）
- pnpm 9.15.0

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

在 `apps/web` 目录下创建 `.env.local` 文件：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Required only for the server-side CLI API; never expose this with NEXT_PUBLIC_.
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

### 启动开发服务器

```bash
cd apps/web
pnpm dev
```

访问 http://localhost:9999
### 部署

项目部署到 Vercel：

1. **Root Directory**：选择 `apps/web`。
2. **Build Command**：使用 `pnpm build`。
3. **环境变量**：在 Vercel Project Settings -> Environment Variables 中配置 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`；CLI API 还需要 server-only 的 `SUPABASE_SECRET_KEY`（Production 与 Preview）。
4. **按发布顺序执行迁移**：先核对目标库和迁移历史，再单独执行本次发布对应的迁移。本轮按“先精简应用上线、后删除旧表”完成；已知历史版本存在漂移，不得盲目 `db push` 或重放旧迁移。
5. **Supabase Auth**：在 Supabase Authentication -> URL Configuration 中添加 Vercel 域名和 `/auth/callback` 回调地址。
6. **发布验证**：部署后先访问会触发新 schema 的页面，再检查 Vercel Runtime Logs；详细防呆流程见 [CLI Schema Version Drift Incident](docs/incidents/2026-08-cli-schema-version-drift.md)。

## 📁 项目结构

```
life-ops/
├── apps/web/                # Next.js 主应用
│   ├── src/app/             # 页面路由
│   ├── src/components/      # 组件库
│   ├── src/features/        # fitness / finance / auth / cli-api / system-config
│   └── src/lib/             # 公共工具与 Supabase 客户端
├── packages/cli/            # 正式 lifeops CLI
├── supabase/migrations/     # 数据库迁移来源，包含已执行清理迁移
├── docs/                    # 设计文档
└── turbo.json               # Turborepo 配置
```

## 📖 文档

- [健身与财务彻底收缩实施方案](docs/fitness-finance-simplification-plan.md) - 应用精简及线上数据清理已完成；其余验收待办见方案
- [应用清理验证记录](docs/audits/2026-09-07-application-cleanup-results.md) - 改动范围、基线与验证结果、未完成事项
- [健身与财务依赖审计](docs/audits/2026-09-07-fitness-finance-dependency-audit.md) - 代码及线上元数据核查、保留与删除清单、CLI 兼容约束和实施前置问题
- [设计总览（历史）](docs/DESIGN.md) - 原综合生活系统设计；当前范围以收缩方案为准
- [Next.js Vercel SSR 改造路线](docs/nextjs-vercel-ssr-roadmap.md) - Vercel 迁移后的 SSR/CSR 改造清单与渲染策略说明
- [CLI Schema Version Drift Incident](docs/incidents/2026-08-cli-schema-version-drift.md) - Supabase schema 与代码同步的发布门禁

## 💾 数据备份

> 2026-09-07 更新：本次删除前已建立并验证私有恢复归档，位置 `/Users/freeman/.local/share/life-ops/archives/2026-09-07-cleanup/`；这是单次归档，未恢复旧的自动备份任务。详见[生产清理结果](docs/audits/2026-09-07-production-cleanup-results.md)。

> 历史方案核查：下述本机备份目录、脚本及 LaunchAgent 未找到；其他主机或云备份尚未核实。以下为既有方案说明，不能视为当前备份已运行。生产数据删除前须确认实际备份并验证恢复，详见[依赖审计](docs/audits/2026-09-07-fitness-finance-dependency-audit.md)。

既有方案将数据库备份放在 `~/Documents/06-Back/supabase_bak/`，计划通过 macOS launchd 每天中午 12:00 执行，同时备份 life-ops 和 yoyo 两个 Supabase 数据库；当前运行状态待重新核实。

手动触发：

```bash
bash ~/Documents/06-Back/supabase_bak/backup.sh
```

备份文件输出到 `~/Documents/06-Back/supabase_bak/dumps/`，超过 14 天的自动清理。

详见 [备份文档](docs/supabase-backup.md)。

## 📝 License

MIT

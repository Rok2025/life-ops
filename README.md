# Life OPS

> 个人控制台 - 行动与节奏

**[在线演示 🌐](https://rok2025.github.io/life-ops/)**

**Life OPS**（Life Operating System）是一个个人控制台网站，帮助你一眼扫完、立即行动。

![Life OPS Screenshot](docs/screenshot.png)

## ✨ 特性

- 🏠 **三栏布局**：侧边栏导航 + 主内容区 + 时间节奏面板
- 🐸 **三只青蛙**：每日最重要的三件事管理
- 💡 **TIL (Today I Learned)**：每日学习记录
- 💪 **健身追踪**：训练记录、动作库、进度统计
- 🌱 **成长领域**：英语、阅读、AI 学习进度
- 🎨 **深色/浅色主题**：跟随系统自动切换

## 🛠 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Next.js 15 (App Router) + TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth |
| 包管理 | pnpm + Turborepo |

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

在 `apps/web` 目录下创建 `.env.local` 文件：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 启动开发服务器

```bash
cd apps/web
pnpm dev
```

访问 http://localhost:9999

## 📁 项目结构

```
life-ops/
├── apps/web/                # Next.js 主应用
│   ├── src/app/             # 页面路由
│   ├── src/components/      # 组件库
│   └── src/lib/             # 工具函数
├── packages/                # 共享包（预留）
├── docs/                    # 设计文档
└── turbo.json               # Turborepo 配置
```

## 📖 文档

- [设计总览](docs/DESIGN.md) - 项目设计理念、功能规划、技术决策

## 📝 License

MIT

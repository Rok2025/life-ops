# Life OPS - 设计总览

> **文档用途**：记录项目的设计理念、已实现功能和技术决策，供 AI 读取最新状态。
> **最后更新**：2026-02-04 (v0.2.2)

---

## 一、项目定位

**Life OPS**（Life Operating System）是一个**个人控制台网站**，核心理念：

- **低情绪负担**：一眼扫完，立即行动
- **节奏驱动**：以"周"为核心节奏单位
- **渐进演进**：从单一领域扩展到多领域

---

## 二、技术架构

### 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Next.js 15 (App Router) + TypeScript |
| 样式 | Tailwind CSS 4 + Apple 风格主题 |
| 状态管理 | React 内置 hooks (暂无全局状态库) |
| 数据库 | Supabase (PostgreSQL) |
| 部署 | 待定 (Vercel / GitHub Pages) |

### 项目结构

```
life-ops/
├── apps/web/                # Next.js 主应用
│   ├── src/app/             # 页面路由
│   ├── src/components/      # 组件库
│   └── src/lib/             # 工具函数
├── packages/                # 共享包（预留）
├── supabase/                # 数据库迁移（预留本地管理）
└── docs/                    # 文档
```

### Supabase 项目

- **项目 ID**: `owhckhngopdwbqgxtmpy`
- **URL**: https://owhckhngopdwbqgxtmpy.supabase.co
- **区域**: Tokyo (ap-northeast-1)

---

## 三、UI 设计规范

### 三栏布局

| 区域 | 宽度 | 用途 |
|------|------|------|
| Sidebar | 240px | 领域导航 + 主题切换 |
| Main | 自适应 (max-w-6xl) | 核心内容展示 |
| Summary | 320px | Horizons 时间节奏 + 快捷操作 |

### 主题系统

- **深色/浅色双主题**，跟随系统偏好自动切换
- **Apple 设计语言**：圆角卡片、毛玻璃效果、微动效
- **语义化颜色变量**：`--accent`, `--success`, `--warning`, `--danger`
- **原生控件适配**：`color-scheme` 让日历等原生控件自动适配主题

### 组件库

| 组件 | 文件位置 | 用途 |
|------|----------|------|
| Sidebar | `components/layout/Sidebar.tsx` | 左侧导航 |
| SummaryPanel | `components/layout/SummaryPanel.tsx` | 右侧摘要 |
| WelcomeHeader | `components/WelcomeHeader.tsx` | 欢迎头部（实时时间 HH:MM、日期、问候语、数据汇总） |
| AreaCard | 内嵌于 `page.tsx` | 领域状态卡片 |
| DailyFrogs | `components/DailyFrogs.tsx` | 三只青蛙（每日重要任务） |
| DailyTIL | `components/DailyTIL.tsx` | Today I Learned 记录 |

### 侧边栏导航规划

```
┌─────────────────────┐
│ Life OPS            │  ← 点击回首页
├─────────────────────┤
│ 🏠 主页             │
├─────────────────────┤
│ 💪 健身             │  ← 无子项
├─────────────────────┤
│ 🌱 成长             │  ← 可折叠，3 个子项
│   ├ 🔤 英语         │
│   ├ 📚 阅读         │
│   └ 🤖 AI           │
├─────────────────────┤
│ ✏️ 输出             │  ← 无子项
├─────────────────────┤
│ 👨‍👩‍👧 家庭             │  ← 无子项
├─────────────────────┤
│ 💰 财务             │  ← 无子项
├─────────────────────┤
│ ☀️ 👤 用户名        │  ← 主题切换 + 登出
└─────────────────────┘
```

### 领域总览

| 领域 | 性质 | 子分类 | 当前状态 |
|------|------|--------|----------|
| 💪 健身 | 身体 | - | ✅ 已实现基础功能 |
| 🌱 成长 | 输入 | 英语/阅读/AI | ⏳ 待实现 |
| ✏️ 输出 | 产出 | - | ⏳ 待实现 |
| 👨‍👩‍👧 家庭 | 生活 | - | ⏳ 待实现 |
| 💰 财务 | 生活 | - | ⏳ 待实现 |

---

## 四、数据模型

### 当前表结构

```sql
-- 健身动作类型（30+ 条预置数据）
exercise_types (id, name, category, tracking_mode, default_unit)

-- 训练记录主表
workout_sessions (id, workout_date, notes, created_at)

-- 每组训练详情
workout_sets (id, session_id, exercise_type_id, set_order, weight, reps, duration_seconds, notes)

-- 领域目标
area_goals (id, area_key, goal_type, target_value, unit, is_active)

-- 三只青蛙（每日重要任务）
daily_frogs (id, frog_date, title, description, priority, is_completed, completed_at, created_at)

-- TIL 学习记录
daily_til (id, til_date, content, category, created_at, updated_at)
```

### 动作分类

| category | 中文名 | 示例动作 |
|----------|--------|----------|
| chest | 胸部 | 杠铃卧推、哑铃卧推 |
| back | 背部 | 引体向上、杠铃划船 |
| legs | 腿部 | 深蹲、腿举 |
| shoulders | 肩部 | 哑铃推举、侧平举 |
| arms | 手臂 | 杠铃弯举、三头下压 |
| core | 核心 | 平板支撑、卷腹 |
| cardio | 有氧 | 跑步机、椭圆机 |

---

## 五、已实现功能

### v0.1.0 (2026-02-04)

#### L0 首页 (`/`)
- [x] 三栏布局渲染
- [x] 健身领域卡片（显示本周 2/3 进度）
- [x] Horizons 时间节奏（第 N 周、年度进度条）
- [x] 主题切换按钮

#### L1 健身领域 (`/fitness`)
- [x] 本周概览卡片 + 进度条
- [x] 最近训练记录列表（模拟数据）
- [x] 「添加记录」按钮

#### L2 训练记录表单 (`/fitness/workout/new`)
- [x] 日期选择器
- [x] 动态添加/删除动作
- [x] 动作类别 + 具体动作下拉选择
- [x] 重量 / 组数 / 次数输入
- [x] 备注输入框

### v0.1.1 (2026-02-04) - UI 抛光
- [x] 右侧摘要面板重构时间节奏展示（点、环、线多样化呈现）
- [x] 侧边栏标题增加回首页跳转链接
- [x] 设计并上线 Apple 风格极简 SVG 系统图标 (icon.svg)

### v0.2.0 (2026-02-04) - 身份验证 + 健身功能完善
- [x] Supabase Auth 登录/登出功能
- [x] AuthContext 全局身份状态管理
- [x] 登录页面（极简毛玻璃卡片风格）
- [x] 侧边栏用户信息展示 + 登出按钮
- [x] 训练记录真实保存到 Supabase
- [x] 训练历史记录列表（按日期分组显示）
- [x] 训练详情页查看/编辑/删除
- [x] 本周训练次数按不同天数统计

### v0.2.1 (2026-02-04) - 三只青蛙 + TIL
- [x] **三只青蛙**：每日最重要的三件事管理
  - 日期导航（左右箭头 + 点击选择任意日期）
  - 添加/编辑/删除青蛙
  - 完成状态标记（点击圆圈切换）
  - 每天最多 3 只青蛙
  - 支持补录历史日期
- [x] **TIL (Today I Learned)**：每日学习记录
  - 日期导航（同三只青蛙）
  - 可选分类（技术/生活/读书/工作/其他）
  - 默认显示 3 条，超过显示「展开更多」
  - 支持补录历史日期
- [x] 主页布局优化：青蛙 + TIL 并排显示
- [x] 主内容区域宽度增大（max-w-4xl → max-w-6xl）
- [x] 原生日期选择器主题适配（color-scheme）

### v0.2.2 (2026-02-04) - 侧边栏领域导航
- [x] **侧边栏结构重构**：
  - 5 个一级领域：健身、成长、输出、家庭、财务
  - 成长下 3 个可折叠子菜单：英语、阅读、AI
  - 菜单卡片化样式（边框 + 背景 + 悬停高亮）
- [x] **局部刷新布局**：
  - 点击菜单只刷新中间内容区域
  - 侧边栏和右侧摘要面板保持稳定
- [x] **新建占位页面**：
  - `/growth/english`、`/growth/reading`、`/growth/ai`
  - `/output`、`/family`、`/finance`

---

## 六、待实现功能

### 近期（v0.3.0）

- [ ] 历史矩阵视图（类似 Excel 的动作对比表）
- [ ] 动作库管理（自定义新增动作）
- [ ] 周回顾统计报告

### 中期

- [ ] 更多领域：学习、项目管理
- [ ] 家庭领域（又又的睡眠/饮食数据整合）
- [ ] 周回顾/月回顾生成

### 长期

- [ ] 部署到 Vercel 或自有服务器
- [ ] 自动化训练数据同步
- [ ] 个人年度报告生成
- [ ] 移动端适配
- [ ] PWA 支持

---

## 七、设计决策记录

### 2026-02-04

1. **选择 Turborepo**：为后续 packages 共享做准备，虽然当前只有一个 app
2. **使用 Tailwind CSS 4**：新版性能更好，`@theme` 语法更灵活
3. **Horizons 为只读展示**：仅提供时间定位感，不用于决策逻辑
4. **模拟数据优先**：先完成 UI 交互，再接入真实数据层
5. **三只青蛙不分优先级**：简化使用体验，按添加顺序显示序号
6. **TIL 可选分类**：分类为可选项，降低记录门槛
7. **日期选择使用 showPicker()**：确保整个按钮区域可点击弹出日历

---

## 八、如何更新本文档

每次完成功能开发后，请更新以下部分：

1. **已实现功能**：添加新条目到对应版本下
2. **待实现功能**：将已完成的项移动到"已实现"
3. **设计决策记录**：记录重要的技术选型或架构变更
4. **最后更新日期**：更新文档顶部的日期

---

## 九、启动方式

```bash
cd apps/web
pnpm dev
# 访问地址：http://localhost:9999
```

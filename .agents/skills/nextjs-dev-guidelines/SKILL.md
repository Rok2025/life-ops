---
name: nextjs-dev-guidelines
description: "Next.js App Router 前端开发规范。涵盖 Server/Client Component 数据获取策略、Feature-based 目录结构、API Layer 抽象、Tailwind CSS 设计系统、TypeScript 严格化、性能优化、Supabase 集成等。"
---


# Next.js App Router 前端开发规范

**(Next.js · App Router · TypeScript · Tailwind CSS · Supabase)**

你是一名**高级前端工程师**，遵循严格的架构和性能标准。

你的目标是构建**可扩展、可预测、可维护的 Next.js 应用**，使用：

* 部署场景感知的数据获取策略（Server-first 或 CSR-first）
* Feature-based 代码组织
* 严格的 TypeScript 纪律
* 性能安全的默认配置

本规范定义的是前端代码**必须如何编写**，而非仅仅*可以*如何编写。

---

## 1. 可行性与复杂度评估 (FFCI)

在实现组件、页面或功能之前，先评估可行性。

### FFCI 维度 (1–5)

| 维度 | 问题 |
|------|------|
| **架构契合** | 是否符合 Feature-based 结构和 Server/Client 分层模型？ |
| **复杂度** | 状态、数据和交互逻辑的复杂程度？ |
| **性能风险** | 是否引入渲染、包体积或 CLS 风险？ |
| **可复用性** | 能否无修改地复用？ |
| **维护成本** | 6 个月后理解此代码的难度？ |

### 评分公式

```
FFCI = (架构契合 + 可复用性 + 性能) − (复杂度 + 维护成本)
```

| FFCI | 含义 | 行动 |
|------|------|------|
| **10–15** | 优秀 | 直接实施 |
| **6–9** | 可接受 | 谨慎实施 |
| **3–5** | 有风险 | 简化或拆分 |
| **≤ 2** | 不佳 | 重新设计 |

---

## 2. 核心架构原则（不可妥协）

### 1. 以部署形态决定数据获取

* 默认所有组件都是 **Server Component**
* 仅在需要交互（useState/useEffect/onClick 等）时才加 `'use client'`
* **有服务器运行时（Node/Edge）**：优先在 Server Component 中 `async/await` 获取只读数据
* **静态导出部署（如 GitHub Pages, `output: 'export'`）**：用户态/实时数据必须在 Client Component 运行时加载（推荐 `useQuery`）
* Client Component 中的数据修改使用 React Query `useMutation`

### 2. Feature-Based 组织

* 领域逻辑存放在 `features/`
* 可复用基础组件存放在 `components/`
* 跨 feature 耦合**禁止**
* `app/` 目录仅做路由入口（瘦层）

### 3. API Layer 必须独立

* 每个 feature 有独立的 `api/` 模块
* 组件中**禁止**内联 Supabase/API 调用
* 所有数据操作通过 API Layer 函数完成

### 4. TypeScript 严格模式

* 禁止 `any`
* 显式返回类型
* 始终使用 `import type`
* 类型是一等设计产物

---

## 3. 适用场景

使用此规范的场景：

* 创建组件或页面
* 添加新功能
* 获取或修改数据
* 设置路由
* 使用 Tailwind CSS 编写样式
* 处理性能问题
* 审查或重构前端代码

---

## 4. 快速检查清单

### 新 Server Component 清单

* [ ] 默认不加 `'use client'`
* [ ] 数据通过 `async/await` + API Layer 获取
* [ ] Props 接口显式定义
* [ ] 无 `useState`、`useEffect`、`useCallback` 等 hooks
* [ ] 使用 `import type` 导入类型

### 新 Client Component 清单

* [ ] 文件顶部 `'use client'` 声明
* [ ] Props 接口显式定义
* [ ] 读取类数据优先使用 `useQuery`
* [ ] 数据修改使用 `useMutation`
* [ ] Handler 使用 `useCallback` 包裹
* [ ] 无组件内直接 Supabase 调用
* [ ] 导出为 `default export`

### 新 Feature 清单

* [ ] 创建 `features/{feature-name}/`
* [ ] 子目录：`api/`、`components/`、`hooks/`、`types/`
* [ ] API Layer 独立在 `api/`
* [ ] 公共导出通过 `index.ts`
* [ ] 对应路由在 `app/` 中仅做组装

---

## 5. 路径别名（必须遵守）

| 别名 | 路径 |
|------|------|
| `@/` | `src/` |

别名必须统一使用。禁止超过一层的相对路径导入（如 `../../`）。

---

## 6. 目录结构规范

```
src/
  app/                          # 路由入口（瘦层）
    layout.tsx                  # 根布局
    page.tsx                    # 首页
    loading.tsx                 # 路由级 loading（可选）
    fitness/
      page.tsx                  # 仅组装 feature 组件
      loading.tsx
      workout/new/page.tsx

  features/                     # 领域功能模块
    daily-frogs/
      api/frogsApi.ts           # Supabase 查询封装
      components/
        FrogsList.tsx
        FrogItem.tsx
        FrogForm.tsx
      hooks/useFrogMutations.ts # useMutation hooks
      types/index.ts
      index.ts                  # 公共导出
    fitness/
      api/fitnessApi.ts
      components/
      hooks/
      types/
      index.ts

  components/                   # 可复用基础组件
    layout/
      Sidebar.tsx
      SummaryPanel.tsx
    ui/
      ConfirmDialog.tsx
      Toast.tsx

  contexts/                     # React Context
    AuthContext.tsx

  lib/                          # 工具库
    supabase.ts                 # Supabase 客户端
    utils/
      date.ts                   # 日期工具函数
      format.ts                 # 格式化工具

  types/                        # 全局类型定义
    database.ts                 # Supabase 生成的类型
```

---

## 7. 数据获取策略

### 决策树（部署感知）

```
需要数据？
  ├─ 是否静态导出（output: 'export'）？
  │   ├─ 是：用户态/实时数据 → Client Component + useQuery + API Layer
  │   └─ 否：展示型/只读 → Server Component + async/await + API Layer
  ├─ 需要交互/CRUD → Client Component + useMutation + invalidateQueries
  └─ 客户端本地瞬时状态 → Client Component + useState
```

### Server Component 数据获取（默认方式）

```tsx
// app/fitness/page.tsx
import { fitnessApi } from '@/features/fitness/api/fitnessApi';
import { WorkoutList } from '@/features/fitness/components/WorkoutList';

export default async function FitnessPage() {
  const workouts = await fitnessApi.getRecent();
  const stats = await fitnessApi.getWeeklyStats();

  return (
    <div>
      <WeeklyStatsCards stats={stats} />
      <WorkoutList workouts={workouts} />
    </div>
  );
}
```

### Client Component 数据修改

```tsx
'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { frogsApi } from '../api/frogsApi';

export const FrogItem: React.FC<FrogItemProps> = ({ frog }) => {
  const router = useRouter();

  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: () => frogsApi.toggleComplete(frog.id, !frog.is_completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['frogs'] }),
  });

  return (/* ... */);
};
```

### 禁止的模式

```tsx
// ❌ 组件内直接调用 Supabase
const { data } = await supabase.from('frogs').select('*');

// ❌ 读取类请求散落在 useEffect + 手动 loading/setState 中（应使用 useQuery）
useEffect(() => { loadData(); }, []);

// ❌ API 逻辑散落在组件中
const handleSave = async () => {
  await supabase.from('frogs').insert({ title });
};
```

---

## 8. 路由规范（Next.js App Router）

### 核心规则

* `app/` 内的 `page.tsx` 仅做**组装层**，不包含业务逻辑
* 使用 `loading.tsx` 文件做路由级加载状态
* 使用 `error.tsx` 文件做路由级错误边界
* `layout.tsx` 仅管理布局结构，不做数据获取
* 若配置了 `basePath`（如 GitHub Pages），导航必须使用 `next/link`，禁止硬编码裸 `<a href="/xxx">`
* OAuth/邮箱确认流程必须有明确 callback 路由（如 `app/auth/callback/page.tsx`）

### 路由入口示例

```tsx
// app/fitness/page.tsx — 瘦层，仅组装
import { fitnessApi } from '@/features/fitness/api/fitnessApi';
import { FitnessPageView } from '@/features/fitness/components/FitnessPageView';

export default async function FitnessPage() {
  const [workouts, stats] = await Promise.all([
    fitnessApi.getRecent(),
    fitnessApi.getWeeklyStats(),
  ]);

  return <FitnessPageView workouts={workouts} stats={stats} />;
}
```

---

## 9. 样式规范（Tailwind CSS v4）

### CSS 变量设计系统

* 所有颜色、间距通过 CSS 变量定义（`globals.css`）
* 支持明暗主题，通过 `prefers-color-scheme` 和 `.dark` 类
* 使用 `@theme inline` 桥接 CSS 变量到 Tailwind

### 命名约定

* 语义化颜色名：`bg-primary`、`text-secondary`、`accent`（非 `blue-500`）
* 组件级样式：`card`、`btn-primary`、`pill`

### 响应式

```tsx
// ✅ Tailwind 响应式
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ 内联 media query
<div style={{ gridTemplateColumns: window.innerWidth > 768 ? '...' : '...' }}>
```

---

## 10. 加载与错误处理

### 路由级 Loading

```tsx
// app/fitness/loading.tsx
export default function FitnessLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-bg-tertiary rounded w-1/3" />
      <div className="h-32 bg-bg-tertiary rounded" />
    </div>
  );
}
```

### Client Component 错误处理

* Mutation 错误通过 `onError` 回调处理
* 使用统一的 Toast 组件通知用户
* 禁止 `console.error` 作为唯一错误处理

### 路由级错误边界

```tsx
// app/fitness/error.tsx
'use client';

export default function FitnessError({ error, reset }: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="text-center py-12">
      <p className="text-danger">加载失败: {error.message}</p>
      <button onClick={reset} className="btn-primary mt-4">重试</button>
    </div>
  );
}
```

---

## 11. 性能默认配置

* `useCallback` 包裹传递给子组件的 handler
* `useMemo` 处理计算密集的派生数据
* `React.memo` 包裹纯展示的重型组件
* 搜索输入 debounce（300–500ms）
* `useEffect` 必须有清理函数（避免内存泄漏）
* 重型 Client Component 使用 `next/dynamic` 懒加载

### 懒加载模式

```tsx
import dynamic from 'next/dynamic';

// 重型组件懒加载（禁用 SSR）
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-64 bg-bg-tertiary rounded" />,
});
```

**性能退化即为 Bug。**

---

## 12. TypeScript 规范

* `strict: true` 始终开启
* 禁止隐式 `any`
* 函数必须有显式返回类型
* 公共接口必须写 JSDoc 注释
* 类型与 feature 共置（`features/xxx/types/`）
* 全局共享类型放 `src/types/`

### `import type` 使用规则

```tsx
// ✅ 正确
import type { Frog } from '../types';
import { frogsApi } from '../api/frogsApi';

// ❌ 错误
import { Frog } from '../types';  // 类型应用 import type
```

---

## 13. 组件规范

### Client Component 结构顺序

1. `'use client'` 声明
2. 导入（外部库 → 内部模块 → 类型）
3. Types / Props 接口
4. 组件函数
5. Hooks 调用
6. 派生值（`useMemo`）
7. Handlers（`useCallback`）
8. Render
9. Default export

### Server Component 结构顺序

1. 导入（外部库 → 内部模块 → 类型）
2. 辅助函数（纯函数）
3. `async` 组件函数（数据获取 + 渲染）
4. Default export（若非直接导出）

### 单一职责原则

* 一个组件**只做一件事**
* 超过 200 行的组件必须拆分
* 拆分维度：列表 / 单项 / 表单 / 过滤器

---

## 14. API Layer 规范

### 文件结构

每个 feature 一个 API 文件，封装所有 Supabase 交互：

```ts
// features/daily-frogs/api/frogsApi.ts
import { supabase } from '@/lib/supabase';
import type { Frog, CreateFrogInput } from '../types';

export const frogsApi = {
  /** 按日期获取青蛙列表 */
  getByDate: async (date: string): Promise<Frog[]> => {
    const { data, error } = await supabase
      .from('daily_frogs')
      .select('*')
      .eq('frog_date', date)
      .order('created_at');
    if (error) throw error;
    return data ?? [];
  },

  /** 创建青蛙 */
  create: async (input: CreateFrogInput): Promise<Frog> => {
    const { data, error } = await supabase
      .from('daily_frogs')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** 切换完成状态 */
  toggleComplete: async (id: string, completed: boolean): Promise<void> => {
    const { error } = await supabase
      .from('daily_frogs')
      .update({ is_completed: completed })
      .eq('id', id);
    if (error) throw error;
  },

  /** 删除青蛙 */
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('daily_frogs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
```

### 规则

* 禁止组件内直接 `supabase.from(...)` 调用
* 禁止在 `app/**/page.tsx` 中直接写 Supabase 查询，页面层只做路由组装
* API 函数必须有 JSDoc 注释
* 返回类型必须显式声明
* 错误统一 `throw`，由调用方处理

---

## 15. 公共工具函数规范

### 消灭重复代码

项目中相同的工具函数（如 `getLocalDateStr`）禁止在多处重复定义。

```ts
// lib/utils/date.ts — 统一存放
/** 获取本地日期字符串 (YYYY-MM-DD)，避免 toISOString 的 UTC 时区问题 */
export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 格式化日期为中文显示 */
export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  // ...
}
```

---

## 16. 反模式（立即拒绝）

❌ Server Component 中使用 hooks（useState/useEffect）
❌ Client Component 读取接口时，继续手写 useEffect + setState + loading（应改为 useQuery）
❌ Feature 逻辑放在 `components/` 目录
❌ 组件内直接 Supabase 调用
❌ 未定义类型的 API 响应
❌ 单个组件承担多个职责
❌ 超过一层的相对路径导入
❌ 工具函数在多处重复定义
❌ `app/page.tsx` 包含大量业务逻辑

---

## 17. 验证清单

提交代码前检查：

* [ ] FFCI ≥ 6
* [ ] Server/Client Component 分层正确
* [ ] Feature 边界得到尊重
* [ ] 无组件内 Supabase 直接调用
* [ ] 类型显式且正确
* [ ] 重型组件已懒加载
* [ ] 性能安全（useCallback/useMemo）
* [ ] 无重复工具函数
* [ ] `app/` 路由入口保持瘦层

---

## 18. 规范状态

**状态：** 稳定、强约束、可执行
**适用范围：** 使用 Next.js App Router + Supabase 的生产级长期维护项目


## When to Use
当创建、修改或审查 Next.js App Router 前端代码时，必须应用此规范。

---
name: nextjs-dev-guidelines
description: "Next.js App Router 前端开发规范。适用于部署在 Vercel 的 Next.js + TypeScript + Tailwind CSS + Supabase 应用，强调 Server Component、Supabase SSR Auth、Server Actions、Feature-based 架构、严格类型和性能安全。"
---

# Next.js App Router 前端开发规范

**适用栈：Next.js App Router · Vercel · TypeScript · Tailwind CSS · Supabase**

本项目已经部署到 Vercel，默认具备 Node/Edge 运行时。所有新代码和重构都应按 **SSR-first / Server-first** 思路设计，而不是 GitHub Pages 静态导出或纯前端 SPA 思路。

## 1. 总原则

* 默认组件是 **Server Component**。只有需要浏览器状态、事件、DOM API、React hooks、实时订阅或乐观交互时才添加 `'use client'`。
* 只读首屏数据优先在 Server Component 中并行获取，避免“空壳首屏 + 客户端二次请求”。
* 写操作优先使用 Server Actions；复杂外部 API、webhook、文件代理等使用 Route Handlers。
* Supabase 认证必须支持 SSR cookie，服务端和客户端使用不同 client。
* React Query 保留给复杂客户端交互、乐观更新、实时筛选、局部刷新；不要让它承担所有首屏读取。
* `app/` 是路由和布局组装层，业务逻辑放在 `features/`。
* 严格 TypeScript，避免 `any`，公共函数显式返回类型。

## 2. Supabase SSR Auth

必须使用 `@supabase/ssr` 拆分 Supabase client：

```
src/lib/supabase/
  client.ts      # createBrowserClient，仅用于 Client Component
  server.ts      # createServerClient，用于 Server Component / Server Actions / Route Handlers
  proxy.ts       # 刷新 cookie session
src/proxy.ts     # Next proxy 入口，调用 updateSession
```

认证规则：

* 受保护页面在服务端读取用户并 `redirect('/login')`，不要依赖客户端 `AuthGuard` 做首屏鉴权。
* 服务端保护用户数据时使用会验证 token 的方法，例如 `auth.getClaims()` 或 Supabase SSR 官方推荐的等价流程。
* `auth.getSession()` 不能作为服务端鉴权的唯一依据。
* 登录页和 callback 放在独立路由组，避免受保护 layout 拦截：

```
src/app/
  (auth)/
    login/page.tsx
    auth/callback/route.ts
  (app)/
    layout.tsx       # 受保护应用壳
    page.tsx
    fitness/page.tsx
```

## 3. 数据获取策略

### 决策树

```
需要数据？
  ├─ 首屏只读/展示型数据 → Server Component + server API + Promise.all
  ├─ 用户私有数据 → Server Component 用 SSR Supabase client 动态读取
  ├─ 低频公共配置 → Server Component + cache tag，变更后 revalidateTag
  ├─ 表单/CRUD 写入 → Server Action + revalidatePath/revalidateTag/redirect
  ├─ 搜索、筛选、分页、复杂局部交互 → Server 首屏 + Client island / React Query
  └─ 实时订阅、浏览器 API、文件选择、语音等 → Client Component
```

### Server Component 首屏示例

```tsx
// app/(app)/fitness/page.tsx
import { fitnessServerApi } from '@/features/fitness/api/server';
import { FitnessPageView } from '@/features/fitness/components/FitnessPageView';

export default async function FitnessPage() {
  const [workouts, stats] = await Promise.all([
    fitnessServerApi.getRecentWorkouts(),
    fitnessServerApi.getWeeklyStats(),
  ]);

  return <FitnessPageView initialWorkouts={workouts} initialStats={stats} />;
}
```

### Client island 示例

```tsx
'use client';

import { useState } from 'react';
import type { WorkoutSession } from '../types';

export function FitnessPageView({
  initialWorkouts,
}: {
  initialWorkouts: WorkoutSession[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return <WorkoutList workouts={initialWorkouts} onSelect={setSelectedId} />;
}
```

## 4. Server Actions

写操作默认放在 feature 内的 `actions.ts`：

```ts
// features/daily-frogs/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleFrog(id: string, completed: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('daily_frogs')
    .update({ is_completed: completed })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/');
}
```

Server Action 规则：

* 必须验证当前用户或依赖 RLS，不能信任客户端传来的 `user_id`。
* 表单输入必须做服务端校验。
* 写入成功后用 `revalidatePath`、`revalidateTag` 或 `redirect` 更新 UI。
* Client Component 可以通过事件调用 Server Action，但业务写入逻辑不要散落在组件里。

## 5. Feature-Based 目录

推荐结构：

```
src/features/{feature}/
  api/
    server.ts       # Server Component 读取、服务端 query
    client.ts       # 客户端专用读取、实时订阅、上传等
  actions.ts        # Server Actions 写操作
  components/
    FeaturePage.tsx # Server shell 或纯展示
    FeatureClient.tsx
  hooks/            # React Query / browser hooks，仅 client 使用
  types/
  index.ts
```

规则：

* 组件内禁止直接写 `supabase.from(...)`。
* Server Component 不导入 browser client，不导入 client hooks。
* Client Component 不导入 server-only 模块。
* API 函数必须显式返回类型，错误统一抛出或映射成可显示状态。
* 跨 feature 依赖要通过公开导出或共享 `lib/`，不要互相深层 import。

## 6. Route 规范

* `page.tsx` 保持瘦层：读取路由参数、触发服务端数据获取、组装 feature 组件。
* `layout.tsx` 只放真正共享的布局和轻量鉴权，不把全站都包进大型 Client Provider。
* 有慢数据时使用 `loading.tsx` 或局部 `<Suspense>` 流式渲染。
* `error.tsx` 负责路由级错误恢复。
* 搜索、时间线、筛选页优先让筛选条件进入 `searchParams`，保证 URL 可分享、可刷新。
* 导航使用 `next/link` 和 `next/navigation`，不再考虑 GitHub Pages basePath。

## 7. React Query 使用边界

适合使用 React Query：

* 客户端筛选、分页、无限滚动、即时刷新。
* 乐观更新和复杂局部状态。
* Realtime 数据和用户触发的临时请求。

不适合使用 React Query：

* 首屏必须展示的只读数据。
* 只为了绕开 Server Component 的普通 Supabase 查询。
* 可以由 Server Action + revalidate 完成的简单 CRUD。

如果保留 React Query，优先由服务端传 `initialData`，减少首屏 waterfall。

## 8. Tailwind 与 UI

* 使用项目设计系统中的 CSS 变量和 UI 组件。
* 保持页面信息密度，后台/控制台页面避免营销式 hero 和装饰过度。
* 文本不能溢出按钮、卡片、表格或侧栏。
* 固定格式 UI（工具栏、日历、棋盘、统计格）要有稳定尺寸，避免 hover 或动态文本造成布局跳动。
* 图标按钮优先使用 lucide 图标，并给不明显的图标提供 tooltip。

## 9. 性能

* Server Component 中并行发起互不依赖的数据请求。
* 慢查询用 Suspense 分块，不阻塞整个页面。
* 重型可交互组件用 `next/dynamic`，但不要把普通页面主体无理由禁用 SSR。
* `useCallback` 用于传给子组件的稳定 handler；`useMemo` 用于成本明显的派生数据。
* 搜索输入 debounce 300-500ms。
* 图片优先用 Next image optimization；Supabase Storage 远程图在 `next.config.ts` 配 `remotePatterns`。

## 10. TypeScript

* `strict: true`。
* 禁止隐式 `any`；临时未知数据使用 `unknown` 并做类型收窄。
* 类型导入使用 `import type`。
* 公共 API、actions、复杂工具函数必须显式返回类型。
* 数据库类型优先来自 Supabase 生成类型或 feature `types/`。

## 11. 反模式

立即避免：

* 为 Vercel 项目添加 `output: 'export'`、`basePath: '/life-ops'`、GitHub Pages 专用构建逻辑。
* 用客户端 `AuthGuard` 作为受保护页面的唯一鉴权。
* 首屏全靠 `useEffect` 或 React Query 拉数据。
* Server Component 中使用 hooks 或浏览器 API。
* Client Component 直接 import server-only Supabase client。
* 组件内直接 Supabase 查询或写入。
* 写操作信任客户端传来的用户身份。
* 单个组件超过 200 行还继续堆业务逻辑。
* `app/page.tsx` 承载大量业务逻辑。

## 12. 提交前检查

* [ ] 没有 GitHub Pages / 静态导出配置回流。
* [ ] 首屏只读数据优先服务端渲染。
* [ ] 受保护路由在服务端鉴权。
* [ ] Supabase server/client client 分离。
* [ ] 写操作使用 Server Action 或明确的 Route Handler。
* [ ] Feature 边界清晰，组件内无直接 Supabase 调用。
* [ ] 类型显式，无新增 `any`。
* [ ] `pnpm --dir apps/web build` 通过。

## When to Use

当创建、修改、审查或重构本项目 Next.js App Router 前端代码时，必须应用此规范。

# Next.js Vercel SSR 改造路线

> 状态：P0/P1/P2 第一轮已落地，P3 第一批已落地，配置缓存待推进
> 背景：项目已从 GitHub Pages 静态导出切换到 Vercel。后续改造目标是恢复 Next.js App Router 的服务端渲染、服务端鉴权、Server Actions、流式渲染和图片优化能力。

## 1. 当前判断

项目现在已经运行在 Vercel，但很多页面仍保留了静态导出时期的前端应用形态：

- 业务数据大多在 Client Component 中通过 React Query / hooks 请求 Supabase。
- 登录态主要由客户端 `AuthContext` 和 `AuthGuard` 判断。
- 大量 feature API 统一 import 浏览器 Supabase client。
- 首屏体验更接近 CSR：先加载应用壳，再在浏览器里请求数据并渲染。

这不是错误，只是没有充分利用 Vercel + Next.js App Router 的优势。后续目标不是消灭 CSR，而是把它收回到适合的位置：交互、实时、局部刷新、乐观更新。

## 2. 本轮落地状态

已完成：

- 引入 `@supabase/ssr`，拆分 browser/server/proxy Supabase client。
- 新增 `src/proxy.ts`，通过 Supabase SSR cookie 刷新登录态。
- 拆分 `app/(auth)` 与 `app/(app)` route groups。
- `(app)/layout.tsx` 改为服务端鉴权，无用户直接 `redirect('/login')`。
- 登录页服务端识别已有用户，已登录时跳转首页。
- Auth callback 改为 Route Handler，服务端交换 session code。
- 首页、家庭、财务、健身的初始首屏数据改为 Server Component 读取并传入 Client island。
- 财务、家庭任务、每日青蛙的写操作第一轮迁到 Server Actions。
- `nextjs-dev-guidelines` 已改为 Vercel + App Router + Supabase SSR 优先规则。
- GitHub Pages 专用 push guard skill 已删除。

仍待推进：

- TIL、随手记、待办、健身记录、输出记录等写操作继续迁移到 Server Actions。
- 配置类数据引入 cache tag 与按需 revalidate。
- 更多 Supabase Storage 图片逐步迁移到 `next/image`。

## 3. 改造优先级

### P0：SSR 基座

1. **Supabase Auth 改成 SSR Cookie 模式**
   - 引入 `@supabase/ssr`。
   - 拆分 `src/lib/supabase/client.ts`、`server.ts`、`proxy.ts`。
   - 让 Server Component、Server Actions、Route Handlers 可以读取当前用户。

2. **受保护路由改为服务端鉴权**
   - 建议拆 route groups：
     - `app/(auth)`：登录、注册、认证回调。
     - `app/(app)`：主应用。
   - 在 `(app)/layout.tsx` 服务端读取用户，无用户直接 `redirect('/login')`。
   - 客户端 `AuthGuard` 只能作为辅助体验，不作为唯一安全边界。

3. **Supabase client 分离**
   - Server Component / Server Action 使用 server client。
   - Client Component 只在确实需要浏览器能力时使用 browser client。
   - 不再让所有 feature API 都直接依赖单一 `src/lib/supabase.ts`。

### P1：首屏 SSR

4. **首页 SSR**
   - 首页青蛙、TIL、随手记、健身统计等首屏摘要改为 Server Component 并行读取。
   - 交互型 widget 保留 Client island。

5. **健身页 SSR**
   - 周统计、训练列表、历史概览服务端读取。
   - 新增训练、编辑训练、详情弹窗保留客户端交互。

6. **家庭模块 SSR**
   - 成员、分类、统计、初始任务板服务端读取。
   - 筛选、弹窗、拖拽或状态更新保留客户端。

7. **财务模块服务端保护**
   - 财务数据属于私密数据，应先在服务端确认用户。
   - dashboard 初始数据服务端读取，写操作迁到 Server Actions。

### P2：写操作与 API 层

8. **CRUD 迁到 Server Actions**
   - 待办、青蛙、TIL、家庭任务、健身记录、财务记录、输出记录逐步迁移。
   - 写入成功后使用 `revalidatePath` / `revalidateTag` / `redirect`。
   - 服务端校验输入，不信任客户端传入的 `user_id`。

9. **Feature API 拆分 server/client**
   - 推荐结构：

```txt
src/features/{feature}/
  api/
    server.ts
    client.ts
  actions.ts
  components/
  hooks/
  types/
```

10. **React Query 降级为交互缓存层**
    - 保留 React Query 处理复杂交互、筛选、分页、局部刷新、乐观更新。
    - 首屏必须展示的数据优先由 Server Component 提供。

### P3：页面能力升级

11. **Search / Timeline URL 驱动**
    - 筛选条件进入 `searchParams`。
    - 服务端提供初始结果。
    - 客户端负责输入 debounce、局部刷新、滚动定位。
    - 状态：已完成第一批。`/search` 与 `/timeline` 已改为 URL 驱动，页面入口由 Server Component 预取初始结果，Client island 继续负责交互。

12. **配置类数据加缓存标签**
    - `system_configs`、运动类型、家庭分类、命令模板等低频变化数据可用 cache tag。
    - 配置变更后通过 Server Action revalidate。
    - 状态：待推进。这个步骤需要先把设置页相关写操作迁到 Server Actions，再统一接入 `revalidateTag`。

13. **恢复 Next Image 优化**
    - Supabase Storage 图片配置 `remotePatterns`。
    - 渐进迁移到 `next/image`。
    - 状态：已完成第一批。又又封面图已迁到 `next/image`，`next.config.ts` 已按 `NEXT_PUBLIC_SUPABASE_URL` 配置 Supabase Storage remote pattern。

14. **清理剩余 Pages 痕迹**
    - 删除 `apps/web/public/.nojekyll`。
    - 避免重新引入 `output: 'export'`、`basePath: '/life-ops'`、`apps/web/out` 检查脚本。
    - 状态：已完成第一批。`.nojekyll` 已删除，并补齐 `/icon.svg`，避免 Vercel 环境继续出现旧 Pages 路径资源缺失。

## 4. 组件与公共层抽取策略

这次迁移需要统一公共能力，但不应该把所有业务组件都提前拆碎。优先顺序如下：

1. **必须统一的基础能力**
   - Supabase browser/server/proxy client。
   - 服务端鉴权 helper，例如 `requireUser()`。
   - Feature server API factory，例如 `createFinanceApi(serverClient)`。
   - Server Actions 的鉴权、写入、`revalidatePath` 模式。
   - 受保护应用 shell，即 `(app)/layout.tsx`。

2. **适合在迁移中顺手抽出的内容**
   - 被 SSR 与 CSR 同时复用的数据类型。
   - 多个页面共用的首屏快照类型。
   - 多个 mutation 共用的缓存 key 和 invalidate 函数。
   - 明确重复的表单片段、列表项、状态 badge。

3. **暂时不要为了重构而重构的内容**
   - 单个 feature 内部还在快速变化的大组件。
   - 业务语义很强、跨模块复用不明确的组件。
   - 只为了减少文件行数而抽出的 wrapper。

判断标准：如果抽取能让 SSR 数据边界、Server Action 写入边界或设计系统复用更清晰，就抽；如果只是把一个大文件拆成多个互相跳转的小文件，先保持内聚。

## 5. SSR 与 CSR 的区别

### CSR：Client-Side Rendering

CSR 的典型流程：

1. 浏览器拿到一个很薄的 HTML。
2. 下载 JavaScript bundle。
3. JavaScript 启动应用。
4. 应用调用后端接口获取数据。
5. 前端组件或 UI 插件把数据渲染出来。

优点：

- 页面内交互顺滑。
- 适合登录后后台系统、复杂表单、拖拽、实时状态、强交互工作台。
- 部署和缓存模型相对简单。

缺点：

- 首屏依赖 JS 下载、执行和接口请求。
- 慢网或低性能设备上容易出现白屏、加载壳或闪烁。
- 搜索引擎和非 JS 客户端看到的初始内容少。

本项目目前很多业务页面就接近这种模式：页面由 Next 路由承载，但核心数据在浏览器里请求 Supabase，再由 React 组件展示。

### SSR：Server-Side Rendering

SSR 的典型流程：

1. 用户请求页面。
2. 服务器读取数据并渲染 HTML。
3. 浏览器先看到带内容的 HTML。
4. JavaScript 下载后进行 hydration，使页面可交互。

优点：

- 更快看到首屏内容。
- 首屏数据请求更靠近数据库或服务端网络。
- 可以把私密查询、鉴权、部分业务逻辑留在服务端。
- 通常更利于 SEO 和分享预览。

缺点：

- 服务端复杂度更高。
- 需要处理 cookie、缓存、用户隔离、hydration mismatch。
- 高交互区域仍然需要客户端 JS。

### 在 Next.js App Router 中的现实选择

Next.js 不是“只能 SSR”或“只能 CSR”。更准确的模型是：

- 默认 Server Component：负责首屏、只读数据、服务端安全边界。
- Client Component：负责交互、浏览器 API、本地状态、实时体验。
- Server Actions：负责写操作。
- Suspense / loading：负责流式加载和渐进呈现。

所以本项目的目标不是把所有东西都 SSR，而是形成组合：

```txt
服务端：鉴权、首屏数据、私密查询、写操作、缓存
客户端：交互、弹窗、筛选、实时、乐观更新、浏览器能力
```

## 6. SSR 是否不利于 SEO？

不是。通常恰好相反。

SSR、静态渲染和 hydration 通常更利于搜索引擎读取页面内容，因为搜索引擎可以直接从 HTML 中看到主要内容。Google 的 JavaScript SEO 文档也说明，客户端渲染内容 Google 可以处理，但存在限制；对于 JavaScript 生成内容有问题的场景，推荐使用 server-side rendering、static rendering 或 hydration，而不是长期依赖动态渲染 workaround。

不过对 Life OPS 这种登录后的个人控制台来说，SEO 不是主要目标。真正重要的是：

- 首屏速度。
- 登录态稳定。
- 私密数据安全边界。
- 避免客户端空壳 + 多次请求。
- 后续可维护性。

## 7. Vue 是 CSR 吗？

Vue 本身不是“只能 CSR”。Vue 官方文档说 Vue 默认用于构建客户端应用：组件默认在浏览器中生成和操作 DOM。但 Vue 也支持 SSR，可以把组件在服务器渲染成 HTML 字符串，再在客户端 hydrate。Nuxt 就是 Vue 生态里常见的 SSR / SSG 上层框架。

所以：

- 普通 Vue SPA 通常是 CSR。
- Vue + Nuxt 可以是 SSR、SSG 或混合渲染。
- React 也一样：普通 React SPA 通常是 CSR；Next.js App Router 可以混合 Server Component、SSR、SSG、CSR。

## 8. 本项目判断标准

优先 SSR / Server Component：

- 首页摘要。
- 健身、家庭、财务等页面的初始数据。
- 用户身份和权限判断。
- 低频配置读取。
- SEO 或分享预览需要的公开页面。

优先 CSR / Client Component：

- 弹窗、表单草稿、拖拽、局部筛选。
- 需要 `window`、`localStorage`、语音、文件选择、浏览器事件的功能。
- 实时订阅。
- 强交互小组件。

优先 Server Actions：

- 创建、更新、删除。
- 状态切换。
- 表单提交。
- 需要服务端校验或重刷缓存的写操作。

## 9. 参考资料

- [Next.js App Router - Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Google Search Central - Dynamic rendering as a workaround](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering)
- [Vue.js - Server-Side Rendering](https://vuejs.org/guide/scaling-up/ssr.html)
- [Vue.js - Routing: Client-Side vs. Server-Side Routing](https://vuejs.org/guide/scaling-up/routing)

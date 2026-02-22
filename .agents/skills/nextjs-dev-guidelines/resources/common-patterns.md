# Common Patterns

适用于 Next.js App Router + Supabase + Tailwind CSS 的常用模式。

---

## 认证：useAuth Hook

### 获取当前用户

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export const MyComponent: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div>
      <p>登录用户: {user?.email}</p>
      <button onClick={signOut}>退出</button>
    </div>
  );
};
```

**禁止直接调用 `supabase.auth`** —— 始终使用 `useAuth` hook。

---

## Server Component 数据获取

### 基本模式

```tsx
// app/fitness/page.tsx
import { fitnessApi } from '@/features/fitness/api/fitnessApi';
import { FitnessPageView } from '@/features/fitness/components/FitnessPageView';

export default async function FitnessPage() {
  // 并行获取多组数据
  const [workouts, stats] = await Promise.all([
    fitnessApi.getRecent(),
    fitnessApi.getWeeklyStats(),
  ]);

  // 传递给展示型组件（Server 或 Client）
  return <FitnessPageView workouts={workouts} stats={stats} />;
}
```

### 关键原则

* 数据获取**仅在 Server Component** 中执行
* 使用 `Promise.all` 并行获取
* API Layer 函数返回类型化数据
* 组件只负责渲染，不负责获取

---

## Client Component 数据修改（useMutation）

### 创建操作

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { frogsApi } from '../api/frogsApi';
import type { CreateFrogInput } from '../types';

interface FrogFormProps {
  date: string;
  onClose: () => void;
}

export const FrogForm: React.FC<FrogFormProps> = ({ date, onClose }) => {
  const [title, setTitle] = useState('');
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: (input: CreateFrogInput) => frogsApi.create(input),
    onSuccess: () => {
      router.refresh(); // 刷新 Server Component 数据
      onClose();
    },
  });

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;
    createMutation.mutate({ title, frog_date: date });
  }, [title, date, createMutation]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="今天要吃的青蛙..."
        className="w-full px-3 py-2 bg-bg-secondary rounded-lg border border-border"
      />
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={onClose} className="text-text-secondary">
          取消
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="btn-primary"
        >
          {createMutation.isPending ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
};
```

### 更新操作（乐观更新）

```tsx
'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { frogsApi } from '../api/frogsApi';
import type { Frog } from '../types';

interface FrogItemProps {
  frog: Frog;
}

export const FrogItem: React.FC<FrogItemProps> = ({ frog }) => {
  const router = useRouter();

  const toggleMutation = useMutation({
    mutationFn: () => frogsApi.toggleComplete(frog.id, !frog.is_completed),
    onSuccess: () => router.refresh(),
  });

  const deleteMutation = useMutation({
    mutationFn: () => frogsApi.delete(frog.id),
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-secondary transition">
      <button
        onClick={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
          ${frog.is_completed ? 'bg-success border-success' : 'border-border'}`}
      >
        {frog.is_completed && <Check size={14} className="text-white" />}
      </button>
      <span className={frog.is_completed ? 'line-through text-text-secondary' : ''}>
        {frog.title}
      </span>
      <button
        onClick={() => deleteMutation.mutate()}
        className="ml-auto text-text-secondary hover:text-danger"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
```

---

## API Layer 模式

### 标准 API 模块

```ts
// features/daily-frogs/api/frogsApi.ts
import { supabase } from '@/lib/supabase';
import type { Frog, CreateFrogInput } from '../types';

export const frogsApi = {
  /** 按日期查询 */
  getByDate: async (date: string): Promise<Frog[]> => {
    const { data, error } = await supabase
      .from('daily_frogs')
      .select('*')
      .eq('frog_date', date)
      .order('created_at');
    if (error) throw error;
    return data ?? [];
  },

  /** 获取统计 */
  getStats: async (date: string): Promise<{ completed: number; total: number }> => {
    const { data, error } = await supabase
      .from('daily_frogs')
      .select('is_completed')
      .eq('frog_date', date);
    if (error) throw error;
    const total = data?.length ?? 0;
    const completed = data?.filter(f => f.is_completed).length ?? 0;
    return { completed, total };
  },

  /** 创建 */
  create: async (input: CreateFrogInput): Promise<Frog> => {
    const { data, error } = await supabase
      .from('daily_frogs')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** 更新 */
  update: async (id: string, updates: Partial<Frog>): Promise<Frog> => {
    const { data, error } = await supabase
      .from('daily_frogs')
      .update(updates)
      .eq('id', id)
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

  /** 删除 */
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('daily_frogs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
```

---

## 状态管理模式

### Server State → Server Component（默认）

```tsx
// Server Component 中直接 await
export default async function Page() {
  const data = await api.getData();
  return <View data={data} />;
}
```

### Client Mutations → useMutation + router.refresh()

```tsx
'use client';

const mutation = useMutation({
  mutationFn: api.create,
  onSuccess: () => router.refresh(), // 刷新 Server Component
});
```

### UI State → useState（仅局部）

```tsx
const [isEditing, setIsEditing] = useState(false);
const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
```

### Global Client State → Context（最小化）

仅用于：主题偏好、侧边栏状态、认证状态。

```tsx
// contexts/AuthContext.tsx — 已有实现
export const useAuth = () => useContext(AuthContext);
```

---

## 日期导航模式

项目中多个组件共用的日期切换模式：

```tsx
'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalDateStr, formatDisplayDate } from '@/lib/utils/date';

interface DateNavProps {
  date: string;
  onDateChange: (date: string) => void;
}

export const DateNav: React.FC<DateNavProps> = ({ date, onDateChange }) => {
  const changeDate = useCallback((days: number): void => {
    const current = new Date(date + 'T00:00:00');
    current.setDate(current.getDate() + days);
    onDateChange(getLocalDateStr(current));
  }, [date, onDateChange]);

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => changeDate(-1)} className="p-1 hover:bg-bg-tertiary rounded">
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-medium min-w-[120px] text-center">
        {formatDisplayDate(date)}
      </span>
      <button onClick={() => changeDate(1)} className="p-1 hover:bg-bg-tertiary rounded">
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
```

---

## Feature 公共导出模式

```ts
// features/daily-frogs/index.ts
export { frogsApi } from './api/frogsApi';
export { FrogsList } from './components/FrogsList';
export { FrogForm } from './components/FrogForm';
export type { Frog, CreateFrogInput } from './types';
```

---

## 总结

**核心模式：**
- ✅ Server Component + async/await 做数据获取
- ✅ Client Component + useMutation 做数据修改
- ✅ `router.refresh()` 同步 Server/Client 数据
- ✅ API Layer 封装所有 Supabase 调用
- ✅ useAuth hook 管理认证
- ✅ useState 仅用于局部 UI 状态
- ✅ Context 仅用于全局客户端状态（最小化）
- ✅ 公共工具函数集中在 `lib/utils/`

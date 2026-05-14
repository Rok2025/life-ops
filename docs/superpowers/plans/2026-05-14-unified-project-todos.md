# Unified Project Todos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show project-level todos from growth modules inside the main Todo page while preserving the existing calendar workflow and adding clickable project labels.

**Architecture:** Keep ownership of data in place: standalone todos stay in `quick_notes`, project todos stay in `project_todos`. Add a small normalization layer that maps both sources into one `UnifiedTodo` model consumed by the Todo page calendar, filters, metrics, and list. Project links use URL query parameters so clicking a project tag opens the correct project and highlights the relevant todo.

**Tech Stack:** Next.js App Router, React Query, TypeScript, Tailwind CSS, Supabase Postgres migrations, Vitest.

---

### Task 1: Persist Calendar Metadata On Project Todos

**Files:**
- Create: `supabase/migrations/*_add_project_todo_schedule_fields.sql`
- Modify: `apps/web/src/features/growth-projects/types/index.ts`
- Modify: `apps/web/src/features/growth-projects/api/projectsApi.ts`

- [x] **Step 1: Create a Supabase migration with the CLI**

Run:

```bash
supabase migration new add_project_todo_schedule_fields
```

Expected: a new SQL file appears under `supabase/migrations`.

- [x] **Step 2: Add project todo scheduling columns**

Migration SQL:

```sql
ALTER TABLE public.project_todos
  ADD COLUMN IF NOT EXISTS execute_date DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal', 'important', 'urgent', 'critical'));

CREATE INDEX IF NOT EXISTS idx_project_todos_execute_date
  ON public.project_todos (execute_date)
  WHERE execute_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_todos_priority
  ON public.project_todos (priority)
  WHERE is_completed = FALSE;
```

- [x] **Step 3: Update project todo types and API**

`ProjectTodo` gets `execute_date` and `priority`. `CreateTodoInput` accepts optional `execute_date` and `priority`. Add `updateTodo(id, updates)` for editing project todos from the unified Todo page.

### Task 2: Add Unified Todo Normalization

**Files:**
- Create: `apps/web/src/features/quick-notes/lib/unifiedTodos.ts`
- Create: `apps/web/src/features/quick-notes/lib/unifiedTodos.test.ts`
- Create: `apps/web/src/features/quick-notes/api/unifiedTodosApi.ts`
- Create: `apps/web/src/features/quick-notes/hooks/useUnifiedTodos.ts`
- Modify: `apps/web/src/features/quick-notes/index.ts`

- [x] **Step 1: Write tests first**

Tests cover:

```ts
standalone quick_notes todos map to source = "standalone";
project_todos map to source = "project" with area label and project href;
english project links include tab=projects;
calendar summaries include both standalone and scheduled project todos.
```

- [x] **Step 2: Implement `UnifiedTodo` helpers**

The helper exports:

```ts
normalizeStandaloneTodo(todo)
normalizeProjectTodo(row)
getProjectTodoHref(area, projectId, todoId)
buildUnifiedCalendarSummaryMap(todos)
compareUnifiedTodos(a, b)
```

- [x] **Step 3: Implement query API and hook**

`unifiedTodosApi.getTodos()` calls `notesApi.getTodos()` and `projectsApi.getInboxTodos()` in parallel and returns normalized, sorted todos. `useUnifiedTodos()` uses React Query key `['unified-todos']`.

### Task 3: Preserve And Upgrade Todo Page UI

**Files:**
- Modify: `apps/web/src/features/quick-notes/components/TodoPage.tsx`

- [x] **Step 1: Switch the page data source**

Replace `useTodos()` with `useUnifiedTodos()`.

- [x] **Step 2: Keep the existing calendar**

Update `TodoCalendarPanel`, `buildCalendarSummaryMap`, filters, metrics, and date groups to consume `UnifiedTodo[]`. The left calendar remains in the same layout and still drives date filtering.

- [x] **Step 3: Add source filtering**

Add a source filter row:

```text
来源：全部 / 独立待办 / 项目待办 / AI / 英语 / 阅读
```

- [x] **Step 4: Add project labels**

Project rows display a clickable chip like:

```text
AI / Agent 系统建设
```

Clicking the chip navigates to the project URL. Standalone rows display `独立待办`.

- [x] **Step 5: Wire mutations by source**

Standalone rows call `notesApi.toggleCompleted`, `notesApi.update`, and `notesApi.delete`. Project rows call `projectsApi.toggleTodo`, `projectsApi.updateTodo`, and `projectsApi.deleteTodo`.

### Task 4: Deep Link Growth Projects

**Files:**
- Modify: `apps/web/src/features/growth-projects/components/ProjectList.tsx`
- Modify: `apps/web/src/features/growth-projects/components/TodoList.tsx`
- Modify: `apps/web/src/features/english-learning/components/EnglishPage.tsx`

- [x] **Step 1: Project selection from URL**

`ProjectList` reads `project` and `todo` query parameters. If `project` exists and is present in loaded projects, select it automatically.

- [x] **Step 2: Todo highlight from URL**

`TodoList` accepts `highlightTodoId` and applies a focused style to the matching row.

- [x] **Step 3: English module tab from URL**

`EnglishPage` reads `tab=projects` or any `project` query parameter and switches to the projects tab.

### Task 5: Verification

**Files:**
- All files touched above.

- [x] **Step 1: Run focused tests**

```bash
pnpm --filter web test src/features/quick-notes/lib/unifiedTodos.test.ts
```

- [x] **Step 2: Run broader tests**

```bash
pnpm --filter web test
```

- [x] **Step 3: Run lint**

```bash
pnpm --filter web lint
```

- [x] **Step 4: Build**

```bash
pnpm --filter web build
```

Verification result after implementation:

- `pnpm --filter web test`: 23 tests passed.
- `pnpm --filter web lint`: completed with 0 errors and 5 pre-existing warnings.
- `pnpm --filter web build`: completed successfully.

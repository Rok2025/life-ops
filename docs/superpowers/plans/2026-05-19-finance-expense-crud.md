# Finance Expense CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a complete expense-record loop so saved expenses can be viewed across all dates and edited by stable transaction id.

**Architecture:** Keep `dashboard.transactions` as the current-month dataset used by budget metrics and snapshot review. Add a separate all-expense dataset for the detail list, then route edits through a server action that updates `finance_transactions` by `id` and authenticated `user_id`.

**Tech Stack:** Next.js App Router, React Client Component island, Server Actions, React Query, Supabase JavaScript client, Vitest.

---

### Task 1: Dashboard Data Contract

**Files:**
- Modify: `apps/web/src/features/finance/types/index.ts`
- Modify: `apps/web/src/features/finance/api/financeApi.ts`
- Test: `apps/web/src/features/finance/api/financeApi.test.ts`

- [x] **Step 1: Write the failing test**

  Add a Vitest case proving `getDashboard()` returns `expenseTransactions` containing all expense rows, including rows outside the current month, while `metrics.currentMonthExpense` remains based on the current-month `transactions` query.

- [x] **Step 2: Run test to verify it fails**

  Run: `pnpm --dir apps/web test src/features/finance/api/financeApi.test.ts`

  Expected: FAIL because `expenseTransactions` does not exist yet.

- [x] **Step 3: Write minimal implementation**

  Add `expenseTransactions: FinanceTransaction[]` to `FinanceDashboard`, query `finance_transactions` a second time with `transaction_type = 'expense'`, ordered by `occurred_date` and `created_at` descending, and return the result without changing current-month metrics.

- [x] **Step 4: Run test to verify it passes**

  Run: `pnpm --dir apps/web test src/features/finance/api/financeApi.test.ts`

  Expected: PASS.

### Task 2: Update Transaction Action

**Files:**
- Modify: `apps/web/src/features/finance/types/index.ts`
- Modify: `apps/web/src/features/finance/api/financeApi.ts`
- Modify: `apps/web/src/features/finance/actions.ts`
- Modify: `apps/web/src/features/finance/hooks/useFinanceDashboard.ts`
- Test: `apps/web/src/features/finance/api/financeApi.test.ts`

- [x] **Step 1: Write the failing test**

  Add a Vitest case proving `updateTransaction()` updates only a matching transaction id and user id, and writes editable fields: account, date, amount, type, category, merchant, and note.

- [x] **Step 2: Run test to verify it fails**

  Run: `pnpm --dir apps/web test src/features/finance/api/financeApi.test.ts`

  Expected: FAIL because `updateTransaction()` does not exist yet.

- [x] **Step 3: Write minimal implementation**

  Add `UpdateFinanceTransactionInput`, implement `financeApi.updateTransaction(input)`, expose `updateFinanceTransactionAction(input)`, and add an `updateTransactionMutation` that invalidates the finance dashboard query.

- [x] **Step 4: Run test to verify it passes**

  Run: `pnpm --dir apps/web test src/features/finance/api/financeApi.test.ts`

  Expected: PASS.

### Task 3: Expense List And Editor UI

**Files:**
- Modify: `apps/web/src/features/finance/lib/transactionDisplay.ts`
- Modify: `apps/web/src/features/finance/lib/transactionDisplay.test.ts`
- Modify: `apps/web/src/features/finance/components/FinanceOverview.tsx`

- [x] **Step 1: Write the failing test**

  Extend `getExpenseDetailRows()` tests to prove rows preserve `accountId`, `merchant`, and raw edit fields needed to prefill the edit form.

- [x] **Step 2: Run test to verify it fails**

  Run: `pnpm --dir apps/web test src/features/finance/lib/transactionDisplay.test.ts`

  Expected: FAIL because the display row does not expose edit fields yet.

- [x] **Step 3: Write minimal implementation**

  Use `dashboard.expenseTransactions` for the detail list labeled “全部明细”, add an edit action from the expense detail dialog, and submit edits through `updateTransactionMutation`.

- [x] **Step 4: Run test to verify it passes**

  Run: `pnpm --dir apps/web test src/features/finance/lib/transactionDisplay.test.ts`

  Expected: PASS.

### Task 4: Verification

**Files:**
- No production file edits unless verification reveals a defect.

- [x] **Step 1: Run focused finance tests**

  Run: `pnpm --dir apps/web test src/features/finance`

  Expected: PASS.

- [x] **Step 2: Run lint**

  Run: `pnpm --dir apps/web lint`

  Expected: PASS.

- [x] **Step 3: Run build if lint and focused tests pass**

  Run: `pnpm --dir apps/web build`

  Expected: PASS.

### Acceptance Criteria

- A newly added expense appears in the all-expense detail list even when its date is outside the current month.
- Current-month budget metrics still use only current-month transactions.
- Clicking an expense opens its detail view and exposes an edit flow.
- Saving edits updates the original `finance_transactions` row by `id`, not a duplicate row.
- The edit action is scoped by authenticated `user_id` on the server.

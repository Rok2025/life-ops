# Finance Expenses Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `全部支出` entry that opens an in-page modal showing only expense transactions, without navigating away from the already-unlocked finance dashboard.

**Architecture:** Reuse `dashboard.expenseTransactions` from the already-loaded finance dashboard and show it in a large dialog. Reuse the existing expense detail/edit UI patterns and transaction update server action, so the user does not hit a second finance password gate.

**2026-05-19 update:** The modal now follows the viewing habit of selecting a year and month first, querying one month of expenses at a time, sorting that month ascending by date/time, and keeping the summary/selector header fixed while only the expense records scroll.

**2026-05-19 UI quality update:** Optimize the `全部支出` modal into a monthly expense ledger scoring at least 85/100 for style and usability. Replace heavy nested cards with a compact fixed toolbar, a single table header, lightweight day dividers, compact rows, quieter empty metadata, and centered icon actions.

**Tech Stack:** Next.js App Router, Client Component modal, Server Actions, React Query, Supabase JavaScript client, Vitest.

---

### Task 1: In-Page Modal Contract

**Files:**
- Modify: `apps/web/src/features/finance/components/FinanceOverview.tsx`
- Test: `apps/web/src/features/finance/components/FinanceOverview.test.tsx`

- [x] **Step 1: Write the failing test**

  Add a Vitest case proving the `全部支出` entry does not render an `href="/finance/expenses"` link.

- [x] **Step 2: Run test to verify it fails**

  Run: `pnpm --dir apps/web test src/features/finance/components/FinanceOverview.test.tsx`

  Expected: FAIL because the current entry is still a route link.

- [x] **Step 3: Write minimal implementation**

  Replace the route link with a button and an in-page dialog that uses `dashboard.expenseTransactions`.

- [x] **Step 4: Run test to verify it passes**

  Run: `pnpm --dir apps/web test src/features/finance/components/FinanceOverview.test.tsx`

  Expected: PASS.

### Task 2: Modal Entry And Cleanup

**Files:**
- Modify: `apps/web/src/features/finance/components/FinanceOverview.tsx`

- [x] **Step 1: Replace navigation with a modal trigger**

  The `全部支出` entry should be a button that opens an in-page dialog instead of linking to `/finance/expenses`.

- [x] **Step 2: Add the modal page**

  The dialog should show only `全部支出`: count, total amount, expense list, detail dialog, and edit dialog.

- [x] **Step 3: Remove the route entry**

  Remove the password-gated `/finance/expenses` route so the button is the only intended entry.

### Task 3: Verification

**Files:**
- No production file edits unless verification reveals a defect.

- [x] **Step 1: Run focused finance tests**

  Run: `pnpm --dir apps/web test src/features/finance`

  Expected: PASS.

- [x] **Step 2: Run lint**

  Run: `pnpm --dir apps/web lint`

  Expected: PASS, allowing unrelated pre-existing warnings.

- [x] **Step 3: Run build**

  Run: `pnpm --dir apps/web build`

  Expected: PASS.

- [x] **Step 4: Browser smoke test**

  Open `/finance` on the local dev server and confirm the page renders without console errors.

### Task 4: Monthly Ledger UI Optimization

**Files:**
- Modify: `apps/web/src/features/finance/components/FinanceOverview.tsx`
- Test: `apps/web/src/features/finance/components/FinanceOverview.test.tsx`

- [x] **Step 1: Write the failing test**

  Add a Vitest case proving the all-expense modal renders as a ledger: `data-expense-ledger-layout="monthly"`, a fixed compact toolbar, one shared table header, lightweight day divider rows, and no duplicated year/month card wrappers.

- [x] **Step 2: Run test to verify it fails**

  Run: `pnpm --dir apps/web test src/features/finance/components/FinanceOverview.test.tsx`

  Expected: FAIL because the current modal still renders the heavy card-like year/month/day structure.

- [x] **Step 3: Implement the ledger layout**

  Replace the two stat cards with a compact toolbar containing the selected month label, count, total, year/month selectors, and export button. Flatten the month content into one ledger table: one shared header row, lightweight day separators, compact transaction rows, centered operation icons, `-` for empty notes, and shorter `未关联` account text.

- [x] **Step 4: Run test to verify it passes**

  Run: `pnpm --dir apps/web test src/features/finance/components/FinanceOverview.test.tsx`

  Expected: PASS.

- [x] **Step 5: Run full verification**

  Run:
  - `pnpm --dir apps/web test src/features/finance`
  - `pnpm --dir apps/web lint`
  - `pnpm --dir apps/web build`

  Expected: finance tests pass, lint has no new errors, build passes.

### Task 5: Ledger Polish To Target 92 Points

**Files:**
- Modify: `apps/web/src/features/finance/components/FinanceOverview.tsx`
- Test: `apps/web/src/features/finance/components/FinanceOverview.test.tsx`

- [x] **Step 1: Write the failing test**

  Extend the ledger Vitest contract to require a sticky shared header, a tighter toolbar grid, thinner day dividers, refined amount/action column widths, and slightly clearer default operation icons.

- [x] **Step 2: Run test to verify it fails**

  Run: `pnpm --dir apps/web test src/features/finance/components/FinanceOverview.test.tsx`

  Expected: FAIL because the current ledger header is not sticky, day dividers are still a little thick, and operation icons are still low-emphasis.

- [x] **Step 3: Implement polish**

  Add sticky header classes, tighten the toolbar to a two-area grid, reduce day divider vertical padding, refine the ledger grid width/amount/action columns, and raise default icon contrast without making delete visually loud.

- [x] **Step 4: Run focused and full verification**

  Run:
  - `pnpm --dir apps/web test src/features/finance/components/FinanceOverview.test.tsx`
  - `pnpm --dir apps/web test src/features/finance`
  - `pnpm --dir apps/web lint`
  - `pnpm --dir apps/web build`

  Expected: component tests pass, finance tests pass, lint has no new errors, build passes.

### Task 6: Ledger Noise Reduction To Target 94 Points

**Files:**
- Modify: `apps/web/src/features/finance/components/FinanceOverview.tsx`
- Test: `apps/web/src/features/finance/components/FinanceOverview.test.tsx`

- [x] **Step 1: Write the failing test**

  Extend the ledger test to require unlinked accounts to render as `-` with `title="未关联账户"`, delete actions to default to muted gray and only turn red on hover, and today's day divider to expose a lightweight `今天` marker.

- [x] **Step 2: Run test to verify it fails**

  Run: `pnpm --dir apps/web test src/features/finance/components/FinanceOverview.test.tsx`

  Expected: FAIL because unlinked accounts still render `未关联`, delete actions are red by default, and current-day markers are not rendered.

- [x] **Step 3: Implement polish**

  Change the account display formatter to return `-` for unlinked accounts, keep the full account meaning in the title attribute, make delete buttons default to `text-text-secondary` with `hover:text-danger`, and add a subtle `今天` chip on the day divider matching `getTodayISO()`.

- [x] **Step 4: Run focused and full verification**

  Run:
  - `pnpm --dir apps/web test src/features/finance/components/FinanceOverview.test.tsx`
  - `pnpm --dir apps/web test src/features/finance`
  - `pnpm --dir apps/web lint`
  - `pnpm --dir apps/web build`

  Expected: component tests pass, finance tests pass, lint has no new errors, build passes.

### Acceptance Criteria

- The finance dashboard has a clear `全部支出` entry.
- Clicking `全部支出` opens an in-page modal, not a route.
- The modal lets the user choose year and month before viewing records.
- The modal queries one month of expenses at a time.
- Records in the selected month are shown ascending by date/time.
- The modal defaults to the current month and scrolls the record area toward today's date when present.
- Summary and selector controls stay fixed; only the expense record area scrolls.
- The page does not show repayment supervision, credit cards, liabilities, budgets, snapshots, income, repayments, or transfers.
- Historical expenses outside the current month are visible.
- Clicking an expense opens detail, and editing updates the original transaction.
- The optimized modal reads as a monthly ledger, not nested cards.
- Top summary and filters are compact and fixed above the scroll area.
- The table header appears once per month view instead of once per day.
- Day groups are lightweight separators, and transaction rows are dense enough for high-volume monthly review.
- Empty notes use `-`, and unlinked accounts use shorter low-emphasis text.
- Operation icons are compact, centered, and visually secondary until hover/focus.
- The ledger header sticks while scrolling inside the modal.
- Toolbar title, summary, filters, and export action feel like one compact tool strip rather than separated cards.
- Day separators are thin enough to guide scanning without reading as large rows.
- Amount and operation columns are narrow, stable visual anchors.
- Unlinked accounts do not create repeated text noise in dense rows.
- Delete actions are discoverable but do not dominate the operation column before hover.
- The current day is lightly marked when it appears in the selected month.

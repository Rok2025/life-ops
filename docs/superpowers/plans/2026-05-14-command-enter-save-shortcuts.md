# Command Enter Save Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Cmd/Ctrl + Enter` support to data save/create/update actions and make the shortcut visible in the frontend.

**Architecture:** Add a shared shortcut predicate, a small scoped action hook, and a reusable `ShortcutHint` UI primitive. Wire form submissions through form-level `requestSubmit()` where possible, and use scoped document listeners for non-form save controls.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, existing `@/components/ui` primitives.

---

### Task 1: Shared Shortcut Core

**Files:**
- Create: `apps/web/src/lib/shortcuts.ts`
- Create: `apps/web/src/lib/shortcuts.test.ts`
- Create: `apps/web/src/hooks/useCommandEnterAction.ts`
- Create: `apps/web/src/components/ui/ShortcutHint.tsx`
- Modify: `apps/web/src/components/ui/index.ts`
- Modify: `apps/web/src/components/ui/FormActions.tsx`

- [ ] Add tests for `Cmd/Ctrl + Enter`, repeated key suppression, IME composition suppression, and submit hint label.
- [ ] Run `pnpm --filter web test apps/web/src/lib/shortcuts.test.ts` and confirm the test fails because the module is missing.
- [ ] Implement the shortcut helpers, scoped hook, and `ShortcutHint`.
- [ ] Update `FormActions` so supported forms show `⌘ Enter` on the submit button.
- [ ] Re-run the shortcut test and confirm it passes.

### Task 2: Form Submit Wiring

**Files:**
- Modify form dialogs and inline forms under `apps/web/src/features/**/components/*.tsx`

- [ ] Add form-level `onKeyDown={handleCommandEnterFormSubmit}` to data write forms.
- [ ] Remove per-textarea `onCmdEnter` handlers where the form-level handler replaces them.
- [ ] Add `ShortcutHint` or visible shortcut text to primary save/create/update buttons.
- [ ] For compact icon-only save buttons, add `title` and `aria-label` with `⌘ Enter`.

### Task 3: Non-Form Save Wiring

**Files:**
- Modify: `apps/web/src/features/output/components/MarkdownEditor.tsx`
- Modify: `apps/web/src/features/output/components/ProjectDocEditor.tsx`
- Modify: `apps/web/src/features/system-config/components/YouyouPhotoSettings.tsx`
- Modify: `apps/web/src/features/finance/components/FinanceOverview.tsx`
- Modify fitness and English learning non-form save controls as needed

- [ ] Extend existing `Cmd/Ctrl + S` editors to also accept `Cmd/Ctrl + Enter`.
- [ ] Add scoped `Cmd/Ctrl + Enter` listeners to non-form save panels.
- [ ] Show `⌘ Enter` in visible button hints or toolbar text.

### Task 4: Verification

**Files:**
- All modified files

- [ ] Run `pnpm --filter web test`.
- [ ] Run `pnpm --filter web lint`.
- [ ] Run `pnpm --filter web build` if lint and test pass.
- [ ] Manually review changed save buttons for visible shortcut affordances.

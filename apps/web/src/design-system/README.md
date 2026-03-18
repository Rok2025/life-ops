# Design System (Tokens + Primitives)

This app uses **CSS variables** as the source of truth for design tokens, then exposes them to **Tailwind v4** via `@theme inline` in `src/app/globals.css`.

## UI primitives (`src/components/ui/`)

Use these instead of ad‑hoc markup so styles stay consistent:

| Component | Use for |
|-----------|--------|
| **Badge** | Status pills / labels. Tones: `default`, `success`, `warning`, `danger`. |
| **Button** | Primary / secondary / ghost / danger actions. Sizes: `sm`, `md`. |
| **Card** | Content panels, list containers. Variants: `default`, `subtle`. |
| **Input** | Text fields and textareas. Sizes: `sm`, `md`. Supports `error`, `multiline`, `rows`. |
| **Dialog** | Modal overlay + panel. Props: `open`, `onClose`, `title?`, `maxWidth?`, `children`. Handles ESC, body scroll lock, and focus. |
| **SectionHeader** | Page/section titles with optional actions. |

Import from `@/components/ui` (e.g. `import { Button, Card, Input, Dialog } from '@/components/ui'`).

## Baseline pages (visual regression targets)

- Dashboard: `src/app/page.tsx` → `features/dashboard`
- Fitness: `src/app/fitness/page.tsx` → `features/fitness`
- English Learning: `src/app/growth/english/page.tsx` → `features/english-learning`
- Output: `src/app/output/page.tsx` → `features/output`
- Settings: `src/app/settings/page.tsx` → `features/system-config`

## Token layers (naming contract)

- **Foundation tokens**: raw scales (typography, spacing, radius, shadow, motion)
  - Examples: `--fs-15`, `--space-4`, `--radius-md`, `--shadow-md`, `--duration-fast`
- **Semantic tokens**: intent-based values
  - Examples: `--bg-primary`, `--text-secondary`, `--card-bg`, `--border`
- **Component tokens**: specific components and layouts
  - Examples: `--sidebar-width`, `--summary-width`, `--space-card`

## Consumption rules

- Prefer **Tailwind utilities that map to tokens** (e.g. `text-body`, `text-body-sm`, `text-caption`, `p-card`, `rounded-card`, `rounded-control`, `shadow-card`).
- Avoid **arbitrary values** (`text-[14px]`, `p-[12px]`, `rounded-[8px]`) unless you are introducing a new token in `globals.css`.
- Prefer **primitives** for cards, buttons, form inputs, and modals instead of hand-rolled `.card` / `btn-primary` or raw `<input>`/`<button>` with repeated classes.
- **ESLint**: No Tailwind plugin (eslint-plugin-tailwindcss targets Tailwind v3; we use v4). Rely on code review and the rules below.
- **Stylelint**: `pnpm lint:styles` lints `src/**/*.css` for consistency.

## Accessibility

- **Reduced motion**: `globals.css` includes `@media (prefers-reduced-motion: reduce)` to shorten animations and transitions.
- **Focus**: Buttons and controls use `focus-visible:ring-accent/30`; test with keyboard and screen reader.

## Storybook (optional)

Run `pnpm storybook` in `apps/web` to view UI primitives. Stories live in `src/components/ui/*.stories.tsx`.

---

## Using design tokens going forward

After the token migration (typography, colors, radius, spacing, primitives), use tokens for all new or updated UI so the app stays consistent and theming works.

### Typography

| Use case | Class | Avoid |
|----------|--------|--------|
| Page/section title | `text-h2` | `text-xl`, `text-2xl` |
| Large title | `text-h1` | `text-3xl` |
| Subsection title | `text-h3` | `text-lg` |
| Body copy | `text-body` | `text-base` |
| Secondary text, labels | `text-body-sm` | `text-sm` |
| Captions, meta, badges | `text-caption` | `text-xs` |
| Code | `text-code` | — |

### Colors

Use semantic colors so light/dark and future themes work automatically:

- **Backgrounds**: `bg-bg-primary`, `bg-bg-secondary`, `bg-bg-tertiary`, `bg-card-bg`
- **Text**: `text-text-primary`, `text-text-secondary`, `text-text-tertiary`
- **States**: `text-success`, `text-warning`, `text-danger`, `text-accent`
- **Interactive**: `bg-accent`, `hover:bg-accent-hover`, `focus-visible:ring-accent/30`
- **Tone utilities**: for domain badges / category chips where you need more than the core semantic states, use `text-tone-blue`, `text-tone-green`, `text-tone-yellow`, `text-tone-purple`, `text-tone-orange`, `text-tone-cyan`, `text-tone-sky` with alpha backgrounds like `bg-tone-blue/14`

Avoid raw hex or Tailwind palette (e.g. `bg-slate-100`, `text-gray-600`) in feature code.

For TypeScript config maps (category/status/tag metadata), prefer reusing the shared tone class map in `src/design-system/tokens.ts` instead of retyping Tailwind palette classes.

### Spacing & radius

- **Cards**: `p-card` or `p-card-lg`, `rounded-card`, `shadow-card`
- **Controls**: `rounded-control`, padding via `px-control-x` / `py-control-y` (or Button/Input primitives)
- **Inner cards / sub-panels**: `rounded-inner-card` (nested surfaces inside a Card)
- **Popovers / dropdowns**: `rounded-popover`
- **Nav items**: `rounded-nav-item` (sidebar links), child items use `rounded-inner-card`
- **Nav container**: `rounded-nav-container` (sidebar nav group wrapper)
- **Layout**: `space-y-section`, `space-header-bottom`, `gap-2` / `gap-4` for local rhythm is fine; for page-level padding prefer `p-page-y` / `p-page-x` if you add new page wrappers

### Components

- **Surfaces**: `<Card>` from `@/components/ui`
- **Actions**: `<Button variant="primary">`
- **Status labels**: `<Badge tone="success">` (not `.pill` class)
- **Forms**: `<Input>`, `<Input multiline>` (not raw `<input>` / `<textarea>` with repeated styles)

### Theming and density

- **Theme palette**: Light / dark tokens in `globals.css` use an Apple-inspired neutral + accent palette with softer glass surfaces and blue selection states.
- **Dark mode**: Already driven by `prefers-color-scheme: dark` and `.dark` overrides in `globals.css`; tokens stay the same in code.
- **Density**: Optional `.density-compact` or `.density-comfortable` on `<html>` or `<body>` adjust spacing and font size via token overrides; no component changes needed.

### Optional future optimizations

- **Colors**: Replace any remaining hardcoded hex/rgba or palette classes with semantic tokens when touching those files.
- **Spacing**: Prefer token-based utilities (`p-card`, `space-y-section`) when adding new cards or sections; existing `p-4` / `gap-2` can stay until you refactor.
- **Docs**: Keep this README and Storybook in sync when adding new tokens or primitives.

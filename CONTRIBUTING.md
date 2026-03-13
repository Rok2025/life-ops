# Contributing

## Style & design

- **Use design tokens** for typography, spacing, radius, and colors. See `apps/web/src/design-system/README.md` and `apps/web/src/app/globals.css` (`:root` and `@theme inline`).
- **Use UI primitives** from `@/components/ui`: `Button`, `Card`, `Input`, `Dialog`, `SectionHeader`. Avoid ad-hoc `.card` / `btn-primary` or raw `<input>`/`<button>` with repeated classes.
- **Avoid arbitrary values** in class names (e.g. `text-[14px]`, `rounded-[8px]`) unless you are adding a new token in `globals.css`.
- Run **Stylelint** for CSS: `pnpm lint:styles` in `apps/web`.

## Lint

- Run `pnpm lint` from the repo root before opening a PR. Fix any ESLint errors and warnings.

## Structure

- Features live under `apps/web/src/features/<feature>/` with `components/`, `hooks/`, `api/` as needed.
- Shared UI lives in `apps/web/src/components/ui/`. Layout in `apps/web/src/components/layout/`.

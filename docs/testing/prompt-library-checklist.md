# Prompt Library Test Checklist

## Scope
- Page route: `/growth/prompts`
- Feature: prompt template management (CRUD, search, tag filter, favorites, copy)

## Functional
- [ ] Page can be opened from sidebar `成长 -> 提示词库`.
- [ ] Existing templates load successfully.
- [ ] Create template with title + content succeeds and appears in list.
- [ ] Edit template updates title/description/content/tags/favorite correctly.
- [ ] Delete template removes the item and list refreshes.
- [ ] Duplicate template creates a new item with copied content.
- [ ] Search by title keyword returns matched items.
- [ ] Search by content keyword returns matched items.
- [ ] Tag filter returns only templates containing selected tag.
- [ ] Favorites-only switch returns only favorite templates.
- [ ] Copy action copies content to clipboard and increments `use_count`.
- [ ] After refresh, saved data is persisted.

## UX
- [ ] Empty state is shown when list has no result.
- [ ] Error state can retry loading.
- [ ] Dialog closes by `Esc` and by clicking backdrop.
- [ ] Layout is usable on mobile width (<= 390px).

## Regression
- [ ] Existing routes in growth section still work (`/growth/english`, `/growth/reading`, `/growth/ai`).
- [ ] Sidebar group expand/collapse behavior remains unchanged.

---
name: github-pages-push-guard
description: "Guard Git pushes and publish flows for this repository by verifying the GitHub Pages static export before committing or pushing. Use when the user asks Codex to commit, push, publish, deploy to GitHub Pages, merge into main, or otherwise update the remote repository for life-ops; if the Pages check fails, fix the issue and rerun the check before committing or pushing."
---

# GitHub Pages Push Guard

Use this skill before any commit/push/publish flow for this repository.

## Required Workflow

1. Inspect the working tree and intended scope with `git status -sb`.
2. Run the guard script from the repository root:

   ```bash
   node .agents/skills/github-pages-push-guard/scripts/check-pages-export.mjs
   ```

3. If the guard fails, do not commit or push. Fix the blocking issue, then rerun the guard until it passes.
4. Only after the guard passes, stage the intended files, commit, and push.
5. In the final response, report the guard result and the commit/push outcome.

## What The Guard Checks

- `pnpm --filter web build` completes successfully.
- `apps/web/out` exists after the static export.
- Required Pages routes exist, including `/` and `/timeline/`.
- HTML files contain the chunk recovery marker inserted by `apps/web/scripts/inject-chunk-recovery.mjs`.
- Static references under `/life-ops/_next/...` point to files that exist in the export output.
- Static asset tags do not directly reference root-level `/_next/...` paths that would break under GitHub Pages repository base paths.

## Fixing Failures

- Build/type failures: fix the TypeScript, Next.js, or component error, then rerun the guard.
- Missing route output: confirm the route exists under `apps/web/src/app` and is compatible with `output: 'export'`.
- Missing static asset: inspect `apps/web/next.config.ts`, base path handling, and generated `apps/web/out`.
- Missing chunk recovery marker: check `apps/web/scripts/inject-chunk-recovery.mjs` and the `web` build script.

Never bypass a failing guard just to push code.

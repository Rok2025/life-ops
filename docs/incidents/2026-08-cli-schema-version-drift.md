# CLI Schema Version Drift Incident

## Summary

On 2026-08-01, the production `cli_*` tables were created from a pre-release DDL draft while the web application later deployed code that expected the committed CLI API schema. The `/developer` page failed at runtime because the deployed code queried `cli_access_tokens.device_name`, a column absent from production.

## Impact

- The existing Life OPS application remained available.
- The new `/developer` page returned a Server Components error.
- No CLI device, token, idempotency, or audit data was created; all four affected tables contained zero rows.

## Root cause

The production SQL was applied directly from an earlier implementation draft instead of the exact migration file committed with the deployed code. The migration history recorded `cli_api_foundation`, but its live schema did not match the repository's version of that migration.

## Remediation

- Add `20260801101052_repair_cli_api_schema.sql`, which matches the migration version recorded in the production Supabase project.
- The repair first checks that every `cli_*` table is empty. If any data exists, it aborts and requires an explicit data migration.
- When empty, it rebuilds the four CLI tables, indexes, RLS policies, and the idempotency RPC to exactly match the deployed server code.

## Required release gate for Supabase-backed features

For every feature that changes both application code and Supabase schema:

1. Create or update the migration in `supabase/migrations/` before deployment.
2. Review the exact migration diff against the server code's queried columns, constraints, policies, and RPC signatures.
3. Apply that exact migration to the target project and record the migration version returned by Supabase.
4. Verify live schema with `information_schema.columns` and verify RPC return fields before deploying the feature.
5. Deploy the matching Git commit only after schema verification succeeds.
6. Run a production smoke test for the first route that touches the new schema and check its Vercel runtime logs.

Never apply a copied SQL draft directly to production. If a schema must be changed after a migration has been applied, add a new corrective migration; do not rewrite migration history.

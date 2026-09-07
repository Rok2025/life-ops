-- User authorized permanent online deletion of unrelated business data on 2026-09-07.
-- Run ONLY after the reduced application is deployed and a restore-tested archive exists.
-- Requires a transaction (Supabase apply_migration or psql --single-transaction).
-- Do not use db push to replay the known divergent historical migrations.
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

DO $$
DECLARE actual text[];
BEGIN
  SELECT array_agg(tablename::text ORDER BY tablename) INTO actual
  FROM pg_tables WHERE schemaname = 'public';
  IF actual IS DISTINCT FROM ARRAY[
    'analytics_targets','area_goals','cli_access_tokens','cli_api_audit_logs',
    'cli_device_authorizations','cli_idempotency_keys','command_categories','command_templates',
    'daily_frogs','daily_til','english_cards','english_daily_assignments','english_daily_summaries',
    'english_learning_logs','english_prompt_mode_bindings','english_prompt_templates','english_queries',
    'english_word_bank','exercise_types','family_members','family_task_assignees','family_tasks',
    'finance_accounts','finance_budgets','finance_credit_card_bills','finance_liabilities',
    'finance_monthly_snapshots','finance_payment_schedules','finance_profiles','finance_transactions',
    'growth_projects','outputs','project_notes','project_todos','prompt_templates','quick_notes',
    'system_configs','workout_sessions','workout_sets','youyou_diary','youyou_growth_records',
    'youyou_medical_records','youyou_milestones','youyou_vaccinations'
  ]::text[] THEN
    RAISE EXCEPTION 'Public table inventory changed; re-audit before cleanup';
  END IF;
END $$;

-- Block concurrent business writes during the before/after comparison.
LOCK TABLE
  public.analytics_targets, public.area_goals, public.cli_access_tokens,
  public.cli_api_audit_logs, public.cli_device_authorizations, public.cli_idempotency_keys,
  public.command_categories, public.command_templates, public.daily_frogs, public.daily_til,
  public.english_cards, public.english_daily_assignments, public.english_daily_summaries,
  public.english_learning_logs, public.english_prompt_mode_bindings, public.english_prompt_templates,
  public.english_queries, public.english_word_bank, public.exercise_types, public.family_members,
  public.family_task_assignees, public.family_tasks, public.finance_accounts, public.finance_budgets,
  public.finance_credit_card_bills, public.finance_liabilities, public.finance_monthly_snapshots,
  public.finance_payment_schedules, public.finance_profiles, public.finance_transactions,
  public.growth_projects, public.outputs, public.project_notes, public.project_todos,
  public.prompt_templates, public.quick_notes, public.system_configs, public.workout_sessions,
  public.workout_sets, public.youyou_diary, public.youyou_growth_records,
  public.youyou_medical_records, public.youyou_milestones, public.youyou_vaccinations
IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE retained_business_fingerprints (
  table_name text PRIMARY KEY, row_count bigint NOT NULL, fingerprint text NOT NULL
) ON COMMIT DROP;

DO $$
DECLARE t text; filter_sql text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.system_configs WHERE scope IS NULL OR scope NOT IN (
    'exercise_category','family_task_category','output_type','project_scope','til_category','youyou-photo'
  )) THEN RAISE EXCEPTION 'Unknown config scope; re-audit before cleanup'; END IF;
  FOREACH t IN ARRAY ARRAY[
    'exercise_types','workout_sessions','workout_sets','finance_profiles','finance_accounts',
    'finance_liabilities','finance_credit_card_bills','finance_payment_schedules','finance_transactions',
    'finance_budgets','finance_monthly_snapshots','cli_device_authorizations','cli_access_tokens',
    'cli_idempotency_keys','cli_api_audit_logs','system_configs'
  ] LOOP
    filter_sql := CASE WHEN t = 'system_configs' THEN ' WHERE scope = ''exercise_category''' ELSE '' END;
    EXECUTE format(
      'INSERT INTO retained_business_fingerprints SELECT %L, count(*), md5(coalesce(string_agg(md5(to_jsonb(r)::text), '''' ORDER BY to_jsonb(r)::text), '''')) FROM public.%I r%s',
      t, t, filter_sql
    );
  END LOOP;
END $$;

DROP FUNCTION public.search_global(text, text[], date, date, integer);
DROP FUNCTION public.get_global_timeline(date, date, text[], integer);
DROP VIEW public.v_analytics_targets_active, public.v_analytics_targets_by_area;

-- One explicit group allows dependencies within the group, but no external CASCADE.
DROP TABLE
  public.analytics_targets, public.area_goals, public.command_categories, public.command_templates,
  public.daily_frogs, public.daily_til, public.english_cards, public.english_daily_assignments,
  public.english_daily_summaries, public.english_learning_logs, public.english_prompt_mode_bindings,
  public.english_prompt_templates, public.english_queries, public.english_word_bank,
  public.family_members, public.family_task_assignees, public.family_tasks, public.growth_projects,
  public.outputs, public.project_notes, public.project_todos, public.prompt_templates, public.quick_notes,
  public.youyou_diary, public.youyou_growth_records, public.youyou_medical_records,
  public.youyou_milestones, public.youyou_vaccinations;

DROP FUNCTION public.command_center_set_updated_at();
DROP FUNCTION public.update_analytics_targets_updated_at();
DROP FUNCTION public.youyou_set_updated_at();

DELETE FROM public.system_configs WHERE scope IN (
  'family_task_category','output_type','project_scope','til_category','youyou-photo'
);

DO $$
DECLARE old record; new_count bigint; new_fingerprint text;
BEGIN
  FOR old IN SELECT * FROM retained_business_fingerprints LOOP
    EXECUTE format(
      'SELECT count(*), md5(coalesce(string_agg(md5(to_jsonb(r)::text), '''' ORDER BY to_jsonb(r)::text), '''')) FROM public.%I r',
      old.table_name
    ) INTO new_count, new_fingerprint;
    IF new_count IS DISTINCT FROM old.row_count OR new_fingerprint IS DISTINCT FROM old.fingerprint THEN
      RAISE EXCEPTION 'Retained data changed in %, rolling back', old.table_name;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') <> 16 THEN
    RAISE EXCEPTION 'Unexpected final table count';
  END IF;
END $$;

-- Storage objects/bucket must be removed through Storage API, not SQL metadata deletion.
-- Their four obsolete policies are removed separately after the bucket is verified empty/deleted.
NOTIFY pgrst, 'reload schema';

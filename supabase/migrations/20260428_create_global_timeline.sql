-- ============================================================
-- Global Timeline
-- A date-first RPC that normalizes records across modules.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_global_timeline(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_source_types TEXT[] DEFAULT NULL,
  p_result_limit INTEGER DEFAULT 300
)
RETURNS TABLE (
  source_type TEXT,
  source_id TEXT,
  domain TEXT,
  event_type TEXT,
  title TEXT,
  snippet TEXT,
  occurred_date DATE,
  occurred_at TIMESTAMPTZ,
  href TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_start DATE := coalesce(p_date_from, CURRENT_DATE - 6);
  v_end DATE := coalesce(p_date_to, CURRENT_DATE);
  v_tmp DATE;
  v_limit INTEGER := least(greatest(coalesce(p_result_limit, 300), 1), 1000);
  v_sql_parts TEXT[] := '{}';
  v_sql TEXT;
BEGIN
  IF v_start > v_end THEN
    v_tmp := v_start;
    v_start := v_end;
    v_end := v_tmp;
  END IF;

  IF to_regclass('public.quick_notes') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        CASE WHEN q.type = 'todo' THEN 'todo' ELSE 'note' END::TEXT AS source_type,
        q.id::TEXT AS source_id,
        'capture'::TEXT AS domain,
        CASE
          WHEN q.type = 'todo' AND q.is_completed THEN 'completed'
          WHEN q.type = 'todo' THEN 'planned'
          ELSE q.type
        END::TEXT AS event_type,
        CASE
          WHEN q.type = 'todo' THEN q.content
          WHEN q.type = 'idea' THEN '灵感 · ' || left(regexp_replace(q.content, '[[:space:]]+', ' ', 'g'), 64)
          ELSE '备忘 · ' || left(regexp_replace(q.content, '[[:space:]]+', ' ', 'g'), 64)
        END::TEXT AS title,
        left(regexp_replace(concat_ws(' ', q.content, q.answer), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        CASE
          WHEN q.type = 'todo' THEN coalesce(q.completed_at::DATE, q.execute_date, q.note_date, q.created_at::DATE)
          ELSE coalesce(q.note_date, q.created_at::DATE)
        END::DATE AS occurred_date,
        CASE
          WHEN q.type = 'todo' THEN coalesce(q.completed_at, q.execute_date::TIMESTAMPTZ, q.created_at)
          ELSE coalesce(q.created_at, q.note_date::TIMESTAMPTZ)
        END::TIMESTAMPTZ AS occurred_at,
        CASE
          WHEN q.type = 'todo' THEN '/todos/all?item=' || q.id::TEXT
          ELSE '/?date=' || q.note_date::TEXT
        END::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'note_type', q.type,
          'priority', q.priority,
          'is_completed', q.is_completed,
          'execute_date', q.execute_date,
          'completed_at', q.completed_at
        )) AS metadata
      FROM public.quick_notes q
    $timeline$);
  END IF;

  IF to_regclass('public.daily_til') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'til'::TEXT AS source_type,
        t.id::TEXT AS source_id,
        'capture'::TEXT AS domain,
        'created'::TEXT AS event_type,
        CASE
          WHEN t.category IS NULL OR t.category = '' THEN 'TIL'
          ELSE 'TIL · ' || t.category
        END::TEXT AS title,
        left(regexp_replace(t.content, '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        t.til_date::DATE AS occurred_date,
        coalesce(t.created_at, t.til_date::TIMESTAMPTZ)::TIMESTAMPTZ AS occurred_at,
        ('/?date=' || t.til_date::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object('category', t.category)) AS metadata
      FROM public.daily_til t
    $timeline$);
  END IF;

  IF to_regclass('public.daily_frogs') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'frog'::TEXT AS source_type,
        f.id::TEXT AS source_id,
        'capture'::TEXT AS domain,
        CASE WHEN f.is_completed THEN 'completed' ELSE 'planned' END::TEXT AS event_type,
        f.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', f.title, f.description), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        f.frog_date::DATE AS occurred_date,
        coalesce(f.completed_at, f.created_at, f.frog_date::TIMESTAMPTZ)::TIMESTAMPTZ AS occurred_at,
        ('/?date=' || f.frog_date::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'is_completed', f.is_completed,
          'completed_at', f.completed_at
        )) AS metadata
      FROM public.daily_frogs f
    $timeline$);
  END IF;

  IF to_regclass('public.workout_sessions') IS NOT NULL
     AND to_regclass('public.workout_sets') IS NOT NULL
     AND to_regclass('public.exercise_types') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'workout'::TEXT AS source_type,
        w.id::TEXT AS source_id,
        'fitness'::TEXT AS domain,
        'logged'::TEXT AS event_type,
        ('训练记录 · ' || w.workout_date::TEXT)::TEXT AS title,
        left(regexp_replace(concat_ws(' ', w.notes, exercise_summary.exercise_names), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        w.workout_date::DATE AS occurred_date,
        w.workout_date::TIMESTAMPTZ AS occurred_at,
        ('/fitness/history?date=' || w.workout_date::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'exercise_names', exercise_summary.exercise_names,
          'exercise_count', exercise_summary.exercise_count,
          'total_sets', exercise_summary.total_sets
        )) AS metadata
      FROM public.workout_sessions w
      LEFT JOIN LATERAL (
        SELECT
          string_agg(DISTINCT et.name, '、' ORDER BY et.name) AS exercise_names,
          count(DISTINCT et.id) AS exercise_count,
          count(ws.id) AS total_sets
        FROM public.workout_sets ws
        LEFT JOIN public.exercise_types et ON et.id = ws.exercise_type_id
        WHERE ws.session_id = w.id
      ) exercise_summary ON TRUE
    $timeline$);
  ELSIF to_regclass('public.workout_sessions') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'workout'::TEXT AS source_type,
        w.id::TEXT AS source_id,
        'fitness'::TEXT AS domain,
        'logged'::TEXT AS event_type,
        ('训练记录 · ' || w.workout_date::TEXT)::TEXT AS title,
        left(regexp_replace(coalesce(w.notes, ''), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        w.workout_date::DATE AS occurred_date,
        w.workout_date::TIMESTAMPTZ AS occurred_at,
        ('/fitness/history?date=' || w.workout_date::TEXT)::TEXT AS href,
        '{}'::JSONB AS metadata
      FROM public.workout_sessions w
    $timeline$);
  END IF;

  IF to_regclass('public.outputs') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'output'::TEXT AS source_type,
        o.id::TEXT AS source_id,
        'output'::TEXT AS domain,
        o.status::TEXT AS event_type,
        o.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', o.title, o.content, o.url), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        o.created_at::DATE AS occurred_date,
        o.created_at::TIMESTAMPTZ AS occurred_at,
        ('/output?item=' || o.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'output_type', o.type,
          'status', o.status,
          'url', o.url,
          'project_id', o.project_id
        )) AS metadata
      FROM public.outputs o
    $timeline$);
  END IF;

  IF to_regclass('public.growth_projects') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'growth_project'::TEXT AS source_type,
        p.id::TEXT AS source_id,
        'growth'::TEXT AS domain,
        p.status::TEXT AS event_type,
        p.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', p.title, p.description), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        coalesce(p.start_date, p.created_at::DATE)::DATE AS occurred_date,
        coalesce(p.start_date::TIMESTAMPTZ, p.created_at)::TIMESTAMPTZ AS occurred_at,
        ('/growth/' || p.area || '?project=' || p.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'area', p.area,
          'scope', p.scope,
          'status', p.status,
          'end_date', p.end_date
        )) AS metadata
      FROM public.growth_projects p
    $timeline$);
  END IF;

  IF to_regclass('public.project_todos') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'project_todo'::TEXT AS source_type,
        pt.id::TEXT AS source_id,
        'growth'::TEXT AS domain,
        CASE WHEN pt.is_completed THEN 'completed' ELSE 'planned' END::TEXT AS event_type,
        pt.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', pt.title, gp.title), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        coalesce(pt.completed_at::DATE, pt.created_at::DATE)::DATE AS occurred_date,
        coalesce(pt.completed_at, pt.created_at)::TIMESTAMPTZ AS occurred_at,
        CASE
          WHEN gp.area IS NULL THEN '/growth/ai'
          ELSE '/growth/' || gp.area || '?todo=' || pt.id::TEXT
        END::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'project_id', pt.project_id,
          'project_title', gp.title,
          'area', gp.area,
          'is_completed', pt.is_completed,
          'completed_at', pt.completed_at
        )) AS metadata
      FROM public.project_todos pt
      LEFT JOIN public.growth_projects gp ON gp.id = pt.project_id
    $timeline$);
  END IF;

  IF to_regclass('public.project_notes') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'project_note'::TEXT AS source_type,
        pn.id::TEXT AS source_id,
        'growth'::TEXT AS domain,
        pn.type::TEXT AS event_type,
        CASE
          WHEN pn.type = 'idea' THEN '项目灵感'
          WHEN pn.type = 'achievement' THEN '项目成果'
          ELSE '项目笔记'
        END::TEXT AS title,
        left(regexp_replace(concat_ws(' ', pn.content, gp.title), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        pn.created_at::DATE AS occurred_date,
        pn.created_at::TIMESTAMPTZ AS occurred_at,
        CASE
          WHEN gp.area IS NULL THEN '/growth/ai'
          ELSE '/growth/' || gp.area || '?note=' || pn.id::TEXT
        END::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'project_id', pn.project_id,
          'project_title', gp.title,
          'area', gp.area,
          'note_type', pn.type,
          'todo_id', pn.todo_id
        )) AS metadata
      FROM public.project_notes pn
      LEFT JOIN public.growth_projects gp ON gp.id = pn.project_id
    $timeline$);
  END IF;

  IF to_regclass('public.youyou_diary') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'youyou_diary'::TEXT AS source_type,
        d.id::TEXT AS source_id,
        'youyou'::TEXT AS domain,
        'diary'::TEXT AS event_type,
        ('又又日记 · ' || d.date::TEXT)::TEXT AS title,
        left(regexp_replace(concat_ws(' ', d.highlight, d.learned, d.funny_quote, d.diet_note, d.sleep_note, d.content), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        d.date::DATE AS occurred_date,
        coalesce(d.created_at, d.date::TIMESTAMPTZ)::TIMESTAMPTZ AS occurred_at,
        ('/growth/youyou/diary?date=' || d.date::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object('mood', d.mood)) AS metadata
      FROM public.youyou_diary d
    $timeline$);
  END IF;

  IF to_regclass('public.youyou_milestones') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'youyou_milestone'::TEXT AS source_type,
        m.id::TEXT AS source_id,
        'youyou'::TEXT AS domain,
        CASE WHEN m.achieved_at IS NULL THEN 'planned' ELSE 'achieved' END::TEXT AS event_type,
        m.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', m.title, m.description), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        coalesce(m.achieved_at, m.created_at::DATE)::DATE AS occurred_date,
        coalesce(m.achieved_at::TIMESTAMPTZ, m.created_at)::TIMESTAMPTZ AS occurred_at,
        ('/growth/youyou/milestones?item=' || m.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'category', m.category,
          'expected_age_months', m.expected_age_months,
          'achieved_at', m.achieved_at
        )) AS metadata
      FROM public.youyou_milestones m
    $timeline$);
  END IF;

  IF to_regclass('public.youyou_growth_records') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'youyou_growth'::TEXT AS source_type,
        g.id::TEXT AS source_id,
        'youyou'::TEXT AS domain,
        'measured'::TEXT AS event_type,
        ('发育记录 · ' || g.date::TEXT)::TEXT AS title,
        left(regexp_replace(concat_ws(' ', g.notes, g.height_cm::TEXT, g.weight_kg::TEXT, g.head_cm::TEXT), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        g.date::DATE AS occurred_date,
        coalesce(g.created_at, g.date::TIMESTAMPTZ)::TIMESTAMPTZ AS occurred_at,
        ('/growth/youyou/growth?date=' || g.date::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'height_cm', g.height_cm,
          'weight_kg', g.weight_kg,
          'head_cm', g.head_cm
        )) AS metadata
      FROM public.youyou_growth_records g
    $timeline$);
  END IF;

  IF to_regclass('public.youyou_vaccinations') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'youyou_vaccination'::TEXT AS source_type,
        v.id::TEXT AS source_id,
        'youyou'::TEXT AS domain,
        CASE WHEN v.actual_date IS NULL THEN 'scheduled' ELSE 'completed' END::TEXT AS event_type,
        v.vaccine_name::TEXT AS title,
        left(regexp_replace(concat_ws(' ', v.vaccine_name, v.location, v.notes), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        coalesce(v.actual_date, v.scheduled_date, v.created_at::DATE)::DATE AS occurred_date,
        coalesce(v.actual_date::TIMESTAMPTZ, v.scheduled_date::TIMESTAMPTZ, v.created_at)::TIMESTAMPTZ AS occurred_at,
        ('/growth/youyou/health?vaccination=' || v.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'dose_number', v.dose_number,
          'scheduled_date', v.scheduled_date,
          'actual_date', v.actual_date,
          'location', v.location
        )) AS metadata
      FROM public.youyou_vaccinations v
    $timeline$);
  END IF;

  IF to_regclass('public.youyou_medical_records') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'youyou_medical'::TEXT AS source_type,
        mr.id::TEXT AS source_id,
        'youyou'::TEXT AS domain,
        mr.type::TEXT AS event_type,
        mr.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', mr.title, mr.symptoms, mr.diagnosis, mr.treatment, mr.hospital, mr.doctor, mr.notes), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        mr.date::DATE AS occurred_date,
        coalesce(mr.created_at, mr.date::TIMESTAMPTZ)::TIMESTAMPTZ AS occurred_at,
        ('/growth/youyou/health?medical=' || mr.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'record_type', mr.type,
          'hospital', mr.hospital,
          'doctor', mr.doctor
        )) AS metadata
      FROM public.youyou_medical_records mr
    $timeline$);
  END IF;

  IF to_regclass('public.english_queries') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'english_query'::TEXT AS source_type,
        e.id::TEXT AS source_id,
        'english'::TEXT AS domain,
        e.prompt_mode::TEXT AS event_type,
        e.input_text::TEXT AS title,
        left(regexp_replace(concat_ws(' ', e.input_text, e.custom_instruction, e.ai_response::TEXT), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        e.query_date::DATE AS occurred_date,
        coalesce(e.created_at, e.query_date::TIMESTAMPTZ)::TIMESTAMPTZ AS occurred_at,
        ('/growth/english?query=' || e.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'input_type', e.input_type,
          'prompt_mode', e.prompt_mode,
          'is_saved', e.is_saved,
          'ai_provider', e.ai_provider
        )) AS metadata
      FROM public.english_queries e
    $timeline$);
  END IF;

  IF to_regclass('public.english_cards') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'english_card'::TEXT AS source_type,
        c.id::TEXT AS source_id,
        'english'::TEXT AS domain,
        'card_created'::TEXT AS event_type,
        c.front_text::TEXT AS title,
        left(regexp_replace(concat_ws(' ', c.front_text, c.back_text, c.phonetic, c.source, array_to_string(c.tags, ' ')), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        c.created_at::DATE AS occurred_date,
        c.created_at::TIMESTAMPTZ AS occurred_at,
        ('/growth/english?card=' || c.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'difficulty', c.difficulty,
          'tags', c.tags,
          'familiarity', c.familiarity,
          'source', c.source
        )) AS metadata
      FROM public.english_cards c
    $timeline$);
  END IF;

  IF to_regclass('public.family_tasks') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $timeline$
      SELECT
        'family_task'::TEXT AS source_type,
        ft.id::TEXT AS source_id,
        'family'::TEXT AS domain,
        CASE
          WHEN ft.status = 'done' THEN 'completed'
          WHEN ft.due_date IS NOT NULL THEN 'due'
          ELSE 'created'
        END::TEXT AS event_type,
        ft.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', ft.title, ft.description, ft.category), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        coalesce(ft.completed_at::DATE, ft.due_date, ft.created_at::DATE)::DATE AS occurred_date,
        coalesce(ft.completed_at, ft.due_date::TIMESTAMPTZ, ft.created_at)::TIMESTAMPTZ AS occurred_at,
        ('/family?task=' || ft.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'priority', ft.priority,
          'status', ft.status,
          'category', ft.category,
          'due_date', ft.due_date,
          'is_recurring', ft.is_recurring
        )) AS metadata
      FROM public.family_tasks ft
    $timeline$);
  END IF;

  IF array_length(v_sql_parts, 1) IS NULL THEN
    RETURN;
  END IF;

  v_sql := 'SELECT s.source_type, s.source_id, s.domain, s.event_type, s.title, s.snippet, s.occurred_date, s.occurred_at, s.href, s.metadata
            FROM (' || array_to_string(v_sql_parts, E'\nUNION ALL\n') || ') s
            WHERE s.occurred_date IS NOT NULL
              AND s.occurred_date >= $2
              AND s.occurred_date <= $3
              AND ($1 IS NULL OR cardinality($1) = 0 OR s.source_type = ANY($1))
            ORDER BY s.occurred_date ASC, s.occurred_at ASC NULLS LAST, s.domain ASC, s.title ASC
            LIMIT $4';

  RETURN QUERY EXECUTE v_sql
    USING p_source_types, v_start, v_end, v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_timeline(DATE, DATE, TEXT[], INTEGER) TO anon, authenticated;

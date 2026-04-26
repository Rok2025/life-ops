-- ============================================================
-- Global Search
-- A single RPC that normalizes searchable records across modules.
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_global(
  p_keyword TEXT,
  p_source_types TEXT[] DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  source_type TEXT,
  source_id TEXT,
  title TEXT,
  snippet TEXT,
  occurred_date DATE,
  href TEXT,
  metadata JSONB,
  rank_score INTEGER
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_keyword TEXT := btrim(coalesce(p_keyword, ''));
  v_pattern TEXT;
  v_limit INTEGER := least(greatest(coalesce(p_result_limit, 50), 1), 100);
  v_sql_parts TEXT[] := '{}';
  v_sql TEXT;
BEGIN
  IF v_keyword = '' THEN
    RETURN;
  END IF;

  v_pattern := '%' || v_keyword || '%';

  IF to_regclass('public.quick_notes') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        CASE WHEN q.type = 'todo' THEN 'todo' ELSE 'note' END::TEXT AS source_type,
        q.id::TEXT AS source_id,
        CASE
          WHEN q.type = 'todo' THEN q.content
          WHEN q.type = 'idea' THEN '灵感 · ' || left(regexp_replace(q.content, '[[:space:]]+', ' ', 'g'), 64)
          ELSE '备忘 · ' || left(regexp_replace(q.content, '[[:space:]]+', ' ', 'g'), 64)
        END::TEXT AS title,
        left(regexp_replace(concat_ws(' ', q.content, q.answer), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        q.note_date::DATE AS occurred_date,
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
        )) AS metadata,
        CASE
          WHEN lower(q.content) = lower($6) THEN 120
          WHEN q.content ILIKE ($6 || '%') THEN 95
          WHEN coalesce(q.answer, '') ILIKE $1 THEN 70
          ELSE 60
        END::INTEGER AS rank_score
      FROM public.quick_notes q
      WHERE ($4 IS NULL OR (CASE WHEN q.type = 'todo' THEN 'todo' ELSE 'note' END) = ANY($4))
        AND ($2 IS NULL OR q.note_date >= $2)
        AND ($3 IS NULL OR q.note_date <= $3)
        AND (q.content ILIKE $1 OR coalesce(q.answer, '') ILIKE $1)
    $search$);
  END IF;

  IF to_regclass('public.daily_til') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'til'::TEXT AS source_type,
        t.id::TEXT AS source_id,
        CASE
          WHEN t.category IS NULL OR t.category = '' THEN 'TIL'
          ELSE 'TIL · ' || t.category
        END::TEXT AS title,
        left(regexp_replace(t.content, '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        t.til_date::DATE AS occurred_date,
        ('/?date=' || t.til_date::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object('category', t.category)) AS metadata,
        CASE
          WHEN lower(t.content) = lower($6) THEN 115
          WHEN t.content ILIKE ($6 || '%') THEN 90
          WHEN coalesce(t.category, '') ILIKE $1 THEN 70
          ELSE 58
        END::INTEGER AS rank_score
      FROM public.daily_til t
      WHERE ($4 IS NULL OR 'til' = ANY($4))
        AND ($2 IS NULL OR t.til_date >= $2)
        AND ($3 IS NULL OR t.til_date <= $3)
        AND (t.content ILIKE $1 OR coalesce(t.category, '') ILIKE $1)
    $search$);
  END IF;

  IF to_regclass('public.daily_frogs') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'frog'::TEXT AS source_type,
        f.id::TEXT AS source_id,
        f.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', f.title, f.description), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        f.frog_date::DATE AS occurred_date,
        ('/?date=' || f.frog_date::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'is_completed', f.is_completed,
          'completed_at', f.completed_at
        )) AS metadata,
        CASE
          WHEN lower(f.title) = lower($6) THEN 115
          WHEN f.title ILIKE ($6 || '%') THEN 90
          WHEN coalesce(f.description, '') ILIKE $1 THEN 65
          ELSE 55
        END::INTEGER AS rank_score
      FROM public.daily_frogs f
      WHERE ($4 IS NULL OR 'frog' = ANY($4))
        AND ($2 IS NULL OR f.frog_date >= $2)
        AND ($3 IS NULL OR f.frog_date <= $3)
        AND (f.title ILIKE $1 OR coalesce(f.description, '') ILIKE $1)
    $search$);
  END IF;

  IF to_regclass('public.workout_sessions') IS NOT NULL
     AND to_regclass('public.workout_sets') IS NOT NULL
     AND to_regclass('public.exercise_types') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'workout'::TEXT AS source_type,
        w.id::TEXT AS source_id,
        ('训练记录 · ' || w.workout_date::TEXT)::TEXT AS title,
        left(regexp_replace(concat_ws(' ', w.notes, exercise_summary.exercise_names), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        w.workout_date::DATE AS occurred_date,
        ('/fitness/history?date=' || w.workout_date::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'exercise_names', exercise_summary.exercise_names,
          'exercise_count', exercise_summary.exercise_count
        )) AS metadata,
        CASE
          WHEN coalesce(exercise_summary.exercise_names, '') ILIKE ($6 || '%') THEN 92
          WHEN coalesce(w.notes, '') ILIKE ($6 || '%') THEN 86
          ELSE 52
        END::INTEGER AS rank_score
      FROM public.workout_sessions w
      LEFT JOIN LATERAL (
        SELECT
          string_agg(DISTINCT et.name, '、' ORDER BY et.name) AS exercise_names,
          count(DISTINCT et.id) AS exercise_count
        FROM public.workout_sets ws
        LEFT JOIN public.exercise_types et ON et.id = ws.exercise_type_id
        WHERE ws.session_id = w.id
      ) exercise_summary ON TRUE
      WHERE ($4 IS NULL OR 'workout' = ANY($4))
        AND ($2 IS NULL OR w.workout_date >= $2)
        AND ($3 IS NULL OR w.workout_date <= $3)
        AND (coalesce(w.notes, '') ILIKE $1 OR coalesce(exercise_summary.exercise_names, '') ILIKE $1)
    $search$);
  ELSIF to_regclass('public.workout_sessions') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'workout'::TEXT AS source_type,
        w.id::TEXT AS source_id,
        ('训练记录 · ' || w.workout_date::TEXT)::TEXT AS title,
        left(regexp_replace(coalesce(w.notes, ''), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        w.workout_date::DATE AS occurred_date,
        ('/fitness/history?date=' || w.workout_date::TEXT)::TEXT AS href,
        '{}'::JSONB AS metadata,
        CASE WHEN coalesce(w.notes, '') ILIKE ($6 || '%') THEN 86 ELSE 52 END::INTEGER AS rank_score
      FROM public.workout_sessions w
      WHERE ($4 IS NULL OR 'workout' = ANY($4))
        AND ($2 IS NULL OR w.workout_date >= $2)
        AND ($3 IS NULL OR w.workout_date <= $3)
        AND coalesce(w.notes, '') ILIKE $1
    $search$);
  END IF;

  IF to_regclass('public.outputs') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'output'::TEXT AS source_type,
        o.id::TEXT AS source_id,
        o.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', o.title, o.content, o.url), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        o.created_at::DATE AS occurred_date,
        ('/output?item=' || o.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'output_type', o.type,
          'status', o.status,
          'url', o.url,
          'project_id', o.project_id
        )) AS metadata,
        CASE
          WHEN lower(o.title) = lower($6) THEN 125
          WHEN o.title ILIKE ($6 || '%') THEN 96
          WHEN coalesce(o.content, '') ILIKE $1 THEN 68
          ELSE 56
        END::INTEGER AS rank_score
      FROM public.outputs o
      WHERE ($4 IS NULL OR 'output' = ANY($4))
        AND ($2 IS NULL OR o.created_at::DATE >= $2)
        AND ($3 IS NULL OR o.created_at::DATE <= $3)
        AND (o.title ILIKE $1 OR coalesce(o.content, '') ILIKE $1 OR coalesce(o.url, '') ILIKE $1)
    $search$);
  END IF;

  IF to_regclass('public.growth_projects') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'growth_project'::TEXT AS source_type,
        p.id::TEXT AS source_id,
        p.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', p.title, p.description), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        coalesce(p.start_date, p.created_at::DATE)::DATE AS occurred_date,
        ('/growth/' || p.area || '?project=' || p.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'area', p.area,
          'scope', p.scope,
          'status', p.status,
          'end_date', p.end_date
        )) AS metadata,
        CASE
          WHEN lower(p.title) = lower($6) THEN 122
          WHEN p.title ILIKE ($6 || '%') THEN 94
          WHEN coalesce(p.description, '') ILIKE $1 THEN 66
          ELSE 54
        END::INTEGER AS rank_score
      FROM public.growth_projects p
      WHERE ($4 IS NULL OR 'growth_project' = ANY($4))
        AND ($2 IS NULL OR coalesce(p.start_date, p.created_at::DATE) >= $2)
        AND ($3 IS NULL OR coalesce(p.start_date, p.created_at::DATE) <= $3)
        AND (p.title ILIKE $1 OR coalesce(p.description, '') ILIKE $1)
    $search$);
  END IF;

  IF to_regclass('public.project_todos') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'project_todo'::TEXT AS source_type,
        pt.id::TEXT AS source_id,
        pt.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', pt.title, gp.title), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        coalesce(pt.completed_at::DATE, pt.created_at::DATE)::DATE AS occurred_date,
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
        )) AS metadata,
        CASE
          WHEN lower(pt.title) = lower($6) THEN 118
          WHEN pt.title ILIKE ($6 || '%') THEN 90
          WHEN coalesce(gp.title, '') ILIKE $1 THEN 62
          ELSE 52
        END::INTEGER AS rank_score
      FROM public.project_todos pt
      LEFT JOIN public.growth_projects gp ON gp.id = pt.project_id
      WHERE ($4 IS NULL OR 'project_todo' = ANY($4))
        AND ($2 IS NULL OR coalesce(pt.completed_at::DATE, pt.created_at::DATE) >= $2)
        AND ($3 IS NULL OR coalesce(pt.completed_at::DATE, pt.created_at::DATE) <= $3)
        AND (pt.title ILIKE $1 OR coalesce(gp.title, '') ILIKE $1)
    $search$);
  END IF;

  IF to_regclass('public.project_notes') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'project_note'::TEXT AS source_type,
        pn.id::TEXT AS source_id,
        CASE
          WHEN pn.type = 'idea' THEN '项目灵感'
          WHEN pn.type = 'achievement' THEN '项目成果'
          ELSE '项目笔记'
        END::TEXT AS title,
        left(regexp_replace(concat_ws(' ', pn.content, gp.title), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        pn.created_at::DATE AS occurred_date,
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
        )) AS metadata,
        CASE
          WHEN pn.content ILIKE ($6 || '%') THEN 88
          WHEN coalesce(gp.title, '') ILIKE $1 THEN 60
          ELSE 50
        END::INTEGER AS rank_score
      FROM public.project_notes pn
      LEFT JOIN public.growth_projects gp ON gp.id = pn.project_id
      WHERE ($4 IS NULL OR 'project_note' = ANY($4))
        AND ($2 IS NULL OR pn.created_at::DATE >= $2)
        AND ($3 IS NULL OR pn.created_at::DATE <= $3)
        AND (pn.content ILIKE $1 OR coalesce(gp.title, '') ILIKE $1)
    $search$);
  END IF;

  IF to_regclass('public.youyou_diary') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'youyou_diary'::TEXT AS source_type,
        d.id::TEXT AS source_id,
        ('又又日记 · ' || d.date::TEXT)::TEXT AS title,
        left(regexp_replace(concat_ws(' ', d.highlight, d.learned, d.funny_quote, d.diet_note, d.sleep_note, d.content), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        d.date::DATE AS occurred_date,
        ('/growth/youyou/diary?date=' || d.date::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object('mood', d.mood)) AS metadata,
        CASE
          WHEN coalesce(d.highlight, '') ILIKE ($6 || '%') THEN 92
          WHEN coalesce(d.content, '') ILIKE $1 THEN 64
          ELSE 52
        END::INTEGER AS rank_score
      FROM public.youyou_diary d
      WHERE ($4 IS NULL OR 'youyou_diary' = ANY($4))
        AND ($2 IS NULL OR d.date >= $2)
        AND ($3 IS NULL OR d.date <= $3)
        AND (
          coalesce(d.highlight, '') ILIKE $1
          OR coalesce(d.learned, '') ILIKE $1
          OR coalesce(d.funny_quote, '') ILIKE $1
          OR coalesce(d.diet_note, '') ILIKE $1
          OR coalesce(d.sleep_note, '') ILIKE $1
          OR coalesce(d.content, '') ILIKE $1
        )
    $search$);
  END IF;

  IF to_regclass('public.youyou_milestones') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'youyou_milestone'::TEXT AS source_type,
        m.id::TEXT AS source_id,
        m.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', m.title, m.description), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        coalesce(m.achieved_at, m.created_at::DATE)::DATE AS occurred_date,
        ('/growth/youyou/milestones?item=' || m.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'category', m.category,
          'expected_age_months', m.expected_age_months,
          'achieved_at', m.achieved_at
        )) AS metadata,
        CASE
          WHEN lower(m.title) = lower($6) THEN 118
          WHEN m.title ILIKE ($6 || '%') THEN 90
          WHEN coalesce(m.description, '') ILIKE $1 THEN 62
          ELSE 52
        END::INTEGER AS rank_score
      FROM public.youyou_milestones m
      WHERE ($4 IS NULL OR 'youyou_milestone' = ANY($4))
        AND ($2 IS NULL OR coalesce(m.achieved_at, m.created_at::DATE) >= $2)
        AND ($3 IS NULL OR coalesce(m.achieved_at, m.created_at::DATE) <= $3)
        AND (m.title ILIKE $1 OR coalesce(m.description, '') ILIKE $1)
    $search$);
  END IF;

  IF to_regclass('public.youyou_growth_records') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'youyou_growth'::TEXT AS source_type,
        g.id::TEXT AS source_id,
        ('发育记录 · ' || g.date::TEXT)::TEXT AS title,
        left(regexp_replace(concat_ws(' ', g.notes, g.height_cm::TEXT, g.weight_kg::TEXT, g.head_cm::TEXT), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        g.date::DATE AS occurred_date,
        ('/growth/youyou/growth?date=' || g.date::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'height_cm', g.height_cm,
          'weight_kg', g.weight_kg,
          'head_cm', g.head_cm
        )) AS metadata,
        CASE WHEN coalesce(g.notes, '') ILIKE ($6 || '%') THEN 82 ELSE 48 END::INTEGER AS rank_score
      FROM public.youyou_growth_records g
      WHERE ($4 IS NULL OR 'youyou_growth' = ANY($4))
        AND ($2 IS NULL OR g.date >= $2)
        AND ($3 IS NULL OR g.date <= $3)
        AND (
          coalesce(g.notes, '') ILIKE $1
          OR coalesce(g.height_cm::TEXT, '') ILIKE $1
          OR coalesce(g.weight_kg::TEXT, '') ILIKE $1
          OR coalesce(g.head_cm::TEXT, '') ILIKE $1
        )
    $search$);
  END IF;

  IF to_regclass('public.youyou_vaccinations') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'youyou_vaccination'::TEXT AS source_type,
        v.id::TEXT AS source_id,
        v.vaccine_name::TEXT AS title,
        left(regexp_replace(concat_ws(' ', v.vaccine_name, v.location, v.notes), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        coalesce(v.actual_date, v.scheduled_date, v.created_at::DATE)::DATE AS occurred_date,
        ('/growth/youyou/health?vaccination=' || v.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'dose_number', v.dose_number,
          'scheduled_date', v.scheduled_date,
          'actual_date', v.actual_date,
          'location', v.location
        )) AS metadata,
        CASE
          WHEN lower(v.vaccine_name) = lower($6) THEN 114
          WHEN v.vaccine_name ILIKE ($6 || '%') THEN 88
          WHEN coalesce(v.notes, '') ILIKE $1 THEN 56
          ELSE 48
        END::INTEGER AS rank_score
      FROM public.youyou_vaccinations v
      WHERE ($4 IS NULL OR 'youyou_vaccination' = ANY($4))
        AND ($2 IS NULL OR coalesce(v.actual_date, v.scheduled_date, v.created_at::DATE) >= $2)
        AND ($3 IS NULL OR coalesce(v.actual_date, v.scheduled_date, v.created_at::DATE) <= $3)
        AND (v.vaccine_name ILIKE $1 OR coalesce(v.location, '') ILIKE $1 OR coalesce(v.notes, '') ILIKE $1)
    $search$);
  END IF;

  IF to_regclass('public.youyou_medical_records') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'youyou_medical'::TEXT AS source_type,
        mr.id::TEXT AS source_id,
        mr.title::TEXT AS title,
        left(regexp_replace(concat_ws(' ', mr.title, mr.symptoms, mr.diagnosis, mr.treatment, mr.hospital, mr.doctor, mr.notes), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        mr.date::DATE AS occurred_date,
        ('/growth/youyou/health?medical=' || mr.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'record_type', mr.type,
          'hospital', mr.hospital,
          'doctor', mr.doctor
        )) AS metadata,
        CASE
          WHEN lower(mr.title) = lower($6) THEN 118
          WHEN mr.title ILIKE ($6 || '%') THEN 90
          WHEN coalesce(mr.diagnosis, '') ILIKE $1 THEN 65
          ELSE 52
        END::INTEGER AS rank_score
      FROM public.youyou_medical_records mr
      WHERE ($4 IS NULL OR 'youyou_medical' = ANY($4))
        AND ($2 IS NULL OR mr.date >= $2)
        AND ($3 IS NULL OR mr.date <= $3)
        AND (
          mr.title ILIKE $1
          OR coalesce(mr.symptoms, '') ILIKE $1
          OR coalesce(mr.diagnosis, '') ILIKE $1
          OR coalesce(mr.treatment, '') ILIKE $1
          OR coalesce(mr.hospital, '') ILIKE $1
          OR coalesce(mr.doctor, '') ILIKE $1
          OR coalesce(mr.notes, '') ILIKE $1
        )
    $search$);
  END IF;

  IF to_regclass('public.english_queries') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'english_query'::TEXT AS source_type,
        e.id::TEXT AS source_id,
        e.input_text::TEXT AS title,
        left(regexp_replace(concat_ws(' ', e.input_text, e.custom_instruction, e.ai_response::TEXT), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        e.query_date::DATE AS occurred_date,
        ('/growth/english?query=' || e.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'input_type', e.input_type,
          'prompt_mode', e.prompt_mode,
          'is_saved', e.is_saved,
          'ai_provider', e.ai_provider
        )) AS metadata,
        CASE
          WHEN lower(e.input_text) = lower($6) THEN 120
          WHEN e.input_text ILIKE ($6 || '%') THEN 94
          WHEN e.ai_response::TEXT ILIKE $1 THEN 60
          ELSE 50
        END::INTEGER AS rank_score
      FROM public.english_queries e
      WHERE ($4 IS NULL OR 'english_query' = ANY($4))
        AND ($2 IS NULL OR e.query_date >= $2)
        AND ($3 IS NULL OR e.query_date <= $3)
        AND (e.input_text ILIKE $1 OR coalesce(e.custom_instruction, '') ILIKE $1 OR e.ai_response::TEXT ILIKE $1)
    $search$);
  END IF;

  IF to_regclass('public.english_cards') IS NOT NULL THEN
    v_sql_parts := array_append(v_sql_parts, $search$
      SELECT
        'english_card'::TEXT AS source_type,
        c.id::TEXT AS source_id,
        c.front_text::TEXT AS title,
        left(regexp_replace(concat_ws(' ', c.front_text, c.back_text, c.phonetic, c.source, array_to_string(c.tags, ' ')), '[[:space:]]+', ' ', 'g'), 220)::TEXT AS snippet,
        c.created_at::DATE AS occurred_date,
        ('/growth/english?card=' || c.id::TEXT)::TEXT AS href,
        jsonb_strip_nulls(jsonb_build_object(
          'difficulty', c.difficulty,
          'tags', c.tags,
          'familiarity', c.familiarity,
          'source', c.source
        )) AS metadata,
        CASE
          WHEN lower(c.front_text) = lower($6) THEN 120
          WHEN c.front_text ILIKE ($6 || '%') THEN 94
          WHEN c.back_text ILIKE $1 THEN 62
          ELSE 50
        END::INTEGER AS rank_score
      FROM public.english_cards c
      WHERE ($4 IS NULL OR 'english_card' = ANY($4))
        AND ($2 IS NULL OR c.created_at::DATE >= $2)
        AND ($3 IS NULL OR c.created_at::DATE <= $3)
        AND (
          c.front_text ILIKE $1
          OR c.back_text ILIKE $1
          OR coalesce(c.phonetic, '') ILIKE $1
          OR coalesce(c.source, '') ILIKE $1
          OR array_to_string(c.tags, ' ') ILIKE $1
        )
    $search$);
  END IF;

  IF array_length(v_sql_parts, 1) IS NULL THEN
    RETURN;
  END IF;

  v_sql := 'SELECT s.source_type, s.source_id, s.title, s.snippet, s.occurred_date, s.href, s.metadata, s.rank_score
            FROM (' || array_to_string(v_sql_parts, E'\nUNION ALL\n') || ') s
            ORDER BY s.rank_score DESC, s.occurred_date DESC NULLS LAST, s.title ASC
            LIMIT $5';

  RETURN QUERY EXECUTE v_sql
    USING v_pattern, p_date_from, p_date_to, p_source_types, v_limit, v_keyword;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_global(TEXT, TEXT[], DATE, DATE, INTEGER) TO anon, authenticated;

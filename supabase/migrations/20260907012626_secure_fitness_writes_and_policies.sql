-- Compatible API addition: deploy before the web client starts using these RPCs.
-- Caller identity always comes from the verified Supabase JWT, never an input user_id.
CREATE FUNCTION public.fitness_save_workout(
  p_session_id uuid, p_workout_date date, p_notes text, p_exercises jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  target_id uuid;
  exercise jsonb;
  next_order integer;
  total_sets integer := 0;
  set_index integer;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF p_workout_date IS NULL OR length(coalesce(p_notes, '')) > 10000
     OR jsonb_typeof(p_exercises) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid workout input' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_exercises) > 100
     OR (p_session_id IS NULL AND jsonb_array_length(p_exercises) = 0) THEN
    RAISE EXCEPTION 'Invalid exercise count' USING ERRCODE = '22023';
  END IF;
  FOR exercise IN SELECT value FROM jsonb_array_elements(p_exercises) LOOP
    IF jsonb_typeof(exercise) IS DISTINCT FROM 'object'
       OR jsonb_typeof(exercise->'exercise_type_id') IS DISTINCT FROM 'string'
       OR jsonb_typeof(exercise->'sets') IS DISTINCT FROM 'number'
       OR jsonb_typeof(exercise->'weight') IS DISTINCT FROM 'number'
       OR jsonb_typeof(exercise->'reps') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'Invalid exercise fields' USING ERRCODE = '22023';
    END IF;
    IF (exercise->>'sets')::numeric <> trunc((exercise->>'sets')::numeric)
       OR (exercise->>'sets')::numeric NOT BETWEEN 1 AND 100
       OR (exercise->>'weight')::numeric NOT BETWEEN 0 AND 9999.99
       OR (exercise->>'reps')::numeric <> trunc((exercise->>'reps')::numeric)
       OR (exercise->>'reps')::numeric NOT BETWEEN 0 AND 1000000 THEN
      RAISE EXCEPTION 'Invalid exercise values' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.exercise_types WHERE id = (exercise->>'exercise_type_id')::uuid) THEN
      RAISE EXCEPTION 'Unknown exercise' USING ERRCODE = '22023';
    END IF;
    total_sets := total_sets + (exercise->>'sets')::integer;
  END LOOP;
  IF total_sets > 1000 THEN RAISE EXCEPTION 'Too many sets' USING ERRCODE = '22023'; END IF;

  IF p_session_id IS NULL THEN
    -- Upsert serializes simultaneous first writes for the same user/date.
    INSERT INTO public.workout_sessions AS ws (user_id, workout_date, notes)
    VALUES (actor, p_workout_date, nullif(p_notes, ''))
    ON CONFLICT (user_id, workout_date) DO UPDATE SET notes =
      CASE WHEN nullif(p_notes, '') IS NULL THEN ws.notes
           WHEN nullif(ws.notes, '') IS NULL THEN p_notes
           ELSE ws.notes || E'\n' || p_notes END
    RETURNING id INTO target_id;
  ELSE
    SELECT ws.id INTO target_id FROM public.workout_sessions ws
    WHERE ws.id = p_session_id AND ws.user_id = actor FOR UPDATE;
    IF target_id IS NULL THEN
      RAISE EXCEPTION 'Workout unavailable' USING ERRCODE = '42501';
    END IF;
    UPDATE public.workout_sessions SET workout_date = p_workout_date, notes = nullif(p_notes, '')
    WHERE id = target_id AND user_id = actor;
    DELETE FROM public.workout_sets WHERE session_id = target_id;
  END IF;

  SELECT coalesce(max(set_order), 0) INTO next_order FROM public.workout_sets WHERE session_id = target_id;
  FOR exercise IN SELECT value FROM jsonb_array_elements(p_exercises) LOOP
    FOR set_index IN 1..(exercise->>'sets')::integer LOOP
      next_order := next_order + 1;
      INSERT INTO public.workout_sets (session_id, exercise_type_id, set_order, weight, reps)
      VALUES (target_id, (exercise->>'exercise_type_id')::uuid, next_order,
              (exercise->>'weight')::numeric, (exercise->>'reps')::integer);
    END LOOP;
  END LOOP;
  RETURN target_id;
END;
$$;

CREATE FUNCTION public.fitness_delete_workout(p_session_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE actor uuid := auth.uid();
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  -- The existing FK cascades set deletion in the same transaction.
  DELETE FROM public.workout_sessions WHERE id = p_session_id AND user_id = actor;
  IF NOT FOUND THEN RAISE EXCEPTION 'Workout unavailable' USING ERRCODE = '42501'; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.fitness_save_workout(uuid, date, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fitness_delete_workout(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fitness_save_workout(uuid, date, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fitness_delete_workout(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';

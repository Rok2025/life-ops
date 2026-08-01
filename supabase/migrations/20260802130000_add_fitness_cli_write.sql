-- Give each workout an owner before exposing fitness writes through the CLI.
BEGIN;

ALTER TABLE public.workout_sessions
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DO $$
DECLARE
    only_user_id UUID;
BEGIN
    SELECT id INTO only_user_id FROM auth.users LIMIT 2;
    IF (SELECT count(*) FROM auth.users) <> 1 THEN
        RAISE EXCEPTION 'Cannot backfill workout ownership unless exactly one auth user exists.';
    END IF;
    UPDATE public.workout_sessions SET user_id = only_user_id WHERE user_id IS NULL;
END;
$$;

ALTER TABLE public.workout_sessions ALTER COLUMN user_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_sessions_user_date
    ON public.workout_sessions (user_id, workout_date);

CREATE OR REPLACE FUNCTION public.cli_log_fitness_workout(
    p_user_id UUID,
    p_workout_date DATE,
    p_notes TEXT,
    p_exercises JSONB
)
RETURNS TABLE(session_id UUID, created_sets INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_session_id UUID;
    next_order INTEGER;
    exercise JSONB;
    set_index INTEGER;
    inserted_count INTEGER := 0;
BEGIN
    SELECT id INTO target_session_id
    FROM public.workout_sessions
    WHERE user_id = p_user_id AND workout_date = p_workout_date
    FOR UPDATE;

    IF target_session_id IS NULL THEN
        INSERT INTO public.workout_sessions (user_id, workout_date, notes)
        VALUES (p_user_id, p_workout_date, p_notes)
        RETURNING id INTO target_session_id;
    ELSIF p_notes IS NOT NULL AND p_notes <> '' THEN
        UPDATE public.workout_sessions
        SET notes = CASE WHEN notes IS NULL OR notes = '' THEN p_notes ELSE notes || E'\\n' || p_notes END
        WHERE id = target_session_id;
    END IF;

    SELECT COALESCE(MAX(set_order), 0) INTO next_order
    FROM public.workout_sets WHERE session_id = target_session_id;

    FOR exercise IN SELECT value FROM jsonb_array_elements(p_exercises)
    LOOP
        FOR set_index IN 1..((exercise->>'sets')::INTEGER)
        LOOP
            next_order := next_order + 1;
            INSERT INTO public.workout_sets (session_id, exercise_type_id, set_order, weight, reps)
            VALUES (target_session_id, (exercise->>'exercise_type_id')::UUID, next_order, (exercise->>'weight')::NUMERIC, (exercise->>'reps')::INTEGER);
            inserted_count := inserted_count + 1;
        END LOOP;
    END LOOP;

    RETURN QUERY SELECT target_session_id, inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cli_log_fitness_workout(UUID, DATE, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cli_log_fitness_workout(UUID, DATE, TEXT, JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cli_log_fitness_workout(UUID, DATE, TEXT, JSONB) TO service_role;

COMMIT;

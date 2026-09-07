-- Apply after the web deployment has switched to atomic, identity-scoped writes.
SET LOCAL lock_timeout = '10s';

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
      AND tablename IN ('workout_sessions','workout_sets','exercise_types'))
     OR (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='system_configs') <> 4 THEN
    RAISE EXCEPTION 'Policy inventory changed; re-audit before enabling fitness permissions';
  END IF;
END $$;

CREATE SCHEMA lifeops_private;
REVOKE ALL ON SCHEMA lifeops_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA lifeops_private TO authenticated, service_role;
CREATE TABLE lifeops_private.fitness_maintainers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE lifeops_private.fitness_maintainers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON lifeops_private.fitness_maintainers FROM PUBLIC, anon, authenticated;
GRANT SELECT ON lifeops_private.fitness_maintainers TO authenticated;
GRANT ALL ON lifeops_private.fitness_maintainers TO service_role;
CREATE POLICY maintainer_membership_read ON lifeops_private.fitness_maintainers
FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- This is a verified single-user installation. Never silently grant every future user admin.
DO $$
BEGIN
  IF (SELECT count(*) FROM auth.users) <> 1 THEN
    RAISE EXCEPTION 'Expected the verified single owner; explicitly select a maintainer before applying';
  END IF;
  INSERT INTO lifeops_private.fitness_maintainers(user_id) SELECT id FROM auth.users;
END $$;

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.workout_sessions, public.workout_sets, public.exercise_types, public.system_configs
FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions, public.workout_sets,
  public.exercise_types, public.system_configs TO authenticated;
GRANT ALL ON public.workout_sessions, public.workout_sets, public.exercise_types, public.system_configs TO service_role;

CREATE POLICY workout_sessions_owner ON public.workout_sessions FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY workout_sets_owner ON public.workout_sets FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.workout_sessions ws
              WHERE ws.id = workout_sets.session_id AND ws.user_id = (SELECT auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.workout_sessions ws
                   WHERE ws.id = workout_sets.session_id AND ws.user_id = (SELECT auth.uid())));

CREATE POLICY exercise_types_read ON public.exercise_types FOR SELECT TO authenticated USING (true);
CREATE POLICY exercise_types_maintain ON public.exercise_types FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM lifeops_private.fitness_maintainers))
WITH CHECK (EXISTS (SELECT 1 FROM lifeops_private.fitness_maintainers));

DROP POLICY "Anyone can read system_configs" ON public.system_configs;
DROP POLICY "Authenticated users can delete system_configs" ON public.system_configs;
DROP POLICY "Authenticated users can insert system_configs" ON public.system_configs;
DROP POLICY "Authenticated users can update system_configs" ON public.system_configs;
CREATE POLICY exercise_categories_read ON public.system_configs FOR SELECT TO authenticated
USING (scope = 'exercise_category');
CREATE POLICY exercise_categories_maintain ON public.system_configs FOR ALL TO authenticated
USING (scope = 'exercise_category' AND EXISTS (SELECT 1 FROM lifeops_private.fitness_maintainers))
WITH CHECK (scope = 'exercise_category' AND EXISTS (SELECT 1 FROM lifeops_private.fitness_maintainers));

-- Keep the privileged CLI RPC callable only by the server service role.
REVOKE ALL ON FUNCTION public.cli_log_fitness_workout(uuid, date, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cli_log_fitness_workout(uuid, date, text, jsonb) TO service_role;
NOTIFY pgrst, 'reload schema';

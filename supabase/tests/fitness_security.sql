-- Run only against the restored, isolated database with both fitness migrations applied.
-- psql -X -v ON_ERROR_STOP=1 -d lifeops_fitness_test -f supabase/tests/fitness_security.sql
\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'lifeops_fitness_test' THEN RAISE EXCEPTION 'Isolated test database required'; END IF;
END $$;
CREATE FUNCTION pg_temp.check(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Assertion failed: %', message; END IF; END $$;
INSERT INTO auth.users(id, email) VALUES
('10000000-0000-0000-0000-000000000001', 'fitness-a@example.invalid'),
('10000000-0000-0000-0000-000000000002', 'fitness-b@example.invalid');
INSERT INTO lifeops_private.fitness_maintainers VALUES ('10000000-0000-0000-0000-000000000001');
INSERT INTO public.exercise_types(id, name, category) VALUES
('10000000-0000-0000-0000-000000000003', '__fitness_security_fixture__', 'test');
INSERT INTO public.system_configs(id, scope, value, label) VALUES
('10000000-0000-0000-0000-000000000004', 'exercise_category', '__test__', 'Test');

-- Force a failure AFTER an edit has deleted its old sets, to verify real rollback.
CREATE FUNCTION pg_temp.fail_test_set() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN IF NEW.weight = 9999 THEN RAISE EXCEPTION 'injected set failure' USING ERRCODE = '23514'; END IF; RETURN NEW; END $$;
CREATE TRIGGER fitness_test_failure BEFORE INSERT ON public.workout_sets FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_test_set();

SET LOCAL ROLE anon;
DO $$ DECLARE tbl text; op text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['workout_sessions','workout_sets','exercise_types','system_configs'] LOOP
    FOREACH op IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE'] LOOP
      PERFORM pg_temp.check(NOT has_table_privilege(current_user, 'public.' || tbl, op), 'anon has no ' || op || ' on ' || tbl);
    END LOOP;
    BEGIN EXECUTE 'SELECT 1 FROM public.' || quote_ident(tbl) || ' LIMIT 1';
      RAISE EXCEPTION 'Anonymous query unexpectedly allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  END LOOP;
  PERFORM pg_temp.check(NOT has_function_privilege(current_user, 'public.fitness_save_workout(uuid,date,text,jsonb)', 'EXECUTE'), 'anon cannot call save RPC');
END $$;

SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN PERFORM public.fitness_save_workout(NULL, '2098-01-01', NULL, '[]');
    RAISE EXCEPTION 'Missing JWT unexpectedly accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM pg_temp.check((SELECT count(*) FROM public.workout_sessions) = 0, 'missing JWT cannot read sessions');
END $$;

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true) AS claims \gset
DO $$ DECLARE a uuid; again uuid; BEGIN
  a := public.fitness_save_workout(NULL, '2098-01-01', 'first', '[{"exercise_type_id":"10000000-0000-0000-0000-000000000003","sets":2,"weight":20,"reps":12}]');
  again := public.fitness_save_workout(NULL, '2098-01-01', 'second', '[{"exercise_type_id":"10000000-0000-0000-0000-000000000003","sets":3,"weight":25,"reps":10}]');
  PERFORM set_config('test.session_a', a::text, true);
  PERFORM pg_temp.check(a = again, 'same user/day appends to one session');
  PERFORM pg_temp.check((SELECT user_id = auth.uid() AND notes = E'first\nsecond' FROM public.workout_sessions WHERE id=a), 'trusted owner and merged notes');
  PERFORM pg_temp.check((SELECT count(*) = 5 AND count(DISTINCT set_order) = 5 FROM public.workout_sets WHERE session_id=a), 'five sequential sets');
  UPDATE public.exercise_types SET name='__fitness_admin_edit__' WHERE id='10000000-0000-0000-0000-000000000003';
  PERFORM pg_temp.check(FOUND, 'maintainer can edit actions');
  UPDATE public.system_configs SET label='Maintainer edit' WHERE id='10000000-0000-0000-0000-000000000004';
  PERFORM pg_temp.check(FOUND, 'maintainer can edit categories');
END $$;

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true) AS claims \gset
DO $$ DECLARE a uuid := current_setting('test.session_a')::uuid; b uuid; BEGIN
  b := public.fitness_save_workout(NULL, '2098-01-01', NULL, '[{"exercise_type_id":"10000000-0000-0000-0000-000000000003","sets":1,"weight":0,"reps":1}]');
  PERFORM set_config('test.session_b', b::text, true);
  PERFORM pg_temp.check(a <> b, 'different users on same date have different sessions');
  PERFORM pg_temp.check((SELECT count(*) FROM public.workout_sessions) = 1, 'B sees only own session');
  PERFORM pg_temp.check((SELECT count(*) FROM public.workout_sets) = 1, 'B sees only own sets');
  UPDATE public.workout_sessions SET notes='intrusion' WHERE id=a;
  PERFORM pg_temp.check(NOT FOUND, 'B cannot update A session');
  DELETE FROM public.workout_sessions WHERE id=a;
  PERFORM pg_temp.check(NOT FOUND, 'B cannot delete A session');
  UPDATE public.workout_sets SET weight=999 WHERE session_id=a;
  PERFORM pg_temp.check(NOT FOUND, 'B cannot update A sets');
  DELETE FROM public.workout_sets WHERE session_id=a;
  PERFORM pg_temp.check(NOT FOUND, 'B cannot delete A sets');
  BEGIN INSERT INTO public.workout_sessions(user_id,workout_date) VALUES ('10000000-0000-0000-0000-000000000001','2098-01-03');
    RAISE EXCEPTION 'Forged owner accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN UPDATE public.workout_sessions SET user_id='10000000-0000-0000-0000-000000000001' WHERE id=b;
    RAISE EXCEPTION 'Owner reassignment accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.workout_sets(session_id,set_order) VALUES(a,999);
    RAISE EXCEPTION 'Foreign session set accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN UPDATE public.workout_sets SET session_id=a WHERE session_id=b;
    RAISE EXCEPTION 'Foreign session reassignment accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.fitness_save_workout(a,'2098-01-01',NULL,'[]');
    RAISE EXCEPTION 'Cross-user edit RPC accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.fitness_delete_workout(a);
    RAISE EXCEPTION 'Cross-user delete RPC accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM pg_temp.check(NOT has_function_privilege(current_user,'public.cli_log_fitness_workout(uuid,date,text,jsonb)','EXECUTE'), 'B cannot invoke privileged CLI RPC');
  PERFORM pg_temp.check((SELECT count(*) FROM lifeops_private.fitness_maintainers)=0,'B cannot impersonate maintainer');
  BEGIN INSERT INTO lifeops_private.fitness_maintainers VALUES(auth.uid());
    RAISE EXCEPTION 'Self-promotion accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE public.exercise_types SET name='intrusion' WHERE id='10000000-0000-0000-0000-000000000003';
  PERFORM pg_temp.check(NOT FOUND, 'B cannot edit action library');
  DELETE FROM public.exercise_types WHERE id='10000000-0000-0000-0000-000000000003';
  PERFORM pg_temp.check(NOT FOUND, 'B cannot delete actions');
  BEGIN INSERT INTO public.exercise_types(name,category) VALUES('intrusion','test');
    RAISE EXCEPTION 'B created action'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE public.system_configs SET label='intrusion' WHERE id='10000000-0000-0000-0000-000000000004';
  PERFORM pg_temp.check(NOT FOUND, 'B cannot edit category');
  DELETE FROM public.system_configs WHERE id='10000000-0000-0000-0000-000000000004';
  PERFORM pg_temp.check(NOT FOUND, 'B cannot delete category');
  BEGIN INSERT INTO public.system_configs(scope,value,label) VALUES('exercise_category','intrusion','intrusion');
    RAISE EXCEPTION 'B created category'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true) AS claims \gset
DO $$ DECLARE a uuid := current_setting('test.session_a')::uuid; BEGIN
  BEGIN PERFORM public.fitness_save_workout(a,'2098-01-02','changed','[{"exercise_type_id":"10000000-0000-0000-0000-000000000003","sets":1,"weight":9999,"reps":1}]');
    RAISE EXCEPTION 'Failure injection did not fire'; EXCEPTION WHEN check_violation THEN NULL; END;
  PERFORM pg_temp.check((SELECT workout_date='2098-01-01' AND notes=E'first\nsecond' FROM public.workout_sessions WHERE id=a), 'failed edit restores date and notes');
  PERFORM pg_temp.check((SELECT count(*) FROM public.workout_sets WHERE session_id=a)=5,'failed edit restores old sets');
  BEGIN PERFORM public.fitness_save_workout(NULL,'2098-01-03',NULL,'[{"exercise_type_id":"10000000-0000-0000-0000-000000000003","sets":1,"weight":9999,"reps":1}]');
    RAISE EXCEPTION 'Failure injection did not fire'; EXCEPTION WHEN check_violation THEN NULL; END;
  PERFORM pg_temp.check(NOT EXISTS(SELECT 1 FROM public.workout_sessions WHERE workout_date='2098-01-03'),'failed create leaves no empty session');
  PERFORM public.fitness_save_workout(a,'2098-01-02','edited','[{"exercise_type_id":"10000000-0000-0000-0000-000000000003","sets":2,"weight":30,"reps":8}]');
  PERFORM pg_temp.check((SELECT count(*) FROM public.workout_sets WHERE session_id=a)=2,'successful edit replaces sets');
  PERFORM public.fitness_save_workout(a,'2098-01-02',NULL,'[]');
  PERFORM pg_temp.check(NOT EXISTS(SELECT 1 FROM public.workout_sets WHERE session_id=a),'empty edit clears sets');
  PERFORM public.fitness_save_workout(a,'2098-01-02',NULL,'[{"exercise_type_id":"10000000-0000-0000-0000-000000000003","sets":1,"weight":0,"reps":1}]');
  PERFORM public.fitness_delete_workout(a);
  PERFORM pg_temp.check(NOT EXISTS(SELECT 1 FROM public.workout_sessions WHERE id=a),'delete removes session');
  PERFORM pg_temp.check(NOT EXISTS(SELECT 1 FROM public.workout_sets WHERE session_id=a),'delete cascades all sets');
END $$;

SET LOCAL ROLE service_role;
DO $$ DECLARE result record; BEGIN
  SELECT * INTO result FROM public.cli_log_fitness_workout('10000000-0000-0000-0000-000000000002','2098-01-01','CLI compatibility',
    '[{"exercise_type_id":"10000000-0000-0000-0000-000000000003","sets":2,"weight":10,"reps":5}]');
  PERFORM pg_temp.check(result.session_id=current_setting('test.session_b')::uuid AND result.created_sets=2,'existing CLI RPC and receipt unchanged');
END $$;
ROLLBACK;
\echo Fitness ownership, permissions, atomicity and CLI compatibility: PASS (fixtures rolled back)

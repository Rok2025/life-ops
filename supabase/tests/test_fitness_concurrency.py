"""Run against the isolated restored DB; never against a Supabase production URL.

PGHOST=<private socket> PGPORT=55439 PGDATABASE=lifeops_fitness_test \
PGUSER=<local owner> PSQL=<psql binary> python3 supabase/tests/test_fitness_concurrency.py
"""
import concurrent.futures
import os
import subprocess
import threading

PSQL = os.environ.get('PSQL', 'psql')


def sql(statement):
    result = subprocess.run([PSQL, '-X', '-At', '-v', 'ON_ERROR_STOP=1'],
                            input=statement, text=True, capture_output=True, check=True)
    return result.stdout.strip()


assert sql('select current_database();') == 'lifeops_fitness_test', 'Isolated database required'
USER = '20000000-0000-0000-0000-000000000001'
EXERCISE = '20000000-0000-0000-0000-000000000003'
sql(f"""
BEGIN;
INSERT INTO auth.users(id,email) VALUES ('{USER}','fitness-concurrency@example.invalid');
INSERT INTO public.exercise_types(id,name,category) VALUES ('{EXERCISE}','__fitness_concurrency__','test');
COMMIT;
""")
barrier = threading.Barrier(2)


def write(_):
    barrier.wait(timeout=10)
    return sql(f"""
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{{"sub":"{USER}","role":"authenticated"}}',true);
SELECT public.fitness_save_workout(NULL,'2098-02-01',NULL,
  '[{{"exercise_type_id":"{EXERCISE}","sets":3,"weight":10,"reps":5}}]');
SELECT pg_sleep(0.3);
COMMIT;
""")


try:
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(write, range(2)))
    actual = sql(f"""
SELECT (SELECT count(*) FROM public.workout_sessions WHERE user_id='{USER}'),
       count(*), count(DISTINCT set_order), min(set_order), max(set_order)
FROM public.workout_sets WHERE session_id IN (SELECT id FROM public.workout_sessions WHERE user_id='{USER}');
""")
    assert actual == '1|6|6|1|6', actual
    print('Concurrent first writes: PASS (one session, six sets, no lost or duplicate ordering)')
finally:
    sql(f"BEGIN; DELETE FROM auth.users WHERE id='{USER}'; DELETE FROM public.exercise_types WHERE id='{EXERCISE}'; COMMIT;")

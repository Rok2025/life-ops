-- Merge same-day workout sessions: keep earliest session per date,
-- move all workout_sets from duplicates into the keeper, then delete duplicates.
DO $$
DECLARE
    dup_date DATE;
    keeper_id UUID;
    dup_id UUID;
    max_order INT;
    keeper_notes TEXT;
    dup_notes TEXT;
BEGIN
    FOR dup_date IN
        SELECT workout_date
        FROM workout_sessions
        GROUP BY workout_date
        HAVING count(*) > 1
    LOOP
        SELECT id, notes INTO keeper_id, keeper_notes
        FROM workout_sessions
        WHERE workout_date = dup_date
        ORDER BY created_at ASC
        LIMIT 1;

        FOR dup_id, dup_notes IN
            SELECT id, notes
            FROM workout_sessions
            WHERE workout_date = dup_date AND id != keeper_id
            ORDER BY created_at ASC
        LOOP
            SELECT COALESCE(MAX(set_order), 0) INTO max_order
            FROM workout_sets
            WHERE session_id = keeper_id;

            UPDATE workout_sets
            SET session_id = keeper_id,
                set_order = max_order + set_order
            WHERE session_id = dup_id;

            IF keeper_notes IS NULL AND dup_notes IS NOT NULL THEN
                UPDATE workout_sessions SET notes = dup_notes WHERE id = keeper_id;
                keeper_notes := dup_notes;
            END IF;

            DELETE FROM workout_sessions WHERE id = dup_id;
        END LOOP;
    END LOOP;
END $$;

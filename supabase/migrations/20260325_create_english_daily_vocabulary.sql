-- ============================================================
-- Longman daily vocabulary planning
-- Tables: english_word_bank, english_daily_assignments, english_learning_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS english_word_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL,
    pos TEXT NOT NULL,
    levels TEXT[] NOT NULL DEFAULT '{}',
    initial TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'longman_3000',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (term, pos, source)
);

CREATE INDEX IF NOT EXISTS idx_english_word_bank_initial ON english_word_bank (initial);
CREATE INDEX IF NOT EXISTS idx_english_word_bank_levels ON english_word_bank USING GIN (levels);

ALTER TABLE english_word_bank ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_word_bank' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON english_word_bank FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_word_bank' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON english_word_bank FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_word_bank' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON english_word_bank FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_word_bank' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON english_word_bank FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

ALTER TABLE english_cards
    ADD COLUMN IF NOT EXISTS word_id UUID REFERENCES english_word_bank(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_english_cards_word_id_unique ON english_cards (word_id) WHERE word_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS english_daily_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_date DATE NOT NULL,
    word_id UUID NOT NULL REFERENCES english_word_bank(id) ON DELETE CASCADE,
    queue_order INT NOT NULL DEFAULT 1,
    assignment_type TEXT NOT NULL DEFAULT 'new' CHECK (assignment_type IN ('new', 'review', 'manual')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    familiarity INT CHECK (familiarity BETWEEN 0 AND 5),
    study_note TEXT,
    example_sentence TEXT,
    reflection TEXT,
    card_id UUID REFERENCES english_cards(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_date, word_id)
);

CREATE INDEX IF NOT EXISTS idx_english_daily_assignments_date ON english_daily_assignments (assignment_date DESC, queue_order ASC);
CREATE INDEX IF NOT EXISTS idx_english_daily_assignments_status ON english_daily_assignments (status);

ALTER TABLE english_daily_assignments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_daily_assignments' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON english_daily_assignments FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_daily_assignments' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON english_daily_assignments FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_daily_assignments' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON english_daily_assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_daily_assignments' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON english_daily_assignments FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS english_learning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES english_daily_assignments(id) ON DELETE SET NULL,
    word_id UUID NOT NULL REFERENCES english_word_bank(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    action TEXT NOT NULL CHECK (action IN ('progress', 'completed', 'skipped')),
    familiarity INT CHECK (familiarity BETWEEN 0 AND 5),
    note TEXT,
    example_sentence TEXT,
    reflection TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_english_learning_logs_word ON english_learning_logs (word_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_english_learning_logs_date ON english_learning_logs (log_date DESC);

ALTER TABLE english_learning_logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_learning_logs' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON english_learning_logs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_learning_logs' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON english_learning_logs FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_learning_logs' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON english_learning_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_learning_logs' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON english_learning_logs FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

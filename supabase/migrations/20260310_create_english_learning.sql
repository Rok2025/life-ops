-- ============================================================
-- English Learning System
-- Tables: english_queries, english_cards, english_daily_summaries
-- AI-powered vocabulary & sentence lookup with spaced repetition
-- ============================================================

-- 1. 英语查询记录
CREATE TABLE IF NOT EXISTS english_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_text TEXT NOT NULL,
    input_type TEXT NOT NULL DEFAULT 'word' CHECK (input_type IN ('word', 'phrase', 'sentence')),
    prompt_mode TEXT NOT NULL DEFAULT 'concise' CHECK (prompt_mode IN ('concise', 'detailed', 'grammar')),
    custom_instruction TEXT,
    ai_response JSONB NOT NULL DEFAULT '{}',
    ai_provider TEXT,
    is_saved BOOLEAN NOT NULL DEFAULT FALSE,
    query_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_english_queries_date ON english_queries (query_date DESC);
CREATE INDEX IF NOT EXISTS idx_english_queries_input ON english_queries (input_text);
CREATE INDEX IF NOT EXISTS idx_english_queries_saved ON english_queries (is_saved) WHERE is_saved = TRUE;

ALTER TABLE english_queries ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_queries' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON english_queries FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_queries' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON english_queries FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_queries' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON english_queries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_queries' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON english_queries FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 2. 英语学习闪卡
CREATE TABLE IF NOT EXISTS english_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES english_queries(id) ON DELETE SET NULL,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    phonetic TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    source TEXT,
    review_count INT NOT NULL DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ DEFAULT NOW(),
    familiarity INT NOT NULL DEFAULT 0 CHECK (familiarity BETWEEN 0 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_english_cards_review ON english_cards (next_review_at ASC) WHERE familiarity < 5;
CREATE INDEX IF NOT EXISTS idx_english_cards_difficulty ON english_cards (difficulty);
CREATE INDEX IF NOT EXISTS idx_english_cards_familiarity ON english_cards (familiarity);
CREATE INDEX IF NOT EXISTS idx_english_cards_tags ON english_cards USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_english_cards_created ON english_cards (created_at DESC);

ALTER TABLE english_cards ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_cards' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON english_cards FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_cards' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON english_cards FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_cards' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON english_cards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_cards' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON english_cards FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 3. 每日学习总结
CREATE TABLE IF NOT EXISTS english_daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_date DATE NOT NULL UNIQUE,
    total_queries INT NOT NULL DEFAULT 0,
    total_cards INT NOT NULL DEFAULT 0,
    new_words TEXT[] NOT NULL DEFAULT '{}',
    ai_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_english_daily_summaries_date ON english_daily_summaries (summary_date);

ALTER TABLE english_daily_summaries ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_daily_summaries' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON english_daily_summaries FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_daily_summaries' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON english_daily_summaries FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_daily_summaries' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON english_daily_summaries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_daily_summaries' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON english_daily_summaries FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

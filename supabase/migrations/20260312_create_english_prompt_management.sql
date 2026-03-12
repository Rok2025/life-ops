-- English prompt management: dedicated templates and mode bindings

CREATE TABLE IF NOT EXISTS english_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    supported_modes TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT english_prompt_templates_supported_modes_check
        CHECK (
            COALESCE(array_length(supported_modes, 1), 0) >= 1
            AND supported_modes <@ ARRAY['concise', 'detailed', 'grammar']::TEXT[]
        )
);

CREATE INDEX IF NOT EXISTS idx_english_prompt_templates_active_updated
    ON english_prompt_templates (is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_english_prompt_templates_supported_modes
    ON english_prompt_templates USING GIN (supported_modes);

ALTER TABLE english_prompt_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_prompt_templates' AND policyname = 'Authenticated users can read english_prompt_templates'
    ) THEN
        CREATE POLICY "Authenticated users can read english_prompt_templates"
            ON english_prompt_templates FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_prompt_templates' AND policyname = 'Authenticated users can insert english_prompt_templates'
    ) THEN
        CREATE POLICY "Authenticated users can insert english_prompt_templates"
            ON english_prompt_templates FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_prompt_templates' AND policyname = 'Authenticated users can update english_prompt_templates'
    ) THEN
        CREATE POLICY "Authenticated users can update english_prompt_templates"
            ON english_prompt_templates FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_prompt_templates' AND policyname = 'Authenticated users can delete english_prompt_templates'
    ) THEN
        CREATE POLICY "Authenticated users can delete english_prompt_templates"
            ON english_prompt_templates FOR DELETE
            TO authenticated
            USING (true);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS english_prompt_mode_bindings (
    mode TEXT PRIMARY KEY,
    template_id UUID REFERENCES english_prompt_templates(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT english_prompt_mode_bindings_mode_check
        CHECK (mode IN ('concise', 'detailed', 'grammar'))
);

ALTER TABLE english_prompt_mode_bindings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_prompt_mode_bindings' AND policyname = 'Authenticated users can read english_prompt_mode_bindings'
    ) THEN
        CREATE POLICY "Authenticated users can read english_prompt_mode_bindings"
            ON english_prompt_mode_bindings FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_prompt_mode_bindings' AND policyname = 'Authenticated users can insert english_prompt_mode_bindings'
    ) THEN
        CREATE POLICY "Authenticated users can insert english_prompt_mode_bindings"
            ON english_prompt_mode_bindings FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'english_prompt_mode_bindings' AND policyname = 'Authenticated users can update english_prompt_mode_bindings'
    ) THEN
        CREATE POLICY "Authenticated users can update english_prompt_mode_bindings"
            ON english_prompt_mode_bindings FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

INSERT INTO english_prompt_mode_bindings (mode)
VALUES ('concise'), ('detailed'), ('grammar')
ON CONFLICT (mode) DO NOTHING;

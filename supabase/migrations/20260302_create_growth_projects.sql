-- ============================================================
-- Growth Projects System
-- Tables: growth_projects, project_todos, project_notes, outputs
-- ============================================================

-- 1. 成长项目主表
CREATE TABLE IF NOT EXISTS growth_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area TEXT NOT NULL CHECK (area IN ('ai', 'english', 'reading')),
    title TEXT NOT NULL,
    description TEXT,
    scope TEXT NOT NULL CHECK (scope IN ('annual', 'quarterly', 'monthly')),
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_projects_area_status ON growth_projects (area, status);
CREATE INDEX IF NOT EXISTS idx_growth_projects_area_scope ON growth_projects (area, scope);

ALTER TABLE growth_projects ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'growth_projects' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON growth_projects FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'growth_projects' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON growth_projects FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'growth_projects' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON growth_projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'growth_projects' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON growth_projects FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 2. 项目待办事项
CREATE TABLE IF NOT EXISTS project_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES growth_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_todos_project ON project_todos (project_id, is_completed);

ALTER TABLE project_todos ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_todos' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON project_todos FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_todos' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON project_todos FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_todos' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON project_todos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_todos' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON project_todos FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 3. 项目灵感 / 成果记录
CREATE TABLE IF NOT EXISTS project_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES growth_projects(id) ON DELETE CASCADE,
    todo_id UUID REFERENCES project_todos(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('idea', 'achievement', 'note')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_notes_project ON project_notes (project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_todo ON project_notes (todo_id);

ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_notes' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON project_notes FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_notes' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON project_notes FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_notes' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON project_notes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_notes' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON project_notes FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 4. 输出记录
CREATE TABLE IF NOT EXISTS outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES growth_projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('blog', 'tweet', 'code', 'note', 'share')),
    url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outputs_project ON outputs (project_id);
CREATE INDEX IF NOT EXISTS idx_outputs_type ON outputs (type);

ALTER TABLE outputs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'outputs' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON outputs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'outputs' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON outputs FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'outputs' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON outputs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'outputs' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON outputs FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 5. Seed system_configs for project_scope and output_type
INSERT INTO system_configs (scope, value, label, sort_order) VALUES
    ('project_scope', 'annual', '年度项目', 1),
    ('project_scope', 'quarterly', '季度项目', 2),
    ('project_scope', 'monthly', '月项目', 3),
    ('output_type', 'blog', '博客', 1),
    ('output_type', 'tweet', '推文', 2),
    ('output_type', 'code', '代码', 3),
    ('output_type', 'note', '笔记', 4),
    ('output_type', 'share', '分享', 5)
ON CONFLICT (scope, value) DO NOTHING;

-- ============================================================
-- Family Module
-- Tables: family_members, family_tasks, family_task_assignees
-- 家庭模块：共享账号模式，成员通过 name 区分，支持多人分配
-- ============================================================

-- 1. 家庭成员表
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
    avatar_color TEXT NOT NULL DEFAULT '#007AFF',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_members' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON family_members FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_members' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON family_members FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_members' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON family_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_members' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON family_members FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 初始化家庭成员
INSERT INTO family_members (name, role, avatar_color, sort_order) VALUES
    ('爸爸', 'parent', '#007AFF', 1),
    ('妈妈', 'parent', '#FF2D55', 2),
    ('又又', 'child', '#FF9500', 3)
ON CONFLICT DO NOTHING;

-- 2. 家庭任务表（无 assignee_id，改用联结表）
CREATE TABLE IF NOT EXISTS family_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    due_date DATE,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule TEXT,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES family_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_tasks_status ON family_tasks (status);
CREATE INDEX IF NOT EXISTS idx_family_tasks_due_date ON family_tasks (due_date) WHERE status != 'done';
CREATE INDEX IF NOT EXISTS idx_family_tasks_category ON family_tasks (category);

ALTER TABLE family_tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_tasks' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON family_tasks FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_tasks' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON family_tasks FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_tasks' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON family_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_tasks' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON family_tasks FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 3. 任务分配联结表（支持多人分配）
CREATE TABLE IF NOT EXISTS family_task_assignees (
    task_id UUID NOT NULL REFERENCES family_tasks(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_family_task_assignees_member ON family_task_assignees (member_id);

ALTER TABLE family_task_assignees ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_task_assignees' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON family_task_assignees FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_task_assignees' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON family_task_assignees FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'family_task_assignees' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON family_task_assignees FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 初始化家庭事务分类到 system_configs
INSERT INTO system_configs (scope, value, label, sort_order) VALUES
    ('family_task_category', 'housework', '家务', 1),
    ('family_task_category', 'childcare', '育儿', 2),
    ('family_task_category', 'shopping', '采购', 3),
    ('family_task_category', 'appointment', '预约/办事', 4),
    ('family_task_category', 'maintenance', '维护/维修', 5),
    ('family_task_category', 'other', '其他', 6)
ON CONFLICT (scope, value) DO NOTHING;

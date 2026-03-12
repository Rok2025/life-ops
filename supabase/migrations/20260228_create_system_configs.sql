-- 系统配置表：存储可管理的分类、类型等配置项
CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT NOT NULL,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引：按 scope 查询
CREATE INDEX IF NOT EXISTS idx_system_configs_scope ON system_configs (scope);

-- 唯一约束：同一 scope 下 value 不重复
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_configs_scope_value ON system_configs (scope, value);

-- 启用 RLS
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- RLS 策略：所有用户可读，已登录用户可写
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'system_configs' AND policyname = 'Anyone can read system_configs'
    ) THEN
        CREATE POLICY "Anyone can read system_configs"
            ON system_configs FOR SELECT
            TO anon, authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'system_configs' AND policyname = 'Authenticated users can insert system_configs'
    ) THEN
        CREATE POLICY "Authenticated users can insert system_configs"
            ON system_configs FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'system_configs' AND policyname = 'Authenticated users can update system_configs'
    ) THEN
        CREATE POLICY "Authenticated users can update system_configs"
            ON system_configs FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'system_configs' AND policyname = 'Authenticated users can delete system_configs'
    ) THEN
        CREATE POLICY "Authenticated users can delete system_configs"
            ON system_configs FOR DELETE
            TO authenticated
            USING (true);
    END IF;
END $$;

-- 初始化 TIL 分类数据
INSERT INTO system_configs (scope, value, label, sort_order) VALUES
    ('til_category', '技术', '技术', 1),
    ('til_category', '生活', '生活', 2),
    ('til_category', '读书', '读书', 3),
    ('til_category', '工作', '工作', 4),
    ('til_category', '其他', '其他', 5)
ON CONFLICT (scope, value) DO NOTHING;

-- 初始化健身训练部位数据
INSERT INTO system_configs (scope, value, label, sort_order) VALUES
    ('exercise_category', 'chest', '胸部', 1),
    ('exercise_category', 'back', '背部', 2),
    ('exercise_category', 'legs', '腿部', 3),
    ('exercise_category', 'shoulders', '肩部', 4),
    ('exercise_category', 'arms', '手臂', 5),
    ('exercise_category', 'core', '核心', 6),
    ('exercise_category', 'cardio', '有氧', 7)
ON CONFLICT (scope, value) DO NOTHING;

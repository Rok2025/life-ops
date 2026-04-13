-- ============================================================
-- Analytics Targets + Views
-- 目标：把分析模块里的目标值和预警阈值从前端常量抽出来
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_key TEXT NOT NULL,
    metric_key TEXT NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('day', 'week', 'rolling_30d', 'month', 'quarter')),
    target_mode TEXT NOT NULL DEFAULT 'minimum' CHECK (target_mode IN ('minimum', 'maximum')),
    target_value NUMERIC(12, 2) NOT NULL,
    warning_threshold NUMERIC(12, 2),
    label TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_targets_unique
    ON analytics_targets (area_key, metric_key, period_type);

CREATE INDEX IF NOT EXISTS idx_analytics_targets_area_period_active
    ON analytics_targets (area_key, period_type)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_analytics_targets_metric_active
    ON analytics_targets (metric_key)
    WHERE is_active = TRUE;

CREATE OR REPLACE FUNCTION update_analytics_targets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analytics_targets_updated_at ON analytics_targets;

CREATE TRIGGER trg_analytics_targets_updated_at
    BEFORE UPDATE ON analytics_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_targets_updated_at();

ALTER TABLE analytics_targets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'analytics_targets' AND policyname = 'Anyone can read analytics_targets'
    ) THEN
        CREATE POLICY "Anyone can read analytics_targets"
            ON analytics_targets FOR SELECT
            TO anon, authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'analytics_targets' AND policyname = 'Authenticated users can insert analytics_targets'
    ) THEN
        CREATE POLICY "Authenticated users can insert analytics_targets"
            ON analytics_targets FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'analytics_targets' AND policyname = 'Authenticated users can update analytics_targets'
    ) THEN
        CREATE POLICY "Authenticated users can update analytics_targets"
            ON analytics_targets FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'analytics_targets' AND policyname = 'Authenticated users can delete analytics_targets'
    ) THEN
        CREATE POLICY "Authenticated users can delete analytics_targets"
            ON analytics_targets FOR DELETE
            TO authenticated
            USING (true);
    END IF;
END $$;

INSERT INTO analytics_targets (
    area_key,
    metric_key,
    period_type,
    target_mode,
    target_value,
    warning_threshold,
    label,
    description,
    config
) VALUES
    (
        'rhythm',
        'full_frog_days',
        'week',
        'minimum',
        2,
        1,
        '完整推进天数',
        '本周至少有 2 天把三只青蛙全部完成。',
        '{"scale_to_period": true}'::jsonb
    ),
    (
        'fitness',
        'workout_days',
        'week',
        'minimum',
        3,
        2,
        '每周训练天数',
        '健身模块默认以每周 3 次训练作为健康节奏目标。',
        '{"scale_to_period": true}'::jsonb
    ),
    (
        'output',
        'published_outputs',
        'week',
        'minimum',
        1,
        0,
        '每周发布输出',
        '每周至少推进 1 条输出进入发布状态。',
        '{}'::jsonb
    ),
    (
        'output',
        'published_outputs',
        'rolling_30d',
        'minimum',
        4,
        2,
        '近 30 天发布输出',
        '近 30 天至少有 4 条输出进入发布状态。',
        '{}'::jsonb
    ),
    (
        'english',
        'daily_assignments',
        'day',
        'minimum',
        8,
        4,
        '每日英语词单',
        '英语学习默认每日词单目标为 8 个词条。',
        '{}'::jsonb
    ),
    (
        'english',
        'review_backlog',
        'day',
        'maximum',
        0,
        12,
        '英语复习积压',
        '当待复习卡片达到 12 张时触发提醒。',
        '{}'::jsonb
    ),
    (
        'todos',
        'overdue_count',
        'day',
        'maximum',
        0,
        1,
        '待办逾期数',
        '待办系统默认不希望出现任何逾期项。',
        '{}'::jsonb
    ),
    (
        'family',
        'overdue_count',
        'day',
        'maximum',
        0,
        1,
        '家庭事务逾期数',
        '家庭事务默认不希望出现任何逾期项。',
        '{}'::jsonb
    )
ON CONFLICT (area_key, metric_key, period_type) DO NOTHING;

CREATE OR REPLACE VIEW public.v_analytics_targets_active
WITH (security_invoker = on)
AS
SELECT
    id,
    area_key,
    metric_key,
    period_type,
    target_mode,
    target_value,
    warning_threshold,
    label,
    description,
    config,
    updated_at
FROM public.analytics_targets
WHERE is_active = TRUE;

CREATE OR REPLACE VIEW public.v_analytics_targets_by_area
WITH (security_invoker = on)
AS
SELECT
    area_key,
    period_type,
    jsonb_object_agg(
        metric_key,
        jsonb_build_object(
            'target_mode', target_mode,
            'target_value', target_value,
            'warning_threshold', warning_threshold,
            'label', label,
            'description', description,
            'config', config
        )
    ) AS metrics
FROM public.analytics_targets
WHERE is_active = TRUE
GROUP BY area_key, period_type;

GRANT SELECT ON public.v_analytics_targets_active TO anon, authenticated;
GRANT SELECT ON public.v_analytics_targets_by_area TO anon, authenticated;

-- ============================================================
-- 又又育儿成长模块 (Phase 1)
-- Tables: youyou_diary, youyou_milestones
-- 成长日记 + 里程碑追踪
-- ============================================================

-- 1. 成长日记表
CREATE TABLE IF NOT EXISTS youyou_diary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
    highlight TEXT,
    learned TEXT,
    funny_quote TEXT,
    diet_note TEXT,
    sleep_note TEXT,
    content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (date)
);

CREATE INDEX IF NOT EXISTS idx_youyou_diary_date ON youyou_diary (date DESC);

ALTER TABLE youyou_diary ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'youyou_diary' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON youyou_diary FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'youyou_diary' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON youyou_diary FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'youyou_diary' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON youyou_diary FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'youyou_diary' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON youyou_diary FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 2. 里程碑表
CREATE TABLE IF NOT EXISTS youyou_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('language', 'motor', 'cognitive', 'social', 'self_care', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    expected_age_months INT,
    achieved_at DATE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_youyou_milestones_category ON youyou_milestones (category);
CREATE INDEX IF NOT EXISTS idx_youyou_milestones_achieved ON youyou_milestones (achieved_at) WHERE achieved_at IS NOT NULL;

ALTER TABLE youyou_milestones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'youyou_milestones' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON youyou_milestones FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'youyou_milestones' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated" ON youyou_milestones FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'youyou_milestones' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated" ON youyou_milestones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'youyou_milestones' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated" ON youyou_milestones FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- 3. 初始化预置里程碑（常见发育里程碑）
INSERT INTO youyou_milestones (category, title, description, expected_age_months, sort_order) VALUES
    ('language', '第一次叫爸爸/妈妈', '有意识地称呼父母', 12, 1),
    ('language', '能说两个词的短句', '如"要喝"、"妈妈抱"', 24, 2),
    ('language', '能清楚表达需求', '用完整句子描述想要什么', 36, 3),
    ('language', '会讲简单的故事', '能复述绘本故事或自编故事', 48, 4),
    ('motor', '独立行走', '不需要扶持能走稳', 15, 1),
    ('motor', '能跑能跳', '可以稳定跑步和双脚跳', 24, 2),
    ('motor', '会骑三轮车/平衡车', '掌握骑行技能', 36, 3),
    ('motor', '能单脚站立5秒', '平衡能力发展', 48, 4),
    ('cognitive', '能认识基本颜色', '红黄蓝绿等基础颜色', 30, 1),
    ('cognitive', '能数到10', '理解基本数量概念', 36, 2),
    ('cognitive', '认识10个以上汉字', '能在日常中认出常见字', 48, 3),
    ('cognitive', '会写自己的名字', '能用笔写出自己的名字', 60, 4),
    ('social', '能与同龄人互动玩耍', '从平行游戏过渡到合作玩耍', 30, 1),
    ('social', '能理解轮流和分享', '在游戏中遵守社交规则', 36, 2),
    ('social', '交到第一个好朋友', '有意识地选择并维持友谊', 48, 3),
    ('self_care', '能自己用勺子吃饭', '独立进食', 18, 1),
    ('self_care', '白天不用尿布', '如厕训练完成', 30, 2),
    ('self_care', '能自己穿简单衣服', '独立穿脱简单衣物', 36, 3),
    ('self_care', '能自己刷牙', '在监督下独立完成刷牙', 36, 4)
ON CONFLICT DO NOTHING;

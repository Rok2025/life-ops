-- Prompt templates: reusable prompt snippets for coding and planning workflows
CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    use_count INT NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_favorite_updated
    ON prompt_templates (is_favorite, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_updated
    ON prompt_templates (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_title
    ON prompt_templates (title);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_tags
    ON prompt_templates USING GIN (tags);

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read prompt_templates"
    ON prompt_templates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert prompt_templates"
    ON prompt_templates FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update prompt_templates"
    ON prompt_templates FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete prompt_templates"
    ON prompt_templates FOR DELETE
    TO authenticated
    USING (true);

INSERT INTO prompt_templates (title, description, content, tags, is_favorite)
SELECT
    '需求改动实施模板',
    '用于和 AI 协作开发时，固定流程收集目标、验收标准和改动护栏。',
    E'我在项目里要做一个改动，请按下面流程完成：先读代码→输出现状分析→给出实施方案→再写代码→补测试→给 PR 描述。\n\n【目标】（1-2句）：\n【验收标准】（3-5条）：\n1)\n2)\n3)\n【入口线索】（可选，给路径/类名/路由/接口）：\n【变更护栏】（必须遵守）：\n\n* 不升级依赖 / 不改构建配置\n* 不重构公共组件/全局样式（除非我明确允许）\n* 改动限制在：_______（写目录白名单即可）\n【输出要求】先给方案和文件清单，我确认后再开始改代码。',
    ARRAY['开发协作', '需求模板', 'PRD'],
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_templates WHERE title = '需求改动实施模板'
);

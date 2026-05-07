-- 命令中心：分类和命令模板
CREATE TABLE IF NOT EXISTS command_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS command_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES command_categories(id) ON DELETE RESTRICT,
    command_text TEXT NOT NULL,
    summary TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    sort_order INT NOT NULL DEFAULT 0,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    copy_count INT NOT NULL DEFAULT 0 CHECK (copy_count >= 0),
    last_copied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_command_categories_slug
    ON command_categories (slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_command_categories_single_default
    ON command_categories (is_default)
    WHERE is_default;

CREATE INDEX IF NOT EXISTS idx_command_categories_active_sort
    ON command_categories (is_active, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS idx_command_templates_category_command
    ON command_templates (category_id, command_text);

CREATE INDEX IF NOT EXISTS idx_command_templates_category_sort
    ON command_templates (category_id, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_command_templates_favorite_sort
    ON command_templates (is_favorite, is_active, sort_order);

CREATE OR REPLACE FUNCTION command_center_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_command_categories_updated_at ON command_categories;
CREATE TRIGGER trg_command_categories_updated_at
    BEFORE UPDATE ON command_categories
    FOR EACH ROW
    EXECUTE FUNCTION command_center_set_updated_at();

DROP TRIGGER IF EXISTS trg_command_templates_updated_at ON command_templates;
CREATE TRIGGER trg_command_templates_updated_at
    BEFORE UPDATE ON command_templates
    FOR EACH ROW
    EXECUTE FUNCTION command_center_set_updated_at();

ALTER TABLE command_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'command_categories' AND policyname = 'Anyone can read command_categories'
    ) THEN
        CREATE POLICY "Anyone can read command_categories"
            ON command_categories FOR SELECT
            TO anon, authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'command_categories' AND policyname = 'Authenticated users can insert command_categories'
    ) THEN
        CREATE POLICY "Authenticated users can insert command_categories"
            ON command_categories FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'command_categories' AND policyname = 'Authenticated users can update command_categories'
    ) THEN
        CREATE POLICY "Authenticated users can update command_categories"
            ON command_categories FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'command_categories' AND policyname = 'Authenticated users can delete command_categories'
    ) THEN
        CREATE POLICY "Authenticated users can delete command_categories"
            ON command_categories FOR DELETE
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'command_templates' AND policyname = 'Anyone can read command_templates'
    ) THEN
        CREATE POLICY "Anyone can read command_templates"
            ON command_templates FOR SELECT
            TO anon, authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'command_templates' AND policyname = 'Authenticated users can insert command_templates'
    ) THEN
        CREATE POLICY "Authenticated users can insert command_templates"
            ON command_templates FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'command_templates' AND policyname = 'Authenticated users can update command_templates'
    ) THEN
        CREATE POLICY "Authenticated users can update command_templates"
            ON command_templates FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'command_templates' AND policyname = 'Authenticated users can delete command_templates'
    ) THEN
        CREATE POLICY "Authenticated users can delete command_templates"
            ON command_templates FOR DELETE
            TO authenticated
            USING (true);
    END IF;
END $$;

INSERT INTO command_categories (name, slug, description, sort_order, is_default) VALUES
    ('高频启用', 'high-frequency', '每天最常用的启动、跳转和状态命令', 1, TRUE),
    ('项目启动', 'project-start', '启动、重启和查看本地项目服务', 2, FALSE),
    ('目录跳转', 'directory', '进入常用项目目录', 3, FALSE),
    ('Rok CLI', 'rok-cli', 'rok-cli 常用上下文和项目命令', 4, FALSE),
    ('Git / 发布', 'git-publish', '提交、推送、构建和发布前的常用命令', 5, FALSE),
    ('数据库 / Supabase', 'database', 'Supabase 和数据库维护命令', 6, FALSE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO command_templates (category_id, command_text, summary, tags, sort_order, is_favorite)
SELECT c.id, v.command_text, v.summary, v.tags, v.sort_order, v.is_favorite
FROM (
    VALUES
        ('high-frequency', 'audit', '启动河北大学前端', ARRAY['front-end', 'smart-platform'], 1, TRUE),
        ('high-frequency', 'life', '启动 Life OPS 本项目', ARRAY['life-ops', 'dev'], 2, TRUE),
        ('high-frequency', 'smartui', '进入 smart-platform 前端目录', ARRAY['directory', 'smart-platform'], 3, TRUE),
        ('high-frequency', 'smart', '进入 smart-platform 项目根目录', ARRAY['directory', 'smart-platform'], 4, TRUE),
        ('high-frequency', 'cst', '启动测试化验相关前端', ARRAY['front-end', 'smart-platform'], 5, TRUE),
        ('high-frequency', 'openclaw', '进入 openclaw 并启动本地命令', ARRAY['openclaw', 'dev'], 6, TRUE),
        ('high-frequency', 'rok ctx show', '查看当前 rok 本地上下文', ARRAY['rok', 'context'], 7, TRUE),
        ('high-frequency', 'rok project status', '查看 rok 管理的本地服务状态', ARRAY['rok', 'status'], 8, TRUE),

        ('project-start', 'cd /Users/freeman/Documents/00-Project/life-ops && pnpm run dev', '启动 Life OPS 前端开发服务', ARRAY['life-ops', 'nextjs'], 1, FALSE),
        ('project-start', 'cd /Users/freeman/Documents/00-Project/life-ops && pnpm run build', '构建 Life OPS 前端', ARRAY['life-ops', 'build'], 2, FALSE),
        ('project-start', 'scripts/dev/platform.sh status', '查看本地平台服务状态', ARRAY['platform', 'status'], 3, FALSE),
        ('project-start', 'scripts/dev/platform.sh restart', '重启本地平台服务', ARRAY['platform', 'restart'], 4, FALSE),
        ('project-start', 'scripts/dev/platform.sh start backend', '启动本地后端服务', ARRAY['platform', 'backend'], 5, FALSE),
        ('project-start', 'scripts/dev/platform.sh start frontend', '启动本地前端服务', ARRAY['platform', 'frontend'], 6, FALSE),
        ('project-start', 'rok project start <name>', '启动 rok 项目服务', ARRAY['rok', 'project'], 7, FALSE),
        ('project-start', 'rok project restart <name>', '重启 rok 项目服务', ARRAY['rok', 'project'], 8, FALSE),
        ('project-start', 'rok project logs <name>', '查看 rok 项目服务日志', ARRAY['rok', 'logs'], 9, FALSE),

        ('directory', 'cd /Users/freeman/Documents/00-Project/life-ops', '进入 Life OPS 项目根目录', ARRAY['directory', 'life-ops'], 1, FALSE),
        ('directory', 'cd /Users/freeman/Documents/00-Project/life-ops/apps/web', '进入 Life OPS 前端目录', ARRAY['directory', 'life-ops'], 2, FALSE),
        ('directory', 'cd /Users/freeman/Documents/00-Project/smart-platform', '进入 smart-platform 项目根目录', ARRAY['directory', 'smart-platform'], 3, FALSE),
        ('directory', 'cd /Users/freeman/Documents/00-Project/smart-platform/zkjsplat-ui', '进入 smart-platform 前端集合目录', ARRAY['directory', 'smart-platform'], 4, FALSE),
        ('directory', 'cd /Users/freeman/Documents/00-Project/smart-platform/zkjsplat-ui/smart-platform-ui', '进入河北大学前端目录', ARRAY['directory', 'audit'], 5, FALSE),
        ('directory', 'cd /Users/freeman/Documents/00-Project/openclaw', '进入 openclaw 项目目录', ARRAY['directory', 'openclaw'], 6, FALSE),

        ('rok-cli', 'rok --help', '查看 rok-cli 命令总览', ARRAY['rok', 'help'], 1, FALSE),
        ('rok-cli', 'rok ctx export', '导出当前上下文为 shell 环境变量', ARRAY['rok', 'context'], 2, FALSE),
        ('rok-cli', 'rok ctx sync', '从配置、环境和浏览器同步上下文', ARRAY['rok', 'context'], 3, FALSE),
        ('rok-cli', 'rok ctx tenant', '查看或设置当前 tenant', ARRAY['rok', 'context'], 4, FALSE),
        ('rok-cli', 'rok ctx programme', '查看或设置当前 programme', ARRAY['rok', 'context'], 5, FALSE),
        ('rok-cli', 'rok ctx token', '查看或设置当前 token', ARRAY['rok', 'context'], 6, FALSE),
        ('rok-cli', 'rok ctx env', '查看或设置当前环境', ARRAY['rok', 'context'], 7, FALSE),
        ('rok-cli', 'rok project ports', '查看 rok 项目服务端口', ARRAY['rok', 'project'], 8, FALSE),
        ('rok-cli', 'rok project doctor', '检查本地项目配置', ARRAY['rok', 'project'], 9, FALSE),
        ('rok-cli', 'rok project health <name>', '检查指定服务健康状态', ARRAY['rok', 'project'], 10, FALSE),
        ('rok-cli', 'rok ui evaluate <file>', '评估指定 UI 文件', ARRAY['rok', 'ui'], 11, FALSE),

        ('git-publish', 'git status --short', '查看当前工作区变更', ARRAY['git', 'status'], 1, FALSE),
        ('git-publish', 'git fetch', '同步远端分支信息', ARRAY['git', 'remote'], 2, FALSE),
        ('git-publish', 'git switch -c codex/<name>', '创建并切换到 codex 功能分支', ARRAY['git', 'branch'], 3, FALSE),
        ('git-publish', 'git add -A', '暂存全部变更', ARRAY['git', 'commit'], 4, FALSE),
        ('git-publish', 'git commit -m "<message>"', '提交当前暂存变更', ARRAY['git', 'commit'], 5, FALSE),
        ('git-publish', 'git push origin HEAD', '推送当前分支到远端', ARRAY['git', 'push'], 6, FALSE),
        ('git-publish', 'pnpm run build', '执行当前包构建检查', ARRAY['build', 'pnpm'], 7, FALSE),

        ('database', 'supabase migration new <name>', '创建新的 Supabase migration', ARRAY['supabase', 'migration'], 1, FALSE),
        ('database', 'supabase db push', '推送本地 migration 到远端数据库', ARRAY['supabase', 'database'], 2, FALSE),
        ('database', 'supabase migration list', '查看 Supabase migration 状态', ARRAY['supabase', 'migration'], 3, FALSE),
        ('database', 'supabase db --help', '查看 Supabase 数据库命令帮助', ARRAY['supabase', 'help'], 4, FALSE),
        ('database', 'source apps/web/.env.local && psql "$LIFE_OPS_DB_URL"', '使用 Life OPS 数据库连接串进入 psql', ARRAY['postgres', 'psql'], 5, FALSE)
) AS v(category_slug, command_text, summary, tags, sort_order, is_favorite)
JOIN command_categories c ON c.slug = v.category_slug
ON CONFLICT (category_id, command_text) DO NOTHING;

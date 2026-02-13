-- 随手记表：支持备忘(memo)、灵感(idea)、问答(question) 三种类型
CREATE TABLE IF NOT EXISTS quick_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('memo', 'idea', 'question')),
    content TEXT NOT NULL,
    answer TEXT,
    is_answered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 按日期查询索引
CREATE INDEX IF NOT EXISTS idx_quick_notes_date ON quick_notes(note_date DESC);

-- 按类型查询索引
CREATE INDEX IF NOT EXISTS idx_quick_notes_type ON quick_notes(type);

-- RLS 策略（如需要）
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON quick_notes
    FOR ALL USING (true) WITH CHECK (true);

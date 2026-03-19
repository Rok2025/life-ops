-- 修复 type CHECK 约束：question → todo（代码已改用 todo，原 migration 用的 question）
ALTER TABLE quick_notes DROP CONSTRAINT IF EXISTS quick_notes_type_check;
ALTER TABLE quick_notes ADD CONSTRAINT quick_notes_type_check CHECK (type IN ('memo', 'idea', 'todo'));
UPDATE quick_notes SET type = 'todo' WHERE type = 'question';

-- 为待办类型添加 完成状态 和 优先级 字段
ALTER TABLE quick_notes
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('normal', 'important', 'urgent', 'critical'));

-- 未完成待办查询索引
CREATE INDEX IF NOT EXISTS idx_quick_notes_todo_status
  ON quick_notes(type, is_completed)
  WHERE type = 'todo';

-- 为 quick_notes 中的待办补充执行日期和完成时间
ALTER TABLE quick_notes
  ADD COLUMN IF NOT EXISTS execute_date DATE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 已完成待办补齐完成时间，避免历史数据丢失完成痕迹
UPDATE quick_notes
SET completed_at = COALESCE(completed_at, updated_at, created_at)
WHERE type = 'todo'
  AND is_completed = TRUE
  AND completed_at IS NULL;

-- 待办执行日期索引，便于排序和筛选
CREATE INDEX IF NOT EXISTS idx_quick_notes_todo_execute_date
  ON quick_notes(type, execute_date)
  WHERE type = 'todo';

-- 已完成待办完成时间索引
CREATE INDEX IF NOT EXISTS idx_quick_notes_todo_completed_at
  ON quick_notes(type, completed_at DESC)
  WHERE type = 'todo' AND is_completed = TRUE;

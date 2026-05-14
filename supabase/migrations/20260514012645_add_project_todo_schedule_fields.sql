ALTER TABLE public.project_todos
  ADD COLUMN IF NOT EXISTS execute_date DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal', 'important', 'urgent', 'critical'));

CREATE INDEX IF NOT EXISTS idx_project_todos_execute_date
  ON public.project_todos (execute_date)
  WHERE execute_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_todos_priority
  ON public.project_todos (priority)
  WHERE is_completed = FALSE;

-- Harness runtime foundation draft:
-- session / message / run / approval / tool-call persistence
--
-- NOTE:
-- This file is intentionally kept under `harness/sql/` during the incubation phase
-- so the harness runtime can evolve independently before being promoted into
-- `supabase/migrations/`.

CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'archived', 'error')),
    mode TEXT NOT NULL DEFAULT 'assistant',
    latest_summary TEXT,
    context_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_status_updated
    ON agent_sessions (status, updated_at DESC);

ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'agent_sessions' AND policyname = 'Authenticated users can read agent_sessions'
    ) THEN
        CREATE POLICY "Authenticated users can read agent_sessions"
            ON agent_sessions FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'agent_sessions' AND policyname = 'Authenticated users can insert agent_sessions'
    ) THEN
        CREATE POLICY "Authenticated users can insert agent_sessions"
            ON agent_sessions FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'agent_sessions' AND policyname = 'Authenticated users can update agent_sessions'
    ) THEN
        CREATE POLICY "Authenticated users can update agent_sessions"
            ON agent_sessions FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL
        CHECK (role IN ('system', 'user', 'assistant', 'tool')),
    content TEXT NOT NULL DEFAULT '',
    structured_content JSONB NOT NULL DEFAULT '{}'::JSONB,
    tool_name TEXT,
    tool_call_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_session_created
    ON agent_messages (session_id, created_at ASC);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'agent_messages' AND policyname = 'Authenticated users can read agent_messages'
    ) THEN
        CREATE POLICY "Authenticated users can read agent_messages"
            ON agent_messages FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'agent_messages' AND policyname = 'Authenticated users can insert agent_messages'
    ) THEN
        CREATE POLICY "Authenticated users can insert agent_messages"
            ON agent_messages FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    trigger TEXT NOT NULL DEFAULT 'user'
        CHECK (trigger IN ('user', 'automation', 'retry')),
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled')),
    model TEXT,
    user_message_id UUID REFERENCES agent_messages(id) ON DELETE SET NULL,
    result_summary TEXT,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_session_started
    ON agent_runs (session_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_runs_status_started
    ON agent_runs (status, started_at DESC);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'agent_runs' AND policyname = 'Authenticated users can read agent_runs'
    ) THEN
        CREATE POLICY "Authenticated users can read agent_runs"
            ON agent_runs FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'agent_runs' AND policyname = 'Authenticated users can insert agent_runs'
    ) THEN
        CREATE POLICY "Authenticated users can insert agent_runs"
            ON agent_runs FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'agent_runs' AND policyname = 'Authenticated users can update agent_runs'
    ) THEN
        CREATE POLICY "Authenticated users can update agent_runs"
            ON agent_runs FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    risk_level TEXT NOT NULL DEFAULT 'medium'
        CHECK (risk_level IN ('low', 'medium', 'high')),
    reason TEXT,
    proposed_input JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_session_created
    ON approval_requests (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status_created
    ON approval_requests (status, created_at DESC);

ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'approval_requests' AND policyname = 'Authenticated users can read approval_requests'
    ) THEN
        CREATE POLICY "Authenticated users can read approval_requests"
            ON approval_requests FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'approval_requests' AND policyname = 'Authenticated users can insert approval_requests'
    ) THEN
        CREATE POLICY "Authenticated users can insert approval_requests"
            ON approval_requests FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'approval_requests' AND policyname = 'Authenticated users can update approval_requests'
    ) THEN
        CREATE POLICY "Authenticated users can update approval_requests"
            ON approval_requests FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS tool_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
    tool_name TEXT NOT NULL,
    call_kind TEXT NOT NULL DEFAULT 'read'
        CHECK (call_kind IN ('read', 'write', 'destructive', 'external')),
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'running', 'completed', 'failed', 'rejected')),
    input JSONB NOT NULL DEFAULT '{}'::JSONB,
    output JSONB NOT NULL DEFAULT '{}'::JSONB,
    error_message TEXT,
    approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tool_call_logs_session_created
    ON tool_call_logs (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_call_logs_run_created
    ON tool_call_logs (run_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_tool_call_logs_tool_created
    ON tool_call_logs (tool_name, created_at DESC);

ALTER TABLE tool_call_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'tool_call_logs' AND policyname = 'Authenticated users can read tool_call_logs'
    ) THEN
        CREATE POLICY "Authenticated users can read tool_call_logs"
            ON tool_call_logs FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'tool_call_logs' AND policyname = 'Authenticated users can insert tool_call_logs'
    ) THEN
        CREATE POLICY "Authenticated users can insert tool_call_logs"
            ON tool_call_logs FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'tool_call_logs' AND policyname = 'Authenticated users can update tool_call_logs'
    ) THEN
        CREATE POLICY "Authenticated users can update tool_call_logs"
            ON tool_call_logs FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

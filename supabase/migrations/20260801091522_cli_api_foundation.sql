-- Life OPS public CLI API foundation. These tables are only accessed by
-- Vercel Route Handlers using the server-only Supabase secret key.

CREATE TABLE IF NOT EXISTS public.cli_device_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code_hash TEXT NOT NULL UNIQUE,
    user_code TEXT NOT NULL UNIQUE,
    device_name TEXT NOT NULL,
    requested_scopes TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'denied', 'consumed', 'expired')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cli_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_authorization_id UUID REFERENCES public.cli_device_authorizations(id) ON DELETE SET NULL,
    token_prefix TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    device_name TEXT NOT NULL,
    scopes TEXT[] NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cli_idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'completed', 'failed')),
    response_json JSONB,
    error_message TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.cli_api_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_id UUID REFERENCES public.cli_access_tokens(id) ON DELETE SET NULL,
    tool_name TEXT NOT NULL,
    idempotency_key TEXT,
    status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'replayed')),
    request_summary JSONB NOT NULL DEFAULT '{}'::JSONB,
    result_summary JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cli_access_tokens_user_active
    ON public.cli_access_tokens (user_id, expires_at DESC)
    WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cli_device_authorizations_user
    ON public.cli_device_authorizations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cli_audit_logs_user_created
    ON public.cli_api_audit_logs (user_id, created_at DESC);

ALTER TABLE public.cli_device_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cli_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cli_idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cli_api_audit_logs ENABLE ROW LEVEL SECURITY;

-- Browser users only need to see their own device and token metadata. The
-- actual Route Handler writes run with the service role and do not rely on RLS.
CREATE POLICY "cli_device_authorizations_select_own"
    ON public.cli_device_authorizations FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "cli_access_tokens_select_own"
    ON public.cli_access_tokens FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "cli_api_audit_logs_select_own"
    ON public.cli_api_audit_logs FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Claiming an idempotency key must be atomic: two concurrent CLI retries can
-- never both write a finance transaction. It is callable by service_role only.
CREATE OR REPLACE FUNCTION public.cli_claim_idempotency_key(
    p_user_id UUID,
    p_idempotency_key TEXT,
    p_request_hash TEXT
)
RETURNS TABLE(status TEXT, response_json JSONB, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    existing_key public.cli_idempotency_keys%ROWTYPE;
BEGIN
    INSERT INTO public.cli_idempotency_keys (user_id, idempotency_key, request_hash)
    VALUES (p_user_id, p_idempotency_key, p_request_hash)
    ON CONFLICT (user_id, idempotency_key) DO NOTHING;

    IF FOUND THEN
        RETURN QUERY SELECT 'claimed'::TEXT, NULL::JSONB, NULL::TEXT;
        RETURN;
    END IF;

    SELECT * INTO existing_key
    FROM public.cli_idempotency_keys
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;

    IF existing_key.request_hash <> p_request_hash THEN
        RAISE EXCEPTION 'Idempotency key was already used with a different request';
    END IF;

    RETURN QUERY SELECT existing_key.status, existing_key.response_json, existing_key.error_message;
END;
$$;

REVOKE ALL ON FUNCTION public.cli_claim_idempotency_key(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cli_claim_idempotency_key(UUID, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cli_claim_idempotency_key(UUID, TEXT, TEXT) TO service_role;

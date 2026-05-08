-- ============================================================
-- Finance Module
-- Personal finance ledger for debt follow-up, spending records,
-- budgets, and monthly snapshots.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.finance_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_income NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (monthly_income >= 0),
    living_budget NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (living_budget >= 0),
    target_repayment_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (target_repayment_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'CNY',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    institution TEXT,
    account_type TEXT NOT NULL CHECK (account_type IN ('credit_card', 'loan', 'investment', 'cash', 'other')),
    credit_limit NUMERIC(14, 2) CHECK (credit_limit IS NULL OR credit_limit >= 0),
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
    statement_day SMALLINT CHECK (statement_day IS NULL OR statement_day BETWEEN 1 AND 31),
    payment_day SMALLINT CHECK (payment_day IS NULL OR payment_day BETWEEN 1 AND 31),
    payment_day_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (payment_day_status IN ('confirmed', 'inferred', 'unknown')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.finance_accounts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    liability_type TEXT NOT NULL CHECK (liability_type IN ('credit_card', 'personal_loan', 'mortgage', 'family_debt', 'other')),
    original_amount NUMERIC(14, 2) CHECK (original_amount IS NULL OR original_amount >= 0),
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
    monthly_payment NUMERIC(14, 2) CHECK (monthly_payment IS NULL OR monthly_payment >= 0),
    annual_rate NUMERIC(8, 4) CHECK (annual_rate IS NULL OR annual_rate >= 0),
    due_day SMALLINT CHECK (due_day IS NULL OR due_day BETWEEN 1 AND 31),
    maturity_date DATE,
    priority SMALLINT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'paused')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_credit_card_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
    bill_month DATE NOT NULL,
    statement_date DATE,
    due_date DATE NOT NULL,
    billed_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (billed_amount >= 0),
    unbilled_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (unbilled_amount >= 0),
    minimum_payment NUMERIC(14, 2) CHECK (minimum_payment IS NULL OR minimum_payment >= 0),
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'scheduled', 'paid', 'risk')),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_payment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credit_card_bill_id UUID REFERENCES public.finance_credit_card_bills(id) ON DELETE CASCADE,
    liability_id UUID REFERENCES public.finance_liabilities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('credit_card', 'loan', 'mortgage', 'family_debt', 'other')),
    due_date DATE NOT NULL,
    amount_due NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (amount_due >= 0),
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('unconfirmed', 'pending', 'scheduled', 'paid', 'risk')),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (credit_card_bill_id IS NOT NULL OR liability_id IS NOT NULL OR schedule_type = 'other')
);

CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.finance_accounts(id) ON DELETE SET NULL,
    occurred_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('expense', 'income', 'repayment', 'transfer')),
    category TEXT NOT NULL DEFAULT 'other',
    merchant TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_month DATE NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_monthly_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_month DATE NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_assets NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_liabilities NUMERIC(14, 2) NOT NULL DEFAULT 0,
    credit_card_debt NUMERIC(14, 2) NOT NULL DEFAULT 0,
    net_worth NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monthly_income NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monthly_expense NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monthly_repayment NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_accounts_user_name
    ON public.finance_accounts (user_id, name);

CREATE INDEX IF NOT EXISTS idx_finance_accounts_user_type
    ON public.finance_accounts (user_id, account_type, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_finance_liabilities_user_status
    ON public.finance_liabilities (user_id, status, priority);

CREATE INDEX IF NOT EXISTS idx_finance_credit_card_bills_user_due
    ON public.finance_credit_card_bills (user_id, due_date, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_credit_card_bills_unique_month
    ON public.finance_credit_card_bills (user_id, account_id, bill_month);

CREATE INDEX IF NOT EXISTS idx_finance_payment_schedules_user_due
    ON public.finance_payment_schedules (user_id, due_date, status);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_date
    ON public.finance_transactions (user_id, occurred_date DESC);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_category
    ON public.finance_transactions (user_id, category, occurred_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_budgets_user_month_category
    ON public.finance_budgets (user_id, budget_month, category);

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_monthly_snapshots_user_month
    ON public.finance_monthly_snapshots (user_id, snapshot_month);

CREATE OR REPLACE FUNCTION public.finance_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_finance_profiles_updated_at ON public.finance_profiles;
CREATE TRIGGER trg_finance_profiles_updated_at
    BEFORE UPDATE ON public.finance_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_updated_at();

DROP TRIGGER IF EXISTS trg_finance_accounts_updated_at ON public.finance_accounts;
CREATE TRIGGER trg_finance_accounts_updated_at
    BEFORE UPDATE ON public.finance_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_updated_at();

DROP TRIGGER IF EXISTS trg_finance_liabilities_updated_at ON public.finance_liabilities;
CREATE TRIGGER trg_finance_liabilities_updated_at
    BEFORE UPDATE ON public.finance_liabilities
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_updated_at();

DROP TRIGGER IF EXISTS trg_finance_credit_card_bills_updated_at ON public.finance_credit_card_bills;
CREATE TRIGGER trg_finance_credit_card_bills_updated_at
    BEFORE UPDATE ON public.finance_credit_card_bills
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_updated_at();

DROP TRIGGER IF EXISTS trg_finance_payment_schedules_updated_at ON public.finance_payment_schedules;
CREATE TRIGGER trg_finance_payment_schedules_updated_at
    BEFORE UPDATE ON public.finance_payment_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_updated_at();

DROP TRIGGER IF EXISTS trg_finance_transactions_updated_at ON public.finance_transactions;
CREATE TRIGGER trg_finance_transactions_updated_at
    BEFORE UPDATE ON public.finance_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_updated_at();

DROP TRIGGER IF EXISTS trg_finance_budgets_updated_at ON public.finance_budgets;
CREATE TRIGGER trg_finance_budgets_updated_at
    BEFORE UPDATE ON public.finance_budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_updated_at();

DROP TRIGGER IF EXISTS trg_finance_monthly_snapshots_updated_at ON public.finance_monthly_snapshots;
CREATE TRIGGER trg_finance_monthly_snapshots_updated_at
    BEFORE UPDATE ON public.finance_monthly_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_updated_at();

ALTER TABLE public.finance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_credit_card_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_monthly_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_profiles_select_own" ON public.finance_profiles;
CREATE POLICY "finance_profiles_select_own"
    ON public.finance_profiles FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "finance_profiles_insert_own" ON public.finance_profiles;
CREATE POLICY "finance_profiles_insert_own"
    ON public.finance_profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "finance_profiles_update_own" ON public.finance_profiles;
CREATE POLICY "finance_profiles_update_own"
    ON public.finance_profiles FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "finance_profiles_delete_own" ON public.finance_profiles;
CREATE POLICY "finance_profiles_delete_own"
    ON public.finance_profiles FOR DELETE
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "finance_accounts_all_own" ON public.finance_accounts;
CREATE POLICY "finance_accounts_all_own"
    ON public.finance_accounts FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "finance_liabilities_all_own" ON public.finance_liabilities;
CREATE POLICY "finance_liabilities_all_own"
    ON public.finance_liabilities FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "finance_credit_card_bills_all_own" ON public.finance_credit_card_bills;
CREATE POLICY "finance_credit_card_bills_all_own"
    ON public.finance_credit_card_bills FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "finance_payment_schedules_all_own" ON public.finance_payment_schedules;
CREATE POLICY "finance_payment_schedules_all_own"
    ON public.finance_payment_schedules FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "finance_transactions_all_own" ON public.finance_transactions;
CREATE POLICY "finance_transactions_all_own"
    ON public.finance_transactions FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "finance_budgets_all_own" ON public.finance_budgets;
CREATE POLICY "finance_budgets_all_own"
    ON public.finance_budgets FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "finance_monthly_snapshots_all_own" ON public.finance_monthly_snapshots;
CREATE POLICY "finance_monthly_snapshots_all_own"
    ON public.finance_monthly_snapshots FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

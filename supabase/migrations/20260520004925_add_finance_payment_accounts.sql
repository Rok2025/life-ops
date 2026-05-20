-- Add common payment accounts for existing finance users.
-- New users also receive these accounts from bootstrapInitialData().
WITH finance_users AS (
    SELECT DISTINCT user_id
    FROM public.finance_accounts
),
account_seed AS (
    SELECT *
    FROM (
        VALUES
            ('微信', '微信支付', 'cash', 0::NUMERIC(14, 2), 5, '用于记录微信支付支出。'),
            ('支付宝', '支付宝', 'cash', 0::NUMERIC(14, 2), 6, '用于记录支付宝支出。')
    ) AS seed(name, institution, account_type, current_balance, sort_order, notes)
)
INSERT INTO public.finance_accounts (
    user_id,
    name,
    institution,
    account_type,
    current_balance,
    payment_day_status,
    is_active,
    sort_order,
    notes
)
SELECT
    finance_users.user_id,
    account_seed.name,
    account_seed.institution,
    account_seed.account_type,
    account_seed.current_balance,
    'confirmed',
    TRUE,
    account_seed.sort_order,
    account_seed.notes
FROM finance_users
CROSS JOIN account_seed
ON CONFLICT (user_id, name) DO NOTHING;

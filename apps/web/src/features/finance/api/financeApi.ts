import { supabase } from '@/lib/supabase';
import type {
    CreateFinanceTransactionInput,
    FinanceAccount,
    FinanceBudget,
    FinanceCreditCardBill,
    FinanceDashboard,
    FinanceDashboardMetrics,
    FinanceLiability,
    FinanceMonthlySnapshot,
    FinancePaymentSchedule,
    FinanceProfile,
    PaymentScheduleStatus,
    SnapshotInput,
    UpdateFinanceAccountInput,
    UpdateFinanceLiabilityInput,
    UpdateFinanceProfileInput,
} from '../types';
import { addDaysISO, getMonthEndISO, getMonthStartISO, getTodayISO, toNumber } from '../lib/financeFormat';

type SupabaseErrorLike = {
    message: string;
};

function throwIfError(error: SupabaseErrorLike | null): void {
    if (error) throw error;
}

function sumBy<T>(rows: T[], getValue: (row: T) => number | string | null | undefined): number {
    return rows.reduce((total, row) => total + toNumber(getValue(row)), 0);
}

function calculateMetrics(input: {
    profile: FinanceProfile | null;
    accounts: FinanceAccount[];
    liabilities: FinanceLiability[];
    paymentSchedules: FinancePaymentSchedule[];
    transactions: FinanceTransactionSubset[];
}): FinanceDashboardMetrics {
    const activeAccounts = input.accounts.filter((account) => account.is_active);
    const activeLiabilities = input.liabilities.filter((liability) => liability.status === 'active');
    const creditCards = activeAccounts.filter((account) => account.account_type === 'credit_card');
    const assets = activeAccounts.filter((account) => account.account_type === 'cash' || account.account_type === 'investment');

    const longTermDebt = sumBy(activeLiabilities, (liability) => liability.current_balance);
    const creditCardDebt = sumBy(creditCards, (account) => account.current_balance);
    const totalAssets = sumBy(assets, (account) => account.current_balance);
    const fixedMonthlyPayment = sumBy(activeLiabilities, (liability) => liability.monthly_payment);
    const monthlyIncome = toNumber(input.profile?.monthly_income);
    const livingBudget = toNumber(input.profile?.living_budget);
    const repaymentCapacity = Math.max(monthlyIncome - fixedMonthlyPayment - livingBudget, 0);

    const currentMonthExpense = sumBy(
        input.transactions.filter((transaction) => transaction.transaction_type === 'expense'),
        (transaction) => transaction.amount,
    );
    const currentMonthRepayment = sumBy(
        input.transactions.filter((transaction) => transaction.transaction_type === 'repayment'),
        (transaction) => transaction.amount,
    );

    const today = getTodayISO();
    const inThirtyDays = addDaysISO(today, 30);
    const openSchedules = input.paymentSchedules.filter((schedule) => schedule.status !== 'paid');
    const upcomingDueTotal = sumBy(
        openSchedules.filter((schedule) => schedule.due_date >= today && schedule.due_date <= inThirtyDays),
        (schedule) => Math.max(toNumber(schedule.amount_due) - toNumber(schedule.amount_paid), 0),
    );
    const overdueTotal = sumBy(
        openSchedules.filter((schedule) => schedule.due_date < today),
        (schedule) => Math.max(toNumber(schedule.amount_due) - toNumber(schedule.amount_paid), 0),
    );

    const totalDebt = longTermDebt + creditCardDebt;

    return {
        totalAssets,
        longTermDebt,
        creditCardDebt,
        totalDebt,
        netWorth: totalAssets - totalDebt,
        monthlyIncome,
        fixedMonthlyPayment,
        livingBudget,
        repaymentCapacity,
        currentMonthExpense,
        currentMonthRepayment,
        livingBudgetUsedPct: livingBudget > 0 ? (currentMonthExpense / livingBudget) * 100 : 0,
        upcomingDueTotal,
        overdueTotal,
    };
}

type FinanceTransactionSubset = {
    amount: number;
    transaction_type: string;
};

export const financeApi = {
    getDashboard: async (userId: string): Promise<FinanceDashboard> => {
        const today = getTodayISO();
        const currentMonthStart = getMonthStartISO();
        const currentMonthEnd = getMonthEndISO();
        const scheduleStart = addDaysISO(today, -7);
        const scheduleEnd = addDaysISO(today, 45);

        const [
            profileResult,
            accountsResult,
            liabilitiesResult,
            billsResult,
            schedulesResult,
            transactionsResult,
            budgetsResult,
            snapshotsResult,
        ] = await Promise.all([
            supabase.from('finance_profiles').select('*').eq('user_id', userId).maybeSingle(),
            supabase.from('finance_accounts').select('*').eq('user_id', userId).order('sort_order'),
            supabase.from('finance_liabilities').select('*').eq('user_id', userId).order('priority'),
            supabase.from('finance_credit_card_bills').select('*').eq('user_id', userId).order('due_date'),
            supabase
                .from('finance_payment_schedules')
                .select('*')
                .eq('user_id', userId)
                .gte('due_date', scheduleStart)
                .lte('due_date', scheduleEnd)
                .order('due_date'),
            supabase
                .from('finance_transactions')
                .select('*')
                .eq('user_id', userId)
                .gte('occurred_date', currentMonthStart)
                .lte('occurred_date', currentMonthEnd)
                .order('occurred_date', { ascending: false }),
            supabase
                .from('finance_budgets')
                .select('*')
                .eq('user_id', userId)
                .eq('budget_month', currentMonthStart)
                .order('category'),
            supabase
                .from('finance_monthly_snapshots')
                .select('*')
                .eq('user_id', userId)
                .order('snapshot_month', { ascending: false })
                .limit(6),
        ]);

        throwIfError(profileResult.error);
        throwIfError(accountsResult.error);
        throwIfError(liabilitiesResult.error);
        throwIfError(billsResult.error);
        throwIfError(schedulesResult.error);
        throwIfError(transactionsResult.error);
        throwIfError(budgetsResult.error);
        throwIfError(snapshotsResult.error);

        const profile = (profileResult.data ?? null) as FinanceProfile | null;
        const accounts = (accountsResult.data ?? []) as FinanceAccount[];
        const liabilities = (liabilitiesResult.data ?? []) as FinanceLiability[];
        const creditCardBills = (billsResult.data ?? []) as FinanceCreditCardBill[];
        const paymentSchedules = (schedulesResult.data ?? []) as FinancePaymentSchedule[];
        const transactions = (transactionsResult.data ?? []) as FinanceTransactionSubset[] as FinanceDashboard['transactions'];
        const budgets = (budgetsResult.data ?? []) as FinanceBudget[];
        const snapshots = (snapshotsResult.data ?? []) as FinanceMonthlySnapshot[];

        const metrics = calculateMetrics({
            profile,
            accounts,
            liabilities,
            paymentSchedules,
            transactions,
        });

        return {
            profile,
            accounts,
            liabilities,
            creditCardBills,
            paymentSchedules,
            transactions,
            budgets,
            snapshots,
            metrics,
            needsBootstrap: accounts.length === 0,
        };
    },

    bootstrapInitialData: async (userId: string): Promise<void> => {
        const { count, error: countError } = await supabase
            .from('finance_accounts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        throwIfError(countError);
        if ((count ?? 0) > 0) return;

        const { error: profileError } = await supabase.from('finance_profiles').upsert(
            {
                user_id: userId,
                monthly_income: 9500,
                living_budget: 1000,
                target_repayment_amount: 3000,
                currency: 'CNY',
                notes: '初始配置来自 2026-05-07 财务汇总。',
            },
            { onConflict: 'user_id' },
        );
        throwIfError(profileError);

        const { data: accountRows, error: accountsError } = await supabase
            .from('finance_accounts')
            .insert([
                {
                    user_id: userId,
                    name: '招行信用卡',
                    institution: '招商银行',
                    account_type: 'credit_card',
                    credit_limit: 90000,
                    current_balance: 46931,
                    statement_day: 26,
                    payment_day: 13,
                    payment_day_status: 'confirmed',
                    sort_order: 1,
                    notes: '当前记录应还 46,931 元。',
                },
                {
                    user_id: userId,
                    name: '建行信用卡',
                    institution: '建设银行',
                    account_type: 'credit_card',
                    credit_limit: 20000,
                    current_balance: 0,
                    statement_day: 5,
                    payment_day: 28,
                    payment_day_status: 'confirmed',
                    sort_order: 2,
                    notes: '消费已还清。',
                },
                {
                    user_id: userId,
                    name: '光大信用卡',
                    institution: '中国光大银行',
                    account_type: 'credit_card',
                    credit_limit: 50000,
                    current_balance: 20920,
                    statement_day: 13,
                    payment_day: 1,
                    payment_day_status: 'confirmed',
                    sort_order: 3,
                    notes: '当前记录应还 20,920 元。',
                },
                {
                    user_id: userId,
                    name: '东莞证券',
                    institution: '东莞证券',
                    account_type: 'investment',
                    current_balance: 30000,
                    sort_order: 4,
                },
            ])
            .select('*');
        throwIfError(accountsError);

        const accounts = (accountRows ?? []) as FinanceAccount[];
        const getAccount = (name: string): FinanceAccount => {
            const account = accounts.find((item) => item.name === name);
            if (!account) throw new Error(`初始化失败，缺少账户：${name}`);
            return account;
        };

        const { data: liabilityRows, error: liabilitiesError } = await supabase
            .from('finance_liabilities')
            .insert([
                {
                    user_id: userId,
                    name: '老婆欠款',
                    liability_type: 'family_debt',
                    original_amount: 70000,
                    current_balance: 70000,
                    priority: 4,
                    notes: '计划还款时间待补充。',
                },
                {
                    user_id: userId,
                    name: '闪电贷 5W',
                    liability_type: 'personal_loan',
                    original_amount: 50000,
                    current_balance: 50000,
                    monthly_payment: 200,
                    due_day: 7,
                    maturity_date: '2028-04-05',
                    priority: 2,
                },
                {
                    user_id: userId,
                    name: '闪电贷 20W',
                    liability_type: 'personal_loan',
                    original_amount: 200000,
                    current_balance: 200000,
                    monthly_payment: 800,
                    due_day: 7,
                    maturity_date: '2028-04-15',
                    priority: 2,
                },
                {
                    user_id: userId,
                    name: '房贷',
                    liability_type: 'mortgage',
                    original_amount: 910000,
                    current_balance: 910000,
                    monthly_payment: 4500,
                    due_day: 1,
                    priority: 1,
                    notes: '每月 1 日还款。',
                },
            ])
            .select('*');
        throwIfError(liabilitiesError);

        const liabilities = (liabilityRows ?? []) as FinanceLiability[];
        const getLiability = (name: string): FinanceLiability => {
            const liability = liabilities.find((item) => item.name === name);
            if (!liability) throw new Error(`初始化失败，缺少债务：${name}`);
            return liability;
        };

        const { data: billRows, error: billsError } = await supabase
            .from('finance_credit_card_bills')
            .insert([
                {
                    user_id: userId,
                    account_id: getAccount('招行信用卡').id,
                    bill_month: '2026-04-01',
                    statement_date: '2026-04-26',
                    due_date: '2026-05-13',
                    billed_amount: 46931,
                    status: 'pending',
                    notes: '近期优先跟进。',
                },
                {
                    user_id: userId,
                    account_id: getAccount('建行信用卡').id,
                    bill_month: '2026-05-01',
                    statement_date: '2026-05-05',
                    due_date: '2026-05-28',
                    billed_amount: 0,
                    status: 'paid',
                    paid_amount: 0,
                    notes: '当前消费已还清。',
                },
                {
                    user_id: userId,
                    account_id: getAccount('光大信用卡').id,
                    bill_month: '2026-05-01',
                    statement_date: '2026-05-13',
                    due_date: '2026-06-01',
                    billed_amount: 20920,
                    status: 'pending',
                    notes: '需在账单日后确认是否已出账。',
                },
            ])
            .select('*');
        throwIfError(billsError);

        const bills = (billRows ?? []) as FinanceCreditCardBill[];
        const getBill = (accountName: string): FinanceCreditCardBill => {
            const account = getAccount(accountName);
            const bill = bills.find((item) => item.account_id === account.id);
            if (!bill) throw new Error(`初始化失败，缺少账单：${accountName}`);
            return bill;
        };

        const { error: schedulesError } = await supabase
            .from('finance_payment_schedules')
            .insert([
                {
                    user_id: userId,
                    credit_card_bill_id: getBill('招行信用卡').id,
                    title: '招行信用卡还款',
                    schedule_type: 'credit_card',
                    due_date: '2026-05-13',
                    amount_due: 46931,
                    status: 'pending',
                },
                {
                    user_id: userId,
                    credit_card_bill_id: getBill('建行信用卡').id,
                    title: '建行信用卡还款',
                    schedule_type: 'credit_card',
                    due_date: '2026-05-28',
                    amount_due: 0,
                    status: 'paid',
                },
                {
                    user_id: userId,
                    credit_card_bill_id: getBill('光大信用卡').id,
                    title: '光大信用卡还款',
                    schedule_type: 'credit_card',
                    due_date: '2026-06-01',
                    amount_due: 20920,
                    status: 'pending',
                    notes: '先按当前记录跟进，账单日后校准已出账金额。',
                },
                {
                    user_id: userId,
                    liability_id: getLiability('闪电贷 5W').id,
                    title: '闪电贷 5W 月供',
                    schedule_type: 'loan',
                    due_date: '2026-05-07',
                    amount_due: 200,
                    status: 'unconfirmed',
                    notes: '需确认本月是否已自动扣款。',
                },
                {
                    user_id: userId,
                    liability_id: getLiability('闪电贷 20W').id,
                    title: '闪电贷 20W 月供',
                    schedule_type: 'loan',
                    due_date: '2026-05-07',
                    amount_due: 800,
                    status: 'unconfirmed',
                },
                {
                    user_id: userId,
                    liability_id: getLiability('房贷').id,
                    title: '房贷月供',
                    schedule_type: 'mortgage',
                    due_date: '2026-05-01',
                    amount_due: 4500,
                    status: 'unconfirmed',
                    notes: '每月 1 日还款，需确认本月是否已扣款。',
                },
            ]);
        throwIfError(schedulesError);

        const { error: budgetError } = await supabase.from('finance_budgets').insert({
            user_id: userId,
            budget_month: '2026-05-01',
            category: 'daily_living',
            amount: 1000,
            notes: '初始日常消费预算。',
        });
        throwIfError(budgetError);

        const { error: snapshotError } = await supabase.from('finance_monthly_snapshots').insert({
            user_id: userId,
            snapshot_month: '2026-05-01',
            snapshot_date: '2026-05-07',
            total_assets: 30000,
            total_liabilities: 1297851,
            credit_card_debt: 67851,
            net_worth: -1267851,
            monthly_income: 9500,
            monthly_expense: 0,
            monthly_repayment: 0,
            notes: '初始快照：不包含现金余额，仅包含已提供资产与负债。',
        });
        throwIfError(snapshotError);
    },

    updatePaymentScheduleStatus: async (
        scheduleId: string,
        status: PaymentScheduleStatus,
    ): Promise<void> => {
        const { data: scheduleData, error: scheduleError } = await supabase
            .from('finance_payment_schedules')
            .select('*')
            .eq('id', scheduleId)
            .single();
        throwIfError(scheduleError);

        const schedule = scheduleData as FinancePaymentSchedule;
        const isPaid = status === 'paid';
        const amountPaid = isPaid ? toNumber(schedule.amount_due) : toNumber(schedule.amount_paid);
        const paidAt = isPaid ? new Date().toISOString() : null;

        const { error: updateError } = await supabase
            .from('finance_payment_schedules')
            .update({
                status,
                amount_paid: amountPaid,
                paid_at: paidAt,
            })
            .eq('id', scheduleId);
        throwIfError(updateError);

        if (!isPaid) return;

        if (schedule.credit_card_bill_id) {
            const { data: billData, error: billError } = await supabase
                .from('finance_credit_card_bills')
                .select('*')
                .eq('id', schedule.credit_card_bill_id)
                .single();
            throwIfError(billError);

            const bill = billData as FinanceCreditCardBill;
            const { error: billUpdateError } = await supabase
                .from('finance_credit_card_bills')
                .update({
                    status: 'paid',
                    paid_amount: toNumber(bill.billed_amount),
                    paid_at: paidAt,
                })
                .eq('id', bill.id);
            throwIfError(billUpdateError);

            const { data: accountData, error: accountError } = await supabase
                .from('finance_accounts')
                .select('*')
                .eq('id', bill.account_id)
                .single();
            throwIfError(accountError);

            const account = accountData as FinanceAccount;
            const nextBalance = Math.max(toNumber(account.current_balance) - toNumber(schedule.amount_due), 0);
            const { error: accountUpdateError } = await supabase
                .from('finance_accounts')
                .update({ current_balance: nextBalance })
                .eq('id', account.id);
            throwIfError(accountUpdateError);
        }

        const { error: transactionError } = await supabase.from('finance_transactions').insert({
            user_id: schedule.user_id,
            occurred_date: getTodayISO(),
            amount: toNumber(schedule.amount_due),
            transaction_type: 'repayment',
            category: 'debt_payment',
            merchant: schedule.title,
            note: '由还款计划标记已还自动生成。',
        });
        throwIfError(transactionError);
    },

    createTransaction: async (input: CreateFinanceTransactionInput): Promise<void> => {
        const { error } = await supabase.from('finance_transactions').insert({
            user_id: input.user_id,
            account_id: input.account_id ?? null,
            occurred_date: input.occurred_date,
            amount: input.amount,
            transaction_type: input.transaction_type,
            category: input.category,
            merchant: input.merchant ?? null,
            note: input.note ?? null,
        });
        throwIfError(error);
    },

    updateProfile: async (input: UpdateFinanceProfileInput): Promise<void> => {
        const { error } = await supabase.from('finance_profiles').upsert(
            {
                user_id: input.user_id,
                monthly_income: input.monthly_income,
                living_budget: input.living_budget,
                target_repayment_amount: input.target_repayment_amount,
                notes: input.notes ?? null,
            },
            { onConflict: 'user_id' },
        );
        throwIfError(error);
    },

    updateAccount: async (input: UpdateFinanceAccountInput): Promise<void> => {
        const { id, ...updates } = input;
        const { error } = await supabase
            .from('finance_accounts')
            .update({
                name: updates.name,
                institution: updates.institution ?? null,
                account_type: updates.account_type,
                credit_limit: updates.credit_limit ?? null,
                current_balance: updates.current_balance,
                statement_day: updates.statement_day ?? null,
                payment_day: updates.payment_day ?? null,
                payment_day_status: updates.payment_day_status,
                is_active: updates.is_active,
                sort_order: updates.sort_order,
                notes: updates.notes ?? null,
            })
            .eq('id', id);
        throwIfError(error);
    },

    updateLiability: async (input: UpdateFinanceLiabilityInput): Promise<void> => {
        const { id, ...updates } = input;
        const { error } = await supabase
            .from('finance_liabilities')
            .update({
                name: updates.name,
                liability_type: updates.liability_type,
                original_amount: updates.original_amount ?? null,
                current_balance: updates.current_balance,
                monthly_payment: updates.monthly_payment ?? null,
                annual_rate: updates.annual_rate ?? null,
                due_day: updates.due_day ?? null,
                maturity_date: updates.maturity_date ?? null,
                priority: updates.priority,
                status: updates.status,
                notes: updates.notes ?? null,
            })
            .eq('id', id);
        throwIfError(error);
    },

    createMonthlySnapshot: async (input: SnapshotInput): Promise<void> => {
        const { error } = await supabase.from('finance_monthly_snapshots').upsert(
            {
                user_id: input.user_id,
                snapshot_month: input.snapshot_month,
                snapshot_date: getTodayISO(),
                total_assets: input.total_assets,
                total_liabilities: input.total_liabilities,
                credit_card_debt: input.credit_card_debt,
                net_worth: input.net_worth,
                monthly_income: input.monthly_income,
                monthly_expense: input.monthly_expense,
                monthly_repayment: input.monthly_repayment,
                notes: input.notes ?? null,
            },
            { onConflict: 'user_id,snapshot_month' },
        );
        throwIfError(error);
    },
};

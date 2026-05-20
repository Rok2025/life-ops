import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createFinanceApi } from './financeApi';

vi.mock('@/lib/supabase', () => ({
    supabase: {},
}));

type QueryFilter = {
    op: 'eq' | 'gte' | 'lte';
    column: string;
    value: unknown;
};

type QueryOrder = {
    column: string;
    options?: unknown;
};

type QueryCall = {
    table: string;
    selectColumns?: string;
    insertPayload?: unknown;
    upsertPayload?: unknown;
    updatePayload?: Record<string, unknown>;
    deleteCalled?: boolean;
    filters: QueryFilter[];
    orders: QueryOrder[];
    limitCount?: number;
    response: unknown;
};

type MockSupabase = {
    client: SupabaseClient;
    calls: QueryCall[];
};

function createMockSupabase(responses: Record<string, unknown[]>): MockSupabase {
    const calls: QueryCall[] = [];
    const tableCounts = new Map<string, number>();

    const client = {
        from(table: string) {
            const tableIndex = tableCounts.get(table) ?? 0;
            tableCounts.set(table, tableIndex + 1);

            const call: QueryCall = {
                table,
                filters: [],
                orders: [],
                response: responses[table]?.[tableIndex] ?? [],
            };
            calls.push(call);

            const builder = {
                select(columns?: string) {
                    call.selectColumns = columns;
                    return builder;
                },
                insert(payload: unknown) {
                    call.insertPayload = payload;
                    return builder;
                },
                upsert(payload: unknown) {
                    call.upsertPayload = payload;
                    return builder;
                },
                update(payload: Record<string, unknown>) {
                    call.updatePayload = payload;
                    call.response = null;
                    return builder;
                },
                delete() {
                    call.deleteCalled = true;
                    call.response = null;
                    return builder;
                },
                eq(column: string, value: unknown) {
                    call.filters.push({ op: 'eq', column, value });
                    return builder;
                },
                gte(column: string, value: unknown) {
                    call.filters.push({ op: 'gte', column, value });
                    return builder;
                },
                lte(column: string, value: unknown) {
                    call.filters.push({ op: 'lte', column, value });
                    return builder;
                },
                order(column: string, options?: unknown) {
                    call.orders.push({ column, options });
                    return builder;
                },
                limit(count: number) {
                    call.limitCount = count;
                    return builder;
                },
                maybeSingle() {
                    return Promise.resolve({ data: call.response ?? null, error: null });
                },
                single() {
                    return Promise.resolve({ data: call.response ?? null, error: null });
                },
                then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
                    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
                    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
                ) {
                    return Promise.resolve({ data: call.response, error: null, count: 0 }).then(onfulfilled, onrejected);
                },
            };

            return builder;
        },
    } as unknown as SupabaseClient;

    return { client, calls };
}

const currentMonthExpense = {
    id: 'expense-current',
    user_id: 'user-1',
    account_id: null,
    occurred_date: '2026-05-18',
    amount: 28,
    transaction_type: 'expense',
    category: 'dining',
    merchant: '午饭',
    note: null,
    created_at: '2026-05-18T05:00:00.000Z',
    updated_at: '2026-05-18T05:00:00.000Z',
};

const earlyMonthExpense = {
    id: 'expense-early-month',
    user_id: 'user-1',
    account_id: null,
    occurred_date: '2026-05-02',
    amount: 18,
    transaction_type: 'expense',
    category: 'transport',
    merchant: '地铁',
    note: null,
    created_at: '2026-05-02T05:00:00.000Z',
    updated_at: '2026-05-02T05:00:00.000Z',
};

const bootstrappedAccounts = [
    { id: 'account-zhaohang', name: '招行信用卡' },
    { id: 'account-jianhang', name: '建行信用卡' },
    { id: 'account-guangda', name: '光大信用卡' },
    { id: 'account-dongguan', name: '东莞证券' },
    { id: 'account-wechat', name: '微信' },
    { id: 'account-alipay', name: '支付宝' },
];

const bootstrappedLiabilities = [
    { id: 'liability-wife', name: '老婆欠款' },
    { id: 'liability-loan-5w', name: '闪电贷 5W' },
    { id: 'liability-loan-20w', name: '闪电贷 20W' },
    { id: 'liability-mortgage', name: '房贷' },
];

const bootstrappedBills = [
    { id: 'bill-zhaohang', account_id: 'account-zhaohang' },
    { id: 'bill-jianhang', account_id: 'account-jianhang' },
    { id: 'bill-guangda', account_id: 'account-guangda' },
];

describe('createFinanceApi', () => {
    it('bootstraps WeChat and Alipay as cash accounts for new finance users', async () => {
        const supabase = createMockSupabase({
            finance_accounts: [[], bootstrappedAccounts],
            finance_liabilities: [bootstrappedLiabilities],
            finance_credit_card_bills: [bootstrappedBills],
            finance_payment_schedules: [],
            finance_budgets: [],
            finance_monthly_snapshots: [],
        });

        const api = createFinanceApi(supabase.client);
        await api.bootstrapInitialData('user-1');

        const accountInsertCall = supabase.calls.find(
            (call) => call.table === 'finance_accounts' && Array.isArray(call.insertPayload),
        );
        expect(accountInsertCall?.insertPayload).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    user_id: 'user-1',
                    name: '微信',
                    institution: '微信支付',
                    account_type: 'cash',
                    current_balance: 0,
                    is_active: true,
                }),
                expect.objectContaining({
                    user_id: 'user-1',
                    name: '支付宝',
                    institution: '支付宝',
                    account_type: 'cash',
                    current_balance: 0,
                    is_active: true,
                }),
            ]),
        );
    });

    it('keeps dashboard expense transactions scoped to the current month', async () => {
        const supabase = createMockSupabase({
            finance_profiles: [null],
            finance_accounts: [[]],
            finance_liabilities: [[]],
            finance_credit_card_bills: [[]],
            finance_payment_schedules: [[]],
            finance_transactions: [[currentMonthExpense]],
            finance_budgets: [[]],
            finance_monthly_snapshots: [[]],
        });

        const api = createFinanceApi(supabase.client);
        const dashboard = await api.getDashboard('user-1');

        expect(dashboard.transactions.map((transaction) => transaction.id)).toEqual(['expense-current']);
        expect(dashboard.metrics.currentMonthExpense).toBe(28);
        expect(dashboard.expenseTransactions.map((transaction) => transaction.id)).toEqual(['expense-current']);

        const transactionCalls = supabase.calls.filter((call) => call.table === 'finance_transactions');
        expect(transactionCalls).toHaveLength(1);
    });

    it('updates a transaction by transaction id and authenticated user id', async () => {
        const supabase = createMockSupabase({
            finance_transactions: [],
        });

        const api = createFinanceApi(supabase.client) as unknown as {
            updateTransaction(input: {
                id: string;
                user_id: string;
                account_id?: string | null;
                occurred_date: string;
                amount: number;
                transaction_type: 'expense';
                category: string;
                merchant?: string | null;
                note?: string | null;
            }): Promise<void>;
        };

        await api.updateTransaction({
            id: 'expense-current',
            user_id: 'user-1',
            account_id: 'account-card',
            occurred_date: '2026-05-19',
            amount: 36.5,
            transaction_type: 'expense',
            category: 'transport',
            merchant: '地铁',
            note: '改为交通分类',
        });

        const updateCall = supabase.calls.find((call) => call.table === 'finance_transactions');
        expect(updateCall?.updatePayload).toEqual({
            account_id: 'account-card',
            occurred_date: '2026-05-19',
            amount: 36.5,
            transaction_type: 'expense',
            category: 'transport',
            merchant: '地铁',
            note: '改为交通分类',
        });
        expect(updateCall?.filters).toEqual([
            { op: 'eq', column: 'id', value: 'expense-current' },
            { op: 'eq', column: 'user_id', value: 'user-1' },
        ]);
    });

    it('deletes a transaction by transaction id and authenticated user id', async () => {
        const supabase = createMockSupabase({
            finance_transactions: [],
        });

        const api = createFinanceApi(supabase.client) as unknown as {
            deleteTransaction(input: {
                id: string;
                user_id: string;
            }): Promise<void>;
        };

        await api.deleteTransaction({
            id: 'expense-current',
            user_id: 'user-1',
        });

        const deleteCall = supabase.calls.find((call) => call.table === 'finance_transactions');
        expect(deleteCall?.deleteCalled).toBe(true);
        expect(deleteCall?.filters).toEqual([
            { op: 'eq', column: 'id', value: 'expense-current' },
            { op: 'eq', column: 'user_id', value: 'user-1' },
        ]);
    });

    it('creates a user-scoped finance account', async () => {
        const supabase = createMockSupabase({
            finance_accounts: [],
        });

        const api = createFinanceApi(supabase.client);
        await api.createAccount({
            user_id: 'user-1',
            name: '微信',
            institution: '微信支付',
            account_type: 'cash',
            credit_limit: null,
            current_balance: 0,
            statement_day: null,
            payment_day: null,
            payment_day_status: 'confirmed',
            is_active: true,
            sort_order: 5,
            notes: null,
        });

        const insertCall = supabase.calls.find((call) => call.table === 'finance_accounts');
        expect(insertCall?.insertPayload).toEqual({
            user_id: 'user-1',
            name: '微信',
            institution: '微信支付',
            account_type: 'cash',
            credit_limit: null,
            current_balance: 0,
            statement_day: null,
            payment_day: null,
            payment_day_status: 'confirmed',
            is_active: true,
            sort_order: 5,
            notes: null,
        });
    });

    it('removes an account from dropdowns by deactivating it for the authenticated user', async () => {
        const supabase = createMockSupabase({
            finance_accounts: [],
        });

        const api = createFinanceApi(supabase.client);
        await api.deleteAccount({
            id: 'account-wechat',
            user_id: 'user-1',
        });

        const updateCall = supabase.calls.find((call) => call.table === 'finance_accounts');
        expect(updateCall?.updatePayload).toEqual({ is_active: false });
        expect(updateCall?.filters).toEqual([
            { op: 'eq', column: 'id', value: 'account-wechat' },
            { op: 'eq', column: 'user_id', value: 'user-1' },
        ]);
    });

    it('returns one month of expenses in ascending date order', async () => {
        const supabase = createMockSupabase({
            finance_transactions: [[earlyMonthExpense, currentMonthExpense]],
        });

        const api = createFinanceApi(supabase.client) as unknown as {
            getExpenseMonth(userId: string, monthStart: string): Promise<{
                expenses: { id: string }[];
            }>;
        };

        const data = await api.getExpenseMonth('user-1', '2026-05-01');

        expect(data.expenses.map((expense) => expense.id)).toEqual(['expense-early-month', 'expense-current']);

        const expenseCall = supabase.calls.find((call) => call.table === 'finance_transactions');
        expect(expenseCall?.filters).toEqual([
            { op: 'eq', column: 'user_id', value: 'user-1' },
            { op: 'eq', column: 'transaction_type', value: 'expense' },
            { op: 'gte', column: 'occurred_date', value: '2026-05-01' },
            { op: 'lte', column: 'occurred_date', value: '2026-05-31' },
        ]);
        expect(expenseCall?.orders).toEqual([
            { column: 'occurred_date', options: { ascending: true } },
            { column: 'created_at', options: { ascending: true } },
        ]);
    });
});

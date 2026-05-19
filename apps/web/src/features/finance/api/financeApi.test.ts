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
                then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
                    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
                    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
                ) {
                    return Promise.resolve({ data: call.response, error: null }).then(onfulfilled, onrejected);
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

describe('createFinanceApi', () => {
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

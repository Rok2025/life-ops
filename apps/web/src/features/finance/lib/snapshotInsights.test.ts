import { describe, expect, it } from 'vitest';
import type { FinanceMonthlySnapshot, FinanceProfile, FinanceTransaction } from '../types';
import { getSnapshotTrendSeries, getSnapshotViewModels } from './snapshotInsights';

const profile = {
    monthly_income: 9500,
    living_budget: 200,
    target_repayment_amount: 180,
} as FinanceProfile;

const snapshots = [
    {
        id: 'may',
        snapshot_month: '2026-05-01',
        snapshot_date: '2026-05-31',
        total_assets: 500,
        total_liabilities: 900,
        credit_card_debt: 120,
        net_worth: -400,
        monthly_income: 9500,
        monthly_expense: 120,
        monthly_repayment: 200,
        notes: '五月复盘',
    },
    {
        id: 'apr',
        snapshot_month: '2026-04-01',
        snapshot_date: '2026-04-30',
        total_assets: 400,
        total_liabilities: 1000,
        credit_card_debt: 180,
        net_worth: -600,
        monthly_income: 9500,
        monthly_expense: 150,
        monthly_repayment: 100,
        notes: null,
    },
] as FinanceMonthlySnapshot[];

const transactions = [
    {
        id: 'expense-dining',
        occurred_date: '2026-05-10',
        amount: 90,
        transaction_type: 'expense',
        category: 'dining',
        merchant: '晚餐',
        note: null,
        created_at: '2026-05-10T12:00:00.000Z',
    },
    {
        id: 'expense-transport',
        occurred_date: '2026-05-12',
        amount: 30,
        transaction_type: 'expense',
        category: 'transport',
        merchant: '地铁',
        note: null,
        created_at: '2026-05-12T12:00:00.000Z',
    },
    {
        id: 'income',
        occurred_date: '2026-05-15',
        amount: 500,
        transaction_type: 'income',
        category: 'salary',
        merchant: '工资',
        note: null,
        created_at: '2026-05-15T12:00:00.000Z',
    },
] as FinanceTransaction[];

describe('snapshot insights', () => {
    it('builds monthly comparison view models', () => {
        const viewModels = getSnapshotViewModels({
            snapshots,
            profile,
            transactions,
            currentMonthStart: '2026-05-01',
        });

        expect(viewModels[0].id).toBe('may');
        expect(viewModels[0].comparison.totalLiabilitiesDelta).toBe(-100);
        expect(viewModels[0].comparison.netWorthDelta).toBe(200);
        expect(viewModels[0].comparison.monthlyExpenseDelta).toBe(-30);
        expect(viewModels[0].comparison.monthlyRepaymentDelta).toBe(100);
        expect(viewModels[0].budgetUsedPct).toBe(60);
        expect(viewModels[0].budgetExceeded).toBe(false);
        expect(viewModels[0].repaymentTargetMet).toBe(true);
        expect(viewModels[0].topExpenseCategory).toEqual({
            category: 'dining',
            categoryLabel: '餐饮',
            amount: 90,
        });
        expect(viewModels[1].comparison.totalLiabilitiesDelta).toBeNull();
        expect(viewModels[1].topExpenseCategory).toBeNull();
    });

    it('sorts snapshot trend points by month', () => {
        const trendSeries = getSnapshotTrendSeries(snapshots);

        expect(trendSeries.map((point) => point.monthLabel)).toEqual(['2026-04', '2026-05']);
        expect(trendSeries[0].totalLiabilities).toBe(1000);
        expect(trendSeries[1].netWorth).toBe(-400);
    });
});

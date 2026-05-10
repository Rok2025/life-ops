import type { FinanceMonthlySnapshot, FinanceProfile, FinanceTransaction } from '../types';
import { getCategoryLabel, toNumber } from './financeFormat';

export type SnapshotComparison = {
    totalLiabilitiesDelta: number | null;
    netWorthDelta: number | null;
    monthlyExpenseDelta: number | null;
    monthlyRepaymentDelta: number | null;
};

export type SnapshotTopExpenseCategory = {
    category: string;
    categoryLabel: string;
    amount: number;
};

export type SnapshotViewModel = {
    id: string;
    snapshot: FinanceMonthlySnapshot;
    monthLabel: string;
    comparison: SnapshotComparison;
    budgetUsedPct: number | null;
    budgetExceeded: boolean;
    repaymentTargetMet: boolean;
    topExpenseCategory: SnapshotTopExpenseCategory | null;
};

export type SnapshotTrendPoint = {
    id: string;
    monthLabel: string;
    totalLiabilities: number;
    netWorth: number;
    monthlyExpense: number;
    monthlyRepayment: number;
};

type SnapshotViewModelInput = {
    snapshots: FinanceMonthlySnapshot[];
    profile: FinanceProfile | null;
    transactions: FinanceTransaction[];
    currentMonthStart: string;
};

function getMonthLabel(snapshotMonth: string): string {
    return snapshotMonth.slice(0, 7);
}

function sortSnapshotsAscending(snapshots: FinanceMonthlySnapshot[]): FinanceMonthlySnapshot[] {
    return [...snapshots].sort((a, b) => a.snapshot_month.localeCompare(b.snapshot_month));
}

function getComparison(
    snapshot: FinanceMonthlySnapshot,
    previousSnapshot: FinanceMonthlySnapshot | null,
): SnapshotComparison {
    if (!previousSnapshot) {
        return {
            totalLiabilitiesDelta: null,
            netWorthDelta: null,
            monthlyExpenseDelta: null,
            monthlyRepaymentDelta: null,
        };
    }

    return {
        totalLiabilitiesDelta: toNumber(snapshot.total_liabilities) - toNumber(previousSnapshot.total_liabilities),
        netWorthDelta: toNumber(snapshot.net_worth) - toNumber(previousSnapshot.net_worth),
        monthlyExpenseDelta: toNumber(snapshot.monthly_expense) - toNumber(previousSnapshot.monthly_expense),
        monthlyRepaymentDelta: toNumber(snapshot.monthly_repayment) - toNumber(previousSnapshot.monthly_repayment),
    };
}

function getTopExpenseCategory(transactions: FinanceTransaction[]): SnapshotTopExpenseCategory | null {
    const totals = new Map<string, number>();
    transactions
        .filter((transaction) => transaction.transaction_type === 'expense')
        .forEach((transaction) => {
            totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + toNumber(transaction.amount));
        });

    const [category, amount] = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0] ?? [];
    if (!category || amount == null) return null;

    return {
        category,
        categoryLabel: getCategoryLabel(category),
        amount,
    };
}

export function getSnapshotViewModels({
    snapshots,
    profile,
    transactions,
    currentMonthStart,
}: SnapshotViewModelInput): SnapshotViewModel[] {
    const sortedAscending = sortSnapshotsAscending(snapshots);
    const currentMonthTopExpenseCategory = getTopExpenseCategory(transactions);
    const livingBudget = toNumber(profile?.living_budget);
    const targetRepaymentAmount = toNumber(profile?.target_repayment_amount);

    return sortedAscending
        .map((snapshot, index) => {
            const monthlyExpense = toNumber(snapshot.monthly_expense);
            const monthlyRepayment = toNumber(snapshot.monthly_repayment);
            const budgetUsedPct = livingBudget > 0 ? (monthlyExpense / livingBudget) * 100 : null;

            return {
                id: snapshot.id,
                snapshot,
                monthLabel: getMonthLabel(snapshot.snapshot_month),
                comparison: getComparison(snapshot, sortedAscending[index - 1] ?? null),
                budgetUsedPct,
                budgetExceeded: livingBudget > 0 && monthlyExpense > livingBudget,
                repaymentTargetMet: targetRepaymentAmount > 0 && monthlyRepayment >= targetRepaymentAmount,
                topExpenseCategory:
                    snapshot.snapshot_month === currentMonthStart ? currentMonthTopExpenseCategory : null,
            };
        })
        .reverse();
}

export function getSnapshotTrendSeries(snapshots: FinanceMonthlySnapshot[]): SnapshotTrendPoint[] {
    return sortSnapshotsAscending(snapshots).map((snapshot) => ({
        id: snapshot.id,
        monthLabel: getMonthLabel(snapshot.snapshot_month),
        totalLiabilities: toNumber(snapshot.total_liabilities),
        netWorth: toNumber(snapshot.net_worth),
        monthlyExpense: toNumber(snapshot.monthly_expense),
        monthlyRepayment: toNumber(snapshot.monthly_repayment),
    }));
}

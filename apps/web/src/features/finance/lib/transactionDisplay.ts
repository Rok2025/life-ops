import type { FinanceTransactionAccount, FinanceTransaction } from '../types';
import { getCategoryLabel, toNumber } from './financeFormat';

export type FinanceExpenseDetailRow = {
    id: string;
    accountId: string | null;
    title: string;
    amount: number;
    occurredDate: string;
    transactionType: FinanceTransaction['transaction_type'];
    category: string;
    categoryLabel: string;
    accountName: string;
    merchant: string | null;
    note: string | null;
    createdAt: string;
};

export type FinanceExpenseDayGroup = {
    date: string;
    label: string;
    amount: number;
    count: number;
    rows: FinanceExpenseDetailRow[];
};

export type FinanceExpenseMonthGroup = {
    month: string;
    label: string;
    amount: number;
    count: number;
    days: FinanceExpenseDayGroup[];
};

export type FinanceExpenseYearGroup = {
    year: string;
    label: string;
    amount: number;
    count: number;
    months: FinanceExpenseMonthGroup[];
};

export function getExpenseDetailRows(
    transactions: FinanceTransaction[],
    accounts: FinanceTransactionAccount[],
    options: { sortDirection?: 'asc' | 'desc' } = {},
): FinanceExpenseDetailRow[] {
    const accountsById = new Map(accounts.map((account) => [account.id, account.name]));
    const sortDirection = options.sortDirection ?? 'desc';

    return transactions
        .filter((transaction) => transaction.transaction_type === 'expense')
        .sort((a, b) => {
            const dateOrder =
                sortDirection === 'asc'
                    ? a.occurred_date.localeCompare(b.occurred_date)
                    : b.occurred_date.localeCompare(a.occurred_date);
            if (dateOrder !== 0) return dateOrder;
            return sortDirection === 'asc'
                ? a.created_at.localeCompare(b.created_at)
                : b.created_at.localeCompare(a.created_at);
        })
        .map((transaction) => ({
            id: transaction.id,
            accountId: transaction.account_id,
            title: transaction.merchant?.trim() || '未填写对象',
            amount: toNumber(transaction.amount),
            occurredDate: transaction.occurred_date,
            transactionType: transaction.transaction_type,
            category: transaction.category,
            categoryLabel: getCategoryLabel(transaction.category),
            accountName: transaction.account_id ? (accountsById.get(transaction.account_id) ?? '未知账户') : '未关联账户',
            merchant: transaction.merchant?.trim() || null,
            note: transaction.note?.trim() || null,
            createdAt: transaction.created_at,
        }));
}

function addToGroupTotal(group: { amount: number; count: number }, row: FinanceExpenseDetailRow): void {
    group.amount += row.amount;
    group.count += 1;
}

function getMonthLabel(month: string): string {
    const parsedMonth = Number(month.slice(5, 7));
    return Number.isFinite(parsedMonth) ? `${parsedMonth}月` : month;
}

function getDayLabel(date: string): string {
    const parsedDay = Number(date.slice(8, 10));
    return Number.isFinite(parsedDay) ? `${parsedDay}日` : date;
}

export function getExpenseTimelineGroups(rows: FinanceExpenseDetailRow[]): FinanceExpenseYearGroup[] {
    const yearGroups: FinanceExpenseYearGroup[] = [];

    rows.forEach((row) => {
        const year = row.occurredDate.slice(0, 4);
        const month = row.occurredDate.slice(0, 7);
        const date = row.occurredDate;

        let yearGroup = yearGroups.find((group) => group.year === year);
        if (!yearGroup) {
            yearGroup = {
                year,
                label: `${year}年`,
                amount: 0,
                count: 0,
                months: [],
            };
            yearGroups.push(yearGroup);
        }
        addToGroupTotal(yearGroup, row);

        let monthGroup = yearGroup.months.find((group) => group.month === month);
        if (!monthGroup) {
            monthGroup = {
                month,
                label: getMonthLabel(month),
                amount: 0,
                count: 0,
                days: [],
            };
            yearGroup.months.push(monthGroup);
        }
        addToGroupTotal(monthGroup, row);

        let dayGroup = monthGroup.days.find((group) => group.date === date);
        if (!dayGroup) {
            dayGroup = {
                date,
                label: getDayLabel(date),
                amount: 0,
                count: 0,
                rows: [],
            };
            monthGroup.days.push(dayGroup);
        }
        addToGroupTotal(dayGroup, row);
        dayGroup.rows.push(row);
    });

    return yearGroups;
}

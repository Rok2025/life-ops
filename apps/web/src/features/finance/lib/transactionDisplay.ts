import type { FinanceAccount, FinanceTransaction } from '../types';
import { getCategoryLabel, toNumber } from './financeFormat';

export type FinanceExpenseDetailRow = {
    id: string;
    title: string;
    amount: number;
    occurredDate: string;
    category: string;
    categoryLabel: string;
    accountName: string;
    note: string | null;
    createdAt: string;
};

export function getExpenseDetailRows(
    transactions: FinanceTransaction[],
    accounts: FinanceAccount[],
): FinanceExpenseDetailRow[] {
    const accountsById = new Map(accounts.map((account) => [account.id, account.name]));

    return transactions
        .filter((transaction) => transaction.transaction_type === 'expense')
        .sort((a, b) => {
            const dateOrder = b.occurred_date.localeCompare(a.occurred_date);
            if (dateOrder !== 0) return dateOrder;
            return b.created_at.localeCompare(a.created_at);
        })
        .map((transaction) => ({
            id: transaction.id,
            title: transaction.merchant?.trim() || '未填写对象',
            amount: toNumber(transaction.amount),
            occurredDate: transaction.occurred_date,
            category: transaction.category,
            categoryLabel: getCategoryLabel(transaction.category),
            accountName: transaction.account_id ? (accountsById.get(transaction.account_id) ?? '未知账户') : '未关联账户',
            note: transaction.note?.trim() || null,
            createdAt: transaction.created_at,
        }));
}

import { describe, expect, it } from 'vitest';
import type { FinanceAccount, FinanceTransaction } from '../types';
import { getExpenseDetailRows } from './transactionDisplay';

const accounts = [
    {
        id: 'account-card',
        name: '招商储蓄卡',
    },
] as FinanceAccount[];

const transactions = [
    {
        id: 'income-1',
        account_id: 'account-card',
        occurred_date: '2026-05-10',
        amount: 3000,
        transaction_type: 'income',
        category: 'salary',
        merchant: '工资',
        note: null,
        created_at: '2026-05-10T08:00:00.000Z',
    },
    {
        id: 'expense-old',
        account_id: null,
        occurred_date: '2026-05-08',
        amount: 42.5,
        transaction_type: 'expense',
        category: 'transport',
        merchant: '',
        note: '',
        created_at: '2026-05-08T09:00:00.000Z',
    },
    {
        id: 'expense-new',
        account_id: 'account-card',
        occurred_date: '2026-05-10',
        amount: 31.2,
        transaction_type: 'expense',
        category: 'dining',
        merchant: '咖啡店',
        note: '和客户聊天',
        created_at: '2026-05-10T10:00:00.000Z',
    },
] as FinanceTransaction[];

describe('getExpenseDetailRows', () => {
    it('returns newest expense rows with display labels', () => {
        const rows = getExpenseDetailRows(transactions, accounts);

        expect(rows.map((row) => row.id)).toEqual(['expense-new', 'expense-old']);
        expect(rows[0].title).toBe('咖啡店');
        expect(rows[0].accountName).toBe('招商储蓄卡');
        expect(rows[0].categoryLabel).toBe('餐饮');
        expect(rows[0].note).toBe('和客户聊天');
        expect(rows[1].title).toBe('未填写对象');
        expect(rows[1].accountName).toBe('未关联账户');
        expect(rows[1].note).toBeNull();
    });
});

import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseDetailDrawer, ExpenseEditDrawer } from './ExpenseTransactionDialogs';
import type { FinanceAccount } from '../types';
import type { FinanceExpenseDetailRow } from '../lib/transactionDisplay';

type MockProps = Record<string, unknown> & {
    children?: ReactNode;
    title?: ReactNode;
    multiline?: boolean;
    open?: boolean;
};

vi.mock('@/components/ui', () => ({
    Button: ({ children, ...props }: MockProps) => <button {...props}>{children}</button>,
    Dialog: ({ children, open, title }: MockProps) => (
        open ? (
            <section>
                <h2>{title}</h2>
                {children}
            </section>
        ) : null
    ),
    Drawer: ({ children, open, title }: MockProps) => (
        open ? (
            <aside>
                <h2>{title}</h2>
                {children}
            </aside>
        ) : null
    ),
    Input: ({ multiline, ...props }: MockProps) => (
        multiline ? <textarea {...props} /> : <input {...props} />
    ),
    Select: ({ children, ...props }: MockProps) => <select {...props}>{children}</select>,
    ShortcutHint: () => <span>shortcut</span>,
}));

vi.mock('@/lib/shortcuts', () => ({
    handleCommandEnterFormSubmit: () => undefined,
}));

const account: FinanceAccount = {
    id: 'account-card',
    user_id: 'user-1',
    name: '招商储蓄卡',
    institution: '招商银行',
    account_type: 'cash',
    credit_limit: null,
    current_balance: 1000,
    statement_day: null,
    payment_day: null,
    payment_day_status: 'confirmed',
    is_active: true,
    sort_order: 1,
    notes: null,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
};

const expense: FinanceExpenseDetailRow = {
    id: 'expense-1',
    occurredDate: '2026-05-19',
    amount: 42,
    category: 'dining',
    categoryLabel: '餐饮',
    accountId: 'account-card',
    accountName: '招商储蓄卡',
    title: '午饭',
    merchant: '午饭',
    note: null,
    createdAt: '2026-05-19T04:00:00.000Z',
};

describe('ExpenseEditDrawer', () => {
    it('renders the expense edit form inside a drawer', () => {
        const html = renderToStaticMarkup(
            <ExpenseEditDrawer
                expense={expense}
                accounts={[account]}
                userId="user-1"
                isSaving={false}
                onClose={() => undefined}
                onSubmit={() => undefined}
            />,
        );

        expect(html).toContain('修改支出');
        expect(html).toContain('data-finance-edit-drawer="expense"');
        expect(html).toContain('午饭');
        expect(html).toContain('保存修改');
    });
});

describe('ExpenseDetailDrawer', () => {
    it('renders expense details in a drawer without an edit action', () => {
        const html = renderToStaticMarkup(
            <ExpenseDetailDrawer
                expense={expense}
                onClose={() => undefined}
            />,
        );

        expect(html).toContain('支出详情');
        expect(html).toContain('data-finance-detail-drawer="expense"');
        expect(html).toContain('午饭');
        expect(html).toContain('¥42');
        expect(html).not.toContain('编辑');
    });
});

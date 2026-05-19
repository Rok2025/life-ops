import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import FinanceOverview, { AllExpensesDialog } from './FinanceOverview';
import type { FinanceDashboard } from '../types';

type MockProps = Record<string, unknown> & {
    children?: ReactNode;
    title?: ReactNode;
    action?: ReactNode;
    multiline?: boolean;
    open?: boolean;
};

vi.mock('@/components/ui', () => ({
    Badge: ({ children }: MockProps) => <span>{children}</span>,
    Button: ({ children, ...props }: MockProps) => <button {...props}>{children}</button>,
    Card: ({ children }: MockProps) => <section>{children}</section>,
    Dialog: ({ children, open }: MockProps) => (open ? <div>{children}</div> : null),
    Drawer: ({ children, open, title }: MockProps) => (
        open ? (
            <aside>
                <h2>{title}</h2>
                {children}
            </aside>
        ) : null
    ),
    getButtonClassName: () => 'mock-button',
    Input: ({ multiline, ...props }: MockProps) => (
        multiline ? <textarea {...props} /> : <input {...props} />
    ),
    PageHero: ({ action, children, title }: MockProps) => (
        <section>
            <h1>{title}</h1>
            {action}
            {children}
        </section>
    ),
    Select: ({ children, ...props }: MockProps) => <select {...props}>{children}</select>,
    ShortcutHint: () => <span>shortcut</span>,
}));

vi.mock('@/hooks/useCommandEnterAction', () => ({
    useCommandEnterAction: () => undefined,
}));

vi.mock('@/lib/shortcuts', () => ({
    handleCommandEnterFormSubmit: () => undefined,
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1' },
        loading: false,
    }),
}));

const mutate = vi.fn();

vi.mock('../hooks/useFinanceDashboard', () => ({
    useFinanceDashboard: () => ({
        data: dashboard,
        isLoading: false,
        isError: false,
    }),
    useFinanceExpenseMonth: () => ({
        data: { expenses: dashboard.expenseTransactions },
        isLoading: false,
        isError: false,
    }),
    useFinanceMutations: () => ({
        bootstrapMutation: { mutate, isPending: false },
        updatePaymentStatusMutation: { mutate, isPending: false },
        createTransactionMutation: { mutate, isPending: false },
        updateTransactionMutation: { mutate, isPending: false },
        deleteTransactionMutation: { mutate, isPending: false },
        updateProfileMutation: { mutate, isPending: false },
        updateAccountMutation: { mutate, isPending: false },
        updateLiabilityMutation: { mutate, isPending: false },
        createSnapshotMutation: { mutate, isPending: false },
    }),
}));

const dashboard: FinanceDashboard = {
    profile: null,
    accounts: [
        {
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
        },
    ],
    liabilities: [],
    creditCardBills: [],
    paymentSchedules: [],
    transactions: [
        {
            id: 'expense-1',
            user_id: 'user-1',
            account_id: 'account-card',
            occurred_date: '2026-05-19',
            amount: 42,
            transaction_type: 'expense',
            category: 'dining',
            merchant: '午饭',
            note: null,
            created_at: '2026-05-19T04:00:00.000Z',
            updated_at: '2026-05-19T04:00:00.000Z',
        },
    ],
    expenseTransactions: [
        {
            id: 'expense-1',
            user_id: 'user-1',
            account_id: 'account-card',
            occurred_date: '2026-05-19',
            amount: 42,
            transaction_type: 'expense',
            category: 'dining',
            merchant: '午饭',
            note: null,
            created_at: '2026-05-19T04:00:00.000Z',
            updated_at: '2026-05-19T04:00:00.000Z',
        },
        {
            id: 'expense-2',
            user_id: 'user-1',
            account_id: null,
            occurred_date: '2026-05-20',
            amount: 18,
            transaction_type: 'expense',
            category: 'shopping',
            merchant: '便利店',
            note: null,
            created_at: '2026-05-20T04:00:00.000Z',
            updated_at: '2026-05-20T04:00:00.000Z',
        },
    ],
    budgets: [],
    snapshots: [],
    metrics: {
        totalAssets: 0,
        longTermDebt: 0,
        creditCardDebt: 0,
        totalDebt: 0,
        netWorth: 0,
        monthlyIncome: 0,
        fixedMonthlyPayment: 0,
        livingBudget: 1000,
        repaymentCapacity: 0,
        currentMonthExpense: 0,
        currentMonthRepayment: 0,
        livingBudgetUsedPct: 0,
        upcomingDueTotal: 0,
        overdueTotal: 0,
    },
    needsBootstrap: false,
};

describe('FinanceOverview', () => {
    it('opens all expenses from an in-page button instead of navigating to a password-gated route', () => {
        const html = renderToStaticMarkup(<FinanceOverview initialUserId="user-1" />);

        expect(html).toContain('全部支出');
        expect(html).not.toContain('href="/finance/expenses"');
        expect(html).toContain('<button');
    });

    it('does not render the embedded all-expense detail list on the spending card', () => {
        const html = renderToStaticMarkup(<FinanceOverview initialUserId="user-1" />);

        expect(html).toContain('支出记录');
        expect(html).toContain('全部支出');
        expect(html).not.toContain('全部明细');
        expect(html).not.toContain('记一笔支出后会在这里查看全部详情。');
    });

    it('renders category totals beside a pie chart on the spending card', () => {
        const html = renderToStaticMarkup(<FinanceOverview initialUserId="user-1" />);

        expect(html).toContain('data-expense-category-layout="split"');
        expect(html).toContain('data-expense-category-chart="pie"');
        expect(html).toContain('分类占比');
        expect(html).toContain('餐饮');
    });

    it('renders all expense records as compact single-line rows', () => {
        const html = renderToStaticMarkup(
            <AllExpensesDialog
                open
                userId="user-1"
                accounts={dashboard.accounts}
                isSavingExpense={false}
                isDeletingExpense={false}
                onClose={() => undefined}
                onUpdateExpense={() => undefined}
                onDeleteExpense={() => undefined}
            />,
        );

        expect(html).toContain('data-expense-row-layout="compact-single-line"');
        expect(html).toContain('时间');
        expect(html).toContain('对象');
        expect(html).toContain('账户');
        expect(html).toContain('午饭');
        expect(html).toContain('招商储蓄卡');
        expect(html).toContain('¥42');
    });

    it('renders an Excel export action for the selected expense month', () => {
        const html = renderToStaticMarkup(
            <AllExpensesDialog
                open
                userId="user-1"
                accounts={dashboard.accounts}
                isSavingExpense={false}
                isDeletingExpense={false}
                onClose={() => undefined}
                onUpdateExpense={() => undefined}
                onDeleteExpense={() => undefined}
            />,
        );

        expect(html).toContain('导出Excel');
        expect(html).toContain('data-expense-export-action="excel"');
    });

    it('renders an edit action for each all-expense record', () => {
        const html = renderToStaticMarkup(
            <AllExpensesDialog
                open
                userId="user-1"
                accounts={dashboard.accounts}
                isSavingExpense={false}
                isDeletingExpense={false}
                onClose={() => undefined}
                onUpdateExpense={() => undefined}
                onDeleteExpense={() => undefined}
            />,
        );

        expect(html).toContain('修改');
        expect(html).toContain('data-expense-edit-action="open-drawer"');
        expect(html).toContain('aria-label="修改支出：午饭"');
    });

    it('keeps all-expense details on a drawer-only detail action', () => {
        const html = renderToStaticMarkup(
            <AllExpensesDialog
                open
                userId="user-1"
                accounts={dashboard.accounts}
                isSavingExpense={false}
                isDeletingExpense={false}
                onClose={() => undefined}
                onUpdateExpense={() => undefined}
                onDeleteExpense={() => undefined}
            />,
        );

        expect(html).toContain('data-expense-detail-action="open-drawer"');
        expect(html).toContain('aria-label="查看支出详情：午饭"');
    });

    it('renders view, edit, and delete as compact icon actions in one operation column', () => {
        const html = renderToStaticMarkup(
            <AllExpensesDialog
                open
                userId="user-1"
                accounts={dashboard.accounts}
                isSavingExpense={false}
                isDeletingExpense={false}
                onClose={() => undefined}
                onUpdateExpense={() => undefined}
                onDeleteExpense={() => undefined}
            />,
        );

        expect(html).toContain('操作');
        expect(html).toContain('data-expense-detail-action="open-drawer"');
        expect(html).toContain('data-expense-edit-action="open-drawer"');
        expect(html).toContain('data-expense-delete-action="delete"');
        expect(html).toContain('data-expense-actions-layout="compact"');
        expect(html).toContain('gap-0.5');
        expect(html).toContain('justify-center');
        expect(html).toContain('class="text-center">操作');
        expect(html).toContain('h-6 w-6');
        expect(html).toContain('aria-label="删除支出：午饭"');
    });

    it('renders the all-expense modal as a compact monthly ledger', () => {
        const html = renderToStaticMarkup(
            <AllExpensesDialog
                open
                userId="user-1"
                accounts={dashboard.accounts}
                isSavingExpense={false}
                isDeletingExpense={false}
                onClose={() => undefined}
                onUpdateExpense={() => undefined}
                onDeleteExpense={() => undefined}
            />,
        );
        const tableHeaderCount = (html.match(new RegExp('>时间</span>', 'g')) ?? []).length;

        expect(html).toContain('data-expense-ledger-layout="monthly"');
        expect(html).toContain('data-expense-ledger-toolbar="fixed"');
        expect(html).toContain('data-expense-ledger-summary="compact"');
        expect(html).toContain('data-expense-ledger-header="shared"');
        expect(html).toContain('data-expense-day-divider="lightweight"');
        expect(html).toContain('data-expense-ledger-row="dense"');
        expect(html).toContain('2026年5月支出');
        expect(html).toContain('title="无备注">-</span>');
        expect(html).toContain('title="未关联账户">-</span>');
        expect(html).toContain('data-expense-toolbar-layout="compact-grid"');
        expect(html).toContain('data-expense-ledger-header-behavior="sticky"');
        expect(html).toContain('sticky top-0 z-10');
        expect(html).toContain('grid-cols-[4.75rem_minmax(8rem,1.35fr)_5.5rem_minmax(6.5rem,0.9fr)_minmax(8rem,1fr)_6.25rem_4.5rem]');
        expect(html).toContain('data-expense-day-density="thin"');
        expect(html).toContain('py-1 text-caption');
        expect(html).toContain('data-expense-action-tone="visible-secondary"');
        expect(html).toContain('text-text-secondary');
        expect(html).toContain('hover:text-danger');
        expect(html).not.toContain('text-danger/70');
        expect(tableHeaderCount).toBe(1);
        expect(html).not.toContain('text-h2 text-text-primary">2026年');
        expect(html).not.toContain('rounded-inner-card border border-glass-border/75 bg-panel-bg/45 p-3');
    });

    it('marks today lightly in the selected expense month', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-19T08:00:00+08:00'));

        try {
            const html = renderToStaticMarkup(
                <AllExpensesDialog
                    open
                    userId="user-1"
                    accounts={dashboard.accounts}
                    isSavingExpense={false}
                    isDeletingExpense={false}
                    onClose={() => undefined}
                    onUpdateExpense={() => undefined}
                    onDeleteExpense={() => undefined}
                />,
            );

            expect(html).toContain('data-expense-day-current="today"');
            expect(html).toContain('今天');
        } finally {
            vi.useRealTimers();
        }
    });
});

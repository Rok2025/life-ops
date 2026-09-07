'use client';
import { useCallback, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useFinanceExpenseMonth } from '../hooks/useFinanceDashboard';
import type { FinanceTransactionAccount, UpdateFinanceTransactionInput, DeleteFinanceTransactionInput } from '../types';
import { formatCurrency, getTodayISO } from '../lib/financeFormat';
import { getExpenseDetailRows, getExpenseTimelineGroups, type FinanceExpenseDetailRow } from '../lib/transactionDisplay';
import { buildExpenseExcelFile, downloadExpenseExcelFile } from '../lib/expenseExport';
import { ExpenseDetailDrawer, ExpenseEditDrawer } from './ExpenseTransactionDialogs';
import { ExpenseLedgerRows } from './ExpenseLedgerRows';
export function ExpenseLedger({
    userId,
    accounts,
    isSavingExpense,
    isDeletingExpense,
    onUpdateExpense,
    onDeleteExpense,
}: {
    userId: string;
    accounts: FinanceTransactionAccount[];
    isSavingExpense: boolean;
    isDeletingExpense: boolean;
    onUpdateExpense: (input: UpdateFinanceTransactionInput, onSuccess?: () => void) => void;
    onDeleteExpense: (input: DeleteFinanceTransactionInput, onSuccess?: () => void) => void;
}) {
    const todayISO = getTodayISO();
    const currentYear = todayISO.slice(0, 4);
    const currentMonth = todayISO.slice(5, 7);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [detailExpenseId, setDetailExpenseId] = useState<string | null>(null);
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const selectedMonthStart = `${selectedYear}-${selectedMonth}-01`;
    const expenseMonthQuery = useFinanceExpenseMonth(userId, selectedMonthStart, true);
    const expenseRows = useMemo(
        () => getExpenseDetailRows(expenseMonthQuery.data?.expenses ?? [], accounts, { sortDirection: 'asc' }),
        [accounts, expenseMonthQuery.data?.expenses],
    );
    const totalExpense = useMemo(
        () => expenseRows.reduce((total, expense) => total + expense.amount, 0),
        [expenseRows],
    );
    const detailExpense = useMemo(
        () => expenseRows.find((row) => row.id === detailExpenseId) ?? null,
        [detailExpenseId, expenseRows],
    );
    const editingExpense = useMemo(
        () => expenseRows.find((row) => row.id === editingExpenseId) ?? null,
        [editingExpenseId, expenseRows],
    );
    const timelineGroups = useMemo(() => getExpenseTimelineGroups(expenseRows), [expenseRows]);
    const dayGroups = useMemo(
        () => timelineGroups.flatMap((yearGroup) => yearGroup.months.flatMap((monthGroup) => monthGroup.days)),
        [timelineGroups],
    );
    const selectedMonthLabel = formatExpenseSelectedMonth(selectedYear, selectedMonth);
    const handleExportExpenses = useCallback(() => {
        if (expenseRows.length === 0) return;
        downloadExpenseExcelFile(buildExpenseExcelFile(expenseRows, selectedYear, selectedMonth));
    }, [expenseRows, selectedMonth, selectedYear]);
    const handleDeleteExpense = useCallback(
        (row: FinanceExpenseDetailRow) => {
            const confirmed = window.confirm(`确认删除这笔支出？\n${row.occurredDate} · ${row.title} · ${formatCurrency(row.amount)}`);
            if (!confirmed) return;

            onDeleteExpense({ id: row.id, user_id: userId }, () => {
                setDetailExpenseId((current) => (current === row.id ? null : current));
                setEditingExpenseId((current) => (current === row.id ? null : current));
            });
        },
        [onDeleteExpense, userId],
    );

    return (
        <>
            <ExpenseDetailDrawer
                key={detailExpense?.id ?? 'all-expenses-detail-closed'}
                expense={detailExpense}
                onClose={() => setDetailExpenseId(null)}
            />
            <ExpenseEditDrawer
                key={editingExpense?.id ?? 'all-expenses-edit-closed'}
                expense={editingExpense}
                accounts={accounts}
                userId={userId}
                isSaving={isSavingExpense}
                onClose={() => setEditingExpenseId(null)}
                onSubmit={(input) => onUpdateExpense(input, () => setEditingExpenseId(null))}
            />
            <section aria-label="月度支出记录" className="rounded-card border border-glass-border bg-panel-bg">
            <div data-expense-ledger-layout="monthly" className="flex min-h-0 flex-1 flex-col">
                <div data-expense-ledger-toolbar="fixed" className="shrink-0 border-b border-glass-border px-5 py-2.5">
                    <div data-expense-toolbar-layout="compact-grid" className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_auto] lg:items-center">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="truncate text-body-sm font-semibold text-text-primary">{selectedMonthLabel}</p>
                            <div data-expense-ledger-summary="compact" className="flex flex-wrap items-center gap-2 text-caption text-text-tertiary">
                                <span className="rounded-full bg-bg-tertiary px-2 py-0.5">{expenseMonthQuery.isLoading ? '加载中' : expenseMonthQuery.isError ? '加载失败' : `${expenseRows.length} 笔`}</span>
                                <span className="rounded-full bg-bg-tertiary px-2 py-0.5 font-semibold text-text-primary">{expenseMonthQuery.isLoading || expenseMonthQuery.isError ? '—' : formatCurrency(totalExpense)}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-end gap-2">
                            <label className="space-y-1">
                                <span className="text-caption text-text-secondary">记账月份</span>
                                <Input type="month" min="0001-01" max="9999-12" value={`${selectedYear}-${selectedMonth}`} onChange={(event) => {
                                    if (!/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value)) return;
                                    const [year, month] = event.target.value.split('-');
                                    setSelectedYear(year); setSelectedMonth(month);
                                    setDetailExpenseId(null); setEditingExpenseId(null);
                                }} />
                            </label>
                            <Button variant="secondary" size="sm" onClick={() => {
                                setSelectedYear(currentYear); setSelectedMonth(currentMonth);
                            }}>回到本月</Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleExportExpenses}
                                disabled={expenseMonthQuery.isLoading || expenseMonthQuery.isError || expenseRows.length === 0}
                                data-expense-export-action="excel"
                                title="导出当前月份支出 Excel"
                            >
                                <Download size={14} />
                                导出Excel
                            </Button>
                        </div>
                    </div>
                </div>

                <div data-expense-ledger-scroll="records" className="max-h-[65vh] min-h-64 overflow-auto px-5 py-4">
                    {expenseMonthQuery.isLoading ? (
                        <p className="rounded-inner-card border border-dashed border-glass-border px-4 py-8 text-center text-body-sm text-text-tertiary">
                            加载当月支出中...
                        </p>
                    ) : expenseMonthQuery.isError ? (
                        <div role="alert" className="p-6 text-danger">支出记录加载失败。
                            <Button variant="secondary" onClick={() => void expenseMonthQuery.refetch()}>重试</Button>
                        </div>
                    ) : expenseRows.length === 0 ? (
                        <p className="rounded-inner-card border border-dashed border-glass-border px-4 py-8 text-center text-body-sm text-text-tertiary">
                            这个月还没有支出记录。
                        </p>
                    ) : (
                        <ExpenseLedgerRows dayGroups={dayGroups} todayISO={todayISO} isDeletingExpense={isDeletingExpense}
                            onDetail={setDetailExpenseId} onEdit={setEditingExpenseId} onDelete={handleDeleteExpense} />
                    )}
                </div>
            </div>
            </section>
        </>
    );
}

function formatExpenseSelectedMonth(year: string, month: string): string {
    const parsedMonth = Number(month);
    return Number.isFinite(parsedMonth) ? `${year}年${parsedMonth}月支出` : `${year}年${month}支出`;
}

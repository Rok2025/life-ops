import { Pencil, ReceiptText, Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/financeFormat';
import type { FinanceExpenseDayGroup, FinanceExpenseDetailRow } from '../lib/transactionDisplay';
const expenseRecordGridClass = 'grid min-w-[820px] grid-cols-[4.75rem_minmax(8rem,1.35fr)_5.5rem_minmax(6.5rem,0.9fr)_minmax(8rem,1fr)_6.25rem_4.5rem] items-center gap-2';
export function ExpenseLedgerRows({ dayGroups, todayISO, isDeletingExpense, onDetail, onEdit, onDelete }: {
    dayGroups: FinanceExpenseDayGroup[];
    todayISO: string;
    isDeletingExpense: boolean;
    onDetail: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (row: FinanceExpenseDetailRow) => void;
}) {
    return (
                        <div className="min-w-[820px] rounded-inner-card border border-glass-border/70 bg-panel-bg/35 pb-1">
                            <div data-expense-ledger-header="shared" data-expense-ledger-header-behavior="sticky" className={`${expenseRecordGridClass} sticky top-0 z-20 border-b border-glass-border bg-bg-primary/95 px-3 py-2 text-caption text-text-tertiary shadow-sm`}>
                                <span>时间</span>
                                <span>对象</span>
                                <span>分类</span>
                                <span>账户</span>
                                <span>备注</span>
                                <span className="text-right">金额</span>
                                <span className="text-center">操作</span>
                            </div>
                            <div className="divide-y divide-glass-border/60">
                                {dayGroups.map((dayGroup) => (
                                    <section
                                        key={dayGroup.date}
                                        data-expense-date={dayGroup.date}
                                        data-expense-day-current={dayGroup.date === todayISO ? 'today' : undefined}
                                        className="bg-panel-bg/20"
                                    >
                                        <div data-expense-day-divider="lightweight" data-expense-day-density="thin" className={`${expenseRecordGridClass} bg-bg-tertiary/30 px-3 py-1 text-caption`}>
                                            <span className="flex min-w-0 items-center gap-1.5 font-semibold text-text-primary">
                                                <span className="truncate">{formatExpenseDayLedgerLabel(dayGroup.date)}</span>
                                                {dayGroup.date === todayISO ? (
                                                    <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">今天</span>
                                                ) : null}
                                            </span>
                                            <span className="col-span-4 truncate text-text-tertiary">{dayGroup.date} · {dayGroup.count} 笔</span>
                                            <span className="text-right font-semibold text-text-primary">{formatCurrency(dayGroup.amount)}</span>
                                            <span />
                                        </div>
                                        {dayGroup.rows.map((row) => (
                                            <div
                                                key={row.id}
                                                data-expense-row-layout="compact-single-line"
                                                data-expense-ledger-row="dense"
                                                className={`${expenseRecordGridClass} min-h-9 w-full px-3 py-1.5 text-left text-body-sm transition-colors duration-normal ease-standard hover:bg-card-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30`}
                                            >
                                                <span className="truncate whitespace-nowrap text-text-tertiary">{formatExpenseCompactDate(row.occurredDate)}</span>
                                                <span className="truncate whitespace-nowrap font-semibold text-text-primary" title={row.title}>{row.title}</span>
                                                <span className="truncate whitespace-nowrap text-text-secondary" title={row.categoryLabel}>{row.categoryLabel}</span>
                                                <span className="truncate whitespace-nowrap text-text-secondary" title={row.accountName}>{formatExpenseAccountLabel(row.accountName)}</span>
                                                <span className={`truncate whitespace-nowrap ${row.note ? 'text-text-secondary' : 'text-text-tertiary'}`} title={row.note ?? '无备注'}>
                                                    {row.note ?? '-'}
                                                </span>
                                                <span className="truncate whitespace-nowrap text-right font-semibold tabular-nums text-text-primary">{formatCurrency(row.amount)}</span>
                                                <div data-expense-actions-layout="compact" className="flex items-center justify-center gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => onDetail(row.id)}
                                                        data-expense-detail-action="open-drawer"
                                                        data-expense-action-tone="visible-secondary"
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-control text-text-secondary transition-colors duration-normal ease-standard hover:bg-selection-bg hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                                                        title="查看详情"
                                                        aria-label={`查看支出详情：${row.title}`}
                                                    >
                                                        <ReceiptText size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onEdit(row.id)}
                                                        data-expense-edit-action="open-drawer"
                                                        data-expense-action-tone="visible-secondary"
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-control text-text-secondary transition-colors duration-normal ease-standard hover:bg-selection-bg hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                                                        title="修改"
                                                        aria-label={`修改支出：${row.title}`}
                                                    >
                                                        <Pencil size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDelete(row)}
                                                        disabled={isDeletingExpense}
                                                        data-expense-delete-action="delete"
                                                        data-expense-action-tone="visible-secondary"
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-control text-text-secondary transition-colors duration-normal ease-standard hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="删除"
                                                        aria-label={`删除支出：${row.title}`}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </section>
                                ))}
                            </div>
                        </div>
    );
}
function formatExpenseCompactDate(value: string): string {
    return value.length >= 10 ? value.slice(5, 10) : value;
}

function formatExpenseDayLedgerLabel(value: string): string {
    const parsedMonth = Number(value.slice(5, 7));
    const parsedDay = Number(value.slice(8, 10));
    if (!Number.isFinite(parsedMonth) || !Number.isFinite(parsedDay)) return value;
    return `${parsedMonth}月${parsedDay}日`;
}

function formatExpenseAccountLabel(value: string): string {
    return value === '未关联账户' ? '-' : value;
}

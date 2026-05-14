'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    CircleDollarSign,
    CreditCard,
    FilePlus2,
    Landmark,
    Plus,
    ReceiptText,
    Save,
    Settings2,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Button, Card, Dialog, Input, PageHero, Select, ShortcutHint } from '@/components/ui';
import { useCommandEnterAction } from '@/hooks/useCommandEnterAction';
import { handleCommandEnterFormSubmit } from '@/lib/shortcuts';
import { useFinanceDashboard, useFinanceMutations } from '../hooks/useFinanceDashboard';
import type {
    CreateFinanceTransactionInput,
    FinanceAccount,
    FinanceAccountType,
    FinanceDashboard,
    FinanceLiability,
    FinancePaymentSchedule,
    FinanceProfile,
    FinanceTransactionType,
    LiabilityStatus,
    LiabilityType,
    PaymentDayStatus,
    PaymentScheduleStatus,
    UpdateFinanceAccountInput,
    UpdateFinanceLiabilityInput,
    UpdateFinanceProfileInput,
} from '../types';
import {
    BILL_STATUS_LABELS,
    FINANCE_CATEGORY_OPTIONS,
    PAYMENT_STATUS_LABELS,
} from '../types';
import {
    diffDays,
    formatCurrency,
    formatPct,
    getCategoryLabel,
    getMonthStartISO,
    getTodayISO,
    toNumber,
} from '../lib/financeFormat';
import { getExpenseDetailRows, type FinanceExpenseDetailRow } from '../lib/transactionDisplay';
import {
    getSnapshotTrendSeries,
    getSnapshotViewModels,
    type SnapshotTrendPoint,
    type SnapshotViewModel,
} from '../lib/snapshotInsights';

function getStatusTone(status: PaymentScheduleStatus): 'default' | 'success' | 'warning' | 'danger' {
    if (status === 'paid') return 'success';
    if (status === 'scheduled') return 'warning';
    if (status === 'risk') return 'danger';
    return 'default';
}

function getScheduleRisk(schedule: FinancePaymentSchedule): {
    label: string;
    tone: 'default' | 'success' | 'warning' | 'danger';
} {
    if (schedule.status === 'paid') return { label: '已完成', tone: 'success' };

    const days = diffDays(getTodayISO(), schedule.due_date);
    if (days < 0) return { label: `已过 ${Math.abs(days)} 天`, tone: 'danger' };
    if (days === 0) return { label: '今天到期', tone: 'danger' };
    if (days <= 1) return { label: '1 天内', tone: 'danger' };
    if (days <= 3) return { label: `${days} 天内`, tone: 'warning' };
    if (days <= 7) return { label: `${days} 天内`, tone: 'warning' };
    return { label: `${days} 天后`, tone: 'default' };
}

function numberToInput(value: number | null | undefined): string {
    return value == null ? '' : String(value);
}

function parseRequiredNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalNumber(value: string): number | null {
    if (value.trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalDay(value: string): number | null {
    const parsed = parseOptionalNumber(value);
    if (parsed == null) return null;
    return Math.min(Math.max(Math.trunc(parsed), 1), 31);
}

function formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

type FinanceOverviewProps = {
    initialUserId?: string;
    initialDashboard?: FinanceDashboard;
};

export default function FinanceOverview({
    initialUserId,
    initialDashboard,
}: FinanceOverviewProps) {
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id ?? initialUserId;
    const dashboardQuery = useFinanceDashboard(userId, initialDashboard);
    const {
        bootstrapMutation,
        updatePaymentStatusMutation,
        createTransactionMutation,
        updateProfileMutation,
        updateAccountMutation,
        updateLiabilityMutation,
        createSnapshotMutation,
    } = useFinanceMutations(userId);
    const [transactionOpen, setTransactionOpen] = useState(false);
    const [basicsOpen, setBasicsOpen] = useState(false);

    useEffect(() => {
        if (!userId || !dashboardQuery.data?.needsBootstrap || bootstrapMutation.isPending) return;
        bootstrapMutation.mutate();
    }, [bootstrapMutation, dashboardQuery.data?.needsBootstrap, userId]);

    const dashboard = dashboardQuery.data;
    const riskMessages = useMemo(() => {
        if (!dashboard) return [];
        const messages: string[] = [];
        if (dashboard.metrics.overdueTotal > 0) {
            messages.push(`有 ${formatCurrency(dashboard.metrics.overdueTotal)} 还款已过期或待确认。`);
        }
        if (dashboard.metrics.creditCardDebt > dashboard.metrics.repaymentCapacity) {
            messages.push(
                `信用卡当前应还 ${formatCurrency(dashboard.metrics.creditCardDebt)}，高于预计可用于还款/储蓄的 ${formatCurrency(dashboard.metrics.repaymentCapacity)}。`,
            );
        }
        if (dashboard.metrics.currentMonthExpense > dashboard.metrics.livingBudget && dashboard.metrics.livingBudget > 0) {
            messages.push('本月日常支出已超过预算，需要复盘分类支出。');
        }
        return messages;
    }, [dashboard]);

    const handleCreateSnapshot = useCallback(() => {
        if (!userId || !dashboard) return;
        createSnapshotMutation.mutate({
            user_id: userId,
            snapshot_month: getMonthStartISO(),
            total_assets: dashboard.metrics.totalAssets,
            total_liabilities: dashboard.metrics.totalDebt,
            credit_card_debt: dashboard.metrics.creditCardDebt,
            net_worth: dashboard.metrics.netWorth,
            monthly_income: dashboard.metrics.monthlyIncome,
            monthly_expense: dashboard.metrics.currentMonthExpense,
            monthly_repayment: dashboard.metrics.currentMonthRepayment,
            notes: '由财务模块页面生成。',
        });
    }, [createSnapshotMutation, dashboard, userId]);

    const handleCreateTransaction = useCallback(
        (input: CreateFinanceTransactionInput) => {
            createTransactionMutation.mutate(input, {
                onSuccess: () => setTransactionOpen(false),
            });
        },
        [createTransactionMutation],
    );

    const handleUpdateProfile = useCallback(
        (input: UpdateFinanceProfileInput) => {
            updateProfileMutation.mutate(input);
        },
        [updateProfileMutation],
    );

    const handleUpdateAccount = useCallback(
        (input: UpdateFinanceAccountInput) => {
            updateAccountMutation.mutate(input);
        },
        [updateAccountMutation],
    );

    const handleUpdateLiability = useCallback(
        (input: UpdateFinanceLiabilityInput) => {
            updateLiabilityMutation.mutate(input);
        },
        [updateLiabilityMutation],
    );

    if (authLoading || dashboardQuery.isLoading || bootstrapMutation.isPending) {
        return (
            <div className="py-12 text-center text-text-tertiary">
                {bootstrapMutation.isPending ? '正在初始化财务账本...' : '加载财务数据中...'}
            </div>
        );
    }

    if (!userId) {
        return <div className="py-12 text-center text-text-tertiary">请先登录后查看财务模块。</div>;
    }

    if (dashboardQuery.isError || !dashboard) {
        return (
            <Card className="p-card">
                <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="mt-0.5 text-danger" />
                    <div>
                        <p className="text-body-sm font-semibold text-text-primary">财务数据加载失败</p>
                        <p className="mt-1 text-body-sm text-text-secondary">
                            请确认 Supabase migration 已应用，然后重新进入财务页。
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="生活 / 财务"
                icon={<Wallet size={18} className="text-accent" />}
                title="财务"
                description="围绕还款监督、支出记录和月度复盘建立个人现金流闭环。"
                action={
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setBasicsOpen(true)}>
                            <Settings2 size={16} />
                            基础信息
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setTransactionOpen(true)}>
                            <Plus size={16} />
                            记一笔
                        </Button>
                        <Button
                            variant="tinted"
                            size="sm"
                            onClick={handleCreateSnapshot}
                            disabled={createSnapshotMutation.isPending}
                        >
                            <FilePlus2 size={16} />
                            月度快照
                        </Button>
                    </div>
                }
                stats={[
                    { label: '总负债', value: formatCurrency(dashboard.metrics.totalDebt, { compact: true }), meta: formatCurrency(dashboard.metrics.totalDebt), tone: 'danger' },
                    { label: '信用卡应还', value: formatCurrency(dashboard.metrics.creditCardDebt, { compact: true }), meta: '重点跟进', tone: 'warning' },
                    { label: '预计可还款', value: formatCurrency(dashboard.metrics.repaymentCapacity), meta: '每月', tone: 'success' },
                    { label: '30天内待还', value: formatCurrency(dashboard.metrics.upcomingDueTotal, { compact: true }), meta: dashboard.metrics.overdueTotal > 0 ? '有逾期' : '待安排', tone: dashboard.metrics.overdueTotal > 0 ? 'danger' : 'blue' },
                ]}
            />

            {riskMessages.length > 0 ? (
                <Card className="p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="mt-0.5 text-warning" />
                        <div className="space-y-1">
                            <p className="text-body-sm font-semibold text-text-primary">本月需要重点看住</p>
                            {riskMessages.map((message) => (
                                <p key={message} className="text-body-sm text-text-secondary">{message}</p>
                            ))}
                        </div>
                    </div>
                </Card>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                <PaymentSchedulePanel
                    dashboard={dashboard}
                    onUpdateStatus={(scheduleId, status) =>
                        updatePaymentStatusMutation.mutate({ scheduleId, status })
                    }
                    updating={updatePaymentStatusMutation.isPending}
                />
                <CashflowPanel dashboard={dashboard} />
            </div>

            <CreditCardPanel dashboard={dashboard} />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
                <DebtProgressPanel dashboard={dashboard} />
                <SpendingPanel dashboard={dashboard} />
            </div>

            <SnapshotPanel dashboard={dashboard} />

            <BasicInfoDialog
                key={basicsOpen ? 'finance-basics-open' : 'finance-basics-closed'}
                open={basicsOpen}
                onClose={() => setBasicsOpen(false)}
                userId={userId}
                dashboard={dashboard}
                isSaving={
                    updateProfileMutation.isPending ||
                    updateAccountMutation.isPending ||
                    updateLiabilityMutation.isPending
                }
                onUpdateProfile={handleUpdateProfile}
                onUpdateAccount={handleUpdateAccount}
                onUpdateLiability={handleUpdateLiability}
            />

            <TransactionDialog
                key={transactionOpen ? 'transaction-open' : 'transaction-closed'}
                open={transactionOpen}
                onClose={() => setTransactionOpen(false)}
                userId={userId}
                accounts={dashboard.accounts}
                isSaving={createTransactionMutation.isPending}
                onSubmit={handleCreateTransaction}
            />
        </div>
    );
}

function PaymentSchedulePanel({
    dashboard,
    updating,
    onUpdateStatus,
}: {
    dashboard: FinanceDashboard;
    updating: boolean;
    onUpdateStatus: (scheduleId: string, status: PaymentScheduleStatus) => void;
}) {
    return (
        <Card className="p-card">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <CalendarClock size={17} className="text-accent" />
                        <h2 className="text-h3 text-text-primary">还款监督</h2>
                    </div>
                    <p className="mt-1 text-body-sm text-text-secondary">按到期日跟进，先处理已过期、3 天内和信用卡账单。</p>
                </div>
            </div>

            <div className="space-y-2">
                {dashboard.paymentSchedules.length === 0 ? (
                    <div className="rounded-inner-card border border-dashed border-glass-border px-4 py-5 text-center text-body-sm text-text-tertiary">
                        暂无未来还款计划。
                    </div>
                ) : (
                    dashboard.paymentSchedules.map((schedule) => {
                        const risk = getScheduleRisk(schedule);
                        const outstanding = Math.max(toNumber(schedule.amount_due) - toNumber(schedule.amount_paid), 0);
                        return (
                            <div
                                key={schedule.id}
                                className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 px-3 py-3"
                            >
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-body-sm font-semibold text-text-primary">{schedule.title}</p>
                                            <Badge tone={getStatusTone(schedule.status)}>
                                                {PAYMENT_STATUS_LABELS[schedule.status]}
                                            </Badge>
                                            <Badge tone={risk.tone}>{risk.label}</Badge>
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-tertiary">
                                            <span>到期：{schedule.due_date}</span>
                                            <span>待还：{formatCurrency(outstanding)}</span>
                                            {schedule.notes ? <span>{schedule.notes}</span> : null}
                                        </div>
                                    </div>

                                    {schedule.status !== 'paid' ? (
                                        <div className="flex shrink-0 gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={updating}
                                                onClick={() => onUpdateStatus(schedule.id, 'scheduled')}
                                            >
                                                已安排
                                            </Button>
                                            <Button
                                                variant="tinted"
                                                size="sm"
                                                disabled={updating}
                                                onClick={() => onUpdateStatus(schedule.id, 'paid')}
                                            >
                                                <CheckCircle2 size={15} />
                                                已还清
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Card>
    );
}

function CashflowPanel({ dashboard }: { dashboard: FinanceDashboard }) {
    const rows = [
        { label: '月收入', value: dashboard.metrics.monthlyIncome, icon: TrendingUp },
        { label: '固定还款', value: dashboard.metrics.fixedMonthlyPayment, icon: Landmark },
        { label: '日常预算', value: dashboard.metrics.livingBudget, icon: CircleDollarSign },
        { label: '理论剩余', value: dashboard.metrics.repaymentCapacity, icon: TrendingDown },
    ];

    return (
        <Card className="p-card">
            <div className="mb-4 flex items-center gap-2">
                <CircleDollarSign size={17} className="text-accent" />
                <h2 className="text-h3 text-text-primary">月度现金流</h2>
            </div>
            <div className="space-y-2">
                {rows.map((row) => {
                    const Icon = row.icon;
                    return (
                        <div
                            key={row.label}
                            className="flex items-center justify-between rounded-inner-card border border-glass-border/70 bg-panel-bg/65 px-3 py-2.5"
                        >
                            <span className="flex items-center gap-2 text-body-sm text-text-secondary">
                                <Icon size={15} className="text-accent/85" />
                                {row.label}
                            </span>
                            <span className="text-body-sm font-semibold text-text-primary">{formatCurrency(row.value)}</span>
                        </div>
                    );
                })}
            </div>
            <p className="mt-3 text-caption text-text-tertiary">
                该剩余值用于还款/储蓄规划，不代表当前现金余额；现金余额后续可作为现金账户录入。
            </p>
        </Card>
    );
}

function CreditCardPanel({ dashboard }: { dashboard: FinanceDashboard }) {
    const creditCards = dashboard.accounts.filter((account) => account.account_type === 'credit_card');
    return (
        <Card className="p-card">
            <div className="mb-4 flex items-center gap-2">
                <CreditCard size={17} className="text-accent" />
                <h2 className="text-h3 text-text-primary">信用卡账单</h2>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
                {creditCards.map((account) => {
                    const bill = dashboard.creditCardBills.find((item) => item.account_id === account.id);
                    const utilization = account.credit_limit ? (toNumber(account.current_balance) / account.credit_limit) * 100 : 0;
                    return (
                        <div key={account.id} className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-body-sm font-semibold text-text-primary">{account.institution}</p>
                                    <p className="mt-1 text-caption text-text-tertiary">{account.name}</p>
                                </div>
                                <Badge tone={bill?.status === 'paid' ? 'success' : bill?.status === 'risk' ? 'danger' : 'warning'}>
                                    {bill ? BILL_STATUS_LABELS[bill.status] : '待建账单'}
                                </Badge>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-end justify-between">
                                    <span className="text-caption text-text-secondary">当前应还/消费</span>
                                    <span className="text-h3 text-text-primary">{formatCurrency(account.current_balance)}</span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                                    <div
                                        className="h-full rounded-full bg-accent"
                                        style={{ width: `${Math.min(utilization, 100)}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex justify-between text-caption text-text-tertiary">
                                    <span>额度 {account.credit_limit ? formatCurrency(account.credit_limit) : '未填'}</span>
                                    <span>{formatPct(utilization)}</span>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-caption">
                                <div className="rounded-control bg-bg-tertiary px-2 py-1.5 text-text-secondary">
                                    账单日 {account.statement_day ? `${account.statement_day}日` : '待补充'}
                                </div>
                                <div className="rounded-control bg-bg-tertiary px-2 py-1.5 text-text-secondary">
                                    还款日 {account.payment_day ? `${account.payment_day}日` : '待补充'}
                                </div>
                            </div>
                            {bill ? (
                                <p className="mt-2 text-caption text-text-tertiary">
                                    本期到期：{bill.due_date} · 已出账 {formatCurrency(bill.billed_amount)}
                                </p>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

function DebtProgressPanel({ dashboard }: { dashboard: FinanceDashboard }) {
    return (
        <Card className="p-card">
            <div className="mb-4 flex items-center gap-2">
                <Landmark size={17} className="text-accent" />
                <h2 className="text-h3 text-text-primary">债务进度</h2>
            </div>
            <div className="space-y-2">
                {dashboard.liabilities.map((liability) => {
                    const original = toNumber(liability.original_amount);
                    const current = toNumber(liability.current_balance);
                    const paidPct = original > 0 ? ((original - current) / original) * 100 : 0;
                    return (
                        <div key={liability.id} className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 px-3 py-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-body-sm font-semibold text-text-primary">{liability.name}</p>
                                    <p className="mt-1 text-caption text-text-tertiary">
                                        月供 {liability.monthly_payment ? formatCurrency(liability.monthly_payment) : '待安排'}
                                        {liability.due_day ? ` · 每月${liability.due_day}日` : ''}
                                        {liability.maturity_date ? ` · 到期 ${liability.maturity_date}` : ''}
                                    </p>
                                </div>
                                <span className="text-body-sm font-semibold text-text-primary">{formatCurrency(current)}</span>
                            </div>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                                <div
                                    className="h-full rounded-full bg-success"
                                    style={{ width: `${Math.max(Math.min(paidPct, 100), 0)}%` }}
                                />
                            </div>
                            <div className="mt-2 flex justify-between text-caption text-text-tertiary">
                                <span>优先级 {liability.priority}</span>
                                <span>已还 {formatPct(paidPct)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

function SpendingPanel({ dashboard }: { dashboard: FinanceDashboard }) {
    const budget = dashboard.metrics.livingBudget;
    const spent = dashboard.metrics.currentMonthExpense;
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
    const categoryTotals = useMemo(() => {
        const totals = new Map<string, number>();
        dashboard.transactions
            .filter((transaction) => transaction.transaction_type === 'expense')
            .forEach((transaction) => {
                totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + toNumber(transaction.amount));
            });
        return Array.from(totals.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [dashboard.transactions]);
    const expenseRows = useMemo(
        () => getExpenseDetailRows(dashboard.transactions, dashboard.accounts),
        [dashboard.accounts, dashboard.transactions],
    );
    const selectedExpense = useMemo(
        () => expenseRows.find((row) => row.id === selectedExpenseId) ?? null,
        [expenseRows, selectedExpenseId],
    );

    return (
        <>
            <Card className="p-card">
                <div className="mb-4 flex items-center gap-2">
                    <CircleDollarSign size={17} className="text-accent" />
                    <h2 className="text-h3 text-text-primary">支出记录</h2>
                </div>
                <div className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 p-3">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-body-sm font-semibold text-text-primary">日常预算</p>
                            <p className="mt-1 text-caption text-text-tertiary">本月已记录支出</p>
                        </div>
                        <div className="text-right">
                            <p className="text-h3 text-text-primary">{formatCurrency(spent)}</p>
                            <p className="text-caption text-text-tertiary">/ {formatCurrency(budget)}</p>
                        </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                        <div
                            className={['h-full rounded-full', pct > 100 ? 'bg-danger' : pct > 80 ? 'bg-warning' : 'bg-success'].join(' ')}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                    </div>
                    <div className="mt-2 text-right text-caption text-text-tertiary">{formatPct(pct)}</div>
                </div>

                <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-body-sm font-semibold text-text-primary">分类汇总</p>
                        <span className="text-caption text-text-tertiary">Top 5</span>
                    </div>
                    <div className="space-y-2">
                        {categoryTotals.length === 0 ? (
                            <p className="rounded-inner-card border border-dashed border-glass-border px-4 py-4 text-center text-body-sm text-text-tertiary">
                                本月还没有支出记录。
                            </p>
                        ) : (
                            categoryTotals.map((item) => (
                                <div key={item.category} className="flex items-center justify-between rounded-control bg-bg-tertiary px-3 py-2 text-body-sm">
                                    <span className="text-text-secondary">{getCategoryLabel(item.category)}</span>
                                    <span className="font-semibold text-text-primary">{formatCurrency(item.amount)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-body-sm font-semibold text-text-primary">本月明细</p>
                        <span className="text-caption text-text-tertiary">{expenseRows.length} 笔</span>
                    </div>
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {expenseRows.length === 0 ? (
                            <p className="rounded-inner-card border border-dashed border-glass-border px-4 py-4 text-center text-body-sm text-text-tertiary">
                                记一笔支出后会在这里查看详情。
                            </p>
                        ) : (
                            expenseRows.map((row) => (
                                <button
                                    key={row.id}
                                    type="button"
                                    onClick={() => setSelectedExpenseId(row.id)}
                                    className="w-full rounded-inner-card border border-glass-border/75 bg-panel-bg/70 px-3 py-2 text-left transition-colors duration-normal ease-standard hover:border-accent/25 hover:bg-card-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                                    aria-label={`查看支出详情：${row.title}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-body-sm font-semibold text-text-primary">{row.title}</p>
                                            <p className="mt-1 truncate text-caption text-text-tertiary">
                                                {row.occurredDate} · {row.categoryLabel} · {row.accountName}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-body-sm font-semibold text-text-primary">{formatCurrency(row.amount)}</p>
                                            <p className="mt-1 inline-flex items-center gap-1 text-caption text-accent">
                                                <ReceiptText size={12} />
                                                详情
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Card>
            <ExpenseDetailDialog expense={selectedExpense} onClose={() => setSelectedExpenseId(null)} />
        </>
    );
}

function ExpenseDetailDialog({
    expense,
    onClose,
}: {
    expense: FinanceExpenseDetailRow | null;
    onClose: () => void;
}) {
    return (
        <Dialog open={expense != null} onClose={onClose} title="支出详情" maxWidth="lg" bodyClassName="min-h-0 flex-1 overflow-y-auto p-5">
            {expense ? (
                <div className="space-y-4">
                    <div className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 p-4">
                        <p className="text-caption text-text-tertiary">金额</p>
                        <p className="mt-1 text-h2 text-text-primary">{formatCurrency(expense.amount)}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <ExpenseDetailField label="日期" value={expense.occurredDate} />
                        <ExpenseDetailField label="分类" value={expense.categoryLabel} />
                        <ExpenseDetailField label="账户" value={expense.accountName} />
                        <ExpenseDetailField label="商户/对象" value={expense.title} />
                        <ExpenseDetailField label="记录时间" value={formatDateTime(expense.createdAt)} />
                        <ExpenseDetailField label="备注" value={expense.note ?? '无'} className="md:col-span-2" />
                    </div>
                </div>
            ) : null}
        </Dialog>
    );
}

function ExpenseDetailField({
    label,
    value,
    className,
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div className={['rounded-control bg-bg-tertiary px-3 py-2', className].filter(Boolean).join(' ')}>
            <p className="text-caption text-text-tertiary">{label}</p>
            <p className="mt-1 break-words text-body-sm font-semibold text-text-primary">{value}</p>
        </div>
    );
}

function formatSignedCurrency(value: number | null): string {
    if (value == null) return '暂无上月';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${formatCurrency(value)}`;
}

function getDeltaTone(
    value: number | null,
    direction: 'lower-better' | 'higher-better',
): 'default' | 'success' | 'warning' | 'danger' {
    if (value == null || value === 0) return 'default';
    if (direction === 'lower-better') return value < 0 ? 'success' : 'danger';
    return value > 0 ? 'success' : 'warning';
}

function getToneTextClass(tone: 'default' | 'success' | 'warning' | 'danger'): string {
    const classes = {
        default: 'text-text-primary',
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-danger',
    };
    return classes[tone];
}

function getTrendBarPct(value: number, values: number[]): number {
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) return 60;
    return 12 + ((value - min) / (max - min)) * 88;
}

function getTrendFillClass(tone: 'blue' | 'danger' | 'success' | 'warning'): string {
    const classes = {
        blue: 'bg-info',
        danger: 'bg-danger',
        success: 'bg-success',
        warning: 'bg-warning',
    };
    return classes[tone];
}

function SnapshotPanel({ dashboard }: { dashboard: FinanceDashboard }) {
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
    const snapshotViewModels = useMemo(
        () =>
            getSnapshotViewModels({
                snapshots: dashboard.snapshots,
                profile: dashboard.profile,
                transactions: dashboard.transactions,
                currentMonthStart: getMonthStartISO(),
            }),
        [dashboard.profile, dashboard.snapshots, dashboard.transactions],
    );
    const selectedSnapshot = useMemo(
        () => snapshotViewModels.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null,
        [selectedSnapshotId, snapshotViewModels],
    );
    const trendSeries = useMemo(() => getSnapshotTrendSeries(dashboard.snapshots), [dashboard.snapshots]);

    return (
        <>
            <Card className="p-card">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <FilePlus2 size={17} className="text-accent" />
                        <h2 className="text-h3 text-text-primary">月度快照</h2>
                    </div>
                    <span className="text-caption text-text-tertiary">点击卡片查看详情</span>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                    {snapshotViewModels.length === 0 ? (
                        <div className="rounded-inner-card border border-dashed border-glass-border px-4 py-4 text-center text-body-sm text-text-tertiary lg:col-span-3">
                            暂无快照。月底点击“月度快照”保存一次结算。
                        </div>
                    ) : (
                        snapshotViewModels.slice(0, 3).map((viewModel) => (
                            <button
                                key={viewModel.id}
                                type="button"
                                onClick={() => setSelectedSnapshotId(viewModel.id)}
                                className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 p-3 text-left transition-colors duration-normal ease-standard hover:border-accent/25 hover:bg-card-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                                aria-label={`查看 ${viewModel.monthLabel} 快照详情`}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-body-sm font-semibold text-text-primary">{viewModel.monthLabel}</p>
                                    <span className="text-caption text-text-tertiary">{viewModel.snapshot.snapshot_date}</span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-caption">
                                    <div className="rounded-control bg-bg-tertiary px-2 py-1.5">
                                        <p className="text-text-tertiary">总负债</p>
                                        <p className="mt-1 font-semibold text-text-primary">{formatCurrency(viewModel.snapshot.total_liabilities)}</p>
                                    </div>
                                    <div className="rounded-control bg-bg-tertiary px-2 py-1.5">
                                        <p className="text-text-tertiary">净值</p>
                                        <p className="mt-1 font-semibold text-text-primary">{formatCurrency(viewModel.snapshot.net_worth)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-caption">
                                    <div>
                                        <p className="text-text-tertiary">负债变化</p>
                                        <p className={['mt-1 font-semibold', getToneTextClass(getDeltaTone(viewModel.comparison.totalLiabilitiesDelta, 'lower-better'))].join(' ')}>
                                            {formatSignedCurrency(viewModel.comparison.totalLiabilitiesDelta)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-text-tertiary">支出</p>
                                        <p className="mt-1 font-semibold text-text-primary">{formatCurrency(viewModel.snapshot.monthly_expense)}</p>
                                    </div>
                                </div>
                                {viewModel.snapshot.notes ? <p className="mt-2 line-clamp-2 text-caption text-text-tertiary">{viewModel.snapshot.notes}</p> : null}
                            </button>
                        ))
                    )}
                </div>
                <SnapshotTrendPanel trendSeries={trendSeries} />
            </Card>
            <SnapshotDetailDialog snapshot={selectedSnapshot} onClose={() => setSelectedSnapshotId(null)} />
        </>
    );
}

function SnapshotTrendPanel({ trendSeries }: { trendSeries: SnapshotTrendPoint[] }) {
    if (trendSeries.length < 2) {
        return (
            <div className="mt-4 rounded-inner-card border border-dashed border-glass-border px-4 py-4 text-center text-body-sm text-text-tertiary">
                快照累计 2 个以上后，会显示总负债、净值、月支出和月还款趋势。
            </div>
        );
    }

    const metrics = [
        { label: '总负债', tone: 'danger' as const, getValue: (point: SnapshotTrendPoint) => point.totalLiabilities },
        { label: '净值', tone: 'success' as const, getValue: (point: SnapshotTrendPoint) => point.netWorth },
        { label: '月支出', tone: 'warning' as const, getValue: (point: SnapshotTrendPoint) => point.monthlyExpense },
        { label: '月还款', tone: 'blue' as const, getValue: (point: SnapshotTrendPoint) => point.monthlyRepayment },
    ];

    return (
        <div className="mt-4 rounded-inner-card border border-glass-border/75 bg-panel-bg/70 p-3">
            <div className="mb-3 flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" />
                <p className="text-body-sm font-semibold text-text-primary">趋势视图</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
                {metrics.map((metric) => {
                    const values = trendSeries.map(metric.getValue);
                    const latestValue = values[values.length - 1] ?? 0;

                    return (
                        <div key={metric.label} className="rounded-control bg-bg-tertiary px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-caption text-text-tertiary">{metric.label}</p>
                                <p className="text-caption font-semibold text-text-primary">{formatCurrency(latestValue)}</p>
                            </div>
                            <div className="mt-3 grid min-h-20 grid-flow-col items-end gap-2">
                                {trendSeries.map((point) => {
                                    const value = metric.getValue(point);
                                    const pct = getTrendBarPct(value, values);

                                    return (
                                        <div key={point.id} className="flex min-w-0 flex-col items-center gap-1">
                                            <div className="flex h-14 w-full max-w-8 items-end rounded-full bg-panel-bg">
                                                <div
                                                    className={['w-full rounded-full', getTrendFillClass(metric.tone)].join(' ')}
                                                    style={{ height: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="max-w-12 truncate text-[10px] leading-tight text-text-tertiary">{point.monthLabel.slice(5)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SnapshotDetailDialog({
    snapshot,
    onClose,
}: {
    snapshot: SnapshotViewModel | null;
    onClose: () => void;
}) {
    const comparisonItems = snapshot
        ? [
            {
                label: '总负债',
                value: snapshot.comparison.totalLiabilitiesDelta,
                direction: 'lower-better' as const,
            },
            {
                label: '净值',
                value: snapshot.comparison.netWorthDelta,
                direction: 'higher-better' as const,
            },
            {
                label: '月支出',
                value: snapshot.comparison.monthlyExpenseDelta,
                direction: 'lower-better' as const,
            },
            {
                label: '月还款',
                value: snapshot.comparison.monthlyRepaymentDelta,
                direction: 'higher-better' as const,
            },
        ]
        : [];

    return (
        <Dialog
            open={snapshot != null}
            onClose={onClose}
            title={snapshot ? `${snapshot.monthLabel} 快照详情` : '快照详情'}
            maxWidth="2xl"
            bodyClassName="min-h-0 flex-1 overflow-y-auto p-5"
        >
            {snapshot ? (
                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <SnapshotDetailField label="总资产" value={formatCurrency(snapshot.snapshot.total_assets)} />
                        <SnapshotDetailField label="总负债" value={formatCurrency(snapshot.snapshot.total_liabilities)} />
                        <SnapshotDetailField label="净值" value={formatCurrency(snapshot.snapshot.net_worth)} />
                        <SnapshotDetailField label="信用卡债务" value={formatCurrency(snapshot.snapshot.credit_card_debt)} />
                        <SnapshotDetailField label="月收入" value={formatCurrency(snapshot.snapshot.monthly_income)} />
                        <SnapshotDetailField label="月支出" value={formatCurrency(snapshot.snapshot.monthly_expense)} />
                        <SnapshotDetailField label="月还款" value={formatCurrency(snapshot.snapshot.monthly_repayment)} />
                        <SnapshotDetailField label="快照日期" value={snapshot.snapshot.snapshot_date} />
                        <SnapshotDetailField label="备注" value={snapshot.snapshot.notes ?? '无'} className="md:col-span-3" />
                    </div>

                    <div className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 p-3">
                        <p className="text-body-sm font-semibold text-text-primary">与上月相比</p>
                        <div className="mt-3 grid gap-2 md:grid-cols-4">
                            {comparisonItems.map((item) => {
                                const tone = getDeltaTone(item.value, item.direction);

                                return (
                                    <div key={item.label} className="rounded-control bg-bg-tertiary px-3 py-2">
                                        <p className="text-caption text-text-tertiary">{item.label}</p>
                                        <p className={['mt-1 text-body-sm font-semibold', getToneTextClass(tone)].join(' ')}>
                                            {formatSignedCurrency(item.value)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <SnapshotReviewCard
                            label="预算使用"
                            value={snapshot.budgetUsedPct == null ? '未设置预算' : formatPct(snapshot.budgetUsedPct)}
                            tone={snapshot.budgetExceeded ? 'danger' : 'success'}
                            description={snapshot.budgetExceeded ? '当月支出超过预算' : '当月支出在预算内'}
                        />
                        <SnapshotReviewCard
                            label="还款目标"
                            value={snapshot.repaymentTargetMet ? '已达标' : '未达标'}
                            tone={snapshot.repaymentTargetMet ? 'success' : 'warning'}
                            description="按当前基础信息中的目标还款额判断"
                        />
                        <SnapshotReviewCard
                            label="本月实时最大分类"
                            value={snapshot.topExpenseCategory ? snapshot.topExpenseCategory.categoryLabel : '暂无分类'}
                            tone="default"
                            description={
                                snapshot.topExpenseCategory
                                    ? `${formatCurrency(snapshot.topExpenseCategory.amount)} · 根据当前本月交易计算`
                                    : '根据当前本月交易计算，不是历史快照存档'
                            }
                        />
                    </div>
                </div>
            ) : null}
        </Dialog>
    );
}

function SnapshotDetailField({
    label,
    value,
    className,
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div className={['rounded-control bg-bg-tertiary px-3 py-2', className].filter(Boolean).join(' ')}>
            <p className="text-caption text-text-tertiary">{label}</p>
            <p className="mt-1 break-words text-body-sm font-semibold text-text-primary">{value}</p>
        </div>
    );
}

function SnapshotReviewCard({
    label,
    value,
    tone,
    description,
}: {
    label: string;
    value: string;
    tone: 'default' | 'success' | 'warning' | 'danger';
    description: string;
}) {
    return (
        <div className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 p-3">
            <p className="text-caption text-text-tertiary">{label}</p>
            <p className={['mt-1 text-body-sm font-semibold', getToneTextClass(tone)].join(' ')}>{value}</p>
            <p className="mt-2 text-caption text-text-tertiary">{description}</p>
        </div>
    );
}

function BasicInfoDialog({
    open,
    onClose,
    userId,
    dashboard,
    isSaving,
    onUpdateProfile,
    onUpdateAccount,
    onUpdateLiability,
}: {
    open: boolean;
    onClose: () => void;
    userId: string;
    dashboard: FinanceDashboard;
    isSaving: boolean;
    onUpdateProfile: (input: UpdateFinanceProfileInput) => void;
    onUpdateAccount: (input: UpdateFinanceAccountInput) => void;
    onUpdateLiability: (input: UpdateFinanceLiabilityInput) => void;
}) {
    return (
        <Dialog open={open} onClose={onClose} title="基础信息" maxWidth="5xl" bodyClassName="p-5">
            <div className="space-y-5">
                <ProfileEditor
                    userId={userId}
                    profile={dashboard.profile}
                    isSaving={isSaving}
                    onSave={onUpdateProfile}
                />

                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <CreditCard size={16} className="text-accent" />
                        <h3 className="text-body-sm font-semibold text-text-primary">账户资料</h3>
                    </div>
                    <div className="grid gap-3 xl:grid-cols-2">
                        {dashboard.accounts.map((account) => (
                            <AccountEditor
                                key={account.id}
                                account={account}
                                isSaving={isSaving}
                                onSave={onUpdateAccount}
                            />
                        ))}
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <Landmark size={16} className="text-accent" />
                        <h3 className="text-body-sm font-semibold text-text-primary">债务资料</h3>
                    </div>
                    <div className="grid gap-3 xl:grid-cols-2">
                        {dashboard.liabilities.map((liability) => (
                            <LiabilityEditor
                                key={liability.id}
                                liability={liability}
                                isSaving={isSaving}
                                onSave={onUpdateLiability}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </Dialog>
    );
}

function ProfileEditor({
    userId,
    profile,
    isSaving,
    onSave,
}: {
    userId: string;
    profile: FinanceProfile | null;
    isSaving: boolean;
    onSave: (input: UpdateFinanceProfileInput) => void;
}) {
    const shortcutScopeRef = useRef<HTMLElement>(null);
    const [monthlyIncome, setMonthlyIncome] = useState(numberToInput(profile?.monthly_income ?? 9500));
    const [livingBudget, setLivingBudget] = useState(numberToInput(profile?.living_budget ?? 1000));
    const [targetRepayment, setTargetRepayment] = useState(numberToInput(profile?.target_repayment_amount ?? 3000));
    const [notes, setNotes] = useState(profile?.notes ?? '');

    const handleSave = useCallback(() => {
        onSave({
            user_id: userId,
            monthly_income: parseRequiredNumber(monthlyIncome),
            living_budget: parseRequiredNumber(livingBudget),
            target_repayment_amount: parseRequiredNumber(targetRepayment),
            notes: notes.trim() || null,
        });
    }, [livingBudget, monthlyIncome, notes, onSave, targetRepayment, userId]);

    useCommandEnterAction({
        disabled: isSaving,
        scopeRef: shortcutScopeRef,
        onAction: handleSave,
    });

    return (
        <section ref={shortcutScopeRef} className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <CircleDollarSign size={16} className="text-accent" />
                        <h3 className="text-body-sm font-semibold text-text-primary">月度配置</h3>
                    </div>
                    <p className="mt-1 text-caption text-text-tertiary">用于计算理论剩余和预算进度。</p>
                </div>
                <Button size="sm" variant="tinted" onClick={handleSave} disabled={isSaving}>
                    <Save size={15} />
                    保存配置
                    {!isSaving ? <ShortcutHint /> : null}
                </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">月收入</span>
                    <Input type="number" min="0" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">日常预算</span>
                    <Input type="number" min="0" value={livingBudget} onChange={(e) => setLivingBudget(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">目标还款/储蓄</span>
                    <Input type="number" min="0" value={targetRepayment} onChange={(e) => setTargetRepayment(e.target.value)} />
                </label>
                <label className="space-y-1.5 md:col-span-3">
                    <span className="text-caption text-text-secondary">备注</span>
                    <Input multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </label>
            </div>
        </section>
    );
}

function AccountEditor({
    account,
    isSaving,
    onSave,
}: {
    account: FinanceAccount;
    isSaving: boolean;
    onSave: (input: UpdateFinanceAccountInput) => void;
}) {
    const shortcutScopeRef = useRef<HTMLDivElement>(null);
    const [name, setName] = useState(account.name);
    const [institution, setInstitution] = useState(account.institution ?? '');
    const [accountType, setAccountType] = useState<FinanceAccountType>(account.account_type);
    const [creditLimit, setCreditLimit] = useState(numberToInput(account.credit_limit));
    const [currentBalance, setCurrentBalance] = useState(numberToInput(account.current_balance));
    const [statementDay, setStatementDay] = useState(numberToInput(account.statement_day));
    const [paymentDay, setPaymentDay] = useState(numberToInput(account.payment_day));
    const [paymentDayStatus, setPaymentDayStatus] = useState<PaymentDayStatus>(account.payment_day_status);
    const [isActive, setIsActive] = useState(account.is_active ? 'true' : 'false');
    const [notes, setNotes] = useState(account.notes ?? '');

    const handleSave = useCallback(() => {
        onSave({
            id: account.id,
            name: name.trim() || account.name,
            institution: institution.trim() || null,
            account_type: accountType,
            credit_limit: parseOptionalNumber(creditLimit),
            current_balance: parseRequiredNumber(currentBalance),
            statement_day: parseOptionalDay(statementDay),
            payment_day: parseOptionalDay(paymentDay),
            payment_day_status: paymentDayStatus,
            is_active: isActive === 'true',
            sort_order: account.sort_order,
            notes: notes.trim() || null,
        });
    }, [
        account.id,
        account.name,
        account.sort_order,
        accountType,
        creditLimit,
        currentBalance,
        institution,
        isActive,
        name,
        notes,
        onSave,
        paymentDay,
        paymentDayStatus,
        statementDay,
    ]);

    useCommandEnterAction({
        disabled: isSaving,
        scopeRef: shortcutScopeRef,
        onAction: handleSave,
    });

    return (
        <div ref={shortcutScopeRef} className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-body-sm font-semibold text-text-primary">{account.name}</p>
                    <p className="mt-1 text-caption text-text-tertiary">
                        {account.account_type === 'credit_card' ? '信用卡额度、账单日、还款日和当前应还' : '账户名称与当前余额'}
                    </p>
                </div>
                <Button size="sm" variant="tinted" onClick={handleSave} disabled={isSaving}>
                    <Save size={15} />
                    保存
                    {!isSaving ? <ShortcutHint /> : null}
                </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">名称</span>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">机构</span>
                    <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">类型</span>
                    <Select value={accountType} onChange={(e) => setAccountType(e.target.value as FinanceAccountType)}>
                        <option value="credit_card">信用卡</option>
                        <option value="loan">贷款账户</option>
                        <option value="investment">投资账户</option>
                        <option value="cash">现金账户</option>
                        <option value="other">其他</option>
                    </Select>
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">当前余额/应还</span>
                    <Input type="number" min="0" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">信用额度</span>
                    <Input type="number" min="0" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">账单日</span>
                    <Input type="number" min="1" max="31" value={statementDay} onChange={(e) => setStatementDay(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">还款日</span>
                    <Input type="number" min="1" max="31" value={paymentDay} onChange={(e) => setPaymentDay(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">还款日状态</span>
                    <Select value={paymentDayStatus} onChange={(e) => setPaymentDayStatus(e.target.value as PaymentDayStatus)}>
                        <option value="confirmed">已确认</option>
                        <option value="inferred">推断</option>
                        <option value="unknown">待补充</option>
                    </Select>
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">是否启用</span>
                    <Select value={isActive} onChange={(e) => setIsActive(e.target.value)}>
                        <option value="true">启用</option>
                        <option value="false">停用</option>
                    </Select>
                </label>
                <label className="space-y-1.5 md:col-span-2">
                    <span className="text-caption text-text-secondary">备注</span>
                    <Input multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </label>
            </div>
        </div>
    );
}

function LiabilityEditor({
    liability,
    isSaving,
    onSave,
}: {
    liability: FinanceLiability;
    isSaving: boolean;
    onSave: (input: UpdateFinanceLiabilityInput) => void;
}) {
    const shortcutScopeRef = useRef<HTMLDivElement>(null);
    const [name, setName] = useState(liability.name);
    const [liabilityType, setLiabilityType] = useState<LiabilityType>(liability.liability_type);
    const [originalAmount, setOriginalAmount] = useState(numberToInput(liability.original_amount));
    const [currentBalance, setCurrentBalance] = useState(numberToInput(liability.current_balance));
    const [monthlyPayment, setMonthlyPayment] = useState(numberToInput(liability.monthly_payment));
    const [annualRate, setAnnualRate] = useState(numberToInput(liability.annual_rate));
    const [dueDay, setDueDay] = useState(numberToInput(liability.due_day));
    const [maturityDate, setMaturityDate] = useState(liability.maturity_date ?? '');
    const [priority, setPriority] = useState(numberToInput(liability.priority));
    const [status, setStatus] = useState<LiabilityStatus>(liability.status);
    const [notes, setNotes] = useState(liability.notes ?? '');

    const handleSave = useCallback(() => {
        const parsedPriority = Math.min(Math.max(Math.trunc(parseRequiredNumber(priority)), 1), 5);
        onSave({
            id: liability.id,
            name: name.trim() || liability.name,
            liability_type: liabilityType,
            original_amount: parseOptionalNumber(originalAmount),
            current_balance: parseRequiredNumber(currentBalance),
            monthly_payment: parseOptionalNumber(monthlyPayment),
            annual_rate: parseOptionalNumber(annualRate),
            due_day: parseOptionalDay(dueDay),
            maturity_date: maturityDate || null,
            priority: parsedPriority,
            status,
            notes: notes.trim() || null,
        });
    }, [
        annualRate,
        currentBalance,
        dueDay,
        liability.id,
        liability.name,
        liabilityType,
        maturityDate,
        monthlyPayment,
        name,
        notes,
        onSave,
        originalAmount,
        priority,
        status,
    ]);

    useCommandEnterAction({
        disabled: isSaving,
        scopeRef: shortcutScopeRef,
        onAction: handleSave,
    });

    return (
        <div ref={shortcutScopeRef} className="rounded-inner-card border border-glass-border/75 bg-panel-bg/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-body-sm font-semibold text-text-primary">{liability.name}</p>
                    <p className="mt-1 text-caption text-text-tertiary">剩余本金、月供、还款日和到期日。</p>
                </div>
                <Button size="sm" variant="tinted" onClick={handleSave} disabled={isSaving}>
                    <Save size={15} />
                    保存
                    {!isSaving ? <ShortcutHint /> : null}
                </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">名称</span>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">类型</span>
                    <Select value={liabilityType} onChange={(e) => setLiabilityType(e.target.value as LiabilityType)}>
                        <option value="mortgage">房贷</option>
                        <option value="personal_loan">个人贷款</option>
                        <option value="family_debt">家庭欠款</option>
                        <option value="credit_card">信用卡</option>
                        <option value="other">其他</option>
                    </Select>
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">原始金额</span>
                    <Input type="number" min="0" value={originalAmount} onChange={(e) => setOriginalAmount(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">当前余额</span>
                    <Input type="number" min="0" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">月供</span>
                    <Input type="number" min="0" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">年化利率</span>
                    <Input type="number" min="0" step="0.0001" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">每月还款日</span>
                    <Input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">到期日</span>
                    <Input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">优先级</span>
                    <Input type="number" min="1" max="5" value={priority} onChange={(e) => setPriority(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">状态</span>
                    <Select value={status} onChange={(e) => setStatus(e.target.value as LiabilityStatus)}>
                        <option value="active">还款中</option>
                        <option value="paid_off">已结清</option>
                        <option value="paused">暂停</option>
                    </Select>
                </label>
                <label className="space-y-1.5 md:col-span-2">
                    <span className="text-caption text-text-secondary">备注</span>
                    <Input multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </label>
            </div>
        </div>
    );
}

function TransactionDialog({
    open,
    onClose,
    userId,
    accounts,
    isSaving,
    onSubmit,
}: {
    open: boolean;
    onClose: () => void;
    userId: string;
    accounts: FinanceAccount[];
    isSaving: boolean;
    onSubmit: (input: CreateFinanceTransactionInput) => void;
}) {
    const [occurredDate, setOccurredDate] = useState(getTodayISO());
    const [amount, setAmount] = useState('');
    const [transactionType, setTransactionType] = useState<FinanceTransactionType>('expense');
    const [category, setCategory] = useState('dining');
    const [accountId, setAccountId] = useState('');
    const [merchant, setMerchant] = useState('');
    const [note, setNote] = useState('');

    const handleSubmit = useCallback(() => {
        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
        onSubmit({
            user_id: userId,
            account_id: accountId || null,
            occurred_date: occurredDate,
            amount: parsedAmount,
            transaction_type: transactionType,
            category,
            merchant: merchant.trim() || null,
            note: note.trim() || null,
        });
    }, [accountId, amount, category, merchant, note, occurredDate, onSubmit, transactionType, userId]);

    return (
        <Dialog open={open} onClose={onClose} title="记一笔" maxWidth="lg" bodyClassName="p-5">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
                onKeyDown={handleCommandEnterFormSubmit}
            >
            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">日期</span>
                    <Input type="date" value={occurredDate} onChange={(e) => setOccurredDate(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">金额</span>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">类型</span>
                    <Select
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value as FinanceTransactionType)}
                    >
                        <option value="expense">支出</option>
                        <option value="income">收入</option>
                        <option value="repayment">还款</option>
                        <option value="transfer">转账</option>
                    </Select>
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">分类</span>
                    <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                        {FINANCE_CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </Select>
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">账户</span>
                    <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                        <option value="">不关联账户</option>
                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                    </Select>
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">商户/对象</span>
                    <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="例如：晚饭、工资、招行还款" />
                </label>
                <label className="space-y-1.5 md:col-span-2">
                    <span className="text-caption text-text-secondary">备注</span>
                    <Input
                        multiline
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="可记录这笔钱的原因或待复盘点"
                    />
                </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>取消</Button>
                <Button type="submit" disabled={isSaving || Number(amount) <= 0}>
                    保存
                    {!isSaving ? <ShortcutHint /> : null}
                </Button>
            </div>
            </form>
        </Dialog>
    );
}

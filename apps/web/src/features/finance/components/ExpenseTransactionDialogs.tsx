'use client';

import { useCallback, useState } from 'react';
import { Button, Drawer, Input, Select, ShortcutHint } from '@/components/ui';
import { handleCommandEnterFormSubmit } from '@/lib/shortcuts';
import type { FinanceAccount, UpdateFinanceTransactionInput } from '../types';
import { FINANCE_CATEGORY_OPTIONS } from '../types';
import { formatCurrency } from '../lib/financeFormat';
import type { FinanceExpenseDetailRow } from '../lib/transactionDisplay';

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

export function ExpenseDetailDrawer({
    expense,
    onClose,
}: {
    expense: FinanceExpenseDetailRow | null;
    onClose: () => void;
}) {
    return (
        <Drawer open={expense != null} onClose={onClose} title="支出详情" size="lg" bodyClassName="min-h-0 flex-1 overflow-y-auto p-5">
            {expense ? (
                <div className="space-y-4" data-finance-detail-drawer="expense">
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
        </Drawer>
    );
}

type ExpenseEditFormProps = {
    expense: FinanceExpenseDetailRow;
    accounts: FinanceAccount[];
    userId: string;
    isSaving: boolean;
    onClose: () => void;
    onSubmit: (input: UpdateFinanceTransactionInput) => void;
};

type ExpenseEditContainerProps = Omit<ExpenseEditFormProps, 'expense'> & {
    expense: FinanceExpenseDetailRow | null;
};

function ExpenseEditForm({
    expense,
    accounts,
    userId,
    isSaving,
    onClose,
    onSubmit,
}: ExpenseEditFormProps) {
    const [occurredDate, setOccurredDate] = useState(expense.occurredDate);
    const [amount, setAmount] = useState(String(expense.amount));
    const [category, setCategory] = useState(expense.category);
    const [accountId, setAccountId] = useState(expense.accountId ?? '');
    const [merchant, setMerchant] = useState(expense.merchant ?? '');
    const [note, setNote] = useState(expense.note ?? '');

    const handleSubmit = useCallback(() => {
        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

        onSubmit({
            id: expense.id,
            user_id: userId,
            account_id: accountId || null,
            occurred_date: occurredDate,
            amount: parsedAmount,
            transaction_type: 'expense',
            category,
            merchant: merchant.trim() || null,
            note: note.trim() || null,
        });
    }, [accountId, amount, category, expense, merchant, note, occurredDate, onSubmit, userId]);

    return (
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
                <label className="space-y-1.5 md:col-span-2">
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
                    保存修改
                    {!isSaving ? <ShortcutHint /> : null}
                </Button>
            </div>
        </form>
    );
}

export function ExpenseEditDrawer({
    expense,
    accounts,
    userId,
    isSaving,
    onClose,
    onSubmit,
}: ExpenseEditContainerProps) {
    return (
        <Drawer open={expense != null} onClose={onClose} title="修改支出" size="lg" bodyClassName="min-h-0 flex-1 overflow-y-auto p-5">
            {expense ? (
                <div data-finance-edit-drawer="expense">
                    <ExpenseEditForm
                        expense={expense}
                        accounts={accounts}
                        userId={userId}
                        isSaving={isSaving}
                        onClose={onClose}
                        onSubmit={onSubmit}
                    />
                </div>
            ) : null}
        </Drawer>
    );
}

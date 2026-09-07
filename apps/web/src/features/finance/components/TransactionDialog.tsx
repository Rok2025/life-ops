'use client';
import { useCallback, useMemo, useState } from 'react';
import { Button, DatePicker, Dialog, Input, Select, ShortcutHint } from '@/components/ui';
import { handleCommandEnterFormSubmit } from '@/lib/shortcuts';
import { getTodayISO } from '../lib/financeFormat';
import { EXPENSE_CATEGORY_OPTIONS, type FinanceTransactionAccount, type CreateFinanceTransactionInput } from '../types';
export function getDefaultTransactionAccountId(accounts: FinanceTransactionAccount[]): string {
    return accounts.find((account) => account.is_active && account.name === '支付宝')?.id ?? '';
}
export function TransactionDialog({
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
    accounts: FinanceTransactionAccount[];
    isSaving: boolean;
    onSubmit: (input: CreateFinanceTransactionInput) => void;
}) {
    const [occurredDate, setOccurredDate] = useState(getTodayISO());
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('dining');
    const [accountId, setAccountId] = useState<string | null>(null);
    const [merchant, setMerchant] = useState('');
    const [note, setNote] = useState('');
    const activeAccounts = useMemo(() => accounts.filter((account) => account.is_active), [accounts]);
    const defaultAccountId = useMemo(() => getDefaultTransactionAccountId(accounts), [accounts]);
    const selectedAccountId = accountId ?? defaultAccountId;

    const handleSubmit = useCallback(() => {
        if (isSaving) return;
        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
        onSubmit({
            user_id: userId,
            account_id: selectedAccountId || null,
            occurred_date: occurredDate,
            amount: parsedAmount,
            transaction_type: 'expense',
            category,
            merchant: merchant.trim() || null,
            note: note.trim() || null,
        });
    }, [isSaving, amount, category, merchant, note, occurredDate, onSubmit, selectedAccountId, userId]);

    return (
        <Dialog open={open} onClose={onClose} title="记一笔支出" maxWidth="lg" bodyClassName="p-5">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
                onKeyDown={handleCommandEnterFormSubmit}
            >
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                    <span className="text-caption text-text-secondary">日期</span>
                    <DatePicker value={occurredDate} onChange={setOccurredDate} ariaLabel="日期" />
                </div>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">金额</span>
                    <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">分类</span>
                    <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                        {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </Select>
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">账户</span>
                    <Select value={selectedAccountId} onChange={(e) => setAccountId(e.target.value)}>
                        <option value="">不关联账户</option>
                        {activeAccounts.map((account) => (
                            <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                    </Select>
                </label>
                <label className="space-y-1.5">
                    <span className="text-caption text-text-secondary">商户/对象</span>
                    <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="例如：午饭、超市购物" />
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
                <Button type="submit" disabled={isSaving || !Number.isFinite(Number(amount)) || Number(amount) <= 0}>
                    保存
                    {!isSaving ? <ShortcutHint /> : null}
                </Button>
            </div>
            </form>
        </Dialog>
    );
}

'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, PageHero } from '@/components/ui';
import { useFinanceTransactionAccounts, useExpenseMutations } from '../hooks/useFinanceDashboard';
import { ExpenseLedger } from './ExpenseLedger';
import { TransactionDialog } from './TransactionDialog';

export default function FinanceOverview({ initialUserId }: { initialUserId: string }) {
    const [transactionOpen, setTransactionOpen] = useState(false);
    const accountsQuery = useFinanceTransactionAccounts(initialUserId);
    const { createTransactionMutation, updateTransactionMutation, deleteTransactionMutation } = useExpenseMutations(initialUserId);
    const mutationError = createTransactionMutation.error || updateTransactionMutation.error || deleteTransactionMutation.error;
    return (
        <div className="space-y-5">
            <PageHero compact title="支出记账" description="查看本月支出，按月回看历史记账记录。" action={
                <Button onClick={() => setTransactionOpen(true)} disabled={!accountsQuery.data}><Plus size={16} />记一笔支出</Button>
            } />
            {mutationError ? <p role="alert" className="text-danger">操作失败，请重试。{mutationError.message}</p> : null}
            {accountsQuery.isLoading ? <p>加载记账账户中...</p> : accountsQuery.isError ? (
                <div role="alert" className="text-danger">记账账户加载失败。<Button onClick={() => void accountsQuery.refetch()}>重试</Button></div>
            ) : (
                <ExpenseLedger userId={initialUserId} accounts={accountsQuery.data ?? []}
                    isSavingExpense={updateTransactionMutation.isPending} isDeletingExpense={deleteTransactionMutation.isPending}
                    onUpdateExpense={(input, onSuccess) => updateTransactionMutation.mutate(input, { onSuccess })}
                    onDeleteExpense={(input, onSuccess) => deleteTransactionMutation.mutate(input, { onSuccess })} />
            )}
            {transactionOpen ? <TransactionDialog open onClose={() => setTransactionOpen(false)} userId={initialUserId}
                accounts={accountsQuery.data ?? []} isSaving={createTransactionMutation.isPending}
                onSubmit={(input) => createTransactionMutation.mutate(input, { onSuccess: () => setTransactionOpen(false) })} /> : null}
        </div>
    );
}

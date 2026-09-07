import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';
import {
    bootstrapFinanceDashboardAction,
    createFinanceAccountAction,
    createFinanceMonthlySnapshotAction,
    createFinanceTransactionAction,
    deleteFinanceAccountAction,
    deleteFinanceTransactionAction,
    updateFinanceAccountAction,
    updateFinanceLiabilityAction,
    updateFinanceProfileAction,
    updateFinanceTransactionAction,
    updatePaymentScheduleStatusAction,
} from '../actions';
import type {
    CreateFinanceAccountInput,
    CreateFinanceTransactionInput,
    DeleteFinanceAccountInput,
    DeleteFinanceTransactionInput,
    FinanceDashboard,
    FinanceExpenseMonthData,
    PaymentScheduleStatus,
    SnapshotInput,
    UpdateFinanceProfileInput,
    UpdateFinanceTransactionInput,
} from '../types';

export const financeKeys = {
    dashboard: (userId: string | undefined) => ['finance-dashboard', userId] as const,
    expenseMonths: (userId: string | undefined) => ['finance-expense-months', userId] as const,
    expenseMonth: (userId: string | undefined, monthStart: string) =>
        [...financeKeys.expenseMonths(userId), monthStart] as const,
};

export function useFinanceDashboard(userId: string | undefined, initialData?: FinanceDashboard) {
    return useQuery<FinanceDashboard>({
        queryKey: financeKeys.dashboard(userId),
        queryFn: () => financeApi.getDashboard(userId!),
        enabled: Boolean(userId),
        initialData,
    });
}

export function useFinanceExpenseMonth(
    userId: string | undefined,
    monthStart: string,
    enabled: boolean,
) {
    return useQuery<FinanceExpenseMonthData>({
        queryKey: financeKeys.expenseMonth(userId, monthStart),
        queryFn: () => financeApi.getExpenseMonth(userId!, monthStart),
        enabled: Boolean(userId) && enabled,
    });
}

export function useFinanceMutations(userId: string | undefined) {
    const queryClient = useQueryClient();

    const invalidate = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: financeKeys.dashboard(userId) }),
            queryClient.invalidateQueries({ queryKey: financeKeys.expenseMonths(userId) }),
        ]);
    };

    const bootstrapMutation = useMutation({
        mutationFn: bootstrapFinanceDashboardAction,
        onSuccess: invalidate,
    });

    const updatePaymentStatusMutation = useMutation({
        mutationFn: ({ scheduleId, status }: { scheduleId: string; status: PaymentScheduleStatus }) =>
            updatePaymentScheduleStatusAction({ scheduleId, status }),
        onSuccess: invalidate,
    });

    const createTransactionMutation = useMutation({
        mutationFn: (input: CreateFinanceTransactionInput) => createFinanceTransactionAction(input),
        onSuccess: invalidate,
    });

    const updateTransactionMutation = useMutation({
        mutationFn: (input: UpdateFinanceTransactionInput) => updateFinanceTransactionAction(input),
        onSuccess: invalidate,
    });

    const deleteTransactionMutation = useMutation({
        mutationFn: (input: DeleteFinanceTransactionInput) => deleteFinanceTransactionAction(input),
        onSuccess: invalidate,
    });

    const updateProfileMutation = useMutation({
        mutationFn: (input: UpdateFinanceProfileInput) => updateFinanceProfileAction(input),
        onSuccess: invalidate,
    });

    const updateAccountMutation = useMutation({
        mutationFn: updateFinanceAccountAction,
        onSuccess: invalidate,
    });

    const createAccountMutation = useMutation({
        mutationFn: (input: CreateFinanceAccountInput) => createFinanceAccountAction(input),
        onSuccess: invalidate,
    });

    const deleteAccountMutation = useMutation({
        mutationFn: (input: DeleteFinanceAccountInput) => deleteFinanceAccountAction(input),
        onSuccess: invalidate,
    });

    const updateLiabilityMutation = useMutation({
        mutationFn: updateFinanceLiabilityAction,
        onSuccess: invalidate,
    });

    const createSnapshotMutation = useMutation({
        mutationFn: (input: SnapshotInput) => createFinanceMonthlySnapshotAction(input),
        onSuccess: invalidate,
    });

    return {
        bootstrapMutation,
        updatePaymentStatusMutation,
        createTransactionMutation,
        updateTransactionMutation,
        deleteTransactionMutation,
        updateProfileMutation,
        updateAccountMutation,
        createAccountMutation,
        deleteAccountMutation,
        updateLiabilityMutation,
        createSnapshotMutation,
    };
}

export function useFinanceTransactionAccounts(userId: string) {
    return useQuery({ queryKey: ['finance-transaction-accounts', userId],
        queryFn: () => financeApi.getTransactionAccounts(userId), enabled: Boolean(userId) });
}

export function useExpenseMutations(userId: string) {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: financeKeys.expenseMonths(userId) });
    return {
        createTransactionMutation: useMutation({ mutationFn: createFinanceTransactionAction, onSuccess: invalidate }),
        updateTransactionMutation: useMutation({ mutationFn: updateFinanceTransactionAction, onSuccess: invalidate }),
        deleteTransactionMutation: useMutation({ mutationFn: deleteFinanceTransactionAction, onSuccess: invalidate }),
    };
}

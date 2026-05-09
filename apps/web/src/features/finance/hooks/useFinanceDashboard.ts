import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';
import {
    bootstrapFinanceDashboardAction,
    createFinanceMonthlySnapshotAction,
    createFinanceTransactionAction,
    updateFinanceAccountAction,
    updateFinanceLiabilityAction,
    updateFinanceProfileAction,
    updatePaymentScheduleStatusAction,
} from '../actions';
import type {
    CreateFinanceTransactionInput,
    FinanceDashboard,
    PaymentScheduleStatus,
    SnapshotInput,
    UpdateFinanceProfileInput,
} from '../types';

export const financeKeys = {
    dashboard: (userId: string | undefined) => ['finance-dashboard', userId] as const,
};

export function useFinanceDashboard(userId: string | undefined, initialData?: FinanceDashboard) {
    return useQuery<FinanceDashboard>({
        queryKey: financeKeys.dashboard(userId),
        queryFn: () => financeApi.getDashboard(userId!),
        enabled: Boolean(userId),
        initialData,
    });
}

export function useFinanceMutations(userId: string | undefined) {
    const queryClient = useQueryClient();

    const invalidate = async () => {
        await queryClient.invalidateQueries({ queryKey: financeKeys.dashboard(userId) });
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

    const updateProfileMutation = useMutation({
        mutationFn: (input: UpdateFinanceProfileInput) => updateFinanceProfileAction(input),
        onSuccess: invalidate,
    });

    const updateAccountMutation = useMutation({
        mutationFn: updateFinanceAccountAction,
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
        updateProfileMutation,
        updateAccountMutation,
        updateLiabilityMutation,
        createSnapshotMutation,
    };
}

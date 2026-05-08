import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';
import type {
    CreateFinanceTransactionInput,
    FinanceDashboard,
    PaymentScheduleStatus,
    SnapshotInput,
    UpdateFinanceAccountInput,
    UpdateFinanceLiabilityInput,
    UpdateFinanceProfileInput,
} from '../types';

export const financeKeys = {
    dashboard: (userId: string | undefined) => ['finance-dashboard', userId] as const,
};

export function useFinanceDashboard(userId: string | undefined) {
    return useQuery<FinanceDashboard>({
        queryKey: financeKeys.dashboard(userId),
        queryFn: () => financeApi.getDashboard(userId!),
        enabled: Boolean(userId),
    });
}

export function useFinanceMutations(userId: string | undefined) {
    const queryClient = useQueryClient();

    const invalidate = async () => {
        await queryClient.invalidateQueries({ queryKey: financeKeys.dashboard(userId) });
    };

    const bootstrapMutation = useMutation({
        mutationFn: () => financeApi.bootstrapInitialData(userId!),
        onSuccess: invalidate,
    });

    const updatePaymentStatusMutation = useMutation({
        mutationFn: ({ scheduleId, status }: { scheduleId: string; status: PaymentScheduleStatus }) =>
            financeApi.updatePaymentScheduleStatus(scheduleId, status),
        onSuccess: invalidate,
    });

    const createTransactionMutation = useMutation({
        mutationFn: (input: CreateFinanceTransactionInput) => financeApi.createTransaction(input),
        onSuccess: invalidate,
    });

    const updateProfileMutation = useMutation({
        mutationFn: (input: UpdateFinanceProfileInput) => financeApi.updateProfile(input),
        onSuccess: invalidate,
    });

    const updateAccountMutation = useMutation({
        mutationFn: (input: UpdateFinanceAccountInput) => financeApi.updateAccount(input),
        onSuccess: invalidate,
    });

    const updateLiabilityMutation = useMutation({
        mutationFn: (input: UpdateFinanceLiabilityInput) => financeApi.updateLiability(input),
        onSuccess: invalidate,
    });

    const createSnapshotMutation = useMutation({
        mutationFn: (input: SnapshotInput) => financeApi.createMonthlySnapshot(input),
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

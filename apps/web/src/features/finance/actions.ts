'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/server';
import { getFinanceServerApi } from './api/server';
import type {
    CreateFinanceTransactionInput,
    DeleteFinanceTransactionInput,
    PaymentScheduleStatus,
    SnapshotInput,
    UpdateFinanceAccountInput,
    UpdateFinanceLiabilityInput,
    UpdateFinanceProfileInput,
    UpdateFinanceTransactionInput,
} from './types';

const FINANCE_PATH = '/finance';

type UserScopedTransactionInput = Omit<CreateFinanceTransactionInput, 'user_id'> & {
    user_id?: string;
};

type UserScopedTransactionUpdateInput = Omit<UpdateFinanceTransactionInput, 'user_id'> & {
    user_id?: string;
};

type UserScopedTransactionDeleteInput = Omit<DeleteFinanceTransactionInput, 'user_id'> & {
    user_id?: string;
};

type UserScopedProfileInput = Omit<UpdateFinanceProfileInput, 'user_id'> & {
    user_id?: string;
};

type UserScopedSnapshotInput = Omit<SnapshotInput, 'user_id'> & {
    user_id?: string;
};

async function getAuthorizedFinanceApi() {
    const user = await requireUser();
    const financeApi = await getFinanceServerApi();

    return { financeApi, user };
}

function revalidateFinance() {
    revalidatePath(FINANCE_PATH);
}

export async function bootstrapFinanceDashboardAction(): Promise<void> {
    const { financeApi, user } = await getAuthorizedFinanceApi();
    await financeApi.bootstrapInitialData(user.id);
    revalidateFinance();
}

export async function updatePaymentScheduleStatusAction(input: {
    scheduleId: string;
    status: PaymentScheduleStatus;
}): Promise<void> {
    const { financeApi } = await getAuthorizedFinanceApi();
    await financeApi.updatePaymentScheduleStatus(input.scheduleId, input.status);
    revalidateFinance();
}

export async function createFinanceTransactionAction(input: UserScopedTransactionInput): Promise<void> {
    const { financeApi, user } = await getAuthorizedFinanceApi();

    await financeApi.createTransaction({
        ...input,
        user_id: user.id,
    });
    revalidateFinance();
}

export async function updateFinanceTransactionAction(input: UserScopedTransactionUpdateInput): Promise<void> {
    const { financeApi, user } = await getAuthorizedFinanceApi();

    await financeApi.updateTransaction({
        ...input,
        user_id: user.id,
    });
    revalidateFinance();
}

export async function deleteFinanceTransactionAction(input: UserScopedTransactionDeleteInput): Promise<void> {
    const { financeApi, user } = await getAuthorizedFinanceApi();

    await financeApi.deleteTransaction({
        ...input,
        user_id: user.id,
    });
    revalidateFinance();
}

export async function updateFinanceProfileAction(input: UserScopedProfileInput): Promise<void> {
    const { financeApi, user } = await getAuthorizedFinanceApi();

    await financeApi.updateProfile({
        ...input,
        user_id: user.id,
    });
    revalidateFinance();
}

export async function updateFinanceAccountAction(input: UpdateFinanceAccountInput): Promise<void> {
    const { financeApi } = await getAuthorizedFinanceApi();
    await financeApi.updateAccount(input);
    revalidateFinance();
}

export async function updateFinanceLiabilityAction(input: UpdateFinanceLiabilityInput): Promise<void> {
    const { financeApi } = await getAuthorizedFinanceApi();
    await financeApi.updateLiability(input);
    revalidateFinance();
}

export async function createFinanceMonthlySnapshotAction(input: UserScopedSnapshotInput): Promise<void> {
    const { financeApi, user } = await getAuthorizedFinanceApi();

    await financeApi.createMonthlySnapshot({
        ...input,
        user_id: user.id,
    });
    revalidateFinance();
}

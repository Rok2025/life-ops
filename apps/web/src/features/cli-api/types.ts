export const CLI_SCOPES = ['tools:read', 'finance:write', 'fitness:write'] as const;

export type CliScope = (typeof CLI_SCOPES)[number];
export type CliTokenRecord = {
    id: string;
    user_id: string;
    device_name: string;
    scopes: CliScope[];
    expires_at: string;
    revoked_at: string | null;
};

export type CliToolDescriptor = {
    name: 'log_finance_transaction' | 'log_fitness_workout';
    description: string;
    scope: CliScope;
};

export type FinanceTransactionInput = {
    occurred_date?: string;
    amount: number;
    transaction_type?: 'expense' | 'income' | 'repayment' | 'transfer';
    category?: string;
    merchant?: string;
    note?: string;
    account_name?: string;
};

export type FitnessWorkoutInput = {
    workout_date?: string;
    notes?: string;
    exercises: Array<{ exercise_name: string; weight: number; sets: number; reps: number }>;
};

export type CliToolResult = {
    toolName: string;
    confirmation: string;
    data: Record<string, unknown>;
};

export type FinanceAccountType = 'credit_card' | 'loan' | 'investment' | 'cash' | 'other';
export type PaymentDayStatus = 'confirmed' | 'inferred' | 'unknown';
export type LiabilityType = 'credit_card' | 'personal_loan' | 'mortgage' | 'family_debt' | 'other';
export type LiabilityStatus = 'active' | 'paid_off' | 'paused';
export type CreditCardBillStatus = 'draft' | 'pending' | 'scheduled' | 'paid' | 'risk';
export type PaymentScheduleStatus = 'unconfirmed' | 'pending' | 'scheduled' | 'paid' | 'risk';
export type PaymentScheduleType = 'credit_card' | 'loan' | 'mortgage' | 'family_debt' | 'other';
export type FinanceTransactionType = 'expense' | 'income' | 'repayment' | 'transfer';

export type FinanceProfile = {
    user_id: string;
    monthly_income: number;
    living_budget: number;
    target_repayment_amount: number;
    currency: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type FinanceAccount = {
    id: string;
    user_id: string;
    name: string;
    institution: string | null;
    account_type: FinanceAccountType;
    credit_limit: number | null;
    current_balance: number;
    statement_day: number | null;
    payment_day: number | null;
    payment_day_status: PaymentDayStatus;
    is_active: boolean;
    sort_order: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type FinanceLiability = {
    id: string;
    user_id: string;
    account_id: string | null;
    name: string;
    liability_type: LiabilityType;
    original_amount: number | null;
    current_balance: number;
    monthly_payment: number | null;
    annual_rate: number | null;
    due_day: number | null;
    maturity_date: string | null;
    priority: number;
    status: LiabilityStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type FinanceCreditCardBill = {
    id: string;
    user_id: string;
    account_id: string;
    bill_month: string;
    statement_date: string | null;
    due_date: string;
    billed_amount: number;
    unbilled_amount: number;
    minimum_payment: number | null;
    paid_amount: number;
    status: CreditCardBillStatus;
    paid_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type FinancePaymentSchedule = {
    id: string;
    user_id: string;
    credit_card_bill_id: string | null;
    liability_id: string | null;
    title: string;
    schedule_type: PaymentScheduleType;
    due_date: string;
    amount_due: number;
    amount_paid: number;
    status: PaymentScheduleStatus;
    paid_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type FinanceTransaction = {
    id: string;
    user_id: string;
    account_id: string | null;
    occurred_date: string;
    amount: number;
    transaction_type: FinanceTransactionType;
    category: string;
    merchant: string | null;
    note: string | null;
    created_at: string;
    updated_at: string;
};

export type FinanceBudget = {
    id: string;
    user_id: string;
    budget_month: string;
    category: string;
    amount: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type FinanceMonthlySnapshot = {
    id: string;
    user_id: string;
    snapshot_month: string;
    snapshot_date: string;
    total_assets: number;
    total_liabilities: number;
    credit_card_debt: number;
    net_worth: number;
    monthly_income: number;
    monthly_expense: number;
    monthly_repayment: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type FinanceDashboardMetrics = {
    totalAssets: number;
    longTermDebt: number;
    creditCardDebt: number;
    totalDebt: number;
    netWorth: number;
    monthlyIncome: number;
    fixedMonthlyPayment: number;
    livingBudget: number;
    repaymentCapacity: number;
    currentMonthExpense: number;
    currentMonthRepayment: number;
    livingBudgetUsedPct: number;
    upcomingDueTotal: number;
    overdueTotal: number;
};

export type FinanceDashboard = {
    profile: FinanceProfile | null;
    accounts: FinanceAccount[];
    liabilities: FinanceLiability[];
    creditCardBills: FinanceCreditCardBill[];
    paymentSchedules: FinancePaymentSchedule[];
    transactions: FinanceTransaction[];
    expenseTransactions: FinanceTransaction[];
    budgets: FinanceBudget[];
    snapshots: FinanceMonthlySnapshot[];
    metrics: FinanceDashboardMetrics;
    needsBootstrap: boolean;
};

export type FinanceExpenseMonthData = {
    expenses: FinanceTransaction[];
};

export type CreateFinanceTransactionInput = {
    user_id: string;
    account_id?: string | null;
    occurred_date: string;
    amount: number;
    transaction_type: FinanceTransactionType;
    category: string;
    merchant?: string | null;
    note?: string | null;
};

export type UpdateFinanceTransactionInput = {
    id: string;
    user_id: string;
    account_id?: string | null;
    occurred_date: string;
    amount: number;
    transaction_type: FinanceTransactionType;
    category: string;
    merchant?: string | null;
    note?: string | null;
};

export type DeleteFinanceTransactionInput = {
    id: string;
    user_id: string;
};

export type CreateFinanceAccountInput = {
    user_id: string;
    name: string;
    institution?: string | null;
    account_type: FinanceAccountType;
    credit_limit?: number | null;
    current_balance: number;
    statement_day?: number | null;
    payment_day?: number | null;
    payment_day_status: PaymentDayStatus;
    is_active: boolean;
    sort_order: number;
    notes?: string | null;
};

export type UpdateFinanceProfileInput = {
    user_id: string;
    monthly_income: number;
    living_budget: number;
    target_repayment_amount: number;
    notes?: string | null;
};

export type UpdateFinanceAccountInput = {
    id: string;
    name: string;
    institution?: string | null;
    account_type: FinanceAccountType;
    credit_limit?: number | null;
    current_balance: number;
    statement_day?: number | null;
    payment_day?: number | null;
    payment_day_status: PaymentDayStatus;
    is_active: boolean;
    sort_order: number;
    notes?: string | null;
};

export type DeleteFinanceAccountInput = {
    id: string;
    user_id: string;
};

export type UpdateFinanceLiabilityInput = {
    id: string;
    name: string;
    liability_type: LiabilityType;
    original_amount?: number | null;
    current_balance: number;
    monthly_payment?: number | null;
    annual_rate?: number | null;
    due_day?: number | null;
    maturity_date?: string | null;
    priority: number;
    status: LiabilityStatus;
    notes?: string | null;
};

export type SnapshotInput = {
    user_id: string;
    snapshot_month: string;
    total_assets: number;
    total_liabilities: number;
    credit_card_debt: number;
    net_worth: number;
    monthly_income: number;
    monthly_expense: number;
    monthly_repayment: number;
    notes?: string | null;
};

export const FINANCE_CATEGORY_OPTIONS = [
    { value: 'dining', label: '餐饮' },
    { value: 'transport', label: '交通' },
    { value: 'family', label: '家庭' },
    { value: 'childcare', label: '育儿' },
    { value: 'housing', label: '住房' },
    { value: 'medical', label: '医疗' },
    { value: 'shopping', label: '购物' },
    { value: 'social', label: '人情' },
    { value: 'subscription', label: '订阅' },
    { value: 'debt_payment', label: '债务还款' },
    { value: 'daily_living', label: '日常预算' },
    { value: 'salary', label: '工资收入' },
    { value: 'other', label: '其他' },
] as const;

export const PAYMENT_STATUS_LABELS: Record<PaymentScheduleStatus, string> = {
    unconfirmed: '待确认',
    pending: '待还款',
    scheduled: '已安排',
    paid: '已还清',
    risk: '有风险',
};

export const BILL_STATUS_LABELS: Record<CreditCardBillStatus, string> = {
    draft: '未出账',
    pending: '待还款',
    scheduled: '已安排',
    paid: '已还清',
    risk: '有风险',
};

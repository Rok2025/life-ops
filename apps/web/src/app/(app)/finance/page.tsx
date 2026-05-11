import { FinanceAccessGate } from '@/features/finance';
import { requireUser } from '@/lib/auth/server';

export default async function FinancePage() {
    const user = await requireUser();

    return <FinanceAccessGate userEmail={user.email} userId={user.id} />;
}

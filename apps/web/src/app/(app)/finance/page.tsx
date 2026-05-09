import { FinanceOverview } from '@/features/finance';
import { getFinanceServerApi } from '@/features/finance/api/server';
import { requireUser } from '@/lib/auth/server';

export default async function FinancePage() {
    const user = await requireUser();
    const financeApi = await getFinanceServerApi();
    const dashboard = await financeApi.getDashboard(user.id);

    return <FinanceOverview initialUserId={user.id} initialDashboard={dashboard} />;
}

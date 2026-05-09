import { HomeDashboard } from '@/features/dashboard';
import { getHomeDashboardSnapshot } from '@/features/dashboard/api/server';

export default async function HomePage() {
    const snapshot = await getHomeDashboardSnapshot();

    return <HomeDashboard initialData={snapshot} />;
}

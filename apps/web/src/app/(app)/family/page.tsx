import FamilyOverview from '@/features/family/components/FamilyOverview';
import { getFamilyServerApi } from '@/features/family/api/server';

export default async function FamilyPage() {
    const familyApi = await getFamilyServerApi();
    const [members, categories, stats, tasks] = await Promise.all([
        familyApi.getMembers(),
        familyApi.getCategories(),
        familyApi.getStats(),
        familyApi.getTasks({ status: 'all', assignee: 'all', category: 'all' }),
    ]);

    return (
        <FamilyOverview
            initialMembers={members}
            initialCategories={categories}
            initialStats={stats}
            initialTasks={tasks}
        />
    );
}

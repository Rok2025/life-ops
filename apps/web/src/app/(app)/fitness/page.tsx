import FitnessOverview from '@/features/fitness/components/FitnessOverview';
import { getFitnessServerApi } from '@/features/fitness/api/server';

export default async function FitnessPage() {
    const fitnessApi = await getFitnessServerApi();
    const [workoutsByDate, stats] = await Promise.all([
        fitnessApi.getWorkouts(),
        fitnessApi.getWeeklyStats(),
    ]);

    return <FitnessOverview initialWorkoutsByDate={workoutsByDate} initialStats={stats} />;
}

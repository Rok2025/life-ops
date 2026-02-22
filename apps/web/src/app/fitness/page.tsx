import { Dumbbell } from 'lucide-react';
import { fitnessApi } from '@/features/fitness';
import { QuickActions } from '@/features/fitness';
import { WeeklyStatsCards } from '@/features/fitness';
import { WorkoutList } from '@/features/fitness';
import { WEEKLY_GOAL } from '@/features/fitness';

export default async function FitnessPage() {
    const [workoutsByDate, stats] = await Promise.all([
        fitnessApi.getWorkouts(),
        fitnessApi.getWeeklyStats(),
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                        <Dumbbell size={24} className="text-success" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">健身领域</h1>
                        <p className="text-sm text-text-secondary">每周目标：{WEEKLY_GOAL} 次训练</p>
                    </div>
                </div>
            </header>

            <QuickActions stats={stats} />
            <WeeklyStatsCards stats={stats} />
            <WorkoutList workoutsByDate={workoutsByDate} />
        </div>
    );
}

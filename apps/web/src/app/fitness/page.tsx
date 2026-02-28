'use client';

import { Dumbbell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fitnessApi } from '@/features/fitness';
import { QuickActions } from '@/features/fitness';
import { WeeklyStatsCards } from '@/features/fitness';
import { WorkoutList } from '@/features/fitness';
import { WEEKLY_GOAL } from '@/features/fitness';
import type { WorkoutsByDate, WeeklyStats } from '@/features/fitness/types';

export default function FitnessPage() {
    const [workoutsByDate, setWorkoutsByDate] = useState<WorkoutsByDate[]>([]);
    const [stats, setStats] = useState<WeeklyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [workoutsData, statsData] = await Promise.all([
                    fitnessApi.getWorkouts(),
                    fitnessApi.getWeeklyStats(),
                ]);
                setWorkoutsByDate(workoutsData);
                setStats(statsData);
            } catch (error) {
                console.error('Failed to load fitness data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-text-secondary">加载中...</div>
            </div>
        );
    }

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

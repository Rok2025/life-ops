'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dumbbell } from 'lucide-react';
import { fitnessApi } from '@/features/fitness';
import { QuickActions } from '@/features/fitness';
import { WeeklyStatsCards } from '@/features/fitness';
import { WorkoutList } from '@/features/fitness';
import { WEEKLY_GOAL } from '@/features/fitness';
import { NewWorkoutDialog } from './NewWorkoutDialog';

export default function FitnessOverview() {
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [copyFromId, setCopyFromId] = useState<string | null>(null);

    const { data: workoutsByDate = [], isLoading: workoutsLoading } = useQuery({
        queryKey: ['fitness-workouts'],
        queryFn: () => fitnessApi.getWorkouts(),
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['fitness-weekly-stats'],
        queryFn: () => fitnessApi.getWeeklyStats(),
    });

    const deleteMutation = useMutation({
        mutationFn: (sessionId: string) => fitnessApi.deleteWorkoutSession(sessionId),
        onMutate: (sessionId) => setDeletingId(sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fitness-workouts'] });
            queryClient.invalidateQueries({ queryKey: ['fitness-weekly-stats'] });
        },
        onSettled: () => setDeletingId(null),
        onError: (error) => {
            console.error('删除训练记录失败:', error);
            alert(`删除失败: ${error instanceof Error ? error.message : '请重试'}`);
        },
    });

    const loading = workoutsLoading || statsLoading;

    const openDialog = (copyId?: string | null) => {
        setCopyFromId(copyId ?? null);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setCopyFromId(null);
    };

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-text-secondary">加载中...</div>
            </div>
        );
    }

    return (
        <div className="space-y-section">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                        <Dumbbell size={20} className="text-success" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">健身领域</h1>
                        <p className="text-sm text-text-secondary">每周目标：{WEEKLY_GOAL} 次训练</p>
                    </div>
                </div>
            </header>

            <QuickActions stats={stats} onAddWorkout={() => openDialog()} />
            <WeeklyStatsCards stats={stats} />
            <WorkoutList
                workoutsByDate={workoutsByDate}
                onDelete={(id) => deleteMutation.mutate(id)}
                deletingId={deletingId}
                onAddWorkout={() => openDialog()}
                onCopyWorkout={(id) => openDialog(id)}
            />

            <NewWorkoutDialog
                open={dialogOpen}
                onClose={closeDialog}
                copyFromId={copyFromId}
            />
        </div>
    );
}

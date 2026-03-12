'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dumbbell, Plus } from 'lucide-react';
import { fitnessApi } from '@/features/fitness';
import { WeeklyStatsCards } from '@/features/fitness';
import { WorkoutList } from '@/features/fitness';
import { WEEKLY_GOAL } from '@/features/fitness';
import { NewWorkoutDialog } from './NewWorkoutDialog';
import { WorkoutDetailDialog } from './WorkoutDetailDialog';
import { FitnessCalendar } from './FitnessCalendar';
import { TopExercises } from './TopExercises';

export default function FitnessOverview() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
    const [detailEditMode, setDetailEditMode] = useState(false);

    const { data: workoutsByDate = [], isLoading: workoutsLoading } = useQuery({
        queryKey: ['fitness-workouts'],
        queryFn: () => fitnessApi.getWorkouts(),
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['fitness-weekly-stats'],
        queryFn: () => fitnessApi.getWeeklyStats(),
    });

    const loading = workoutsLoading || statsLoading;

    const openDialog = () => {
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
    };

    const openDetail = (sessionId: string, edit = false) => {
        setDetailSessionId(sessionId);
        setDetailEditMode(edit);
    };

    const closeDetail = () => {
        setDetailSessionId(null);
        setDetailEditMode(false);
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
                <button
                    type="button"
                    onClick={() => openDialog()}
                    className="btn-primary inline-flex items-center gap-1.5 text-sm"
                >
                    <Plus size={16} />
                    添加记录
                </button>
            </header>

            <WeeklyStatsCards stats={stats} />

            {/* 日历 + 常练动作：桌面端并排，移动端堆叠 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FitnessCalendar onSelectDate={(date) => {
                    const dayGroup = workoutsByDate.find(g => g.date === date);
                    if (dayGroup?.sessions[0]) {
                        openDetail(dayGroup.sessions[0].id);
                    }
                }} />
                <TopExercises workoutsByDate={workoutsByDate} />
            </div>

            <WorkoutList
                workoutsByDate={workoutsByDate}
                onView={(id) => openDetail(id)}
                onEdit={(id) => openDetail(id, true)}
                onAddWorkout={() => openDialog()}
            />

            <NewWorkoutDialog
                open={dialogOpen}
                onClose={closeDialog}
            />

            <WorkoutDetailDialog
                sessionId={detailSessionId}
                editMode={detailEditMode}
                onClose={closeDetail}
            />
        </div>
    );
}

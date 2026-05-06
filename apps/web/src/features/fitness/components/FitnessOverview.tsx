'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dumbbell, Plus } from 'lucide-react';
import { fitnessApi } from '@/features/fitness';
import { WeeklyStatsCards } from '@/features/fitness';
import { WorkoutList } from '@/features/fitness';
import { NewWorkoutDialog } from './NewWorkoutDialog';
import { WorkoutDetailDialog } from './WorkoutDetailDialog';
import { FitnessCalendar } from './FitnessCalendar';
import { TopExercises } from './TopExercises';
import { Button, PageHero } from '@/components/ui';

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
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="人生领域 / 健身"
                icon={<Dumbbell size={18} className="text-success" />}
                title="健身领域"
                description="把本周训练、动作分布和历史记录放在一个稳定视图里，方便持续推进。"
                compact
                action={
                    <Button onClick={() => openDialog()} variant="tinted" size="sm" className="gap-1.5">
                        <Plus size={16} />
                        添加记录
                    </Button>
                }
            />

            <WeeklyStatsCards stats={stats} />

            {/* 日历 + 常练动作：桌面端并排，移动端堆叠 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-section">
                <FitnessCalendar onSelectDate={(date) => {
                    const dayGroup = workoutsByDate.find(g => g.date === date);
                    if (dayGroup?.sessions[0]) {
                        openDetail(dayGroup.sessions[0].id);
                    }
                }} />
                <TopExercises onAddWorkout={openDialog} />
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

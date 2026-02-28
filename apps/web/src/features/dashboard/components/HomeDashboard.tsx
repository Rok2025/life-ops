'use client';

import { useQuery } from '@tanstack/react-query';
import WelcomeHeader from '@/components/WelcomeHeader';
import { FrogsWidget, frogsApi } from '@/features/daily-frogs';
import { TilWidget, tilApi } from '@/features/daily-til';
import { NotesWidget, notesApi } from '@/features/quick-notes';
import { ClientFitnessAreaCard, fitnessApi } from '@/features/fitness';
import { GrowthAreaCard } from '@/features/growth-projects';
import { OutputAreaCard } from '@/features/output';
import { getLocalDateStr } from '@/lib/utils/date';

export default function HomeDashboard() {
    const today = getLocalDateStr();

    const { data: frogsStats } = useQuery({
        queryKey: ['frogs-stats', today],
        queryFn: () => frogsApi.getStats(today),
    });

    const { data: tilCount } = useQuery({
        queryKey: ['til-count', today],
        queryFn: () => tilApi.getCount(today),
    });

    const { data: notesCount } = useQuery({
        queryKey: ['notes-count', today],
        queryFn: () => notesApi.getCount(today),
    });

    const { data: weeklyWorkoutDays } = useQuery({
        queryKey: ['weekly-workout-days'],
        queryFn: () => fitnessApi.getWeeklyWorkoutDays(),
    });

    return (
        <div>
            <WelcomeHeader
                userName="Rok"
                frogsCompleted={frogsStats?.completed ?? 0}
                frogsTotal={frogsStats?.total ?? 0}
                tilCount={tilCount ?? 0}
                notesCount={notesCount ?? 0}
                workoutDays={weeklyWorkoutDays ?? 0}
                workoutTarget={3}
            />

            <section className="mb-section grid grid-cols-1 lg:grid-cols-2 gap-section">
                <FrogsWidget initialDate={today} />
                <TilWidget initialDate={today} />
            </section>

            <section className="mb-section">
                <NotesWidget initialDate={today} />
            </section>

            <section>
                <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-widget-header">
                    人生领域
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ClientFitnessAreaCard target={3} unit="天" />
                    <GrowthAreaCard />
                    <OutputAreaCard />
                </div>
            </section>
        </div>
    );
}

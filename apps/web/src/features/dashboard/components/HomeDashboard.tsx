'use client';

import { useQuery } from '@tanstack/react-query';
import WelcomeHeader from '@/components/WelcomeHeader';
import { FrogsWidget, frogsApi } from '@/features/daily-frogs';
import { TilWidget, tilApi } from '@/features/daily-til';
import { NotesWidget, notesApi } from '@/features/quick-notes';
import { ClientFitnessAreaCard, fitnessApi } from '@/features/fitness';
import { GrowthAreaCard } from '@/features/growth-projects';
import { OutputAreaCard } from '@/features/output';
import { EnglishDailyWidget } from '@/features/english-learning';
import { getLocalDateStr } from '@/lib/utils/date';
import { SectionHeader } from '@/components/ui';

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
        queryKey: ['notes-count', today, 'notes-only'],
        queryFn: () => notesApi.getCount(today, { includeTodos: false }),
    });

    const { data: weeklyWorkoutDays } = useQuery({
        queryKey: ['weekly-workout-days'],
        queryFn: () => fitnessApi.getWeeklyWorkoutDays(),
    });

    return (
        <div className="space-y-4 xl:space-y-[1.125rem]">
            <section className="relative isolate">
                <div className="pointer-events-none absolute inset-x-10 top-3 -z-10 h-24 rounded-2xl bg-accent/5 blur-3xl dark:bg-accent/4" />
                <div className="pointer-events-none absolute left-12 top-5 -z-10 h-20 w-44 rounded-full bg-white/8 blur-3xl dark:bg-white/4" />
                <div className="pointer-events-none absolute right-16 top-10 -z-10 h-16 w-16 rounded-full bg-tone-sky/12 blur-3xl dark:bg-tone-sky/8" />
                <WelcomeHeader
                    userName="Rok"
                    frogsCompleted={frogsStats?.completed ?? 0}
                    frogsTotal={frogsStats?.total ?? 0}
                    tilCount={tilCount ?? 0}
                    notesCount={notesCount ?? 0}
                    workoutDays={weeklyWorkoutDays ?? 0}
                    workoutTarget={3}
                />
            </section>

            <section className="grid grid-cols-1 gap-3 xl:gap-4 lg:grid-cols-2">
                <FrogsWidget initialDate={today} />
                <TilWidget initialDate={today} />
            </section>

            <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.92fr)] xl:items-stretch">
                <NotesWidget initialDate={today} />
                <EnglishDailyWidget />
            </section>

            <section>
                <SectionHeader
                    title="人生领域"
                    className="mb-3"
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <ClientFitnessAreaCard target={3} unit="天" />
                    <GrowthAreaCard />
                    <OutputAreaCard />
                </div>
            </section>
        </div>
    );
}

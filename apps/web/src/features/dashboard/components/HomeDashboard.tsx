'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import WelcomeHeader from '@/components/WelcomeHeader';
import { frogsApi } from '@/features/daily-frogs/api/frogsApi';
import { tilApi } from '@/features/daily-til/api/tilApi';
import { notesApi } from '@/features/quick-notes/api/notesApi';
import { fitnessApi } from '@/features/fitness/api/fitnessApi';
import { getLocalDateStr } from '@/lib/utils/date';
import { Card, SectionHeader } from '@/components/ui';
import type { HomeDashboardSnapshot } from '../types';

type HomeDashboardProps = {
    initialData?: HomeDashboardSnapshot;
};

type DateWidgetProps = {
    initialDate?: string;
};

type FitnessAreaCardProps = {
    target: number;
    unit: string;
};

const FrogsWidget = dynamic<DateWidgetProps>(
    () => import('@/features/daily-frogs/components/FrogsWidget'),
    { loading: () => <DashboardWidgetSkeleton title="三只青蛙" /> },
);

const TilWidget = dynamic<DateWidgetProps>(
    () => import('@/features/daily-til/components/TilWidget'),
    { loading: () => <DashboardWidgetSkeleton title="TIL" /> },
);

const NotesWidget = dynamic<DateWidgetProps>(
    () => import('@/features/quick-notes/components/NotesWidget'),
    { loading: () => <DashboardWidgetSkeleton title="随手记" tall /> },
);

const EnglishDailyWidget = dynamic(
    () => import('@/features/english-learning/components/EnglishDailyWidget'),
    { loading: () => <DashboardWidgetSkeleton title="今日英语" tall /> },
);

const ClientFitnessAreaCard = dynamic<FitnessAreaCardProps>(
    () => import('@/features/fitness/components/ClientFitnessAreaCard').then((mod) => mod.ClientFitnessAreaCard),
    { loading: () => <AreaCardSkeleton title="健身" /> },
);

const GrowthAreaCard = dynamic(
    () => import('@/features/growth-projects/components/GrowthAreaCard').then((mod) => mod.GrowthAreaCard),
    { loading: () => <AreaCardSkeleton title="成长" /> },
);

const OutputAreaCard = dynamic(
    () => import('@/features/output/components/OutputAreaCard').then((mod) => mod.OutputAreaCard),
    { loading: () => <AreaCardSkeleton title="输出" /> },
);

function DashboardWidgetSkeleton({ title, tall = false }: { title: string; tall?: boolean }) {
    return (
        <Card className={['p-card', tall ? 'min-h-[18rem]' : 'min-h-[13rem]'].join(' ')}>
            <div className="mb-widget-header flex items-center justify-between">
                <div className="h-5 w-24 rounded bg-bg-tertiary" aria-label={`${title} 加载中`} />
                <div className="h-8 w-16 rounded-control bg-bg-tertiary" />
            </div>
            <div className="space-y-2">
                <div className="h-10 rounded-inner-card bg-bg-tertiary" />
                <div className="h-10 rounded-inner-card bg-bg-tertiary" />
                <div className="h-10 rounded-inner-card bg-bg-tertiary" />
            </div>
        </Card>
    );
}

function AreaCardSkeleton({ title }: { title: string }) {
    return (
        <Card className="h-full min-h-[10rem] p-card">
            <div className="mb-widget-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-bg-tertiary" />
                    <div className="h-4 w-14 rounded bg-bg-tertiary" aria-label={`${title} 加载中`} />
                </div>
                <div className="h-6 w-16 rounded-full bg-bg-tertiary" />
            </div>
            <div className="space-y-2">
                <div className="h-4 rounded bg-bg-tertiary" />
                <div className="h-2 rounded-full bg-bg-tertiary" />
            </div>
        </Card>
    );
}

export default function HomeDashboard({ initialData }: HomeDashboardProps) {
    const today = initialData?.today ?? getLocalDateStr();

    const { data: frogsStats } = useQuery({
        queryKey: ['frogs-stats', today],
        queryFn: () => frogsApi.getStats(today),
        initialData: initialData?.frogsStats,
    });

    const { data: tilCount } = useQuery({
        queryKey: ['til-count', today],
        queryFn: () => tilApi.getCount(today),
        initialData: initialData?.tilCount,
    });

    const { data: notesCount } = useQuery({
        queryKey: ['notes-count', today, 'notes-only'],
        queryFn: () => notesApi.getCount(today, { includeTodos: false }),
        initialData: initialData?.notesCount,
    });

    const { data: weeklyWorkoutDays } = useQuery({
        queryKey: ['weekly-workout-days'],
        queryFn: () => fitnessApi.getWeeklyWorkoutDays(),
        initialData: initialData?.weeklyWorkoutDays,
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

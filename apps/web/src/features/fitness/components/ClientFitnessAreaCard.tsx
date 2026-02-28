'use client';

import { Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fitnessApi } from '@/features/fitness/api/fitnessApi';

export function ClientFitnessAreaCard({
    target, unit,
}: {
    target: number; unit: string;
}) {
    const { data: current = 0 } = useQuery({
        queryKey: ['weekly-workout-days'],
        queryFn: () => fitnessApi.getWeeklyWorkoutDays(),
    });

    const progress = Math.round((current / target) * 100);
    const status = progress >= 100 ? 'success' : progress >= 50 ? 'warning' : 'danger';
    const statusLabel = progress >= 100 ? 'OK' : progress >= 50 ? '进行中' : '需关注';

    return (
        <Link href="/fitness" className="card p-card block hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-widget-header">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <Dumbbell size={16} className="text-accent" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">健身</h3>
                </div>
                <span className={`pill pill-${status}`}>{statusLabel}</span>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">本周进度</span>
                    <span className="font-medium text-text-primary">{current}/{target} {unit}</span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${status === 'success' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-danger'
                            }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>
        </Link>
    );
}

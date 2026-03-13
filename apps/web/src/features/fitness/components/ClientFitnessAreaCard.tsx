'use client';

import { Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fitnessApi } from '@/features/fitness/api/fitnessApi';
import { Card } from '@/components/ui';

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
        <Link href="/fitness">
            <Card className="block h-full p-card transition-all duration-normal ease-standard hover:-translate-y-0.5 hover:bg-card-bg">
                <div className="flex items-center justify-between mb-widget-header">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                            <Dumbbell size={16} className="text-accent" />
                        </div>
                        <h3 className="text-body font-semibold text-text-primary">健身</h3>
                    </div>
                    <span className={`pill pill-${status}`}>{statusLabel}</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-body-sm">
                        <span className="text-text-secondary">本周进度</span>
                        <span className="font-medium text-text-primary">{current}/{target} {unit}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary/90">
                        <div
                            className={`h-full rounded-full transition-all duration-normal ease-standard ${status === 'success' ? 'bg-success/80' : status === 'warning' ? 'bg-warning/78' : 'bg-danger/76'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>
            </Card>
        </Link>
    );
}

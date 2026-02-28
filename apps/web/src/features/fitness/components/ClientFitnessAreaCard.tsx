'use client';

import { Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fitnessApi } from '@/features/fitness/api/fitnessApi';

export function ClientFitnessAreaCard({
    target, unit,
}: {
    target: number; unit: string;
}) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        async function loadStats() {
            const days = await fitnessApi.getWeeklyWorkoutDays();
            setCurrent(days);
        }
        loadStats();
    }, []);

    const progress = Math.round((current / target) * 100);
    const status = progress >= 100 ? 'success' : progress >= 50 ? 'warning' : 'danger';
    const statusLabel = progress >= 100 ? 'OK' : progress >= 50 ? '进行中' : '需关注';

    return (
        <Link href="/fitness" className="card p-6 block hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <Dumbbell size={20} className="text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary">健身</h3>
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

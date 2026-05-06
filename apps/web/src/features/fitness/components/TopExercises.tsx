'use client';

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, TrendingUp } from 'lucide-react';
import type { TopExercisesPeriod } from '../types';
import { getCategoryConfig } from '../types';
import { fitnessApi } from '@/features/fitness/api/fitnessApi';
import { Button, Card, SegmentedControl } from '@/components/ui';

interface TopExercisesProps {
    onAddWorkout?: () => void;
}

const PERIOD_OPTIONS: Array<{ value: TopExercisesPeriod; label: string }> = [
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'year', label: '本年' },
];

const EMPTY_LABELS: Record<TopExercisesPeriod, string> = {
    week: '本周无训练记录',
    month: '本月无训练记录',
    year: '本年无训练记录',
};

function isTopExercisesPeriod(value: string): value is TopExercisesPeriod {
    return value === 'week' || value === 'month' || value === 'year';
}

function formatLoadTons(weightKg: number): string {
    return `${(weightKg / 1000).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}吨`;
}

export function TopExercises({ onAddWorkout }: TopExercisesProps) {
    const [period, setPeriod] = useState<TopExercisesPeriod>('week');

    const handlePeriodChange = useCallback((value: string) => {
        if (isTopExercisesPeriod(value)) {
            setPeriod(value);
        }
    }, []);

    const { data: topExercises = [], isError, isLoading } = useQuery({
        queryKey: ['fitness-top-exercises', period],
        queryFn: () => fitnessApi.getTopExercises(period),
    });

    const maxCount = Math.max(topExercises[0]?.sessionCount ?? 1, 1);

    return (
        <Card className="p-3 min-h-[224px]">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-accent" />
                    <h3 className="text-body-sm font-medium text-text-secondary">常练动作 Top 5</h3>
                </div>
                <SegmentedControl
                    value={period}
                    onChange={handlePeriodChange}
                    options={PERIOD_OPTIONS}
                    size="sm"
                    optionClassName="min-w-10"
                    aria-label="常练动作周期"
                />
            </div>

            {isLoading ? (
                <div className="space-y-3 py-1">
                    {Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="h-4 w-4 rounded bg-bg-tertiary" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-2/3 rounded bg-bg-tertiary" />
                                <div className="h-1.5 rounded-full bg-bg-tertiary" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="flex min-h-[150px] items-center justify-center text-body-sm text-text-secondary">
                    常练动作加载失败
                </div>
            ) : topExercises.length === 0 ? (
                <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 text-center">
                    <p className="text-body-sm text-text-secondary">{EMPTY_LABELS[period]}</p>
                    {onAddWorkout ? (
                        <Button onClick={onAddWorkout} variant="ghost" size="sm" className="gap-1.5">
                            <Plus size={14} />
                            添加记录
                        </Button>
                    ) : null}
                </div>
            ) : (
                <div className="space-y-2">
                    {topExercises.map((ex, i) => {
                        const config = getCategoryConfig(ex.category);
                        const percentage = Math.round((ex.sessionCount / maxCount) * 100);

                        return (
                            <div key={ex.exerciseTypeId} className="flex items-center gap-3">
                                <span className="text-caption text-text-secondary w-4 text-right">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className="min-w-0 flex-1 truncate text-body-sm text-text-primary">{ex.name}</span>
                                        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-caption text-text-secondary">
                                            <span className={`text-caption px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                                                {config.label}
                                            </span>
                                            <span>{ex.sessionCount}次</span>
                                            <span className="text-text-tertiary">·</span>
                                            <span>{ex.totalSets}组</span>
                                            <span className="text-text-tertiary">·</span>
                                            <span>{formatLoadTons(ex.totalVolume)}</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent/60 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

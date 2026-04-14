'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Syringe, Check, Undo2, Plus, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { healthApi } from '../api/healthApi';
import { useVaccinations } from '../hooks/useHealth';
import type { Vaccination } from '../types';
import { Card, Button, Badge, PageHero } from '@/components/ui';
import { VaccinationFormDialog } from './VaccinationFormDialog';

function getVaccineStatus(v: Vaccination): 'completed' | 'overdue' | 'upcoming' | 'future' {
    if (v.actual_date) return 'completed';
    if (!v.scheduled_date) return 'future';
    const today = new Date().toISOString().slice(0, 10);
    if (v.scheduled_date < today) return 'overdue';
    // within 30 days
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    if (v.scheduled_date <= soon.toISOString().slice(0, 10)) return 'upcoming';
    return 'future';
}

const STATUS_BADGE: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'default' }> = {
    completed: { label: '已接种', tone: 'success' },
    overdue:   { label: '已逾期', tone: 'warning' },
    upcoming:  { label: '即将到期', tone: 'default' },
    future:    { label: '未到期', tone: 'default' },
};

export function VaccinationList() {
    const { data: vaccinations = [], isLoading } = useVaccinations();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);

    const markMutation = useMutation({
        mutationFn: (id: string) => healthApi.markVaccinated(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-vaccinations'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-vaccination-stats'] });
        },
    });

    const unmarkMutation = useMutation({
        mutationFn: (id: string) => healthApi.unmarkVaccinated(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-vaccinations'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-vaccination-stats'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => healthApi.deleteVaccination(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-vaccinations'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-vaccination-stats'] });
        },
    });

    const completed = vaccinations.filter(v => v.actual_date);
    const pending = vaccinations.filter(v => !v.actual_date);
    const completedCount = completed.length;
    const totalCount = vaccinations.length;

    const handleMarkDone = useCallback((id: string) => markMutation.mutate(id), [markMutation]);
    const handleUnmark = useCallback((id: string) => unmarkMutation.mutate(id), [unmarkMutation]);

    if (isLoading) return <div className="p-8 text-center text-text-tertiary">加载中...</div>;

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="又又 / 健康管理"
                icon={<Syringe size={18} />}
                title="疫苗接种"
                description="追踪国家免疫规划疫苗接种进度"
                stats={[
                    {
                        label: '接种进度',
                        value: `${completedCount}/${totalCount}`,
                        meta: totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : '',
                        tone: 'success',
                    },
                ]}
                action={
                    <Button size="sm" onClick={() => setShowForm(true)}>
                        <Plus size={14} />
                        添加疫苗
                    </Button>
                }
            />

            {/* 待接种列表 */}
            {pending.length > 0 && (
                <Card className="p-card">
                    <div className="flex items-center gap-2 mb-widget-header">
                        <Clock size={16} className="text-accent" />
                        <h3 className="text-body font-semibold text-text-primary">待接种 ({pending.length})</h3>
                    </div>
                    <div className="space-y-2">
                        {pending.map(v => {
                            const status = getVaccineStatus(v);
                            const badge = STATUS_BADGE[status];
                            return (
                                <div
                                    key={v.id}
                                    className="flex items-center gap-3 rounded-inner-card border border-glass-border/60 bg-panel-bg/60 px-3 py-2.5"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-body-sm font-medium text-text-primary">
                                                {v.vaccine_name}
                                            </span>
                                            {v.dose_number > 1 && (
                                                <span className="text-caption text-text-tertiary">
                                                    第{v.dose_number}剂
                                                </span>
                                            )}
                                            <Badge tone={badge.tone}>{badge.label}</Badge>
                                        </div>
                                        {v.scheduled_date && (
                                            <p className="text-caption text-text-tertiary mt-0.5">
                                                计划: {v.scheduled_date}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleMarkDone(v.id)}
                                            className="rounded p-1.5 text-success hover:bg-success/10 transition-colors"
                                            title="标记已接种"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteMutation.mutate(v.id)}
                                            className="rounded p-1.5 text-text-tertiary hover:text-danger hover:bg-bg-tertiary transition-colors"
                                            title="删除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* 已接种列表 */}
            {completed.length > 0 && (
                <Card className="p-card">
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-2 mb-widget-header text-left w-full"
                    >
                        <CheckCircle2 size={16} className="text-success" />
                        <h3 className="text-body font-semibold text-text-primary">已接种 ({completed.length})</h3>
                        <span className="text-caption text-text-tertiary ml-auto">
                            {showCompleted ? '收起' : '展开'}
                        </span>
                    </button>
                    {showCompleted && (
                        <div className="space-y-2">
                            {completed.map(v => (
                                <div
                                    key={v.id}
                                    className="flex items-center gap-3 rounded-inner-card border border-glass-border/60 bg-panel-bg/60 px-3 py-2.5 opacity-70"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-body-sm text-text-primary line-through">
                                                {v.vaccine_name}
                                            </span>
                                            {v.dose_number > 1 && (
                                                <span className="text-caption text-text-tertiary">
                                                    第{v.dose_number}剂
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-caption text-text-tertiary mt-0.5">
                                            接种日期: {v.actual_date}
                                            {v.location && ` · ${v.location}`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleUnmark(v.id)}
                                        className="rounded p-1.5 text-text-tertiary hover:text-warning hover:bg-bg-tertiary transition-colors"
                                        title="撤销接种"
                                    >
                                        <Undo2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            <VaccinationFormDialog open={showForm} onClose={() => setShowForm(false)} />
        </div>
    );
}

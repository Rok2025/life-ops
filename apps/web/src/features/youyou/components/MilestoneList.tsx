'use client';

import { useState, useCallback } from 'react';
import { Plus, Trophy, Check, Undo2, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMilestones } from '../hooks/useMilestones';
import { youyouApi } from '../api/youyouApi';
import { MILESTONE_CATEGORY_CONFIG } from '../types';
import type { MilestoneCategory, Milestone } from '../types';
import { MilestoneFormDialog } from './MilestoneFormDialog';
import { Button, Card, PageHero } from '@/components/ui';

export function MilestoneList() {
    const [catFilter, setCatFilter] = useState<MilestoneCategory | null>(null);
    const [showAchieved, setShowAchieved] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const { data: milestones = [], isLoading } = useMilestones(catFilter ?? undefined);
    const queryClient = useQueryClient();

    const pending = milestones.filter(m => !m.achieved_at);
    const achieved = milestones.filter(m => m.achieved_at);

    const achieveMutation = useMutation({
        mutationFn: (id: string) => youyouApi.achieveMilestone(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-milestones'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-milestone-stats'] });
        },
    });

    const unachieveMutation = useMutation({
        mutationFn: (id: string) => youyouApi.unachieveMilestone(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-milestones'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-milestone-stats'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => youyouApi.deleteMilestone(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-milestones'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-milestone-stats'] });
        },
    });

    const handleAchieve = useCallback((m: Milestone) => {
        achieveMutation.mutate(m.id);
    }, [achieveMutation]);

    const handleUnachieve = useCallback((m: Milestone) => {
        unachieveMutation.mutate(m.id);
    }, [unachieveMutation]);

    const handleDelete = useCallback((m: Milestone) => {
        if (!confirm(`确定删除里程碑「${m.title}」？`)) return;
        deleteMutation.mutate(m.id);
    }, [deleteMutation]);

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="成长 / 又又"
                icon={<Trophy size={18} />}
                title="里程碑"
                description="追踪又又的关键发育里程碑，记录每一个珍贵的「第一次」。"
                action={
                    <Button onClick={() => setShowForm(true)} variant="tinted" size="sm" className="gap-1">
                        <Plus size={16} />
                        新增里程碑
                    </Button>
                }
                stats={[
                    {
                        label: '待解锁',
                        value: pending.length,
                        tone: 'accent',
                    },
                    {
                        label: '已达成',
                        value: achieved.length,
                        meta: showAchieved ? '已展开' : '已收起',
                        tone: 'success',
                    },
                ]}
            >
                {/* Category filter */}
                <div className="glass-filter-bar flex items-center">
                    <button
                        onClick={() => setCatFilter(null)}
                        className={`glass-filter-chip text-caption ${!catFilter ? 'glass-filter-chip-active' : ''}`}
                    >
                        全部
                    </button>
                    {(Object.keys(MILESTONE_CATEGORY_CONFIG) as MilestoneCategory[]).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                            className={`glass-filter-chip text-caption ${catFilter === cat ? 'glass-filter-chip-active' : ''}`}
                        >
                            {MILESTONE_CATEGORY_CONFIG[cat].emoji} {MILESTONE_CATEGORY_CONFIG[cat].label}
                        </button>
                    ))}
                </div>
                {achieved.length > 0 && (
                    <button
                        onClick={() => setShowAchieved(!showAchieved)}
                        className="glass-mini-chip text-body-sm transition-colors duration-normal ease-standard hover:bg-card-bg"
                    >
                        {showAchieved ? '隐藏已达成' : `查看已达成 ${achieved.length}`}
                    </button>
                )}
            </PageHero>

            {/* Milestone cards */}
            {isLoading ? (
                <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                    加载中...
                </Card>
            ) : pending.length === 0 && achieved.length === 0 ? (
                <Card className="p-card-lg text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                        <Trophy size={28} className="text-text-secondary" />
                    </div>
                    <p className="text-body text-text-primary">还没有里程碑</p>
                    <p className="mt-1 text-body-sm text-text-secondary">
                        添加又又的发育里程碑，记录成长中的每个突破。
                    </p>
                    <Button onClick={() => setShowForm(true)} variant="tinted" size="sm" className="mt-4 gap-1">
                        <Plus size={16} />
                        添加第一个里程碑
                    </Button>
                </Card>
            ) : (
                <>
                    {/* Pending */}
                    <div className="space-y-1.5">
                        {pending.map(m => (
                            <MilestoneCard
                                key={m.id}
                                milestone={m}
                                onAchieve={handleAchieve}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    {/* Achieved */}
                    {achieved.length > 0 && showAchieved && (
                        <div className="space-y-1.5 opacity-70">
                            {achieved.map(m => (
                                <MilestoneCard
                                    key={m.id}
                                    milestone={m}
                                    onUnachieve={handleUnachieve}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            <MilestoneFormDialog
                open={showForm}
                onClose={() => setShowForm(false)}
            />
        </div>
    );
}

// ── MilestoneCard ────────────────────────────────────────

interface MilestoneCardProps {
    milestone: Milestone;
    onAchieve?: (m: Milestone) => void;
    onUnachieve?: (m: Milestone) => void;
    onDelete: (m: Milestone) => void;
}

function MilestoneCard({ milestone, onAchieve, onUnachieve, onDelete }: MilestoneCardProps) {
    const cfg = MILESTONE_CATEGORY_CONFIG[milestone.category];
    const isAchieved = !!milestone.achieved_at;

    return (
        <Card className="flex items-center gap-3 p-3">
            {/* Category emoji */}
            <span className={`text-base ${isAchieved ? '' : 'opacity-60'}`}>{cfg.emoji}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`text-body-sm font-medium ${isAchieved ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                        {milestone.title}
                    </span>
                    <span className={`text-caption px-1.5 py-0.5 rounded-control ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                    </span>
                </div>
                {milestone.description && (
                    <p className="mt-0.5 text-caption text-text-tertiary truncate">{milestone.description}</p>
                )}
                <div className="flex items-center gap-3 mt-0.5 text-caption text-text-tertiary">
                    {milestone.expected_age_months && (
                        <span>预期 ~{milestone.expected_age_months} 月龄</span>
                    )}
                    {isAchieved && (
                        <span className="text-success">✓ {milestone.achieved_at?.slice(5)} 达成</span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                {isAchieved ? (
                    <button
                        onClick={() => onUnachieve?.(milestone)}
                        className="rounded-control p-1.5 text-text-tertiary transition-colors hover:bg-panel-bg hover:text-warning"
                        title="撤销达成"
                    >
                        <Undo2 size={14} />
                    </button>
                ) : (
                    <button
                        onClick={() => onAchieve?.(milestone)}
                        className="rounded-control p-1.5 text-text-tertiary transition-colors hover:bg-success/14 hover:text-success"
                        title="标记达成"
                    >
                        <Check size={14} />
                    </button>
                )}
                <button
                    onClick={() => onDelete(milestone)}
                    className="rounded-control p-1.5 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
                    title="删除"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </Card>
    );
}

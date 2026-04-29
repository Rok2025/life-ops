import { Calendar, CalendarDays } from 'lucide-react';
import type { WeeklyStats } from '../types';
import { TONES } from '@/design-system/tokens';
import { WEEKLY_GOAL, getCategoryConfig } from '../types';
import { Card } from '@/components/ui';

function formatLoadTons(weightKg: number): string {
    return `${(weightKg / 1000).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}吨`;
}

interface WeeklyStatsCardsProps {
    stats: WeeklyStats;
}

const CATEGORY_COLOR_VARS: Record<string, string> = {
    chest: 'var(--danger)',
    back: 'var(--tone-blue)',
    legs: 'var(--tone-green)',
    shoulders: 'var(--tone-yellow)',
    arms: 'var(--tone-purple)',
    core: 'var(--tone-orange)',
    cardio: 'var(--tone-cyan)',
    other: 'var(--text-tertiary)',
};

function getCategoryColor(category: string): string {
    return CATEGORY_COLOR_VARS[category] ?? 'var(--text-tertiary)';
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(angleRad),
        y: cy + radius * Math.sin(angleRad),
    };
}

function describeSlice(startAngle: number, endAngle: number): string {
    const start = polarToCartesian(50, 50, 42, endAngle);
    const end = polarToCartesian(50, 50, 42, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
        `M 50 50`,
        `L ${start.x} ${start.y}`,
        `A 42 42 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        'Z',
    ].join(' ');
}

function CategoryPieChart({ breakdown }: { breakdown: Record<string, number> }) {
    const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    if (total === 0) {
        return (
            <div className="flex h-full min-h-[7.75rem] w-28 shrink-0 flex-col items-center justify-center gap-2">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-glass-border bg-bg-tertiary text-caption text-text-tertiary">
                    暂无
                </div>
                <span className="text-caption text-text-tertiary">训练分布</span>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-[7.75rem] w-28 shrink-0 flex-col items-center justify-between gap-2">
            <svg viewBox="0 0 100 100" className="h-20 w-20" role="img" aria-label="训练分布饼图">
                {entries.map(([category, count], index) => {
                    const priorTotal = entries.slice(0, index).reduce((sum, [, priorCount]) => sum + priorCount, 0);
                    const startAngle = (priorTotal / total) * 360;
                    const endAngle = startAngle + (count / total) * 360;

                    if (entries.length === 1) {
                        return (
                            <circle key={category} cx="50" cy="50" r="42" fill={getCategoryColor(category)}>
                                <title>{`${getCategoryConfig(category).label} ${count}组`}</title>
                            </circle>
                        );
                    }

                    return (
                        <path
                            key={category}
                            d={describeSlice(startAngle, endAngle)}
                            fill={getCategoryColor(category)}
                            stroke="var(--panel-bg)"
                            strokeWidth="1.5"
                        >
                            <title>{`${getCategoryConfig(category).label} ${count}组`}</title>
                        </path>
                    );
                })}
                <circle cx="50" cy="50" r="22" fill="var(--panel-bg)" />
                <text
                    x="50"
                    y="48"
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    className="text-[16px] font-semibold"
                >
                    {total}
                </text>
                <text x="50" y="63" textAnchor="middle" fill="var(--text-tertiary)" className="text-[10px]">
                    组
                </text>
            </svg>
            <div className="grid w-full grid-cols-1 gap-1">
                {entries.slice(0, 3).map(([category, count]) => {
                    const config = getCategoryConfig(category);

                    return (
                        <div key={category} className="flex min-w-0 items-center justify-between gap-1">
                            <span className="flex min-w-0 items-center gap-1">
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: getCategoryColor(category) }}
                                />
                                <span className="truncate text-caption text-text-secondary">{config.label}</span>
                            </span>
                            <span className={`shrink-0 text-caption font-medium ${config.color}`}>{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function WeeklyStatsCards({ stats }: WeeklyStatsCardsProps) {
    const progress = Math.round((stats.count / WEEKLY_GOAL) * 100);
    const monthProgress = Math.round((stats.monthCount / Math.max(stats.monthGoal, 1)) * 100);

    return (
        <>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-section">
                <Card className="p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-success" />
                            <span className="text-body-sm font-medium text-text-primary">本周训练</span>
                        </div>
                        <span className="text-caption text-success">{stats.trainedToday ? '今天已训练' : '等待记录'}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_7rem] items-stretch gap-4">
                        <div className="flex min-w-0 flex-col justify-between">
                            <div>
                                <div className="flex items-baseline justify-between gap-3">
                                    <div>
                                        <span className="text-h2 text-text-primary">{stats.count}</span>
                                        <span className="text-body-sm text-text-secondary">/ {WEEKLY_GOAL} 天</span>
                                    </div>
                                    <span className="text-caption text-text-tertiary">每周 {WEEKLY_GOAL} 次目标</span>
                                </div>
                                <div className="mt-2 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-success rounded-full transition-all duration-normal ease-standard"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-t border-glass-border/70 pt-3">
                                <div>
                                    <div className="text-caption text-text-tertiary">总组数</div>
                                    <div className="mt-1 text-body font-semibold text-text-primary">{stats.totalSets} 组</div>
                                </div>
                                <div>
                                    <div className="text-caption text-text-tertiary">总负荷</div>
                                    <div className="mt-1 text-body font-semibold text-text-primary">{formatLoadTons(stats.totalVolume)}</div>
                                </div>
                            </div>
                        </div>
                        <CategoryPieChart breakdown={stats.categoryBreakdown} />
                    </div>
                </Card>

                <Card className="p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <CalendarDays size={18} className={TONES.blue.color} />
                            <span className="text-body-sm font-medium text-text-primary">本月训练</span>
                        </div>
                        <span className={`text-caption ${TONES.blue.color}`}>当月累计</span>
                    </div>
                    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_7rem] items-stretch gap-4">
                        <div className="flex min-w-0 flex-col justify-between">
                            <div>
                                <div className="flex items-baseline justify-between gap-3">
                                    <div>
                                        <span className="text-h2 text-text-primary">{stats.monthCount}</span>
                                        <span className="text-body-sm text-text-secondary">/ {stats.monthGoal} 天</span>
                                    </div>
                                    <span className="text-caption text-text-tertiary">按每周 {WEEKLY_GOAL} 次折算</span>
                                </div>
                                <div className="mt-2 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent rounded-full transition-all duration-normal ease-standard"
                                        style={{ width: `${Math.min(monthProgress, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-t border-glass-border/70 pt-3">
                                <div>
                                    <div className="text-caption text-text-tertiary">总组数</div>
                                    <div className="mt-1 text-body font-semibold text-text-primary">{stats.monthTotalSets} 组</div>
                                </div>
                                <div>
                                    <div className="text-caption text-text-tertiary">总负荷</div>
                                    <div className="mt-1 text-body font-semibold text-text-primary">{formatLoadTons(stats.monthTotalVolume)}</div>
                                </div>
                            </div>
                        </div>
                        <CategoryPieChart breakdown={stats.monthCategoryBreakdown} />
                    </div>
                </Card>
            </section>
        </>
    );
}

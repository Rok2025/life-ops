import { Calendar, TrendingUp, Dumbbell, Flame } from 'lucide-react';
import type { WeeklyStats } from '../types';
import { WEEKLY_GOAL, CATEGORY_CONFIG } from '../types';

/** 格式化体积 (kg) */
function formatVolume(volume: number): string {
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}t`;
    return `${volume}kg`;
}

interface WeeklyStatsCardsProps {
    stats: WeeklyStats;
}

export function WeeklyStatsCards({ stats }: WeeklyStatsCardsProps) {
    const progress = Math.round((stats.count / WEEKLY_GOAL) * 100);
    const maxCategoryCount = Math.max(...Object.values(stats.categoryBreakdown), 1);

    return (
        <>
            {/* 本周统计卡片 */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Calendar size={18} className="text-accent" />
                        <span className="text-sm text-text-secondary">本周训练</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">{stats.count}</span>
                        <span className="text-text-secondary">/ {WEEKLY_GOAL} 天</span>
                    </div>
                    <div className="mt-2 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-success rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp size={18} className="text-blue-400" />
                        <span className="text-sm text-text-secondary">总组数</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">{stats.totalSets}</span>
                        <span className="text-text-secondary">组</span>
                    </div>
                </div>

                <div className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Dumbbell size={18} className="text-orange-400" />
                        <span className="text-sm text-text-secondary">总负荷</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">{formatVolume(stats.totalVolume)}</span>
                    </div>
                </div>

                <div className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Flame size={18} className="text-red-400" />
                        <span className="text-sm text-text-secondary">连续训练</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">{stats.streak}</span>
                        <span className="text-text-secondary">天</span>
                    </div>
                </div>
            </section>

            {/* 肌群分布 */}
            {Object.keys(stats.categoryBreakdown).length > 0 && (
                <section className="card p-4">
                    <h3 className="text-sm font-medium text-text-secondary mb-4">本周肌群训练分布</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(stats.categoryBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([category, count]) => {
                                const config = CATEGORY_CONFIG[category] || { label: category, color: 'text-gray-400', bg: 'bg-gray-500/20' };
                                const percentage = Math.round((count / maxCategoryCount) * 100);
                                return (
                                    <div key={category} className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                                            <span className={`text-sm font-bold ${config.color}`}>{count}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-text-primary">{config.label}</div>
                                            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mt-1">
                                                <div
                                                    className={`h-full rounded-full ${config.bg.replace('/20', '/60')}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </section>
            )}
        </>
    );
}

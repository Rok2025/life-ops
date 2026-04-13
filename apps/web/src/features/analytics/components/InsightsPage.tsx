'use client';

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { PageHero, Card, Button } from '@/components/ui';
import { useInsights } from '../hooks/useInsights';
import type { AnalyticsPeriod } from '../types';
import PeriodSwitcher from './PeriodSwitcher';
import GlobalPulse from './GlobalPulse';
import AreaHealthGrid from './AreaHealthGrid';
import AchievementBoard from './AchievementBoard';
import RiskPanel from './RiskPanel';
import TrendForecastPanel from './TrendForecastPanel';
import UpcomingMilestones from './UpcomingMilestones';

export default function InsightsPage() {
    const [period, setPeriod] = useState<AnalyticsPeriod>('week');
    const { data, isLoading, error, refetch, isFetching } = useInsights(period);

    if (isLoading && !data) {
        return (
            <div className="space-y-4 xl:space-y-5">
                <PageHero
                    eyebrow="全局 / 洞察"
                    icon={<BarChart3 size={18} className="text-accent" />}
                    title="洞察"
                    description="正在把各模块的节奏、成果和风险收拢到同一张图里。"
                />
                <Card className="p-card text-body-sm text-text-secondary">正在生成统计分析视图...</Card>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="space-y-4 xl:space-y-5">
                <PageHero
                    eyebrow="全局 / 洞察"
                    icon={<BarChart3 size={18} className="text-accent" />}
                    title="洞察"
                    description="这一页会统一回答：现在状态怎样、最近做成了什么、接下来最该补哪里。"
                >
                    <PeriodSwitcher value={period} onChange={setPeriod} />
                </PageHero>

                <Card className="p-card">
                    <div className="space-y-3">
                        <div className="text-body font-semibold text-text-primary">洞察页暂时没拿到数据</div>
                        <div className="text-body-sm text-text-secondary">
                            可能是 Supabase 连接、表结构或当前环境变量出了问题。可以先重试一次。
                        </div>
                        <div>
                            <Button onClick={() => refetch()} size="sm" variant="tinted">
                                重新加载
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="全局 / 洞察"
                icon={<BarChart3 size={18} className="text-accent" />}
                title="洞察"
                description={data.heroSummary}
                stats={[
                    {
                        label: '观察周期',
                        value: data.periodLabel,
                        meta: isFetching ? '刷新中' : '已同步',
                        tone: 'accent',
                    },
                    {
                        label: '重点关注',
                        value: data.focusArea,
                        meta: `${data.risks.length} 项风险`,
                        tone: data.risks.length > 0 ? 'warning' : 'success',
                    },
                ]}
            >
                <PeriodSwitcher value={period} onChange={setPeriod} />
            </PageHero>

            <GlobalPulse
                stats={data.globalStats}
                summary="先看全局，再回到具体领域。这里聚焦的是整体稳定度、成果沉淀和风险密度。"
                generatedAt={data.generatedAt}
            />

            <AreaHealthGrid areas={data.areaSnapshots} />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
                <AchievementBoard items={data.achievements} />
                <RiskPanel items={data.risks} />
            </div>

            <TrendForecastPanel metrics={data.trends} />

            <UpcomingMilestones items={data.upcoming} />
        </div>
    );
}

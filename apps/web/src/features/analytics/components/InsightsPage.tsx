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
import TrendForecastPanel from './TrendForecastPanel';
import UpcomingMilestones from './UpcomingMilestones';
import DecisionFocusCard from './DecisionFocusCard';
import ActionQueue from './ActionQueue';

export default function InsightsPage() {
    const [period, setPeriod] = useState<AnalyticsPeriod>('week');
    const { data, isLoading, error, refetch, isFetching } = useInsights(period);
    const secondaryActions = data?.actionQueue.filter((action) => action.id !== data.focusAction?.id) ?? [];

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
                        label: '决策焦点',
                        value: data.focusAction?.areaLabel ?? '平稳',
                        meta: data.focusAction?.metric ?? `${data.risks.length} 项风险`,
                        tone: data.risks.length > 0 ? 'warning' : 'success',
                    },
                ]}
            >
                <PeriodSwitcher value={period} onChange={setPeriod} />
            </PageHero>

            <DecisionFocusCard action={data.focusAction} />

            <ActionQueue actions={secondaryActions} />

            <GlobalPulse
                stats={data.globalStats}
                summary="全局数字只做背景判断，真正的主线已经收束到上面的行动建议里。"
                generatedAt={data.generatedAt}
            />

            <AreaHealthGrid areas={data.areaSnapshots} compact />

            <AchievementBoard items={data.achievements.slice(0, 5)} />

            <TrendForecastPanel metrics={data.trends} />

            <UpcomingMilestones items={data.upcoming.slice(0, 5)} />
        </div>
    );
}

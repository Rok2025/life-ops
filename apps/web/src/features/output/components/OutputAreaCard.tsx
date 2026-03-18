'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { outputApi } from '../api/outputApi';
import { OUTPUT_TYPE_CONFIG } from '../types';
import { AREA_CONFIG, type GrowthArea } from '@/features/growth-projects';
import type { OutputWithProject } from '../types';
import { Badge, Card } from '@/components/ui';

export function OutputAreaCard() {
    const { data: stats } = useQuery({
        queryKey: ['output-stats-dashboard'],
        queryFn: () => outputApi.getStats(),
    });

    const { data: recent = [] } = useQuery({
        queryKey: ['outputs-recent-dashboard'],
        queryFn: async () => {
            const all = await outputApi.getAll();
            return all.slice(0, 3);
        },
    });

    const published = stats?.published ?? 0;
    const draft = stats?.draft ?? 0;
    const total = stats?.total ?? 0;
    const status = published > 0 ? 'success' : total > 0 ? 'warning' : 'danger';
    const statusLabel = published > 0 ? `${published} 已发布` : total > 0 ? '全部草稿' : '暂无输出';

    return (
        <Link href="/output" className="block">
            <Card className="h-full p-card transition-all duration-normal ease-standard hover:-translate-y-0.5 hover:bg-card-bg">
            <div className="flex items-center justify-between mb-widget-header">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                        <PenLine size={16} className="text-accent" />
                    </div>
                    <h3 className="text-body font-semibold text-text-primary">输出</h3>
                </div>
                <Badge tone={status}>{statusLabel}</Badge>
            </div>
            <div className="space-y-2">
                {/* 统计行 */}
                <div className="flex justify-between text-body-sm">
                    <span className="text-text-secondary">总计</span>
                    <span className="font-medium text-text-primary">
                        已发布 {published} · 草稿 {draft}
                    </span>
                </div>

                {/* 最近输出 */}
                {recent.length > 0 ? (
                    <div className="space-y-1 pt-0.5">
                        {recent.map((o: OutputWithProject) => {
                            const typeCfg = OUTPUT_TYPE_CONFIG[o.type];
                            return (
                                <div key={o.id} className="flex items-center gap-2 rounded-control border border-glass-border/70 bg-panel-bg/85 px-2.5 py-1.5 text-caption backdrop-blur-xl">
                                    <span className={`shrink-0 ${typeCfg.color}`}>{typeCfg.emoji}</span>
                                    <span className="text-text-primary truncate flex-1">{o.title}</span>
                                    {o.project_area && (
                                        <span className="text-caption text-text-tertiary shrink-0">
                                            {AREA_CONFIG[o.project_area as GrowthArea]?.icon}
                                        </span>
                                    )}
                                    <span className="text-caption text-text-tertiary shrink-0">
                                        {new Date(o.updated_at).toLocaleDateString('zh-CN', {
                                            month: 'numeric',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-caption text-text-tertiary pt-0.5">还没有输出记录</p>
                )}
            </div>
            </Card>
        </Link>
    );
}

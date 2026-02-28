'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { outputApi } from '../api/outputApi';
import { OUTPUT_TYPE_CONFIG } from '../types';
import { AREA_CONFIG, type GrowthArea } from '@/features/growth-projects';
import type { OutputWithProject } from '../types';

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
        <Link href="/output" className="card p-card block hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-widget-header">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <PenLine size={16} className="text-accent" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">输出</h3>
                </div>
                <span className={`pill pill-${status}`}>{statusLabel}</span>
            </div>
            <div className="space-y-2">
                {/* 统计行 */}
                <div className="flex justify-between text-sm">
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
                                <div key={o.id} className="flex items-center gap-2 text-xs">
                                    <span className={`shrink-0 ${typeCfg.color}`}>{typeCfg.emoji}</span>
                                    <span className="text-text-primary truncate flex-1">{o.title}</span>
                                    {o.project_area && (
                                        <span className="text-[10px] text-text-tertiary shrink-0">
                                            {AREA_CONFIG[o.project_area as GrowthArea]?.icon}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-text-tertiary shrink-0">
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
                    <p className="text-xs text-text-tertiary pt-0.5">还没有输出记录</p>
                )}
            </div>
        </Link>
    );
}

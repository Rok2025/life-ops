'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import { AREA_CONFIG, type GrowthArea, type ProjectWithStats } from '../types';
import { Badge, Card } from '@/components/ui';

const AREAS: GrowthArea[] = ['ai', 'english', 'reading'];

export function GrowthAreaCard() {
    const { data: allProjects = { ai: [], english: [], reading: [] } } = useQuery<
        Record<GrowthArea, ProjectWithStats[]>
    >({
        queryKey: ['projects', 'dashboard-summary'],
        queryFn: async () => {
            const results = await Promise.all(AREAS.map(a => projectsApi.getByArea(a)));
            return Object.fromEntries(AREAS.map((a, i) => [a, results[i]])) as Record<
                GrowthArea,
                ProjectWithStats[]
            >;
        },
    });

    // 汇总
    const totalActive = AREAS.reduce(
        (sum, a) => sum + (allProjects[a]?.filter(p => p.status === 'active').length ?? 0),
        0,
    );
    const status = totalActive > 0 ? 'success' : 'danger';
    const statusLabel = totalActive > 0 ? '进行中' : '需关注';

    return (
        <Link href="/growth/ai" className="block">
            <Card className="h-full p-card transition-all duration-normal ease-standard hover:-translate-y-0.5 hover:bg-card-bg">
                <div className="flex items-center justify-between mb-widget-header">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                            <TrendingUp size={16} className="text-accent" />
                        </div>
                        <h3 className="text-body font-semibold text-text-primary">成长</h3>
                    </div>
                    <Badge tone={status}>{statusLabel}</Badge>
                </div>
                <div className="space-y-2">
                    {AREAS.map(area => {
                        const cfg = AREA_CONFIG[area];
                        const projects = allProjects[area] ?? [];
                        const active = projects.filter(p => p.status === 'active');
                        const totalTodos = active.reduce((s, p) => s + p.todo_total, 0);
                        const doneTodos = active.reduce((s, p) => s + p.todo_completed, 0);
                        const pct = totalTodos > 0 ? Math.round((doneTodos / totalTodos) * 100) : 0;
                        const progressClass = area === 'ai'
                            ? 'bg-accent/75'
                            : area === 'english'
                                ? 'bg-tone-blue/75'
                                : 'bg-success/75';

                        return (
                            <div key={area}>
                                <div className="flex justify-between text-body-sm mb-1">
                                    <span className="text-text-secondary flex items-center gap-1.5">
                                        <span>{cfg.icon}</span>
                                        <span>{cfg.label}</span>
                                    </span>
                                    <span className="font-medium text-text-primary">
                                        {active.length}/{projects.length} 个项目
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary/90">
                                    <div
                                        className={`h-full rounded-full transition-all duration-normal ease-standard ${progressClass}`}
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </Link>
    );
}

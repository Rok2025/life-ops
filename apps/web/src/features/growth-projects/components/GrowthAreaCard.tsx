'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import { AREA_CONFIG, type GrowthArea, type ProjectWithStats } from '../types';

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
        <Link href="/growth/ai" className="card p-card block hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-widget-header">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <TrendingUp size={16} className="text-accent" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">成长</h3>
                </div>
                <span className={`pill pill-${status}`}>{statusLabel}</span>
            </div>
            <div className="space-y-2">
                {AREAS.map(area => {
                    const cfg = AREA_CONFIG[area];
                    const projects = allProjects[area] ?? [];
                    const active = projects.filter(p => p.status === 'active');
                    const totalTodos = active.reduce((s, p) => s + p.todo_total, 0);
                    const doneTodos = active.reduce((s, p) => s + p.todo_completed, 0);
                    const pct = totalTodos > 0 ? Math.round((doneTodos / totalTodos) * 100) : 0;

                    return (
                        <div key={area}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-text-secondary flex items-center gap-1.5">
                                    <span>{cfg.icon}</span>
                                    <span>{cfg.label}</span>
                                </span>
                                <span className="font-medium text-text-primary">
                                    {active.length}/{projects.length} 个项目
                                </span>
                            </div>
                            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${cfg.color.replace('text-', 'bg-')}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </Link>
    );
}

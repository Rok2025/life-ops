'use client';

import { Card } from '@/components/ui';
import {
    AREA_CONFIG,
    SCOPE_CONFIG,
    STATUS_CONFIG,
    type GrowthArea,
    type ProjectWithStats,
} from '@/features/growth-projects';

export function AreaProjectSummary({
    area,
    projects,
    selectedProjectId,
    onSelectProject,
}: {
    area: GrowthArea;
    projects: ProjectWithStats[];
    selectedProjectId: string | null;
    onSelectProject: (project: ProjectWithStats, area: GrowthArea) => void;
}) {
    const cfg = AREA_CONFIG[area];
    const activeProjects = projects.filter(p => p.status === 'active');

    return (
        <Card variant="subtle" className="p-card">
            <div className="flex items-center gap-2 mb-widget-header">
                <span className="text-body">{cfg.icon}</span>
                <span className={`text-body-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                <span className="text-caption text-text-tertiary ml-auto">
                    {activeProjects.length} 个进行中
                </span>
            </div>
            {activeProjects.length === 0 ? (
                <p className="text-caption text-text-tertiary">暂无进行中的项目</p>
            ) : (
                <div className="space-y-1">
                    {activeProjects.map(p => {
                        const scopeCfg = SCOPE_CONFIG[p.scope];
                        const statusCfg = STATUS_CONFIG[p.status];
                        const pct = p.todo_total > 0 ? Math.round((p.todo_completed / p.todo_total) * 100) : 0;
                        const isSelected = selectedProjectId === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => onSelectProject(p, area)}
                                className={`glass-list-row w-full flex items-center gap-2 px-2 py-1.5 text-caption ${
                                    isSelected
                                        ? 'border-selection-border bg-selection-bg'
                                        : ''
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                                <span className={`shrink-0 px-1.5 py-0.5 rounded-control text-caption ${scopeCfg.color} ${scopeCfg.bg}`}>
                                    {scopeCfg.label}
                                </span>
                                <span className="text-text-primary truncate flex-1 text-left">{p.title}</span>
                                {p.todo_total > 0 && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <div className="w-12 h-1 rounded-full bg-bg-tertiary/90 overflow-hidden">
                                            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-caption text-text-tertiary w-7 text-right">{pct}%</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

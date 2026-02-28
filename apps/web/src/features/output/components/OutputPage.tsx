'use client';

import { useState, useCallback } from 'react';
import { Plus, PenLine, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOutputs } from '../hooks/useOutputs';
import { OutputCard } from './OutputCard';
import { OutputForm } from './OutputForm';
import { ProjectDocEditor } from './ProjectDocEditor';
import { OUTPUT_TYPE_CONFIG } from '../types';
import {
    AREA_CONFIG,
    SCOPE_CONFIG,
    STATUS_CONFIG,
    projectsApi,
    type GrowthArea,
    type ProjectWithStats,
} from '@/features/growth-projects';
import type { OutputType, OutputWithProject } from '../types';

/* ── 领域项目概览卡片 ─────────────────────────────── */
function AreaProjectSummary({
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
        <div className="p-card rounded-xl bg-bg-secondary border border-border">
            <div className="flex items-center gap-2 mb-widget-header">
                <span className="text-base">{cfg.icon}</span>
                <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-text-tertiary ml-auto">
                    {activeProjects.length} 个进行中
                </span>
            </div>
            {activeProjects.length === 0 ? (
                <p className="text-xs text-text-tertiary">暂无进行中的项目</p>
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
                                className={`w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-colors ${
                                    isSelected
                                        ? 'bg-accent/10 border border-accent/30'
                                        : 'hover:bg-bg-tertiary border border-transparent'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] ${scopeCfg.color} ${scopeCfg.bg}`}>
                                    {scopeCfg.label}
                                </span>
                                <span className="text-text-primary truncate flex-1 text-left">{p.title}</span>
                                {p.todo_total > 0 && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <div className="w-12 h-1 rounded-full bg-bg-tertiary overflow-hidden">
                                            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-[10px] text-text-tertiary w-7 text-right">{pct}%</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function OutputPage() {
    const [typeFilter, setTypeFilter] = useState<OutputType | null>(null);
    const [areaFilter, setAreaFilter] = useState<GrowthArea | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingOutput, setEditingOutput] = useState<OutputWithProject | null>(null);
    const [selectedProject, setSelectedProject] = useState<{ project: ProjectWithStats; area: GrowthArea } | null>(null);

    const { data: outputs = [], isLoading } = useOutputs(
        typeFilter ? { type: typeFilter } : undefined,
    );

    // 获取各领域项目数据
    const areas: GrowthArea[] = ['ai', 'english', 'reading'];
    const { data: allProjects = { ai: [], english: [], reading: [] } } = useQuery<Record<GrowthArea, ProjectWithStats[]>>({
        queryKey: ['projects', 'all-areas-summary'],
        queryFn: async () => {
            const results = await Promise.all(
                areas.map(a => projectsApi.getByArea(a)),
            );
            return Object.fromEntries(areas.map((a, i) => [a, results[i]])) as Record<GrowthArea, ProjectWithStats[]>;
        },
    });

    // 按领域过滤
    const filteredOutputs = areaFilter
        ? outputs.filter(o => o.project_area === areaFilter)
        : outputs;

    // 按项目分组
    const grouped = filteredOutputs.reduce((acc, o) => {
        const key = o.project_id ?? '__none__';
        if (!acc[key]) acc[key] = { projectTitle: o.project_title, projectArea: o.project_area, items: [] };
        acc[key].items.push(o);
        return acc;
    }, {} as Record<string, { projectTitle?: string; projectArea?: string; items: OutputWithProject[] }>);

    // 有项目的分组排前面，无项目的排后面
    const groupEntries = Object.entries(grouped).sort(([a], [b]) => {
        if (a === '__none__') return 1;
        if (b === '__none__') return -1;
        return 0;
    });

    const handleAdd = useCallback(() => {
        setEditingOutput(null);
        setShowForm(true);
    }, []);

    const handleEdit = useCallback((output: OutputWithProject) => {
        setEditingOutput(output);
        setShowForm(true);
    }, []);

    const handleCloseForm = useCallback(() => {
        setShowForm(false);
        setEditingOutput(null);
    }, []);

    const handleSelectProject = useCallback((project: ProjectWithStats, area: GrowthArea) => {
        setSelectedProject(prev =>
            prev?.project.id === project.id ? null : { project, area },
        );
    }, []);

    const publishedCount = outputs.filter(o => o.status === 'published').length;
    const draftCount = outputs.filter(o => o.status === 'draft').length;

    return (
        <div className="space-y-section">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <PenLine size={20} className="text-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">输出</h1>
                        <p className="text-sm text-text-secondary">
                            已发布 {publishedCount} · 草稿 {draftCount}
                        </p>
                    </div>
                </div>
                <button onClick={handleAdd} className="btn-primary flex items-center gap-1 text-sm">
                    <Plus size={16} />
                    新建输出
                </button>
            </div>

            {/* 筛选栏 */}
            <div className="flex items-center gap-4">
                {/* 领域筛选 */}
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-text-tertiary">领域</span>
                    <button
                        onClick={() => setAreaFilter(null)}
                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                            !areaFilter ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:bg-bg-tertiary'
                        }`}
                    >
                        全部
                    </button>
                    {(Object.keys(AREA_CONFIG) as GrowthArea[]).map(a => (
                        <button
                            key={a}
                            onClick={() => setAreaFilter(areaFilter === a ? null : a)}
                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                                areaFilter === a ? `${AREA_CONFIG[a].bg} ${AREA_CONFIG[a].color}` : 'text-text-secondary hover:bg-bg-tertiary'
                            }`}
                        >
                            {AREA_CONFIG[a].icon} {AREA_CONFIG[a].label}
                        </button>
                    ))}
                </div>

                <div className="w-px h-4 bg-border" />

                {/* 类型筛选 */}
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-text-tertiary">类型</span>
                    <button
                        onClick={() => setTypeFilter(null)}
                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                            !typeFilter ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:bg-bg-tertiary'
                        }`}
                    >
                        全部
                    </button>
                    {(Object.keys(OUTPUT_TYPE_CONFIG) as OutputType[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                                typeFilter === t ? `${OUTPUT_TYPE_CONFIG[t].bg} ${OUTPUT_TYPE_CONFIG[t].color}` : 'text-text-secondary hover:bg-bg-tertiary'
                            }`}
                        >
                            {OUTPUT_TYPE_CONFIG[t].emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* 各领域项目概览 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {areas.map(a => (
                    <AreaProjectSummary
                        key={a}
                        area={a}
                        projects={allProjects[a] ?? []}
                        selectedProjectId={selectedProject?.project.id ?? null}
                        onSelectProject={handleSelectProject}
                    />
                ))}
            </div>

            {/* 选中项目的文档编辑器 */}
            {selectedProject && (
                <ProjectDocEditor
                    key={selectedProject.project.id}
                    project={selectedProject.project}
                    area={selectedProject.area}
                    onClose={() => setSelectedProject(null)}
                />
            )}

            {/* 输出列表 */}
            {isLoading ? (
                <div className="text-center py-8 text-text-secondary">加载中...</div>
            ) : filteredOutputs.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                    <FileText size={32} className="mx-auto mb-2 text-text-tertiary" />
                    <p className="text-sm mb-2">还没有输出记录</p>
                    <button onClick={handleAdd} className="text-accent hover:underline text-sm">
                        创建第一条输出 →
                    </button>
                </div>
            ) : (
                <div className="space-y-section">
                    {groupEntries.map(([key, group]) => (
                        <div key={key}>
                            {/* 分组标题 */}
                            <div className="flex items-center gap-2 mb-2">
                                {key !== '__none__' && group.projectArea && (
                                    <span className="text-xs">{AREA_CONFIG[group.projectArea as GrowthArea]?.icon}</span>
                                )}
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                                    {key === '__none__' ? '未关联项目' : group.projectTitle}
                                </span>
                                <span className="text-[10px] text-text-tertiary">({group.items.length})</span>
                            </div>
                            <div className="space-y-1">
                                {group.items.map(output => (
                                    <OutputCard key={output.id} output={output} onEdit={handleEdit} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 新建/编辑弹窗 */}
            <OutputForm
                open={showForm}
                onClose={handleCloseForm}
                editingOutput={editingOutput}
            />
        </div>
    );
}

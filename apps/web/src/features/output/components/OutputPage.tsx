'use client';

import { useState, useCallback } from 'react';
import { Plus, PenLine, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOutputs } from '../hooks/useOutputs';
import { OutputCard } from './OutputCard';
import { OutputForm } from './OutputForm';
import { ProjectDocEditor } from './ProjectDocEditor';
import { AreaProjectSummary } from './AreaProjectSummary';
import { OUTPUT_TYPE_CONFIG } from '../types';
import { Button, Card, PageHero, SectionHeader } from '@/components/ui';
import {
    AREA_CONFIG,
    projectsApi,
    type GrowthArea,
    type ProjectWithStats,
} from '@/features/growth-projects';
import type { OutputType, OutputWithProject } from '../types';

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
    const activeProjectCount = areas.reduce(
        (sum, area) => sum + (allProjects[area] ?? []).filter(project => project.status === 'active').length,
        0,
    );

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="输出面板"
                icon={<PenLine size={18} className="text-accent" />}
                title="输出"
                description="把文章、草稿和项目文档收在同一处，保持发布、迭代和归档都在同一条节奏里。"
                action={
                    <Button onClick={handleAdd} variant="tinted" size="sm" className="gap-1">
                        <Plus size={16} />
                        新建输出
                    </Button>
                }
                stats={[
                    {
                        label: '已发布',
                        value: publishedCount,
                        meta: outputs.length > 0 ? `${outputs.length} 总计` : '尚无记录',
                        tone: 'success',
                    },
                    {
                        label: '草稿',
                        value: draftCount,
                        meta: typeFilter ? OUTPUT_TYPE_CONFIG[typeFilter].label : '待整理',
                        tone: 'warning',
                    },
                    {
                        label: '进行中项目',
                        value: activeProjectCount,
                        meta: areaFilter ? AREA_CONFIG[areaFilter].label : '全部领域',
                        tone: 'accent',
                    },
                    {
                        label: '当前视图',
                        value: filteredOutputs.length,
                        meta: areaFilter || typeFilter ? '已过滤' : '全部内容',
                        tone: 'blue',
                    },
                ]}
            />

            <Card variant="subtle" className="space-y-4 p-card">
                <SectionHeader
                    title="筛选视图"
                    description="按领域和输出类型收束列表，也可以直接切入某个项目的文档编辑。"
                />

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-caption text-text-tertiary">领域</span>
                            <div className="glass-filter-bar">
                                <button
                                    onClick={() => setAreaFilter(null)}
                                    className={`glass-filter-chip text-caption ${!areaFilter ? 'glass-filter-chip-active' : ''}`}
                                >
                                    全部
                                </button>
                                {(Object.keys(AREA_CONFIG) as GrowthArea[]).map(a => (
                                    <button
                                        key={a}
                                        onClick={() => setAreaFilter(areaFilter === a ? null : a)}
                                        className={`glass-filter-chip text-caption ${areaFilter === a ? 'glass-filter-chip-active' : ''}`}
                                    >
                                        {AREA_CONFIG[a].icon} {AREA_CONFIG[a].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="hidden h-4 w-px bg-border xl:block" />

                        <div className="flex items-center gap-1.5">
                            <span className="text-caption text-text-tertiary">类型</span>
                            <div className="glass-filter-bar">
                                <button
                                    onClick={() => setTypeFilter(null)}
                                    className={`glass-filter-chip text-caption ${!typeFilter ? 'glass-filter-chip-active' : ''}`}
                                >
                                    全部
                                </button>
                                {(Object.keys(OUTPUT_TYPE_CONFIG) as OutputType[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                                        className={`glass-filter-chip text-caption ${typeFilter === t ? 'glass-filter-chip-active' : ''}`}
                                    >
                                        {OUTPUT_TYPE_CONFIG[t].emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="glass-mini-chip text-body-sm">
                        {selectedProject
                            ? `${AREA_CONFIG[selectedProject.area].label} / ${selectedProject.project.title}`
                            : '未选择项目文档'}
                    </div>
                </div>
            </Card>

            {/* 各领域项目概览 */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                    加载中...
                </Card>
            ) : filteredOutputs.length === 0 ? (
                <Card className="p-card-lg text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                        <FileText size={28} className="text-text-secondary" />
                    </div>
                    <p className="text-body text-text-primary">还没有输出记录</p>
                    <p className="mt-1 text-body-sm text-text-secondary">
                        先从一篇草稿或一份项目文档开始，把内容沉淀到这里。
                    </p>
                    <Button onClick={handleAdd} variant="tinted" size="sm" className="mt-4 gap-1">
                        <Plus size={16} />
                        创建第一条输出
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {groupEntries.map(([key, group]) => (
                        <Card key={key} variant="subtle" className="space-y-3 p-card">
                            <div className="flex items-center gap-2">
                                {key !== '__none__' && group.projectArea && (
                                    <span className="text-caption">{AREA_CONFIG[group.projectArea as GrowthArea]?.icon}</span>
                                )}
                                <span className="text-body-sm font-medium text-text-secondary">
                                    {key === '__none__' ? '未关联项目' : group.projectTitle}
                                </span>
                                <span className="glass-mini-chip text-caption">{group.items.length} 条</span>
                            </div>
                            <div className="space-y-1">
                                {group.items.map(output => (
                                    <OutputCard key={output.id} output={output} onEdit={handleEdit} />
                                ))}
                            </div>
                        </Card>
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

'use client';

import { useState, useCallback } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { ProjectDetailPanel, ProjectDetailEmpty } from './ProjectDetailPanel';
import { AREA_CONFIG, SCOPE_CONFIG } from '../types';
import type { GrowthArea, ProjectScope, ProjectWithStats } from '../types';
import { compareProjectsByDisplayStatus } from '../utils/projectProgress';
import { Button, Card, PageHero } from '@/components/ui';

interface ProjectListProps {
    area: GrowthArea;
}

export default function ProjectList({ area }: ProjectListProps) {
    const areaConfig = AREA_CONFIG[area];
    const [scopeFilter, setScopeFilter] = useState<ProjectScope | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    /** 移动端：是否显示详情视图 */
    const [mobileDetail, setMobileDetail] = useState(false);

    const { data: projects = [], isLoading } = useProjects(area, scopeFilter ? { scope: scopeFilter } : undefined);

    const activeProjects = [...projects.filter(p => p.status === 'active' || p.status === 'paused')]
        .sort(compareProjectsByDisplayStatus);
    const archivedProjects = [...projects.filter(p => p.status === 'completed' || p.status === 'archived')]
        .sort(compareProjectsByDisplayStatus);

    const selectedProject = projects.find(p => p.id === selectedId) ?? null;

    const handleAdd = useCallback(() => {
        setEditingProject(null);
        setShowForm(true);
    }, []);

    const handleEdit = useCallback((project: ProjectWithStats) => {
        setEditingProject(project);
        setShowForm(true);
    }, []);

    const handleCloseForm = useCallback(() => {
        setShowForm(false);
        setEditingProject(null);
    }, []);

    const handleSelect = useCallback((project: ProjectWithStats) => {
        setSelectedId(project.id);
        setMobileDetail(true);
    }, []);

    const handleMobileBack = useCallback(() => {
        setMobileDetail(false);
    }, []);

    const hero = (
        <PageHero
            eyebrow={`成长 / ${areaConfig.label}`}
            icon={<span className="text-lg">{areaConfig.icon}</span>}
            title={areaConfig.label}
            description="把长期项目、待办和灵感放进同一块视图，让推进节奏更稳定。"
            action={
                <Button onClick={handleAdd} variant="tinted" size="sm" className="gap-1">
                    <Plus size={16} />
                    新建项目
                </Button>
            }
            stats={[
                {
                    label: '活跃项目',
                    value: activeProjects.length,
                    meta: scopeFilter ? SCOPE_CONFIG[scopeFilter].label : '全部范围',
                    tone: 'accent',
                },
                {
                    label: '归档项目',
                    value: archivedProjects.length,
                    meta: showArchived ? '已展开' : '已收起',
                    tone: 'warning',
                },
            ]}
        >
            <div className="glass-filter-bar flex items-center">
                <button
                    onClick={() => setScopeFilter(null)}
                    className={`glass-filter-chip text-caption ${!scopeFilter ? 'glass-filter-chip-active' : ''}`}
                >
                    全部
                </button>
                {(Object.keys(SCOPE_CONFIG) as ProjectScope[]).map(s => (
                    <button
                        key={s}
                        onClick={() => setScopeFilter(scopeFilter === s ? null : s)}
                        className={`glass-filter-chip text-caption ${scopeFilter === s ? 'glass-filter-chip-active' : ''}`}
                    >
                        {SCOPE_CONFIG[s].label}
                    </button>
                ))}
            </div>
            {archivedProjects.length > 0 ? (
                <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="glass-mini-chip text-body-sm transition-colors duration-normal ease-standard hover:bg-card-bg"
                >
                    {showArchived ? '隐藏已归档' : `查看已归档 ${archivedProjects.length}`}
                </button>
            ) : null}
        </PageHero>
    );

    // 左侧 - 项目列表面板
    const listPanel = (
        <div className="space-y-4 xl:space-y-5">
            {/* 项目列表 */}
            {isLoading ? (
                <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                    加载中...
                </Card>
            ) : activeProjects.length === 0 && archivedProjects.length === 0 ? (
                <Card className="p-card-lg text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                        <FolderOpen size={28} className="text-text-secondary" />
                    </div>
                    <p className="text-body text-text-primary">还没有项目</p>
                    <p className="mt-1 text-body-sm text-text-secondary">
                        从一个明确的长期目标开始，把任务和想法都落到同一个项目里。
                    </p>
                    <Button onClick={handleAdd} variant="tinted" size="sm" className="mt-4 gap-1">
                        <Plus size={16} />
                        创建第一个项目
                    </Button>
                </Card>
            ) : (
                <>
                    {/* 活跃项目 */}
                    <div className="space-y-1">
                        {activeProjects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                area={area}
                                selected={selectedId === project.id}
                                onSelect={handleSelect}
                                onEdit={handleEdit}
                            />
                        ))}
                    </div>

                    {/* 已完成/归档项目 */}
                    {archivedProjects.length > 0 && (
                        <div>
                            {showArchived && (
                                <div className="space-y-1 opacity-60">
                                    {archivedProjects.map(project => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            area={area}
                                            selected={selectedId === project.id}
                                            onSelect={handleSelect}
                                            onEdit={handleEdit}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );

    // 右侧 - 详情面板
    const detailPanel = selectedProject ? (
        <ProjectDetailPanel project={selectedProject} onBack={handleMobileBack} />
    ) : (
        <ProjectDetailEmpty />
    );

    return (
        <>
            {/* 桌面端：左右分栏 */}
            <div className="hidden space-y-4 xl:space-y-5 md:block">
                {hero}
                <div className="grid items-start gap-5 md:grid-cols-[minmax(320px,1.6fr)_minmax(0,2.2fr)]">
                    <div>{listPanel}</div>
                    <Card variant="subtle" className="sticky top-4 max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
                        {detailPanel}
                    </Card>
                </div>
            </div>

            {/* 移动端：列表/详情切换 */}
            <div className="space-y-4 md:hidden">
                {hero}
                {mobileDetail && selectedProject ? (
                    <Card className="min-h-[60vh]">
                        <ProjectDetailPanel project={selectedProject} onBack={handleMobileBack} />
                    </Card>
                ) : (
                    listPanel
                )}
            </div>

            {/* 新建/编辑弹窗 */}
            <ProjectForm
                open={showForm}
                onClose={handleCloseForm}
                area={area}
                editingProject={editingProject}
            />
        </>
    );
}

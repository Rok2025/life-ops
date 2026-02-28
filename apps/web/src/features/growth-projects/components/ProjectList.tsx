'use client';

import { useState, useCallback } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { ProjectDetailPanel, ProjectDetailEmpty } from './ProjectDetailPanel';
import { AREA_CONFIG, SCOPE_CONFIG } from '../types';
import type { GrowthArea, ProjectScope, ProjectWithStats } from '../types';

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

    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'paused');
    const archivedProjects = projects.filter(p => p.status === 'completed' || p.status === 'archived');

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

    // 左侧 - 项目列表面板
    const listPanel = (
        <div className="space-y-section">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${areaConfig.bg} flex items-center justify-center`}>
                        <span className="text-xl">{areaConfig.icon}</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">{areaConfig.label}</h1>
                        <p className="text-sm text-text-secondary">
                            成长 / {areaConfig.label} · {activeProjects.length} 个活跃项目
                        </p>
                    </div>
                </div>
                <button onClick={handleAdd} className="btn-primary flex items-center gap-1 text-sm">
                    <Plus size={16} />
                    新建项目
                </button>
            </div>

            {/* 筛选栏 */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setScopeFilter(null)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                        !scopeFilter ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:bg-bg-tertiary'
                    }`}
                >
                    全部
                </button>
                {(Object.keys(SCOPE_CONFIG) as ProjectScope[]).map(s => (
                    <button
                        key={s}
                        onClick={() => setScopeFilter(scopeFilter === s ? null : s)}
                        className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                            scopeFilter === s ? `${SCOPE_CONFIG[s].bg} ${SCOPE_CONFIG[s].color}` : 'text-text-secondary hover:bg-bg-tertiary'
                        }`}
                    >
                        {SCOPE_CONFIG[s].label}
                    </button>
                ))}
            </div>

            {/* 项目列表 */}
            {isLoading ? (
                <div className="text-center py-8 text-text-secondary">加载中...</div>
            ) : activeProjects.length === 0 && archivedProjects.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                    <FolderOpen size={32} className="mx-auto mb-2 text-text-tertiary" />
                    <p className="text-sm mb-2">还没有项目</p>
                    <button onClick={handleAdd} className="text-accent hover:underline text-sm">
                        创建第一个项目 →
                    </button>
                </div>
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
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className="text-xs text-text-tertiary hover:text-text-secondary mb-2"
                            >
                                {showArchived ? '隐藏' : '显示'}已完成/归档 ({archivedProjects.length})
                            </button>
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
            <div className="hidden md:grid md:grid-cols-[2fr_3fr] md:gap-6 md:items-start">
                <div>{listPanel}</div>
                <div className="card sticky top-4 max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
                    {detailPanel}
                </div>
            </div>

            {/* 移动端：列表/详情切换 */}
            <div className="md:hidden">
                {mobileDetail && selectedProject ? (
                    <div className="card min-h-[60vh]">
                        <ProjectDetailPanel project={selectedProject} onBack={handleMobileBack} />
                    </div>
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

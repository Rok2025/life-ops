'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, FileEdit } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { outputApi } from '../api/outputApi';
import { projectsApi } from '@/features/growth-projects/api/projectsApi';
import { AREA_CONFIG, type GrowthArea } from '@/features/growth-projects';
import { OUTPUT_TYPE_CONFIG, OUTPUT_STATUS_CONFIG } from '../types';
import { MarkdownEditor } from './MarkdownEditor';
import type { OutputWithProject, OutputType, OutputStatus, CreateOutputInput, UpdateOutputInput } from '../types';

interface OutputFormProps {
    open: boolean;
    onClose: () => void;
    editingOutput?: OutputWithProject | null;
    defaultProjectId?: string;
}

export function OutputForm({ open, onClose, editingOutput, defaultProjectId }: OutputFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!editingOutput;

    const [title, setTitle] = useState('');
    const [type, setType] = useState<OutputType>('blog');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<OutputStatus>('draft');
    const [projectId, setProjectId] = useState('');
    const [showEditor, setShowEditor] = useState(false);

    // 获取项目列表（用于下拉选择）
    const { data: allProjects = [] } = useQuery({
        queryKey: ['projects-all'],
        queryFn: () => projectsApi.getAll(),
        enabled: open,
    });

    useEffect(() => {
        if (editingOutput) {
            setTitle(editingOutput.title);
            setType(editingOutput.type);
            setContent(editingOutput.content ?? '');
            setUrl(editingOutput.url ?? '');
            setStatus(editingOutput.status);
            setProjectId(editingOutput.project_id ?? '');
        } else {
            setTitle('');
            setType('blog');
            setContent('');
            setUrl('');
            setStatus('draft');
            setProjectId(defaultProjectId ?? '');
        }
    }, [editingOutput, defaultProjectId]);

    const createMutation = useMutation({
        mutationFn: (input: CreateOutputInput) => outputApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['outputs'] });
            onClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (input: UpdateOutputInput) => outputApi.update(editingOutput!.id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['outputs'] });
            onClose();
        },
    });

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;

        if (isEditing) {
            updateMutation.mutate({
                title: trimmed,
                type,
                content: content || null,
                url: url || null,
                status,
                project_id: projectId || null,
            });
        } else {
            createMutation.mutate({
                title: trimmed,
                type,
                content: content || undefined,
                url: url || undefined,
                status,
                project_id: projectId || undefined,
            });
        }
    }, [title, type, content, url, status, projectId, isEditing, createMutation, updateMutation]);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    const saving = createMutation.isPending || updateMutation.isPending;

    // 按 area 分组项目
    const groupedProjects = allProjects.reduce((acc, p) => {
        if (!acc[p.area]) acc[p.area] = [];
        acc[p.area].push(p);
        return acc;
    }, {} as Record<string, typeof allProjects>);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg mx-4 bg-bg-primary border border-border rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-border">
                    <h2 className="text-base font-bold text-text-primary">
                        {isEditing ? '编辑输出' : '新建输出'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-3 space-y-3">
                    {/* 标题 */}
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">标题 *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="输出标题"
                            className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent"
                            autoFocus
                            required
                        />
                    </div>

                    {/* 类型 + 状态 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">类型</label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value as OutputType)}
                                className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary outline-none focus:border-accent"
                            >
                                {(Object.keys(OUTPUT_TYPE_CONFIG) as OutputType[]).map(t => (
                                    <option key={t} value={t}>{OUTPUT_TYPE_CONFIG[t].emoji} {OUTPUT_TYPE_CONFIG[t].label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">状态</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as OutputStatus)}
                                className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary outline-none focus:border-accent"
                            >
                                {(Object.keys(OUTPUT_STATUS_CONFIG) as OutputStatus[]).map(s => (
                                    <option key={s} value={s}>{OUTPUT_STATUS_CONFIG[s].label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 关联项目 */}
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">关联项目</label>
                        <select
                            value={projectId}
                            onChange={e => setProjectId(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary outline-none focus:border-accent"
                        >
                            <option value="">不关联项目</option>
                            {Object.entries(groupedProjects).map(([area, projects]) => (
                                <optgroup key={area} label={`${AREA_CONFIG[area as GrowthArea]?.icon ?? ''} ${AREA_CONFIG[area as GrowthArea]?.label ?? area}`}>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* 链接 */}
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">链接（可选）</label>
                        <input
                            type="url"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent"
                        />
                    </div>

                    {/* 内容编辑 */}
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">内容（Markdown）</label>
                        <button
                            type="button"
                            onClick={() => setShowEditor(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-secondary hover:border-accent hover:text-accent transition-colors"
                        >
                            <FileEdit size={14} />
                            {content ? `已编辑 · ${content.length} 字符` : '打开编辑器撰写内容 →'}
                        </button>
                    </div>

                    {/* 按钮 */}
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !title.trim()}
                            className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                        >
                            {saving ? '保存中...' : isEditing ? '保存' : '创建'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 全屏 Markdown 编辑器 */}
            <MarkdownEditor
                open={showEditor}
                title={title}
                content={content}
                onChange={setContent}
                onClose={() => setShowEditor(false)}
                onSave={() => setShowEditor(false)}
            />
        </div>
    );
}

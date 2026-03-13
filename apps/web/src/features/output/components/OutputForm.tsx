'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileEdit } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { outputApi } from '../api/outputApi';
import { projectsApi } from '@/features/growth-projects/api/projectsApi';
import { AREA_CONFIG, type GrowthArea } from '@/features/growth-projects';
import { OUTPUT_TYPE_CONFIG, OUTPUT_STATUS_CONFIG } from '../types';
import { MarkdownEditor } from './MarkdownEditor';
import type { OutputWithProject, OutputType, OutputStatus, CreateOutputInput, UpdateOutputInput } from '../types';
import { Button, Dialog, Input, Select } from '@/components/ui';

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
        queueMicrotask(() => {
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
        });
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

    if (!open) return null;

    const saving = createMutation.isPending || updateMutation.isPending;

    // 按 area 分组项目
    const groupedProjects = allProjects.reduce((acc, p) => {
        if (!acc[p.area]) acc[p.area] = [];
        acc[p.area].push(p);
        return acc;
    }, {} as Record<string, typeof allProjects>);

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                title={isEditing ? '编辑输出' : '新建输出'}
                maxWidth="lg"
                bodyClassName="flex min-h-0 flex-1 flex-col"
            >
                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {/* 标题 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">标题 *</label>
                        <Input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="输出标题"
                            autoFocus
                            required
                        />
                    </div>

                    {/* 类型 + 状态 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">类型</label>
                            <Select
                                value={type}
                                onChange={e => setType(e.target.value as OutputType)}
                            >
                                {(Object.keys(OUTPUT_TYPE_CONFIG) as OutputType[]).map(t => (
                                    <option key={t} value={t}>{OUTPUT_TYPE_CONFIG[t].emoji} {OUTPUT_TYPE_CONFIG[t].label}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">状态</label>
                            <Select
                                value={status}
                                onChange={e => setStatus(e.target.value as OutputStatus)}
                            >
                                {(Object.keys(OUTPUT_STATUS_CONFIG) as OutputStatus[]).map(s => (
                                    <option key={s} value={s}>{OUTPUT_STATUS_CONFIG[s].label}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* 关联项目 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">关联项目</label>
                        <Select
                            value={projectId}
                            onChange={e => setProjectId(e.target.value)}
                        >
                            <option value="">不关联项目</option>
                            {Object.entries(groupedProjects).map(([area, projects]) => (
                                <optgroup key={area} label={`${AREA_CONFIG[area as GrowthArea]?.icon ?? ''} ${AREA_CONFIG[area as GrowthArea]?.label ?? area}`}>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </Select>
                    </div>

                    {/* 链接 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">链接（可选）</label>
                        <Input
                            type="url"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>

                    {/* 内容编辑 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">内容（Markdown）</label>
                        <button
                            type="button"
                            onClick={() => setShowEditor(true)}
                            className="w-full flex items-center gap-2 px-control-x py-control-y text-body-sm bg-bg-tertiary border border-border rounded-control text-text-secondary hover:border-accent hover:text-accent transition-colors duration-normal ease-standard"
                        >
                            <FileEdit size={14} />
                            {content ? `已编辑 · ${content.length} 字符` : '打开编辑器撰写内容 →'}
                        </button>
                    </div>
                    </div>

                    {/* 按钮 */}
                    <div className="flex justify-end gap-2 border-t border-border bg-bg-primary px-5 py-3">
                        <Button type="button" onClick={onClose} variant="ghost" size="sm">
                            取消
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving || !title.trim()}
                            size="sm"
                        >
                            {saving ? '保存中...' : isEditing ? '保存' : '创建'}
                        </Button>
                    </div>
                </form>
            </Dialog>
            {/* 全屏 Markdown 编辑器 */}
            <MarkdownEditor
                open={showEditor}
                title={title}
                content={content}
                onChange={setContent}
                onClose={() => setShowEditor(false)}
                onSave={() => setShowEditor(false)}
            />
        </>
    );
}

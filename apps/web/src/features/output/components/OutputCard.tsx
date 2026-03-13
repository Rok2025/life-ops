'use client';

import { useState } from 'react';
import { Edit2, Trash2, ExternalLink, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { outputApi } from '../api/outputApi';
import { OUTPUT_TYPE_CONFIG, OUTPUT_STATUS_CONFIG } from '../types';
import { AREA_CONFIG, type GrowthArea } from '@/features/growth-projects';
import { MarkdownViewer } from './MarkdownViewer';
import type { OutputWithProject } from '../types';

interface OutputCardProps {
    output: OutputWithProject;
    onEdit: (output: OutputWithProject) => void;
}

export function OutputCard({ output, onEdit }: OutputCardProps) {
    const queryClient = useQueryClient();
    const [showViewer, setShowViewer] = useState(false);
    const typeConfig = OUTPUT_TYPE_CONFIG[output.type];
    const statusConfig = OUTPUT_STATUS_CONFIG[output.status];

    const deleteMutation = useMutation({
        mutationFn: () => outputApi.delete(output.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['outputs'] });
        },
    });

    const handleDelete = () => {
        if (!confirm('确定删除？')) return;
        deleteMutation.mutate();
    };

    return (
        <div className="glass-list-row group flex items-center gap-2 px-3 py-2">
            {/* 类型标签 */}
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-caption ${typeConfig.bg} ${typeConfig.color}`}>
                {typeConfig.emoji} {typeConfig.label}
            </span>

            {/* 标题 */}
            <span className="text-body-sm text-text-primary flex-1 min-w-0 truncate">{output.title}</span>

            {/* 关联项目 */}
            {output.project_title && output.project_area && (
                <span className="text-caption text-text-tertiary shrink-0 flex items-center gap-0.5">
                    {AREA_CONFIG[output.project_area as GrowthArea]?.icon} {output.project_title}
                </span>
            )}

            {/* 状态 */}
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-caption ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
            </span>

            {/* 链接 */}
            {output.url && (
                <a
                    href={output.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-control p-1 text-accent transition-colors duration-normal ease-standard hover:bg-panel-bg"
                >
                    <ExternalLink size={12} />
                </a>
            )}

            {/* 查看内容 */}
            {output.content && (
                <button
                    onClick={() => setShowViewer(true)}
                    className="shrink-0 rounded-control p-1 text-text-secondary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-accent"
                    title="查看内容"
                >
                    <FileText size={13} />
                </button>
            )}

            {/* 时间 */}
            <span className="text-caption text-text-tertiary shrink-0">
                {new Date(output.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
            </span>

            {/* 操作 */}
            <button
                onClick={() => onEdit(output)}
                className="rounded-control p-1 text-text-secondary opacity-0 transition-all duration-normal ease-standard group-hover:opacity-100 hover:bg-panel-bg hover:text-text-primary"
            >
                <Edit2 size={13} />
            </button>
            <button
                onClick={handleDelete}
                className="rounded-control p-1 text-danger opacity-0 transition-all duration-normal ease-standard group-hover:opacity-100 hover:bg-danger/10"
            >
                <Trash2 size={13} />
            </button>

            {/* 全屏 Markdown 查看器 */}
            {showViewer && output.content && (
                <MarkdownViewer
                    title={output.title}
                    content={output.content}
                    onClose={() => setShowViewer(false)}
                />
            )}
        </div>
    );
}

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
        <div className="group py-1.5 px-3 bg-bg-tertiary rounded-lg flex items-center gap-2">
            {/* 类型标签 */}
            <span className={`text-xs px-1.5 py-0.5 rounded ${typeConfig.bg} ${typeConfig.color} shrink-0`}>
                {typeConfig.emoji} {typeConfig.label}
            </span>

            {/* 标题 */}
            <span className="text-sm text-text-primary flex-1 min-w-0 truncate">{output.title}</span>

            {/* 关联项目 */}
            {output.project_title && output.project_area && (
                <span className="text-[10px] text-text-tertiary shrink-0 flex items-center gap-0.5">
                    {AREA_CONFIG[output.project_area as GrowthArea]?.icon} {output.project_title}
                </span>
            )}

            {/* 状态 */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusConfig.bg} ${statusConfig.color} shrink-0`}>
                {statusConfig.label}
            </span>

            {/* 链接 */}
            {output.url && (
                <a
                    href={output.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-accent hover:bg-accent/10 rounded shrink-0"
                >
                    <ExternalLink size={12} />
                </a>
            )}

            {/* 查看内容 */}
            {output.content && (
                <button
                    onClick={() => setShowViewer(true)}
                    className="p-1 text-text-secondary hover:text-accent hover:bg-accent/10 rounded shrink-0"
                    title="查看内容"
                >
                    <FileText size={13} />
                </button>
            )}

            {/* 时间 */}
            <span className="text-[10px] text-text-tertiary shrink-0">
                {new Date(output.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
            </span>

            {/* 操作 */}
            <button
                onClick={() => onEdit(output)}
                className="p-1 text-text-secondary hover:bg-bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Edit2 size={13} />
            </button>
            <button
                onClick={handleDelete}
                className="p-1 text-danger hover:bg-danger/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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

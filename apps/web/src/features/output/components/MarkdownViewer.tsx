'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
    title: string;
    content: string;
    onClose: () => void;
}

export function MarkdownViewer({ title, content, onClose }: MarkdownViewerProps) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-bg-primary">
            {/* 顶栏 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    >
                        <X size={18} />
                    </button>
                    <span className="text-sm font-semibold text-text-primary truncate">{title}</span>
                </div>
                <span className="text-[10px] text-text-tertiary">Esc 退出</span>
            </div>

            {/* 内容 */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    <div className="prose-custom">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* 底栏 */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-bg-secondary text-[10px] text-text-tertiary shrink-0">
                <span>{content.length} 字符</span>
                <span>{content.split('\n').length} 行</span>
            </div>
        </div>
    );
}

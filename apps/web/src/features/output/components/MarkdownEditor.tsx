'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
    X,
    Eye,
    Edit3,
    Maximize2,
    Minimize2,
    Bold,
    Italic,
    Code,
    List,
    ListOrdered,
    Link,
    Heading1,
    Heading2,
    Quote,
    Minus,
    Image,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type EditorMode = 'edit' | 'preview' | 'split';

interface MarkdownEditorProps {
    open: boolean;
    title: string;
    content: string;
    onChange: (content: string) => void;
    onClose: () => void;
    onSave: () => void;
    saving?: boolean;
}

/* ── 工具栏按钮 ──────────────────────────── */
function ToolbarButton({
    icon: Icon,
    label,
    onClick,
}: {
    icon: React.ComponentType<{ size?: number }>;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        >
            <Icon size={15} />
        </button>
    );
}

/* ── Markdown 渲染样式 ──────────────────── */
function MarkdownPreview({ content }: { content: string }) {
    return (
        <div className="prose-custom h-full overflow-y-auto px-5 py-4">
            {content.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
                <p className="text-text-tertiary italic text-sm">暂无内容，开始编辑吧…</p>
            )}
        </div>
    );
}

/* ── 主组件 ─────────────────────────────── */
export function MarkdownEditor({
    open,
    title,
    content,
    onChange,
    onClose,
    onSave,
    saving = false,
}: MarkdownEditorProps) {
    const [mode, setMode] = useState<EditorMode>('split');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 快捷键
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                onSave();
            }
        };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [open, onClose, onSave]);

    // 聚焦 textarea
    useEffect(() => {
        if (open && mode !== 'preview') {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [open, mode]);

    /* ── 插入 markdown 语法 ── */
    const insertMd = useCallback(
        (before: string, after: string = '', placeholder: string = '') => {
            const ta = textareaRef.current;
            if (!ta) return;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const selected = ta.value.slice(start, end) || placeholder;
            const newText =
                ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
            onChange(newText);
            requestAnimationFrame(() => {
                ta.focus();
                const cursorPos = start + before.length + selected.length;
                ta.setSelectionRange(cursorPos, cursorPos);
            });
        },
        [onChange],
    );

    const toolbarActions = [
        { icon: Heading1, label: 'H1', action: () => insertMd('\n# ', '\n', '标题') },
        { icon: Heading2, label: 'H2', action: () => insertMd('\n## ', '\n', '标题') },
        { icon: Bold, label: '粗体', action: () => insertMd('**', '**', '粗体文本') },
        { icon: Italic, label: '斜体', action: () => insertMd('*', '*', '斜体文本') },
        { icon: Code, label: '行内代码', action: () => insertMd('`', '`', 'code') },
        'sep' as const,
        { icon: List, label: '无序列表', action: () => insertMd('\n- ', '\n', '列表项') },
        { icon: ListOrdered, label: '有序列表', action: () => insertMd('\n1. ', '\n', '列表项') },
        { icon: Quote, label: '引用', action: () => insertMd('\n> ', '\n', '引用文本') },
        { icon: Minus, label: '分割线', action: () => insertMd('\n---\n') },
        'sep' as const,
        { icon: Link, label: '链接', action: () => insertMd('[', '](url)', '链接文本') },
        { icon: Image, label: '图片', action: () => insertMd('![', '](url)', 'alt text') },
    ];

    if (!open) return null;

    const modeButtons: { key: EditorMode; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
        { key: 'edit', icon: Edit3, label: '编辑' },
        { key: 'split', icon: Maximize2, label: '分栏' },
        { key: 'preview', icon: Eye, label: '预览' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-bg-primary">
            {/* ── 顶栏 ── */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    >
                        <X size={18} />
                    </button>
                    <span className="text-sm font-semibold text-text-primary truncate">{title || '未命名'}</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* 模式切换 */}
                    <div className="flex items-center bg-bg-tertiary rounded-lg p-0.5">
                        {modeButtons.map(({ key, icon: Icon, label }) => (
                            <button
                                key={key}
                                onClick={() => setMode(key)}
                                title={label}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
                                    mode === key
                                        ? 'bg-bg-primary text-text-primary shadow-sm'
                                        : 'text-text-tertiary hover:text-text-secondary'
                                }`}
                            >
                                <Icon size={13} />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* 保存 */}
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
                    >
                        {saving ? '保存中…' : '保存'}
                    </button>
                </div>
            </div>

            {/* ── 工具栏（编辑/分栏模式显示） ── */}
            {mode !== 'preview' && (
                <div className="flex items-center gap-0.5 px-4 py-1 border-b border-border bg-bg-secondary shrink-0 overflow-x-auto">
                    {toolbarActions.map((item, i) =>
                        item === 'sep' ? (
                            <div key={`sep-${i}`} className="w-px h-4 bg-border mx-1" />
                        ) : (
                            <ToolbarButton key={item.label} icon={item.icon} label={item.label} onClick={item.action} />
                        ),
                    )}
                    <span className="ml-auto text-[10px] text-text-tertiary hidden sm:block">
                        ⌘S 保存 · Esc 退出
                    </span>
                </div>
            )}

            {/* ── 主区域 ── */}
            <div className="flex-1 flex min-h-0">
                {/* 编辑区 */}
                {mode !== 'preview' && (
                    <div className={`flex flex-col ${mode === 'split' ? 'w-1/2 border-r border-border' : 'w-full'}`}>
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={e => onChange(e.target.value)}
                            placeholder="开始用 Markdown 编写..."
                            spellCheck={false}
                            className="flex-1 w-full px-5 py-4 text-sm leading-relaxed bg-transparent text-text-primary placeholder:text-text-tertiary outline-none resize-none font-mono"
                        />
                    </div>
                )}

                {/* 预览区 */}
                {mode !== 'edit' && (
                    <div className={`flex flex-col ${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
                        {mode === 'split' && (
                            <div className="px-4 py-1.5 text-[10px] text-text-tertiary uppercase tracking-wide border-b border-border bg-bg-secondary">
                                Preview
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto">
                            <MarkdownPreview content={content} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── 底栏 ── */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-bg-secondary text-[10px] text-text-tertiary shrink-0">
                <span>{content.length} 字符</span>
                <span>{content.split('\n').length} 行</span>
            </div>
        </div>
    );
}

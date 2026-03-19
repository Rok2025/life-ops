'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    X,
    Eye,
    Edit3,
    Maximize2,
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
import { Button, SegmentedControl } from '@/components/ui';

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
            className="p-1.5 rounded-control text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-normal ease-standard"
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
                <p className="text-text-tertiary italic text-body-sm">暂无内容，开始编辑吧…</p>
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

    const insertMdRef = useRef(insertMd);
    useEffect(() => {
        insertMdRef.current = insertMd;
    }, [insertMd]);

    const toolbarActions = useMemo(
        () => [
            { icon: Heading1, label: 'H1', action: () => insertMdRef.current?.('\n# ', '\n', '标题') },
            { icon: Heading2, label: 'H2', action: () => insertMdRef.current?.('\n## ', '\n', '标题') },
            { icon: Bold, label: '粗体', action: () => insertMdRef.current?.('**', '**', '粗体文本') },
            { icon: Italic, label: '斜体', action: () => insertMdRef.current?.('*', '*', '斜体文本') },
            { icon: Code, label: '行内代码', action: () => insertMdRef.current?.('`', '`', 'code') },
            'sep' as const,
            { icon: List, label: '无序列表', action: () => insertMdRef.current?.('\n- ', '\n', '列表项') },
            { icon: ListOrdered, label: '有序列表', action: () => insertMdRef.current?.('\n1. ', '\n', '列表项') },
            { icon: Quote, label: '引用', action: () => insertMdRef.current?.('\n> ', '\n', '引用文本') },
            { icon: Minus, label: '分割线', action: () => insertMdRef.current?.('\n---\n') },
            'sep' as const,
            { icon: Link, label: '链接', action: () => insertMdRef.current?.('[', '](url)', '链接文本') },
            { icon: Image, label: '图片', action: () => insertMdRef.current?.('![', '](url)', 'alt text') },
        ],
        [],
    );

    if (!open) return null;

    const modeOptions = [
        { value: 'edit', label: '编辑', icon: <Edit3 size={13} /> },
        { value: 'split', label: '分栏', icon: <Maximize2 size={13} /> },
        { value: 'preview', label: '预览', icon: <Eye size={13} /> },
    ] as const;

    return (
        <div className="fixed inset-0 z-60 flex flex-col bg-bg-primary">
            {/* ── 顶栏 ── */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-control text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-normal ease-standard"
                    >
                        <X size={18} />
                    </button>
                    <span className="text-body font-semibold text-text-primary truncate">{title || '未命名'}</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* 模式切换 */}
                    <SegmentedControl
                        value={mode}
                        onChange={(next) => setMode(next as EditorMode)}
                        options={modeOptions}
                        aria-label="Markdown 编辑模式"
                    />

                    {/* 保存 */}
                    <Button onClick={onSave} disabled={saving} size="sm">
                        {saving ? '保存中…' : '保存'}
                    </Button>
                </div>
            </div>

            {/* ── 工具栏（编辑/分栏模式显示） ── */}
            {mode !== 'preview' && (
                <div className="flex items-center gap-0.5 px-4 py-1 border-b border-border bg-bg-secondary shrink-0 overflow-x-auto">
                    {/* toolbarActions are stable; ref is only read in click handlers */}
                    {/* eslint-disable-next-line react-hooks/refs */}
                    {toolbarActions.map((item, i) =>
                        item === 'sep' ? (
                            <div key={`sep-${i}`} className="w-px h-4 bg-border mx-1" />
                        ) : (
                            <ToolbarButton key={item.label} icon={item.icon} label={item.label} onClick={item.action} />
                        ),
                    )}
                    <span className="ml-auto text-caption text-text-tertiary hidden sm:block">
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
                            className="flex-1 w-full px-5 py-4 text-body-sm leading-relaxed bg-transparent text-text-primary placeholder:text-text-tertiary outline-none resize-none font-mono"
                        />
                    </div>
                )}

                {/* 预览区 */}
                {mode !== 'edit' && (
                    <div className={`flex flex-col ${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
                        {mode === 'split' && (
                            <div className="px-4 py-1.5 text-caption text-text-tertiary uppercase tracking-wide border-b border-border bg-bg-secondary">
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
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-bg-secondary text-caption text-text-tertiary shrink-0">
                <span>{content.length} 字符</span>
                <span>{content.split('\n').length} 行</span>
            </div>
        </div>
    );
}

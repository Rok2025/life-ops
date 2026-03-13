'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    Plus,
    Save,
    Trash2,
    Eye,
    Edit3,
    Maximize2,
    X,
    FileText,
    ChevronDown,
    ChevronRight,
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
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { outputApi } from '../api/outputApi';
import { useOutputsByProject } from '../hooks/useOutputsByProject';
import { OUTPUT_TYPE_CONFIG } from '../types';
import { AREA_CONFIG, SCOPE_CONFIG, STATUS_CONFIG, type GrowthArea, type ProjectWithStats } from '@/features/growth-projects';
import { MarkdownEditor } from './MarkdownEditor';
import type { Output, OutputType } from '../types';
import { Button, Card } from '@/components/ui';

interface ProjectDocEditorProps {
    project: ProjectWithStats;
    area: GrowthArea;
    onClose: () => void;
}

type InlineMode = 'edit' | 'preview';

/* ── 工具栏按钮 ── */
function TbBtn({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number }>; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            className="p-1 rounded-control text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-normal ease-standard"
        >
            <Icon size={14} />
        </button>
    );
}

/* ── 文档条目 ── */
function DocItem({ doc, onSelect, selected }: { doc: Output; onSelect: (d: Output) => void; selected: boolean }) {
    const typeCfg = OUTPUT_TYPE_CONFIG[doc.type];
    return (
        <button
            onClick={() => onSelect(doc)}
            className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-control text-caption transition-colors duration-normal ease-standard ${
                selected ? 'bg-accent/10 border border-accent/30' : 'hover:bg-bg-tertiary border border-transparent'
            }`}
        >
            <span className={`${typeCfg.color} shrink-0`}>{typeCfg.emoji}</span>
            <span className="text-text-primary truncate flex-1">{doc.title}</span>
            <span className="text-caption text-text-tertiary shrink-0">
                {new Date(doc.updated_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
            </span>
        </button>
    );
}

export function ProjectDocEditor({ project, area, onClose }: ProjectDocEditorProps) {
    const queryClient = useQueryClient();
    const areaCfg = AREA_CONFIG[area];
    const scopeCfg = SCOPE_CONFIG[project.scope];
    const statusCfg = STATUS_CONFIG[project.status];

    const { data: docs = [] } = useOutputsByProject(project.id);

    const [selectedDoc, setSelectedDoc] = useState<Output | null>(null);
    const [docTitle, setDocTitle] = useState('');
    const [docContent, setDocContent] = useState('');
    const [docType, setDocType] = useState<OutputType>('note');
    const [inlineMode, setInlineMode] = useState<InlineMode>('edit');
    const [isNew, setIsNew] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [docsExpanded, setDocsExpanded] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 选中文档时加载
    const handleSelectDoc = useCallback((doc: Output) => {
        setSelectedDoc(doc);
        setDocTitle(doc.title);
        setDocContent(doc.content ?? '');
        setDocType(doc.type);
        setIsNew(false);
        setInlineMode('edit');
    }, []);

    // 新建文档
    const handleNew = useCallback(() => {
        setSelectedDoc(null);
        setDocTitle('');
        setDocContent('');
        setDocType('note');
        setIsNew(true);
        setInlineMode('edit');
        setTimeout(() => textareaRef.current?.focus(), 100);
    }, []);

    // 保存（创建 or 更新）
    const createMutation = useMutation({
        mutationFn: () =>
            outputApi.create({
                project_id: project.id,
                title: docTitle.trim() || '未命名文档',
                type: docType,
                content: docContent,
                status: 'draft',
            }),
        onSuccess: (newDoc) => {
            queryClient.invalidateQueries({ queryKey: ['outputs'] });
            setSelectedDoc(newDoc);
            setIsNew(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: () =>
            outputApi.update(selectedDoc!.id, {
                title: docTitle.trim() || '未命名文档',
                type: docType,
                content: docContent,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['outputs'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => outputApi.delete(selectedDoc!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['outputs'] });
            setSelectedDoc(null);
            setDocTitle('');
            setDocContent('');
            setIsNew(false);
        },
    });

    const handleSave = useCallback(() => {
        if (isNew) {
            createMutation.mutate();
        } else if (selectedDoc) {
            updateMutation.mutate();
        }
    }, [isNew, selectedDoc, createMutation, updateMutation]);

    const handleDelete = useCallback(() => {
        if (!selectedDoc) return;
        if (!confirm('确定删除此文档？')) return;
        deleteMutation.mutate();
    }, [selectedDoc, deleteMutation]);

    const saving = createMutation.isPending || updateMutation.isPending;

    // ⌘S 快捷键
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's' && (isNew || selectedDoc)) {
                e.preventDefault();
                handleSave();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [handleSave, isNew, selectedDoc]);

    /* ── 插入 markdown ── */
    const insertMd = useCallback(
        (before: string, after: string = '', placeholder: string = '') => {
            const ta = textareaRef.current;
            if (!ta) return;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const selected = ta.value.slice(start, end) || placeholder;
            const newText = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
            setDocContent(newText);
            requestAnimationFrame(() => {
                ta.focus();
                const cursorPos = start + before.length + selected.length;
                ta.setSelectionRange(cursorPos, cursorPos);
            });
        },
        [],
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
            { icon: Code, label: '代码', action: () => insertMdRef.current?.('`', '`', 'code') },
            'sep' as const,
            { icon: List, label: '列表', action: () => insertMdRef.current?.('\n- ', '\n', '列表项') },
            { icon: ListOrdered, label: '有序列表', action: () => insertMdRef.current?.('\n1. ', '\n', '列表项') },
            { icon: Quote, label: '引用', action: () => insertMdRef.current?.('\n> ', '\n', '引用文本') },
            { icon: Minus, label: '分割线', action: () => insertMdRef.current?.('\n---\n') },
            'sep' as const,
            { icon: Link, label: '链接', action: () => insertMdRef.current?.('[', '](url)', '链接文本') },
        ],
        [],
    );

    const hasContent = isNew || !!selectedDoc;
    const pct = project.todo_total > 0 ? Math.round((project.todo_completed / project.todo_total) * 100) : 0;

    return (
        <Card variant="subtle" className="overflow-hidden border border-accent/30">
            {/* ── 项目头部 ── */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg-secondary">
                <span className="text-body">{areaCfg.icon}</span>
                <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                <span className={`text-caption px-1.5 py-0.5 rounded-control ${scopeCfg.color} ${scopeCfg.bg}`}>{scopeCfg.label}</span>
                <span className="text-body font-semibold text-text-primary truncate">{project.title}</span>
                {project.todo_total > 0 && (
                    <span className="text-caption text-text-tertiary ml-1">{pct}%</span>
                )}
                <div className="ml-auto flex items-center gap-1">
                    <button onClick={onClose} className="p-1 rounded-control text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-normal ease-standard">
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="flex min-h-[320px]">
                {/* ── 左侧：文档列表 ── */}
                <div className="w-48 shrink-0 border-r border-border p-2 space-y-1">
                    <div className="flex items-center justify-between mb-1">
                        <button
                            onClick={() => setDocsExpanded(!docsExpanded)}
                            className="flex items-center gap-1 text-caption text-text-tertiary uppercase tracking-wide"
                        >
                            {docsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            文档 ({docs.length})
                        </button>
                        <button
                            onClick={handleNew}
                            className="p-0.5 text-accent hover:bg-accent/10 rounded-control transition-colors duration-normal ease-standard"
                            title="新建文档"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    {docsExpanded && (
                        <div className="space-y-0.5">
                            {docs.length === 0 && !isNew && (
                                <p className="text-caption text-text-tertiary px-2 py-2">暂无文档</p>
                            )}
                            {isNew && (
                                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-control bg-accent/10 border border-accent/30 text-caption">
                                    <FileText size={12} className="text-accent shrink-0" />
                                    <span className="text-accent truncate">新文档</span>
                                </div>
                            )}
                            {docs.map(d => (
                                <DocItem
                                    key={d.id}
                                    doc={d}
                                    onSelect={handleSelectDoc}
                                    selected={!isNew && selectedDoc?.id === d.id}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── 右侧：编辑/预览 ── */}
                <div className="flex-1 flex flex-col min-w-0">
                    {hasContent ? (
                        <>
                            {/* 文档标题 + 操作栏 */}
                            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border">
                                <input
                                    value={docTitle}
                                    onChange={e => setDocTitle(e.target.value)}
                                    placeholder="文档标题"
                                    className="flex-1 text-body font-medium bg-transparent text-text-primary outline-none placeholder:text-text-tertiary"
                                />
                                <div className="flex items-center bg-bg-tertiary rounded-control p-0.5">
                                    <button
                                        onClick={() => setInlineMode('edit')}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-control text-caption transition-colors duration-normal ease-standard ${
                                            inlineMode === 'edit' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-tertiary'
                                        }`}
                                    >
                                        <Edit3 size={11} /> 编辑
                                    </button>
                                    <button
                                        onClick={() => setInlineMode('preview')}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-control text-caption transition-colors duration-normal ease-standard ${
                                            inlineMode === 'preview' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-tertiary'
                                        }`}
                                    >
                                        <Eye size={11} /> 预览
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowFullscreen(true)}
                                    className="p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-control transition-colors duration-normal ease-standard"
                                    title="全屏编辑"
                                >
                                    <Maximize2 size={14} />
                                </button>
                                <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
                                    <Save size={12} />
                                    {saving ? '保存中…' : '保存'}
                                </Button>
                                {selectedDoc && (
                                    <button
                                        onClick={handleDelete}
                                        className="p-1 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-control transition-colors duration-normal ease-standard"
                                        title="删除文档"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>

                            {/* 工具栏（编辑模式） */}
                            {inlineMode === 'edit' && (
                                <div className="flex items-center gap-0.5 px-3 py-1 border-b border-border overflow-x-auto">
                                    {/* eslint-disable-next-line react-hooks/refs */}
                                    {toolbarActions.map((item, i) =>
                                        item === 'sep' ? (
                                            <div key={`sep-${i}`} className="w-px h-3.5 bg-border mx-0.5" />
                                        ) : (
                                            <TbBtn key={item.label} icon={item.icon} label={item.label} onClick={item.action} />
                                        ),
                                    )}
                                    <span className="ml-auto text-caption text-text-tertiary">⌘S 保存</span>
                                </div>
                            )}

                            {/* 内容区 */}
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                {inlineMode === 'edit' ? (
                                    <textarea
                                        ref={textareaRef}
                                        value={docContent}
                                        onChange={e => setDocContent(e.target.value)}
                                        placeholder="开始用 Markdown 编写…"
                                        spellCheck={false}
                                        className="w-full h-full min-h-[240px] px-4 py-3 text-body-sm leading-relaxed bg-transparent text-text-primary placeholder:text-text-tertiary outline-none resize-none font-mono"
                                    />
                                ) : (
                                    <div className="px-4 py-3 prose-custom">
                                        {docContent.trim() ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{docContent}</ReactMarkdown>
                                        ) : (
                                            <p className="text-text-tertiary italic text-body-sm">暂无内容</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 底部信息 */}
                            <div className="flex items-center justify-between px-3 py-1 border-t border-border text-caption text-text-tertiary">
                                <span>{docContent.length} 字符 · {docContent.split('\n').length} 行</span>
                                {selectedDoc && (
                                    <span>更新于 {new Date(selectedDoc.updated_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-text-tertiary">
                            <div className="text-center">
                                <FileText size={28} className="mx-auto mb-2 opacity-50" />
                                <p className="text-body-sm mb-2">选择或创建一个文档</p>
                                <button onClick={handleNew} className="text-body-sm text-accent hover:underline">
                                    新建文档 →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 全屏编辑器 */}
            <MarkdownEditor
                open={showFullscreen}
                title={docTitle || '未命名文档'}
                content={docContent}
                onChange={setDocContent}
                onClose={() => setShowFullscreen(false)}
                onSave={() => {
                    handleSave();
                    setShowFullscreen(false);
                }}
                saving={saving}
            />
        </Card>
    );
}

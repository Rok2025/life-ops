'use client';

import { useState, useCallback } from 'react';
import { Trash2, Maximize2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import { MarkdownEditor } from '@/features/output/components/MarkdownEditor';
import type { ProjectNote, ProjectNoteType } from '../types';
import { NOTE_TYPE_CONFIG } from '../types';

interface NoteItemProps {
    note: ProjectNote;
    projectId: string;
}

function NoteItem({ note, projectId }: NoteItemProps) {
    const queryClient = useQueryClient();
    const config = NOTE_TYPE_CONFIG[note.type];
    const [expanded, setExpanded] = useState(false);

    const deleteMutation = useMutation({
        mutationFn: () => projectsApi.deleteNote(note.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-notes', projectId] });
        },
    });

    const isLong = note.content.length > 80;

    return (
        <div className="glass-list-row px-2 py-1.5">
            <div className="flex items-start gap-2">
                <span className={`text-caption px-1.5 py-0.5 rounded-control ${config.bg} ${config.color} shrink-0 mt-0.5`}>
                    {config.emoji}
                </span>
                <div className="flex-1 min-w-0">
                    <p className={`text-body-sm text-text-primary whitespace-pre-wrap wrap-break-word ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
                        {note.content}
                    </p>
                    {isLong && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-caption text-accent hover:underline mt-0.5"
                        >
                            {expanded ? '收起' : '展开'}
                        </button>
                    )}
                </div>
                <span className="text-caption text-text-tertiary shrink-0 mt-0.5">
                    {new Date(note.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </span>
                <button
                    onClick={() => deleteMutation.mutate()}
                    className="p-0.5 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-control transition-colors duration-normal ease-standard shrink-0 mt-0.5"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

interface NoteListProps {
    projectId: string;
    notes: ProjectNote[];
}

export function NoteList({ projectId, notes }: NoteListProps) {
    const queryClient = useQueryClient();
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState<ProjectNoteType>('note');
    const [showEditor, setShowEditor] = useState(false);

    const createMutation = useMutation({
        mutationFn: (data: { content: string; type: ProjectNoteType }) =>
            projectsApi.createNote({ project_id: projectId, type: data.type, content: data.content }),
        onSuccess: () => {
            setNewContent('');
            queryClient.invalidateQueries({ queryKey: ['project-notes', projectId] });
        },
    });

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newContent.trim();
        if (!trimmed) return;
        createMutation.mutate({ content: trimmed, type: newType });
    }, [newContent, newType, createMutation]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            const trimmed = newContent.trim();
            if (!trimmed) return;
            createMutation.mutate({ content: trimmed, type: newType });
        }
    }, [newContent, newType, createMutation]);

    const noteTypes: ProjectNoteType[] = ['idea', 'achievement', 'note'];

    return (
        <div>
            <div className="mb-2 text-caption font-medium uppercase tracking-wide text-text-secondary">
                灵感 & 成果 ({notes.length})
            </div>
            {notes.length > 0 ? (
                <div className="space-y-0.5 mb-2">
                    {notes.map(note => (
                        <NoteItem key={note.id} note={note} projectId={projectId} />
                    ))}
                </div>
            ) : (
                <p className="text-caption text-text-tertiary py-2 px-2 mb-2">暂无灵感记录</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-1.5">
                <div className="glass-filter-bar flex flex-wrap items-center">
                    {noteTypes.map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setNewType(t)}
                            className={`glass-filter-chip text-caption ${
                                newType === t
                                    ? 'glass-filter-chip-active font-medium text-text-primary'
                                    : ''
                            }`}
                        >
                            {NOTE_TYPE_CONFIG[t].emoji} {NOTE_TYPE_CONFIG[t].label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1.5">
                    <textarea
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="记录灵感或成果... (⌘+Enter 提交)"
                        rows={2}
                        className="flex-1 resize-none rounded-control border border-glass-border bg-panel-bg px-control-x py-control-y text-body-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors duration-normal ease-standard focus:border-accent"
                    />
                    <div className="flex flex-col justify-end gap-1 shrink-0 pb-1.5">
                        <button
                            type="button"
                            onClick={() => setShowEditor(true)}
                            className="p-1 text-text-tertiary hover:text-accent hover:bg-accent/10 rounded-control transition-colors duration-normal ease-standard"
                            title="全屏编辑"
                        >
                            <Maximize2 size={14} />
                        </button>
                        {newContent.trim() && (
                            <button type="submit" className="text-caption text-accent hover:underline">
                                添加
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* 全屏 Markdown 编辑器 */}
            <MarkdownEditor
                open={showEditor}
                title={`${NOTE_TYPE_CONFIG[newType].emoji} ${NOTE_TYPE_CONFIG[newType].label}`}
                content={newContent}
                onChange={setNewContent}
                onClose={() => setShowEditor(false)}
                onSave={() => {
                    setShowEditor(false);
                    const trimmed = newContent.trim();
                    if (trimmed) {
                        createMutation.mutate({ content: trimmed, type: newType });
                    }
                }}
                saving={createMutation.isPending}
            />
        </div>
    );
}

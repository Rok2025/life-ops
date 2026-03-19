'use client';

import { Edit2, Trash2 } from 'lucide-react';
import type { QuickNote } from '../types';
import { NOTE_TYPE_CONFIG, PRIORITY_CONFIG } from '../types';

interface NoteCardProps {
    note: QuickNote;
    onEdit: (note: QuickNote) => void;
    onDelete: (id: string) => void;
    onToggleCompleted?: (id: string, completed: boolean) => void;
}

export function NoteCard({ note, onEdit, onDelete, onToggleCompleted }: NoteCardProps) {
    const config = NOTE_TYPE_CONFIG[note.type];
    const isTodo = note.type === 'todo';
    const priorityCfg = note.priority ? PRIORITY_CONFIG[note.priority] : null;
    const showPriority = isTodo && priorityCfg && note.priority !== 'normal';

    return (
        <div className="group">
            <div className="glass-list-row flex items-center gap-2 px-3 py-2">
                {/* 待办勾选框 */}
                {isTodo && onToggleCompleted ? (
                    <button
                        type="button"
                        onClick={() => onToggleCompleted(note.id, !note.is_completed)}
                        className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors duration-normal ease-standard ${
                            note.is_completed
                                ? 'border-success bg-success text-white'
                                : 'border-glass-border hover:border-accent'
                        }`}
                        aria-label={note.is_completed ? '标记为未完成' : '标记为已完成'}
                    >
                        {note.is_completed && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                ) : null}

                {/* 类型标签 */}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-caption ${config.bg} ${config.color}`}>
                    {config.emoji} {config.label}
                </span>

                {/* 优先级标签 */}
                {showPriority && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-caption ${priorityCfg.bg} ${priorityCfg.color}`}>
                        {priorityCfg.emoji} {priorityCfg.label}
                    </span>
                )}

                {/* 内容 */}
                <div className="flex-1 min-w-0 truncate">
                    <span className={`text-body-sm ${isTodo && note.is_completed ? 'line-through text-text-secondary/50' : 'text-text-primary'}`}>
                        {note.content}
                    </span>
                </div>

                {/* 时间 + 操作 */}
                <div className="flex items-center gap-0.5 shrink-0">
                    <span className="text-caption text-text-secondary/50 mr-1">
                        {new Date(note.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                        onClick={() => onEdit(note)}
                        className="rounded-control p-1 text-text-secondary opacity-0 transition-all duration-normal ease-standard group-hover:opacity-100 hover:bg-panel-bg hover:text-text-primary"
                    >
                        <Edit2 size={13} />
                    </button>
                    <button
                        onClick={() => onDelete(note.id)}
                        className="rounded-control p-1 text-danger opacity-0 transition-all duration-normal ease-standard group-hover:opacity-100 hover:bg-danger/10"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

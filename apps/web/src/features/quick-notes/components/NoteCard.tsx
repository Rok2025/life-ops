'use client';

import { Edit2, Trash2 } from 'lucide-react';
import type { QuickNote } from '../types';
import { NOTE_TYPE_CONFIG } from '../types';

interface NoteCardProps {
    note: QuickNote;
    onEdit: (note: QuickNote) => void;
    onDelete: (id: string) => void;
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
    const config = NOTE_TYPE_CONFIG[note.type];

    return (
        <div className="group">
            <div className="glass-list-row flex items-center gap-2 px-3 py-2">
                {/* 类型标签 */}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-caption ${config.bg} ${config.color}`}>
                    {config.emoji} {config.label}
                </span>

                {/* 内容 */}
                <div className="flex-1 min-w-0 truncate">
                    <span className="text-text-primary text-body-sm">{note.content}</span>
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

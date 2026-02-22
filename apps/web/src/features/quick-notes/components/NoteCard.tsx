'use client';

import { Edit2, Trash2, Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import type { QuickNote } from '../types';
import { NOTE_TYPE_CONFIG } from '../types';

interface NoteCardProps {
    note: QuickNote;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    onEdit: (note: QuickNote) => void;
    onDelete: (id: string) => void;
}

export function NoteCard({ note, isExpanded, onToggleExpand, onEdit, onDelete }: NoteCardProps) {
    const config = NOTE_TYPE_CONFIG[note.type];

    return (
        <div className="group">
            <div className="p-3 bg-bg-tertiary rounded-lg flex items-start gap-3">
                {/* 类型标签 */}
                <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color} shrink-0 mt-0.5`}>
                    {config.emoji} {config.label}
                </span>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                    <span className="text-text-primary text-sm">{note.content}</span>

                    {/* 问答类型 */}
                    {note.type === 'question' && (
                        <div className="mt-1">
                            {note.is_answered ? (
                                <button
                                    onClick={() => onToggleExpand(note.id)}
                                    className="text-xs text-green-400 flex items-center gap-1 hover:underline"
                                >
                                    <Check size={12} />
                                    已回答
                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                            ) : (
                                <button
                                    onClick={() => onEdit(note)}
                                    className="text-xs text-orange-400 flex items-center gap-1 hover:underline"
                                >
                                    <MessageSquare size={12} />
                                    待回答，点击作答
                                </button>
                            )}
                        </div>
                    )}

                    {/* 展开的答案 */}
                    {note.type === 'question' && note.is_answered && isExpanded && (
                        <div className="mt-2 pl-3 border-l-2 border-green-500/30 text-sm text-text-secondary">
                            {note.answer}
                        </div>
                    )}
                </div>

                {/* 时间 + 操作 */}
                <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-text-secondary/50 mr-1">
                        {new Date(note.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                        onClick={() => onEdit(note)}
                        className="p-1.5 text-text-secondary hover:bg-bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(note.id)}
                        className="p-1.5 text-danger hover:bg-danger/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

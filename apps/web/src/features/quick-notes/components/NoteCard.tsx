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
            <div className="py-1.5 px-3 bg-bg-tertiary rounded-lg flex items-center gap-2">
                {/* 类型标签 */}
                <span className={`text-xs px-1.5 py-0.5 rounded ${config.bg} ${config.color} shrink-0`}>
                    {config.emoji} {config.label}
                </span>

                {/* 内容 */}
                <div className="flex-1 min-w-0 truncate">
                    <span className="text-text-primary text-sm">{note.content}</span>

                    {/* 问答类型 - 内联显示 */}
                    {note.type === 'question' && (
                        <>
                            {note.is_answered ? (
                                <button
                                    onClick={() => onToggleExpand(note.id)}
                                    className="text-xs text-green-400 inline-flex items-center gap-0.5 hover:underline ml-2"
                                >
                                    <Check size={11} />
                                    已回答
                                    {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                </button>
                            ) : (
                                <button
                                    onClick={() => onEdit(note)}
                                    className="text-xs text-orange-400 inline-flex items-center gap-0.5 hover:underline ml-2"
                                >
                                    <MessageSquare size={11} />
                                    待回答
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* 时间 + 操作 */}
                <div className="flex items-center gap-0.5 shrink-0">
                    <span className="text-xs text-text-secondary/50 mr-1">
                        {new Date(note.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                        onClick={() => onEdit(note)}
                        className="p-1 text-text-secondary hover:bg-bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit2 size={13} />
                    </button>
                    <button
                        onClick={() => onDelete(note.id)}
                        className="p-1 text-danger hover:bg-danger/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* 展开的答案 - 在行下方展开 */}
            {note.type === 'question' && note.is_answered && isExpanded && (
                <div className="mt-1 ml-3 pl-3 border-l-2 border-green-500/30 text-sm text-text-secondary py-1">
                    {note.answer}
                </div>
            )}
        </div>
    );
}

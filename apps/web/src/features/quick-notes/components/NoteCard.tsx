'use client';

import { Edit2, Trash2, Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import type { QuickNote } from '../types';
import { NOTE_TYPE_CONFIG } from '../types';
import { TONES } from '@/design-system/tokens';

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
            <div className="glass-list-row flex items-center gap-2 px-3 py-2">
                {/* 类型标签 */}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-caption ${config.bg} ${config.color}`}>
                    {config.emoji} {config.label}
                </span>

                {/* 内容 */}
                <div className="flex-1 min-w-0 truncate">
                    <span className="text-text-primary text-body-sm">{note.content}</span>

                    {/* 问答类型 - 内联显示 */}
                    {note.type === 'question' && (
                        <>
                            {note.is_answered ? (
                                <button
                                    onClick={() => onToggleExpand(note.id)}
                                    className={`ml-2 inline-flex items-center gap-0.5 text-caption hover:underline ${TONES.success.color}`}
                                >
                                    <Check size={11} />
                                    已回答
                                    {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                </button>
                            ) : (
                                <button
                                    onClick={() => onEdit(note)}
                                    className={`ml-2 inline-flex items-center gap-0.5 text-caption hover:underline ${TONES.orange.color}`}
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

            {/* 展开的答案 - 在行下方展开 */}
            {note.type === 'question' && note.is_answered && isExpanded && (
                <div className="mt-1 ml-3 rounded-control border border-glass-border bg-panel-bg px-3 py-2 text-body-sm text-text-secondary backdrop-blur-xl">
                    {note.answer}
                </div>
            )}
        </div>
    );
}

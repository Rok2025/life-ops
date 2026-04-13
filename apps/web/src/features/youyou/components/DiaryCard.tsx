'use client';

import { useState } from 'react';
import { Edit2, Trash2, MoreHorizontal, Utensils, Moon, Lightbulb, MessageCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { youyouApi } from '../api/youyouApi';
import { MOOD_CONFIG } from '../types';
import type { DiaryEntry } from '../types';
import { Card } from '@/components/ui';

interface DiaryCardProps {
    entry: DiaryEntry;
    onEdit: (entry: DiaryEntry) => void;
}

export function DiaryCard({ entry, onEdit }: DiaryCardProps) {
    const queryClient = useQueryClient();
    const [showMenu, setShowMenu] = useState(false);

    const deleteMutation = useMutation({
        mutationFn: () => youyouApi.deleteDiary(entry.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-diary'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-diary-stats'] });
        },
    });

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确定删除这篇日记吗？')) return;
        deleteMutation.mutate();
    };

    const weekDay = ['日', '一', '二', '三', '四', '五', '六'][new Date(entry.date).getDay()];

    return (
        <Card className="p-3">
            {/* Header: date + mood + actions */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-body-sm font-medium text-text-primary">{entry.date.slice(5)}</span>
                    <span className="text-caption text-text-tertiary">周{weekDay}</span>
                </div>
                {entry.mood && (
                    <span
                        className={`text-caption px-1.5 py-0.5 rounded-control ${MOOD_CONFIG[entry.mood].bg} ${MOOD_CONFIG[entry.mood].color}`}
                    >
                        {MOOD_CONFIG[entry.mood].emoji} {MOOD_CONFIG[entry.mood].label}
                    </span>
                )}
                <div className="flex-1" />
                {/* More actions */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="rounded-control p-1 text-text-tertiary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-text-secondary"
                    >
                        <MoreHorizontal size={14} />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="glass-popover absolute right-0 top-full z-20 mt-1 min-w-25 rounded-card py-1">
                                <button
                                    onClick={() => { onEdit(entry); setShowMenu(false); }}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-body-sm text-text-primary transition-colors duration-normal ease-standard hover:bg-panel-bg"
                                >
                                    <Edit2 size={12} /> 编辑
                                </button>
                                <button
                                    onClick={e => { handleDelete(e); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-body-sm text-danger hover:bg-danger/10 flex items-center gap-2 transition-colors duration-normal ease-standard"
                                >
                                    <Trash2 size={12} /> 删除
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Highlight */}
            {entry.highlight && (
                <div className="mt-2 flex items-start gap-2">
                    <Lightbulb size={14} className="mt-0.5 shrink-0 text-tone-yellow" />
                    <p className="text-body-sm text-text-primary">{entry.highlight}</p>
                </div>
            )}

            {/* Content */}
            {entry.content && (
                <p className="mt-1.5 text-body-sm text-text-secondary line-clamp-3">{entry.content}</p>
            )}

            {/* Funny Quote */}
            {entry.funny_quote && (
                <div className="mt-2 flex items-start gap-2 rounded-inner-card border border-glass-border/50 bg-tone-yellow/8 px-2.5 py-2">
                    <MessageCircle size={14} className="mt-0.5 shrink-0 text-tone-yellow" />
                    <p className="text-body-sm text-text-primary italic">&ldquo;{entry.funny_quote}&rdquo;</p>
                </div>
            )}

            {/* Bottom row: learned + diet + sleep */}
            {(entry.learned || entry.diet_note || entry.sleep_note) && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-caption text-text-tertiary">
                    {entry.learned && (
                        <span className="flex items-center gap-1">📖 {entry.learned}</span>
                    )}
                    {entry.diet_note && (
                        <span className="flex items-center gap-1">
                            <Utensils size={10} /> {entry.diet_note}
                        </span>
                    )}
                    {entry.sleep_note && (
                        <span className="flex items-center gap-1">
                            <Moon size={10} /> {entry.sleep_note}
                        </span>
                    )}
                </div>
            )}
        </Card>
    );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { youyouApi } from '../api/youyouApi';
import { MOOD_CONFIG } from '../types';
import type { DiaryEntry, DiaryMood, CreateDiaryInput, UpdateDiaryInput } from '../types';
import { Button, Dialog, Input } from '@/components/ui';

interface DiaryFormDialogProps {
    open: boolean;
    onClose: () => void;
    editingEntry?: DiaryEntry | null;
}

export function DiaryFormDialog({ open, onClose, editingEntry }: DiaryFormDialogProps) {
    const queryClient = useQueryClient();
    const isEditing = !!editingEntry;

    const [date, setDate] = useState('');
    const [mood, setMood] = useState<DiaryMood | null>(null);
    const [highlight, setHighlight] = useState('');
    const [learned, setLearned] = useState('');
    const [funnyQuote, setFunnyQuote] = useState('');
    const [dietNote, setDietNote] = useState('');
    const [sleepNote, setSleepNote] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        queueMicrotask(() => {
            if (editingEntry) {
                setDate(editingEntry.date);
                setMood(editingEntry.mood);
                setHighlight(editingEntry.highlight ?? '');
                setLearned(editingEntry.learned ?? '');
                setFunnyQuote(editingEntry.funny_quote ?? '');
                setDietNote(editingEntry.diet_note ?? '');
                setSleepNote(editingEntry.sleep_note ?? '');
                setContent(editingEntry.content ?? '');
            } else {
                setDate(new Date().toISOString().slice(0, 10));
                setMood(null);
                setHighlight('');
                setLearned('');
                setFunnyQuote('');
                setDietNote('');
                setSleepNote('');
                setContent('');
            }
        });
    }, [editingEntry]);

    const createMutation = useMutation({
        mutationFn: (input: CreateDiaryInput) => youyouApi.createDiary(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-diary'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-diary-stats'] });
            onClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (input: UpdateDiaryInput) => youyouApi.updateDiary(editingEntry!.id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-diary'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-diary-stats'] });
            onClose();
        },
    });

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!date) return;

            if (isEditing) {
                updateMutation.mutate({
                    mood: mood ?? null,
                    highlight: highlight || null,
                    learned: learned || null,
                    funny_quote: funnyQuote || null,
                    diet_note: dietNote || null,
                    sleep_note: sleepNote || null,
                    content: content || null,
                });
            } else {
                createMutation.mutate({
                    date,
                    mood: mood ?? null,
                    highlight: highlight || null,
                    learned: learned || null,
                    funny_quote: funnyQuote || null,
                    diet_note: dietNote || null,
                    sleep_note: sleepNote || null,
                    content: content || null,
                });
            }
        },
        [date, mood, highlight, learned, funnyQuote, dietNote, sleepNote, content, isEditing, createMutation, updateMutation],
    );

    if (!open) return null;

    const saving = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={isEditing ? '编辑日记' : '写日记'}
            maxWidth="lg"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-4 overflow-y-auto px-5 py-4">
                    {/* 日期 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">日期 *</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                            disabled={isEditing}
                        />
                    </div>

                    {/* 心情 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1.5">今天心情</label>
                        <div className="flex flex-wrap gap-1.5">
                            {(Object.keys(MOOD_CONFIG) as DiaryMood[]).map(m => {
                                const cfg = MOOD_CONFIG[m];
                                const selected = mood === m;
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMood(selected ? null : m)}
                                        className={`flex items-center gap-1 rounded-control px-2.5 py-1.5 text-body-sm transition-colors duration-normal ease-standard border ${
                                            selected
                                                ? `${cfg.bg} ${cfg.color} border-current`
                                                : 'border-glass-border bg-panel-bg text-text-secondary hover:bg-card-bg'
                                        }`}
                                    >
                                        <span>{cfg.emoji}</span>
                                        <span>{cfg.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 今日亮点 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">💡 今日亮点</label>
                        <Input
                            type="text"
                            value={highlight}
                            onChange={e => setHighlight(e.target.value)}
                            placeholder="今天最值得记住的事"
                        />
                    </div>

                    {/* 童言趣语 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">💬 童言趣语</label>
                        <Input
                            type="text"
                            value={funnyQuote}
                            onChange={e => setFunnyQuote(e.target.value)}
                            placeholder="又又今天说了什么有趣的话？"
                        />
                    </div>

                    {/* 学到了什么 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">📖 今天学到</label>
                        <Input
                            type="text"
                            value={learned}
                            onChange={e => setLearned(e.target.value)}
                            placeholder="新学会的技能、认识的字、会说的新词等"
                        />
                    </div>

                    {/* 饮食 & 睡眠 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">🍽️ 饮食</label>
                            <Input
                                type="text"
                                value={dietNote}
                                onChange={e => setDietNote(e.target.value)}
                                placeholder="胃口/挑食/零食"
                            />
                        </div>
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">🌙 睡眠</label>
                            <Input
                                type="text"
                                value={sleepNote}
                                onChange={e => setSleepNote(e.target.value)}
                                placeholder="午睡/夜睡情况"
                            />
                        </div>
                    </div>

                    {/* 详细内容 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">📝 详细记录</label>
                        <Input
                            multiline
                            rows={4}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="更多想记下来的事情..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-glass-border px-5 py-3">
                    <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                        取消
                    </Button>
                    <Button type="submit" size="sm" disabled={!date || saving}>
                        {saving ? '保存中...' : isEditing ? '更新' : '保存'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

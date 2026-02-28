'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { getLocalDateStr } from '@/lib/utils/date';
import type { QuickNote, NoteType } from '../types';
import { NOTE_TYPE_CONFIG, NOTE_TYPES } from '../types';

interface NoteFormProps {
    editingNote: QuickNote | null;
    defaultDate: string;
    defaultType?: NoteType;
    saving: boolean;
    onSave: (data: { type: NoteType; content: string; answer: string | null; date: string }) => void;
    onCancel: () => void;
}

export function NoteForm({ editingNote, defaultDate, defaultType, saving, onSave, onCancel }: NoteFormProps) {
    const [type, setType] = useState<NoteType>(editingNote?.type ?? defaultType ?? 'memo');
    const [content, setContent] = useState(editingNote?.content ?? '');
    const [answer, setAnswer] = useState(editingNote?.answer ?? '');
    const [date, setDate] = useState(editingNote?.note_date ?? defaultDate);

    const handleSubmit = useCallback(() => {
        if (!content.trim()) return;
        onSave({
            type,
            content: content.trim(),
            answer: type === 'question' ? (answer.trim() || null) : null,
            date,
        });
    }, [type, content, answer, date, onSave]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card p-card w-full max-w-md mx-4">
                <h3 className="text-base font-semibold text-text-primary mb-widget-header">
                    {editingNote ? '编辑记录' : '快速记录'}
                </h3>
                <div className="space-y-3">
                    {/* 类型选择 */}
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">类型</label>
                        <div className="flex gap-2">
                            {NOTE_TYPES.map(t => {
                                const config = NOTE_TYPE_CONFIG[t];
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${type === t
                                                ? `${config.bg} ${config.color} border-transparent font-medium`
                                                : 'border-border text-text-secondary hover:bg-bg-tertiary'
                                            }`}
                                    >
                                        {config.emoji} {config.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 日期 */}
                    <div>
                        <label className="block text-sm text-text-secondary mb-1">日期</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={getLocalDateStr()}
                            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
                        />
                    </div>

                    {/* 内容 */}
                    <div>
                        <label className="block text-sm text-text-secondary mb-1">
                            {type === 'question' ? '你的疑问' : '内容'}
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={NOTE_TYPE_CONFIG[type].placeholder}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary resize-none"
                            autoFocus
                        />
                    </div>

                    {/* 问答类型的答案 */}
                    {type === 'question' && (
                        <div>
                            <label className="block text-sm text-text-secondary mb-1">
                                答案 <span className="text-text-secondary/50">（可稍后填写）</span>
                            </label>
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="写下你的回答..."
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary resize-none"
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 rounded-lg border border-border text-text-secondary hover:bg-bg-tertiary flex items-center justify-center gap-1"
                    >
                        <X size={16} />
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || saving}
                        className="flex-1 btn-primary py-2 disabled:opacity-50"
                    >
                        {saving ? '保存中...' : '确定'}
                    </button>
                </div>
            </div>
        </div>
    );
}

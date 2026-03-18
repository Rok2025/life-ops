'use client';

import { useState, useCallback } from 'react';
import { getLocalDateStr } from '@/lib/utils/date';
import type { QuickNote, NoteType } from '../types';
import { NOTE_TYPE_CONFIG, NOTE_TYPES } from '../types';
import { Button, Dialog, Input } from '@/components/ui';

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
    const [date, setDate] = useState(editingNote?.note_date ?? defaultDate);

    const handleSubmit = useCallback(() => {
        if (!content.trim()) return;
        onSave({
            type,
            content: content.trim(),
            answer: null,
            date,
        });
    }, [type, content, date, onSave]);

    return (
        <Dialog
            open
            onClose={onCancel}
            title={editingNote ? '编辑记录' : '快速记录'}
            maxWidth="md"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
                className="flex min-h-0 flex-1 flex-col"
            >
                <div className="space-y-3 px-5 py-4">
                    {/* 类型选择 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-2">类型</label>
                        <div className="flex gap-2">
                            {NOTE_TYPES.map(t => {
                                const config = NOTE_TYPE_CONFIG[t];
                                return (
                                    <button
                                        type="button"
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`flex-1 px-3 py-2 rounded-control text-body-sm border transition-colors duration-normal ease-standard ${type === t
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
                        <label className="block text-caption text-text-secondary mb-1">日期</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={getLocalDateStr()}
                        />
                    </div>

                    {/* 内容 */}
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">
                            内容
                        </label>
                        <Input
                            multiline
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={NOTE_TYPE_CONFIG[type].placeholder}
                            rows={3}
                            className="resize-none"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex gap-2 border-t border-border bg-bg-primary px-5 py-3">
                    <Button type="button" onClick={onCancel} variant="ghost" className="flex-1">
                        取消
                    </Button>
                    <Button
                        type="submit"
                        disabled={!content.trim() || saving}
                        className="flex-1"
                    >
                        {saving ? '保存中...' : '确定'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

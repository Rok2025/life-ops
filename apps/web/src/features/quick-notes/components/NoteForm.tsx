'use client';

import { useState, useCallback } from 'react';
import { getLocalDateStr } from '@/lib/utils/date';
import type { QuickNote, NoteType, TodoPriority } from '../types';
import { NOTE_TYPE_CONFIG, NOTE_TYPES, PRIORITY_CONFIG, TODO_PRIORITIES } from '../types';
import { ChipGroup, Dialog, FormActions, Input } from '@/components/ui';
import type { ChipOption } from '@/components/ui';

interface NoteFormProps {
    editingNote: QuickNote | null;
    defaultDate: string;
    defaultType?: NoteType;
    saving: boolean;
    onSave: (data: { type: NoteType; content: string; answer: string | null; date: string; priority: TodoPriority | null }) => void;
    onCancel: () => void;
}

const NOTE_TYPE_OPTIONS: ChipOption<NoteType>[] = NOTE_TYPES.map((t) => ({
    value: t,
    label: `${NOTE_TYPE_CONFIG[t].emoji} ${NOTE_TYPE_CONFIG[t].label}`,
}));

const PRIORITY_OPTIONS: ChipOption<TodoPriority>[] = TODO_PRIORITIES.map((p) => {
    const cfg = PRIORITY_CONFIG[p];
    return { value: p, label: cfg.emoji ? `${cfg.emoji} ${cfg.label}` : cfg.label };
});

export function NoteForm({ editingNote, defaultDate, defaultType, saving, onSave, onCancel }: NoteFormProps) {
    const [type, setType] = useState<NoteType>(editingNote?.type ?? defaultType ?? 'memo');
    const [content, setContent] = useState(editingNote?.content ?? '');
    const [date, setDate] = useState(editingNote?.note_date ?? defaultDate);
    const [priority, setPriority] = useState<TodoPriority>(editingNote?.priority ?? 'normal');

    const handleSubmit = useCallback(() => {
        if (!content.trim()) return;
        onSave({
            type,
            content: content.trim(),
            answer: null,
            date,
            priority: type === 'todo' ? priority : null,
        });
    }, [type, content, date, priority, onSave]);

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
                        <label className="block text-caption text-text-secondary mb-1">类型</label>
                        <ChipGroup<NoteType>
                            label="记录类型"
                            name="note-type"
                            value={type}
                            options={NOTE_TYPE_OPTIONS}
                            onChange={setType}
                        />
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

                    {/* 待办优先级 */}
                    {type === 'todo' && (
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">优先级</label>
                            <ChipGroup<TodoPriority>
                                label="待办优先级"
                                name="todo-priority"
                                value={priority}
                                options={PRIORITY_OPTIONS}
                                onChange={setPriority}
                            />
                        </div>
                    )}

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
                            onCmdEnter={handleSubmit}
                        />
                    </div>
                </div>

                <FormActions onCancel={onCancel} disabled={!content.trim()} saving={saving} />
            </form>
        </Dialog>
    );
}

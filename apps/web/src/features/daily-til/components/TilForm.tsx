'use client';

import { useState, useCallback } from 'react';
import { getLocalDateStr } from '@/lib/utils/date';
import type { TIL } from '../types';
import { ChipGroup, DatePicker, Dialog, FormActions, Input } from '@/components/ui';
import type { ChipOption } from '@/components/ui';

interface TilFormProps {
    editingTil: TIL | null;
    defaultDate: string;
    saving: boolean;
    categories: string[];
    onSave: (content: string, category: string | null, date: string) => void;
    onCancel: () => void;
}

const buildCategoryOptions = (categories: string[]): ChipOption[] => [
    { value: '', label: '不分类' },
    ...categories.map((c) => ({ value: c, label: c })),
];

export function TilForm({ editingTil, defaultDate, saving, categories, onSave, onCancel }: TilFormProps) {
    const [content, setContent] = useState(editingTil?.content ?? '');
    const [category, setCategory] = useState(editingTil?.category ?? '');
    const [date, setDate] = useState(editingTil?.til_date ?? defaultDate);
    const categoryOptions = buildCategoryOptions(categories);

    const handleSubmit = useCallback(() => {
        if (!content.trim()) return;
        onSave(content.trim(), category || null, date);
    }, [content, category, date, onSave]);

    return (
        <Dialog
            open
            onClose={onCancel}
            title={editingTil ? '编辑 TIL' : '记录 TIL'}
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
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">日期</label>
                        <DatePicker value={date} onChange={setDate} maxDate={getLocalDateStr()} />
                    </div>
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">分类（可选）</label>
                        <ChipGroup
                            label="TIL 分类"
                            name="til-category"
                            value={category}
                            options={categoryOptions}
                            onChange={setCategory}
                        />
                    </div>
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">学到了什么</label>
                        <Input
                            multiline
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="今天我学到了..."
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

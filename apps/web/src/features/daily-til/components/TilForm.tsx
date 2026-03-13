'use client';

import { useState, useCallback } from 'react';
import { getLocalDateStr } from '@/lib/utils/date';
import type { TIL } from '../types';
import { Button, Dialog, Input } from '@/components/ui';

interface TilFormProps {
    editingTil: TIL | null;
    defaultDate: string;
    saving: boolean;
    categories: string[];
    onSave: (content: string, category: string | null, date: string) => void;
    onCancel: () => void;
}

export function TilForm({ editingTil, defaultDate, saving, categories, onSave, onCancel }: TilFormProps) {
    const [content, setContent] = useState(editingTil?.content ?? '');
    const [category, setCategory] = useState(editingTil?.category ?? '');
    const [date, setDate] = useState(editingTil?.til_date ?? defaultDate);

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
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={getLocalDateStr()}
                        />
                    </div>
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">分类（可选）</label>
                        <div className="flex flex-wrap gap-2">
                            <label
                                className={`inline-flex items-center px-3 py-1.5 rounded-control border cursor-pointer transition-colors duration-normal ease-standard text-body-sm ${
                                    category === ''
                                        ? 'border-accent bg-accent/10 text-accent'
                                        : 'border-border text-text-secondary hover:bg-bg-tertiary'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="til-category"
                                    value=""
                                    checked={category === ''}
                                    onChange={() => setCategory('')}
                                    className="sr-only"
                                />
                                不分类
                            </label>
                            {categories.map(cat => (
                                <label
                                    key={cat}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-control border cursor-pointer transition-colors duration-normal ease-standard text-body-sm ${
                                        category === cat
                                            ? 'border-accent bg-accent/10 text-accent'
                                            : 'border-border text-text-secondary hover:bg-bg-tertiary'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="til-category"
                                        value={cat}
                                        checked={category === cat}
                                        onChange={() => setCategory(cat)}
                                        className="sr-only"
                                    />
                                    {cat}
                                </label>
                            ))}
                        </div>
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

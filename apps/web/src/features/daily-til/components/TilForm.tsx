'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { getLocalDateStr } from '@/lib/utils/date';
import type { TIL } from '../types';

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card p-card w-full max-w-md mx-4">
                <h3 className="text-base font-semibold text-text-primary mb-widget-header">
                    {editingTil ? '编辑 TIL' : '记录 TIL'}
                </h3>
                <div className="space-y-3">
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
                    <div>
                        <label className="block text-sm text-text-secondary mb-1">分类（可选）</label>
                        <div className="flex flex-wrap gap-2">
                            <label
                                className={`inline-flex items-center px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-sm ${
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
                                    className={`inline-flex items-center px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-sm ${
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
                        <label className="block text-sm text-text-secondary mb-1">学到了什么</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="今天我学到了..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary resize-none"
                            autoFocus
                        />
                    </div>
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

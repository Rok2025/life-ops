'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { getLocalDateStr } from '@/lib/utils/date';
import type { Frog } from '../types';

interface FrogFormProps {
    editingFrog: Frog | null;
    defaultDate: string;
    saving: boolean;
    onSave: (title: string, date: string) => void;
    onCancel: () => void;
}

export function FrogForm({ editingFrog, defaultDate, saving, onSave, onCancel }: FrogFormProps) {
    const [title, setTitle] = useState(editingFrog?.title ?? '');
    const [date, setDate] = useState(editingFrog?.frog_date ?? defaultDate);

    const handleSubmit = useCallback(() => {
        if (!title.trim()) return;
        onSave(title.trim(), date);
    }, [title, date, onSave]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card p-card w-full max-w-md mx-4">
                <h3 className="text-base font-semibold text-text-primary mb-widget-header">
                    {editingFrog ? '编辑青蛙' : '添加青蛙'}
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
                        <label className="block text-sm text-text-secondary mb-1">任务内容</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="今天要完成的重要事情..."
                            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmit();
                            }}
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
                        disabled={!title.trim() || saving}
                        className="flex-1 btn-primary py-2 disabled:opacity-50"
                    >
                        {saving ? '保存中...' : '确定'}
                    </button>
                </div>
            </div>
        </div>
    );
}

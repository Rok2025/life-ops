'use client';

import { useState, useCallback } from 'react';
import { getLocalDateStr } from '@/lib/utils/date';
import type { Frog } from '../types';
import { Button, Dialog, Input } from '@/components/ui';

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
        <Dialog
            open
            onClose={onCancel}
            title={editingFrog ? '编辑青蛙' : '添加青蛙'}
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
                        <label className="block text-caption text-text-secondary mb-1">任务内容</label>
                        <Input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="今天要完成的重要事情..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmit();
                            }}
                        />
                    </div>
                </div>
                <div className="flex gap-2 border-t border-border bg-bg-primary px-5 py-3">
                    <Button type="button" onClick={onCancel} variant="ghost" className="flex-1">
                        取消
                    </Button>
                    <Button
                        type="submit"
                        disabled={!title.trim() || saving}
                        className="flex-1"
                    >
                        {saving ? '保存中...' : '确定'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

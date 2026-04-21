'use client';

import { useCallback, useState } from 'react';
import { formatDisplayDate } from '@/lib/utils/date';
import { ChipGroup, DatePicker, Dialog, FormActions, Input } from '@/components/ui';
import type { ChipOption } from '@/components/ui';
import type { QuickNote, TodoPriority } from '../types';
import { PRIORITY_CONFIG, TODO_PRIORITIES } from '../types';

export interface TodoFormValues {
    content: string;
    execute_date: string | null;
    priority: TodoPriority | null;
}

interface TodoFormDialogProps {
    open: boolean;
    mode?: 'create' | 'edit';
    todo?: QuickNote | null;
    initialValues?: Partial<TodoFormValues>;
    saving: boolean;
    onSave: (data: TodoFormValues) => void;
    onClose: () => void;
}

const PRIORITY_OPTIONS: ChipOption<TodoPriority>[] = TODO_PRIORITIES.map((priority) => {
    const config = PRIORITY_CONFIG[priority];
    return {
        value: priority,
        label: config.emoji ? `${config.emoji} ${config.label}` : config.label,
    };
});

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export function TodoFormDialog({
    open,
    mode: modeProp,
    todo,
    initialValues,
    saving,
    onSave,
    onClose,
}: TodoFormDialogProps) {
    const mode = modeProp ?? (todo ? 'edit' : 'create');
    const initialContent = todo?.content ?? initialValues?.content ?? '';
    const initialExecuteDate = todo?.execute_date ?? initialValues?.execute_date ?? '';
    const initialPriority = todo?.priority ?? initialValues?.priority ?? 'normal';
    const [content, setContent] = useState(initialContent);
    const [executeDate, setExecuteDate] = useState(initialExecuteDate);
    const [priority, setPriority] = useState<TodoPriority>(initialPriority);

    const handleSubmit = useCallback(() => {
        if (!content.trim()) return;
        onSave({
            content: content.trim(),
            execute_date: executeDate || null,
            priority,
        });
    }, [content, executeDate, onSave, priority]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={mode === 'create' ? '新建待办' : '编辑待办'}
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
                <div className="space-y-4 px-5 py-4">
                    {todo ? (
                        <div className="rounded-inner-card border border-glass-border bg-panel-bg/70 px-3 py-3 text-body-sm text-text-secondary">
                            <div className="flex flex-wrap items-center gap-3">
                                <span>创建于 {formatDateTime(todo.created_at)}</span>
                                <span>执行日 {todo.execute_date ? formatDisplayDate(todo.execute_date) : '未安排'}</span>
                                {todo.completed_at ? <span>完成于 {formatDateTime(todo.completed_at)}</span> : null}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-inner-card border border-glass-border bg-panel-bg/70 px-3 py-3 text-body-sm text-text-secondary">
                            创建后会自动记录当前时间，执行日期默认带出今天；如果需要，也可以改成别的日期。
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">内容</label>
                        <Input
                            multiline
                            rows={4}
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder={mode === 'create' ? '比如：补一下保险资料，给爸妈确认五一安排...' : '补充一下待办内容...'}
                            className="resize-none"
                            autoFocus
                            onCmdEnter={handleSubmit}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">执行日期</label>
                        <DatePicker
                            value={executeDate}
                            onChange={setExecuteDate}
                            clearable
                            placeholder="暂不指定执行日期"
                        />
                        <p className="mt-1 text-caption text-text-tertiary">默认是今天；清空后表示暂不指定执行日期。</p>
                    </div>

                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">优先级</label>
                        <ChipGroup<TodoPriority>
                            label="待办优先级"
                            name="todo-priority-edit"
                            value={priority}
                            options={PRIORITY_OPTIONS}
                            onChange={setPriority}
                        />
                    </div>
                </div>

                <FormActions onCancel={onClose} disabled={!content.trim()} saving={saving} />
            </form>
        </Dialog>
    );
}

'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker, Dialog, Input, Select, Button, Checkbox } from '@/components/ui';
import { familyApi } from '../api/familyApi';
import { useActiveMember } from '../contexts/ActiveMemberContext';
import type {
    FamilyTask,
    FamilyMember,
    TaskCategoryConfig,
    TaskPriority,
    TaskStatus,
    CreateTaskInput,
} from '../types';
import { TASK_PRIORITIES, PRIORITY_CONFIG, TASK_STATUSES, STATUS_CONFIG } from '../types';

interface TaskFormDialogProps {
    open: boolean;
    onClose: () => void;
    task?: FamilyTask | null;
    members: FamilyMember[];
    categories: TaskCategoryConfig[];
}

export function TaskFormDialog({
    open,
    onClose,
    task,
    members,
    categories,
}: TaskFormDialogProps) {
    const queryClient = useQueryClient();
    const { activeMemberId } = useActiveMember();
    const isEdit = !!task;

    const [title, setTitle] = useState(task?.title ?? '');
    const [description, setDescription] = useState(task?.description ?? '');
    const [category, setCategory] = useState(task?.category ?? '');
    const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'normal');
    const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
    const [dueDate, setDueDate] = useState(task?.due_date ?? '');
    const [assigneeIds, setAssigneeIds] = useState<string[]>(
        task?.assignees.map((a) => a.id) ?? (activeMemberId ? [activeMemberId] : []),
    );

    const toggleAssignee = (id: string) => {
        setAssigneeIds((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
        );
    };

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['family-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['family-stats'] });
    };

    const createMutation = useMutation({
        mutationFn: (input: CreateTaskInput) => familyApi.createTask(input),
        onSuccess: () => {
            invalidate();
            onClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: () =>
            familyApi.updateTask(task!.id, {
                title,
                description: description || null,
                category: category || null,
                priority,
                status,
                due_date: dueDate || null,
                assignee_ids: assigneeIds,
                completed_at: status === 'done' ? (task!.completed_at ?? new Date().toISOString()) : null,
            }),
        onSuccess: () => {
            invalidate();
            onClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => familyApi.deleteTask(task!.id),
        onSuccess: () => {
            invalidate();
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        if (isEdit) {
            updateMutation.mutate();
        } else {
            createMutation.mutate({
                title: title.trim(),
                description: description || null,
                category: category || null,
                priority,
                due_date: dueDate || null,
                assignee_ids: assigneeIds,
                created_by: activeMemberId,
            });
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={isEdit ? '编辑任务' : '新建家庭任务'}
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 p-4 pt-0">
                {/* Title */}
                <div>
                    <label className="text-caption text-text-secondary mb-1 block">标题</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="要做什么？"
                        autoFocus
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="text-caption text-text-secondary mb-1 block">描述</label>
                    <Input
                        multiline
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="补充说明（可选）"
                    />
                </div>

                {/* Status (edit only) + Category + Priority */}
                {isEdit && (
                    <div>
                        <label className="text-caption text-text-secondary mb-1 block">状态</label>
                        <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                            {TASK_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}

                {/* Category + Priority row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-caption text-text-secondary mb-1 block">分类</label>
                        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="">不分类</option>
                            {categories.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="text-caption text-text-secondary mb-1 block">优先级</label>
                        <Select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as TaskPriority)}
                        >
                            {TASK_PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                    {PRIORITY_CONFIG[p].emoji} {PRIORITY_CONFIG[p].label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Assignees */}
                <div>
                    <label className="text-caption text-text-secondary mb-2 block">
                        负责人 <span className="text-text-tertiary">（可多选，留空 = 待分配）</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {members.map((m) => (
                            <Checkbox
                                key={m.id}
                                checked={assigneeIds.includes(m.id)}
                                onChange={() => toggleAssignee(m.id)}
                                label={
                                    <span className="flex items-center gap-1.5">
                                        <span
                                            className="inline-block w-3 h-3 rounded-full"
                                            style={{ backgroundColor: m.avatar_color }}
                                        />
                                        {m.name}
                                    </span>
                                }
                            />
                        ))}
                    </div>
                </div>

                {/* Due date */}
                <div>
                    <label className="text-caption text-text-secondary mb-1 block">截止日期</label>
                    <DatePicker
                        value={dueDate}
                        onChange={setDueDate}
                        clearable
                        placeholder="不设置截止日期"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <div>
                        {isEdit && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                    if (confirm('确定删除此任务？')) deleteMutation.mutate();
                                }}
                                disabled={deleteMutation.isPending}
                            >
                                删除
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>
                            取消
                        </Button>
                        <Button type="submit" disabled={saving || !title.trim()}>
                            {saving ? '保存中...' : '保存'}
                        </Button>
                    </div>
                </div>
            </form>
        </Dialog>
    );
}

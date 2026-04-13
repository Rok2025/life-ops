'use client';

import { CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FamilyTask } from '../types';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../types';
import { MemberAvatarGroup } from './MemberAvatar';
import { familyApi } from '../api/familyApi';

interface TaskCardProps {
    task: FamilyTask;
    categoryLabel?: string;
    onEdit: (task: FamilyTask) => void;
}

export function TaskCard({ task, categoryLabel, onEdit }: TaskCardProps) {
    const queryClient = useQueryClient();

    const toggleMutation = useMutation({
        mutationFn: () =>
            task.status === 'done'
                ? familyApi.reopenTask(task.id)
                : familyApi.completeTask(task.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['family-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['family-stats'] });
        },
    });

    const priorityCfg = PRIORITY_CONFIG[task.priority];
    const statusCfg = STATUS_CONFIG[task.status];
    const isDone = task.status === 'done';

    const isOverdue =
        !isDone && task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());

    return (
        <div
            className={[
                'group relative rounded-inner-card border border-glass-border/80 bg-card-bg p-3 shadow-sm backdrop-blur-xl transition-all duration-150 hover:shadow-md hover:border-glass-border cursor-pointer',
                isDone ? 'opacity-60' : '',
            ].join(' ')}
            onClick={() => onEdit(task)}
        >
            {/* Title row */}
            <div className="flex items-start gap-2">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMutation.mutate();
                    }}
                    className={[
                        'mt-0.5 shrink-0 rounded-full p-0.5 transition-colors',
                        isDone
                            ? 'text-success hover:text-text-secondary'
                            : 'text-text-tertiary hover:text-success',
                    ].join(' ')}
                    title={isDone ? '重新打开' : '标记完成'}
                >
                    {isDone ? (
                        <CheckCircle2 size={16} />
                    ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-current" />
                    )}
                </button>
                <span
                    className={[
                        'text-body-sm font-medium leading-snug',
                        isDone ? 'line-through text-text-tertiary' : 'text-text-primary',
                    ].join(' ')}
                >
                    {task.title}
                </span>
            </div>

            {/* Meta row */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-caption">
                {/* Category tag */}
                {categoryLabel && (
                    <span className={['inline-flex items-center rounded-full px-2 py-0.5', statusCfg.bg, statusCfg.color].join(' ')}>
                        {categoryLabel}
                    </span>
                )}

                {/* Priority */}
                {task.priority !== 'normal' && (
                    <span className={priorityCfg.color}>
                        {priorityCfg.emoji} {priorityCfg.label}
                    </span>
                )}

                {/* Assignees */}
                <MemberAvatarGroup members={task.assignees} />

                {/* Due date */}
                {task.due_date && (
                    <span className={isOverdue ? 'text-danger font-medium' : 'text-text-tertiary'}>
                        {isOverdue ? '已逾期 · ' : ''}
                        {task.due_date}
                    </span>
                )}
            </div>
        </div>
    );
}

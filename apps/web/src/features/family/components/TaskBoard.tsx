'use client';

import type { FamilyTask, TaskStatus, TaskCategoryConfig } from '../types';
import { STATUS_CONFIG, TASK_STATUSES } from '../types';
import { TaskCard } from './TaskCard';

interface TaskBoardProps {
    tasks: FamilyTask[];
    categories: TaskCategoryConfig[];
    onEditTask: (task: FamilyTask) => void;
}

export function TaskBoard({ tasks, categories, onEditTask }: TaskBoardProps) {
    const categoryMap = new Map(categories.map((c) => [c.value, c.label]));

    const columns = TASK_STATUSES.map((status) => ({
        status,
        config: STATUS_CONFIG[status],
        tasks: tasks.filter((t) => t.status === status),
    }));

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            {columns.map((col) => (
                <TaskColumn
                    key={col.status}
                    status={col.status}
                    label={`${col.config.emoji} ${col.config.label}`}
                    count={col.tasks.length}
                    tasks={col.tasks}
                    categoryMap={categoryMap}
                    onEditTask={onEditTask}
                />
            ))}
        </div>
    );
}

function TaskColumn({
    status,
    label,
    count,
    tasks,
    categoryMap,
    onEditTask,
}: {
    status: TaskStatus;
    label: string;
    count: number;
    tasks: FamilyTask[];
    categoryMap: Map<string, string>;
    onEditTask: (task: FamilyTask) => void;
}) {
    const statusCfg = STATUS_CONFIG[status];

    return (
        <div className="space-y-3">
            {/* Column header */}
            <div className="flex items-center gap-2">
                <span className="text-body-sm font-semibold text-text-primary">{label}</span>
                <span
                    className={[
                        'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-caption font-medium',
                        statusCfg.bg,
                        statusCfg.color,
                    ].join(' ')}
                >
                    {count}
                </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
                {tasks.length === 0 ? (
                    <div className="rounded-inner-card border border-dashed border-glass-border/50 p-4 text-center text-caption text-text-tertiary">
                        暂无任务
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            categoryLabel={
                                task.category ? categoryMap.get(task.category) : undefined
                            }
                            onEdit={onEditTask}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

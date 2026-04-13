'use client';

import { useState, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FamilyTask, TaskStatus, TaskCategoryConfig } from '../types';
import { STATUS_CONFIG, TASK_STATUSES } from '../types';
import { TaskCard } from './TaskCard';
import { familyApi } from '../api/familyApi';

interface TaskBoardProps {
    tasks: FamilyTask[];
    categories: TaskCategoryConfig[];
    onEditTask: (task: FamilyTask) => void;
}

export function TaskBoard({ tasks, categories, onEditTask }: TaskBoardProps) {
    const categoryMap = new Map(categories.map((c) => [c.value, c.label]));
    const queryClient = useQueryClient();
    const [activeTask, setActiveTask] = useState<FamilyTask | null>(null);

    // Require 8px movement before starting drag → allows click-to-edit
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const moveMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
            familyApi.updateTask(id, {
                status,
                completed_at: status === 'done' ? new Date().toISOString() : null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['family-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['family-stats'] });
        },
    });

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const task = tasks.find((t) => t.id === event.active.id);
            setActiveTask(task ?? null);
        },
        [tasks],
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setActiveTask(null);
            const { active, over } = event;
            if (!over) return;

            const taskId = active.id as string;
            const targetStatus = over.id as TaskStatus;
            const task = tasks.find((t) => t.id === taskId);
            if (!task || task.status === targetStatus) return;

            moveMutation.mutate({ id: taskId, status: targetStatus });
        },
        [tasks, moveMutation],
    );

    const columns = TASK_STATUSES.map((status) => ({
        status,
        config: STATUS_CONFIG[status],
        tasks: tasks.filter((t) => t.status === status),
    }));

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid gap-4 lg:grid-cols-3">
                {columns.map((col) => (
                    <DroppableColumn
                        key={col.status}
                        status={col.status}
                        label={`${col.config.emoji} ${col.config.label}`}
                        count={col.tasks.length}
                        tasks={col.tasks}
                        categoryMap={categoryMap}
                        onEditTask={onEditTask}
                        isOver={false}
                    />
                ))}
            </div>

            {/* Drag overlay — renders a ghost card following cursor */}
            <DragOverlay dropAnimation={null}>
                {activeTask ? (
                    <div className="opacity-85 rotate-2 scale-105 pointer-events-none">
                        <TaskCard
                            task={activeTask}
                            categoryLabel={
                                activeTask.category
                                    ? categoryMap.get(activeTask.category)
                                    : undefined
                            }
                            onEdit={() => {}}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// ── Droppable Column ──────────────────────────────────────

function DroppableColumn({
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
    isOver: boolean;
}) {
    const { setNodeRef, isOver: columnIsOver } = useDroppable({ id: status });
    const statusCfg = STATUS_CONFIG[status];

    return (
        <div
            ref={setNodeRef}
            className={[
                'space-y-3 rounded-card p-2 -m-2 transition-colors duration-150',
                columnIsOver ? 'bg-accent/5 ring-2 ring-accent/20' : '',
            ].join(' ')}
        >
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
            <div className="space-y-2 min-h-8 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
                {tasks.length === 0 ? (
                    <div
                        className={[
                            'rounded-inner-card border border-dashed px-4 py-3 text-center text-caption text-text-tertiary transition-colors',
                            columnIsOver
                                ? 'border-accent/40 bg-accent/5'
                                : 'border-glass-border/50',
                        ].join(' ')}
                    >
                        {columnIsOver ? '放到这里' : '暂无任务'}
                    </div>
                ) : (
                    tasks.map((task) => (
                        <DraggableTaskCard
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

// ── Draggable wrapper ─────────────────────────────────────

function DraggableTaskCard({
    task,
    categoryLabel,
    onEdit,
}: {
    task: FamilyTask;
    categoryLabel?: string;
    onEdit: (task: FamilyTask) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { status: task.status } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={isDragging ? 'opacity-30' : ''}
            {...attributes}
            {...listeners}
        >
            <TaskCard task={task} categoryLabel={categoryLabel} onEdit={onEdit} />
        </div>
    );
}

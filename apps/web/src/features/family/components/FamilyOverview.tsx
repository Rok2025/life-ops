'use client';

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { PageHero, Button } from '@/components/ui';
import { ActiveMemberProvider } from '../contexts/ActiveMemberContext';
import { useFamilyMembers } from '../hooks/useFamilyMembers';
import { useFamilyTasks } from '../hooks/useFamilyTasks';
import { useFamilyStats } from '../hooks/useFamilyStats';
import { useFamilyCategories } from '../hooks/useFamilyCategories';
import { TaskFilterBar } from './TaskFilter';
import { TaskBoard } from './TaskBoard';
import { TaskFormDialog } from './TaskFormDialog';
import type { FamilyTask, TaskFilter } from '../types';

export default function FamilyOverview() {
    const { members } = useFamilyMembers();

    return (
        <ActiveMemberProvider members={members}>
            <FamilyOverviewInner />
        </ActiveMemberProvider>
    );
}

function FamilyOverviewInner() {
    const { members } = useFamilyMembers();
    const { categories } = useFamilyCategories();
    const { stats } = useFamilyStats();

    const [filter, setFilter] = useState<TaskFilter>({
        status: 'all',
        assignee: 'all',
        category: 'all',
    });

    const { tasks, loading } = useFamilyTasks(filter);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<FamilyTask | null>(null);

    const handleNewTask = () => {
        setEditingTask(null);
        setDialogOpen(true);
    };

    const handleEditTask = (task: FamilyTask) => {
        setEditingTask(task);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingTask(null);
    };

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="生活 / 家庭"
                icon={<Users size={18} className="text-accent" />}
                title="家庭事务"
                action={
                    <Button onClick={handleNewTask} size="sm">
                        <Plus size={16} />
                        新建任务
                    </Button>
                }
                stats={[
                    { label: '待处理', value: stats.todo + stats.inProgress, meta: `${stats.todo} 待办 · ${stats.inProgress} 进行中`, tone: 'blue' },
                    { label: '已逾期', value: stats.overdue, tone: stats.overdue > 0 ? 'danger' : 'accent' },
                    { label: '本周完成', value: stats.doneThisWeek, tone: 'success' },
                ]}
            />

            {/* Filter bar (includes identity switcher) */}
            <TaskFilterBar
                filter={filter}
                onChange={setFilter}
                members={members}
                categories={categories}
            />

            {/* Board */}
            {loading ? (
                <div className="py-12 text-center text-text-tertiary">加载中...</div>
            ) : (
                <TaskBoard
                    tasks={tasks}
                    categories={categories}
                    onEditTask={handleEditTask}
                />
            )}

            {/* Form dialog */}
            <TaskFormDialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                task={editingTask}
                members={members}
                categories={categories}
            />
        </div>
    );
}

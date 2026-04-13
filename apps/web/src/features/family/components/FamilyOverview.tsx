'use client';

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { PageHero, Button } from '@/components/ui';
import { ActiveMemberProvider, useActiveMember } from '../contexts/ActiveMemberContext';
import { useFamilyMembers } from '../hooks/useFamilyMembers';
import { useFamilyTasks } from '../hooks/useFamilyTasks';
import { useFamilyStats } from '../hooks/useFamilyStats';
import { useFamilyCategories } from '../hooks/useFamilyCategories';
import { MemberSwitcher } from './MemberSwitcher';
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
    const { activeMemberId } = useActiveMember();
    const { members } = useFamilyMembers();
    const { categories } = useFamilyCategories();
    const { stats } = useFamilyStats();

    const [filter, setFilter] = useState<TaskFilter>({
        status: 'all',
        assignee: activeMemberId ? 'mine' : 'all',
        category: 'all',
    });

    const { tasks, loading } = useFamilyTasks(filter, activeMemberId);

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
                description="把家庭事务统一管理，每件事都有人负责。"
                action={
                    <Button onClick={handleNewTask} size="sm">
                        <Plus size={16} />
                        新建任务
                    </Button>
                }
                stats={[
                    { label: '待办', value: stats.todo, tone: 'blue' },
                    { label: '进行中', value: stats.inProgress, tone: 'warning' },
                    { label: '已完成', value: stats.done, tone: 'success' },
                ]}
            />

            {/* Identity switcher + filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <TaskFilterBar
                    filter={filter}
                    onChange={setFilter}
                    members={members}
                    categories={categories}
                />
                <MemberSwitcher members={members} />
            </div>

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

'use client';

import type { FamilyMember, TaskCategoryConfig, TaskFilter, AssigneeFilter } from '../types';
import { useActiveMember } from '../contexts/ActiveMemberContext';

interface TaskFilterBarProps {
    filter: TaskFilter;
    onChange: (filter: TaskFilter) => void;
    members: FamilyMember[];
    categories: TaskCategoryConfig[];
}

type AssigneeOption = { value: AssigneeFilter; label: string; color?: string };

export function TaskFilterBar({ filter, onChange, members, categories }: TaskFilterBarProps) {
    const { activeMemberId } = useActiveMember();

    const assigneeOptions: AssigneeOption[] = [
        ...(activeMemberId ? [{ value: 'mine' as const, label: '我的' }] : []),
        { value: 'all' as const, label: '全部' },
        ...members.map((m) => ({
            value: m.id,
            label: m.name,
            color: m.avatar_color,
        })),
        { value: 'unassigned' as const, label: '待分配' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Assignee chips */}
            <div className="flex flex-wrap gap-1">
                {assigneeOptions.map((opt) => {
                    const isActive = filter.assignee === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange({ ...filter, assignee: opt.value })}
                            className={[
                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium transition-colors',
                                isActive
                                    ? 'border border-accent bg-accent/10 text-accent'
                                    : 'border border-glass-border text-text-secondary hover:bg-panel-bg',
                            ].join(' ')}
                        >
                            {opt.color && (
                                <span
                                    className="inline-block w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: opt.color }}
                                />
                            )}
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {/* Category selector */}
            <select
                value={filter.category}
                onChange={(e) => onChange({ ...filter, category: e.target.value })}
                className="rounded-full border border-glass-border bg-panel-bg px-3 py-1 text-caption text-text-secondary backdrop-blur-xl outline-none focus:border-accent"
            >
                <option value="all">全部分类</option>
                {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                        {c.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

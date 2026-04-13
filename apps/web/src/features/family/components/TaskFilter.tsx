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
    const { activeMemberId, setActiveMember } = useActiveMember();

    const assigneeOptions: AssigneeOption[] = [
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

            {/* Divider + Identity switcher (merged from MemberSwitcher) */}
            {members.length > 0 && (
                <>
                    <span className="h-4 w-px bg-glass-border/60" />
                    <div className="flex items-center gap-1">
                        <span className="text-caption text-text-tertiary mr-0.5">身份</span>
                        {members.map((m) => {
                            const isMe = m.id === activeMemberId;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setActiveMember(m)}
                                    title={m.name}
                                    className={[
                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium transition-all duration-150',
                                        isMe
                                            ? 'bg-white/15 text-text-primary shadow-sm ring-1 ring-white/10'
                                            : 'text-text-tertiary hover:text-text-secondary hover:bg-white/8',
                                    ].join(' ')}
                                >
                                    <span
                                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                        style={{ backgroundColor: m.avatar_color }}
                                    />
                                    {m.name}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

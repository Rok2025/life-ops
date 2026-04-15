'use client';

import { useState, useMemo } from 'react';
import { History, StickyNote, Lightbulb, ListFilter } from 'lucide-react';
import { Card, SectionHeader, getButtonClassName } from '@/components/ui';
import { formatDisplayDate, formatFullDate, getLocalDateStr } from '@/lib/utils/date';
import { useNotesTimeline } from '../hooks/useNotesTimeline';
import type { QuickNote, NoteType, FilterType } from '../types';
import { NOTE_TYPE_CONFIG } from '../types';
import { OverflowTooltipText } from './OverflowTooltipText';

interface NotesTimelineViewProps {
    onRequestClose?: () => void;
}

function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function buildTimelineGroups(notes: QuickNote[]) {
    const groups = new Map<string, QuickNote[]>();

    for (const note of notes) {
        const existing = groups.get(note.note_date) ?? [];
        existing.push(note);
        groups.set(note.note_date, existing);
    }

    return Array.from(groups.entries())
        .sort(([dateA], [dateB]) => (dateA === dateB ? 0 : dateA > dateB ? -1 : 1))
        .map(([date, items]) => {
            const sortedItems = [...items].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            return {
                key: date,
                title: formatFullDate(date),
                subtitle: date === getLocalDateStr() ? '今天' : '更早记录',
                notes: sortedItems,
                isToday: date === getLocalDateStr(),
            };
        });
}

function NoteTimelineRow({ note }: { note: QuickNote }) {
    const typeConfig = NOTE_TYPE_CONFIG[note.type];

    return (
        <div className="glass-list-row relative z-0 grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2 px-2.5 py-1.5 hover:z-20 focus-within:z-20 md:grid-cols-[10px_minmax(0,1.25fr)_minmax(0,0.9fr)_auto]">
            <span
                aria-hidden="true"
                className={['h-2 w-2 shrink-0 rounded-full', typeConfig.bg.split('/')[0] === 'bg' ? 'bg-accent' : 'bg-accent'].join(' ')}
                style={{ backgroundColor: typeConfig.bg.includes('/') ? undefined : typeConfig.bg }}
            />

            <OverflowTooltipText
                text={note.content}
                className="truncate text-body-sm font-medium text-text-primary"
            />

            <div className="hidden truncate text-caption text-text-tertiary md:block">
                {typeConfig.emoji} {typeConfig.label}
            </div>

            <div className="flex items-center justify-end gap-1.5">
                <span className="hidden text-caption text-text-tertiary lg:inline">{formatTime(note.created_at)}</span>
                <span className={`rounded-full px-1.5 py-0 text-caption font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                    {typeConfig.emoji} {typeConfig.label}
                </span>
            </div>
        </div>
    );
}

export function NotesTimelineView({ onRequestClose }: NotesTimelineViewProps) {
    const today = getLocalDateStr();
    const [filter, setFilter] = useState<FilterType>('all');
    const { data: allNotes = [], isLoading, error } = useNotesTimeline();

    const filteredNotes = useMemo(() => {
        if (filter === 'all') return allNotes;
        return allNotes.filter(n => n.type === filter);
    }, [allNotes, filter]);

    const timelineGroups = useMemo(() => buildTimelineGroups(filteredNotes), [filteredNotes]);

    const stats = useMemo(() => {
        const memoCount = allNotes.filter(n => n.type === 'memo').length;
        const ideaCount = allNotes.filter(n => n.type === 'idea').length;
        return [
            { label: '全部记录', value: allNotes.length, valueClassName: 'text-text-primary' },
            { label: '备注', value: memoCount, valueClassName: NOTE_TYPE_CONFIG.memo.color },
            { label: '灵感', value: ideaCount, valueClassName: NOTE_TYPE_CONFIG.idea.color },
            { label: '时间分组', value: timelineGroups.length, valueClassName: 'text-accent' },
        ];
    }, [allNotes, timelineGroups]);

    const filterOptions: { value: FilterType; label: string; icon: React.ReactNode }[] = [
        { value: 'all', label: '全部', icon: <StickyNote size={14} /> },
        { value: 'memo', label: '备注', icon: <StickyNote size={14} /> },
        { value: 'idea', label: '灵感', icon: <Lightbulb size={14} /> },
    ];

    const timelineContent = isLoading ? (
        <div className="px-1 py-10 text-center text-body-sm text-text-secondary">加载中...</div>
    ) : error ? (
        <div className="rounded-inner-card border border-danger/24 bg-danger/7 px-4 py-4 text-body-sm text-danger">
            读取全部随手记失败，请稍后再试。
        </div>
    ) : filteredNotes.length === 0 ? (
        <div className="rounded-inner-card border border-glass-border/55 bg-linear-to-r from-selection-bg/28 to-panel-bg/78 px-4 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/14">
                        <StickyNote size={18} />
                    </div>
                    <div>
                        <p className="text-body font-medium text-text-primary">还没有任何随手记</p>
                        <p className="mt-1 text-body-sm text-text-secondary">
                            关闭弹窗后就可以在随手记卡片中新增备注或灵感。
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onRequestClose}
                    className={getButtonClassName({
                        variant: 'tinted',
                        size: 'sm',
                        className: 'gap-2',
                    })}
                >
                    关闭弹窗
                </button>
            </div>
        </div>
    ) : (
        <div className="space-y-1.5">
            {timelineGroups.map((group) => (
                <div key={group.key} className="overflow-hidden rounded-inner-card border border-glass-border/45 bg-panel-bg/56 shadow-none">
                    <div className="grid gap-0 lg:grid-cols-[164px_minmax(0,1fr)]">
                        <div className="border-b border-glass-border/35 bg-bg-tertiary/22 px-3 py-2 lg:border-b-0 lg:border-r">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <div className="text-body-sm font-semibold text-text-primary">{group.title}</div>
                                <span className={[
                                    'inline-flex items-center rounded-full px-1.5 py-0 text-caption font-medium',
                                    group.isToday
                                        ? 'bg-accent/10 text-accent'
                                        : 'bg-panel-bg/85 text-text-secondary',
                                ].join(' ')}>
                                    {group.subtitle}
                                </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-1 text-caption text-text-secondary">
                                <span className="rounded-full bg-panel-bg/90 px-1.5 py-0.5">共 {group.notes.length}</span>
                            </div>
                        </div>

                        <div className="space-y-0.5 px-2 py-2">
                            {group.notes.map((note) => (
                                <NoteTimelineRow key={note.id} note={note} />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-4 md:p-5">
            <Card variant="subtle" className="shrink-0 space-y-2.5 p-3.5">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/14">
                        <History size={16} />
                    </div>
                    <p className="text-body-sm font-medium text-text-primary">按时间查看全部随手记</p>
                </div>

                <div className="rounded-inner-card border border-glass-border/55 bg-panel-bg/76 px-2.5 py-1.5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:gap-x-5">
                        {stats.map((stat) => (
                            <div key={stat.label} className="inline-flex items-baseline gap-1.5 whitespace-nowrap rounded-full px-1.5 py-0.5">
                                <span className="text-caption text-text-secondary">{stat.label}</span>
                                <span className={`text-body-sm font-semibold ${stat.valueClassName}`}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ListFilter size={14} className="text-text-secondary" />
                    <div className="flex gap-1">
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value)}
                                className={[
                                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body-sm transition-colors duration-normal ease-standard',
                                    filter === option.value
                                        ? 'bg-accent/14 text-accent'
                                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                                ].join(' ')}
                            >
                                {option.icon}
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            <Card variant="subtle" className="min-h-0 flex-1 overflow-hidden p-0">
                <div className="flex h-full min-h-0 flex-col p-4">
                    <div className="shrink-0">
                        <SectionHeader
                            title="时间线视图"
                            right={<span className="glass-mini-chip text-body-sm">{timelineGroups.length} 组</span>}
                        />
                    </div>
                    <div className="scrollbar-none mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                        {timelineContent}
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default NotesTimelineView;

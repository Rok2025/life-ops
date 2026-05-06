'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { Button, Card, Input, PageHero, SegmentedControl } from '@/components/ui';
import { getLocalDateStr, offsetDate } from '@/lib/utils/date';
import { useTimeline } from '../hooks/useTimeline';
import type { TimelineDayGroup, TimelineFilters, TimelineSourceGroup, TimelineSourceType } from '../types';
import { TimelineDaySection } from './TimelineDaySection';

type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

type SourceGroupOption = {
    value: TimelineSourceGroup;
    label: string;
    sourceTypes: TimelineSourceType[] | null;
};

const DATE_PRESET_OPTIONS = [
    { value: 'today', label: '今天' },
    { value: 'yesterday', label: '昨天' },
    { value: '7d', label: '近 7 天' },
    { value: '30d', label: '近 30 天' },
    { value: 'custom', label: '自定义' },
] as const;

const SOURCE_GROUPS: SourceGroupOption[] = [
    { value: 'all', label: '全部', sourceTypes: null },
    { value: 'capture', label: '输入', sourceTypes: ['note', 'todo', 'til', 'frog'] },
    { value: 'growth', label: '成长', sourceTypes: ['growth_project', 'project_todo', 'project_note'] },
    {
        value: 'youyou',
        label: '又又',
        sourceTypes: ['youyou_diary', 'youyou_milestone', 'youyou_growth', 'youyou_vaccination', 'youyou_medical'],
    },
    { value: 'fitness', label: '健身', sourceTypes: ['workout'] },
    { value: 'output', label: '输出', sourceTypes: ['output'] },
    { value: 'english', label: '英语', sourceTypes: ['english_query', 'english_card'] },
    { value: 'family', label: '家庭', sourceTypes: ['family_task'] },
];

function normalizeRange(start: string, end: string, today: string): { dateFrom: string; dateTo: string } {
    let dateFrom = start > today ? today : start;
    let dateTo = end > today ? today : end;

    if (dateFrom > dateTo) {
        [dateFrom, dateTo] = [dateTo, dateFrom];
    }

    return { dateFrom, dateTo };
}

function getPresetRange(
    preset: DatePreset,
    today: string,
    customDateFrom: string,
    customDateTo: string,
): { dateFrom: string; dateTo: string } {
    if (preset === 'today') {
        return { dateFrom: today, dateTo: today };
    }

    if (preset === 'yesterday') {
        const yesterday = offsetDate(today, -1);
        return { dateFrom: yesterday, dateTo: yesterday };
    }

    if (preset === '30d') {
        return { dateFrom: offsetDate(today, -29), dateTo: today };
    }

    if (preset === 'custom') {
        return normalizeRange(customDateFrom || offsetDate(today, -6), customDateTo || today, today);
    }

    return { dateFrom: offsetDate(today, -6), dateTo: today };
}

function getDatesInRange(start: string, end: string): string[] {
    const dates: string[] = [];
    let cursor = start;

    while (cursor <= end && dates.length < 370) {
        dates.push(cursor);
        cursor = offsetDate(cursor, 1);
    }

    return dates;
}

function getDateRangeLabel(dateFrom: string, dateTo: string): string {
    if (dateFrom === dateTo) return dateFrom;
    return `${dateFrom} 至 ${dateTo}`;
}

export default function TimelinePage() {
    const today = getLocalDateStr();
    const todaySectionRef = useRef<HTMLElement | null>(null);
    const autoScrolledRangeRef = useRef<string | null>(null);
    const [datePreset, setDatePreset] = useState<DatePreset>('30d');
    const [sourceGroup, setSourceGroup] = useState<TimelineSourceGroup>('all');
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');

    const selectedSourceGroup = useMemo(
        () => SOURCE_GROUPS.find((item) => item.value === sourceGroup) ?? SOURCE_GROUPS[0],
        [sourceGroup],
    );

    const dateRange = useMemo(
        () => getPresetRange(datePreset, today, customDateFrom, customDateTo),
        [customDateFrom, customDateTo, datePreset, today],
    );

    const filters = useMemo<TimelineFilters>(
        () => ({
            dateFrom: dateRange.dateFrom,
            dateTo: dateRange.dateTo,
            sourceTypes: selectedSourceGroup.sourceTypes ?? undefined,
            limit: datePreset === '30d' ? 600 : 360,
        }),
        [datePreset, dateRange.dateFrom, dateRange.dateTo, selectedSourceGroup.sourceTypes],
    );

    const { data: entries = [], error, isFetching, refetch } = useTimeline(filters);

    const dayGroups = useMemo<TimelineDayGroup[]>(() => {
        const entriesByDate = new Map<string, typeof entries>();

        for (const entry of entries) {
            const list = entriesByDate.get(entry.occurredDate) ?? [];
            list.push(entry);
            entriesByDate.set(entry.occurredDate, list);
        }

        return getDatesInRange(dateRange.dateFrom, dateRange.dateTo).map((date) => ({
            date,
            items: entriesByDate.get(date) ?? [],
            isToday: date === today,
        }));
    }, [dateRange.dateFrom, dateRange.dateTo, entries, today]);

    const rangeKey = `${dateRange.dateFrom}:${dateRange.dateTo}`;
    const includesToday = dateRange.dateFrom <= today && dateRange.dateTo >= today;

    useEffect(() => {
        if (!includesToday || autoScrolledRangeRef.current === rangeKey) return;

        const timer = window.setTimeout(() => {
            todaySectionRef.current?.scrollIntoView({ block: 'start' });
            autoScrolledRangeRef.current = rangeKey;
        }, 80);

        return () => window.clearTimeout(timer);
    }, [includesToday, rangeKey]);

    const handleDatePresetChange = useCallback((value: string) => {
        setDatePreset(value as DatePreset);
    }, []);

    const handleSourceGroupChange = useCallback((value: string) => {
        setSourceGroup(value as TimelineSourceGroup);
    }, []);

    const handleJumpToday = useCallback(() => {
        setDatePreset('30d');
        window.requestAnimationFrame(() => {
            todaySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }, []);

    const rangeLabel = getDateRangeLabel(dateRange.dateFrom, dateRange.dateTo);

    return (
        <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col gap-2.5">
            <PageHero
                eyebrow="全局 / 日期流水"
                compact
                className="shrink-0"
                icon={<CalendarClock size={16} className="text-accent" />}
                title="流水记"
                action={
                    <Button onClick={handleJumpToday} variant="tinted" size="sm" className="gap-1.5">
                        <RotateCcw size={15} />
                        今天
                    </Button>
                }
            />

            <Card variant="subtle" className="shrink-0 p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-body-sm font-semibold text-text-primary">浏览条件</span>
                    <div className="min-w-0">
                        <SegmentedControl
                            value={datePreset}
                            onChange={handleDatePresetChange}
                            options={DATE_PRESET_OPTIONS}
                            wrap
                            aria-label="流水记时间范围"
                        />
                    </div>

                    <div className="min-w-0">
                        <SegmentedControl
                            value={sourceGroup}
                            onChange={handleSourceGroupChange}
                            options={SOURCE_GROUPS.map(({ value, label }) => ({ value, label }))}
                            wrap
                            aria-label="流水记领域"
                        />
                    </div>

                    {datePreset === 'custom' ? (
                        <div className="grid min-w-[17rem] flex-1 gap-2 sm:grid-cols-2">
                            <Input
                                type="date"
                                value={customDateFrom}
                                max={today}
                                onChange={(event) => setCustomDateFrom(event.target.value)}
                                aria-label="开始日期"
                            />
                            <Input
                                type="date"
                                value={customDateTo}
                                max={today}
                                onChange={(event) => setCustomDateTo(event.target.value)}
                                aria-label="结束日期"
                            />
                        </div>
                    ) : null}

                    <div className="ml-auto flex items-center gap-2">
                        <span className="hidden text-caption text-text-tertiary lg:inline">
                            {rangeLabel} · {selectedSourceGroup.label} · {entries.length} 条
                        </span>
                        <Button onClick={() => void refetch()} variant="secondary" size="sm" className="gap-1.5">
                            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
                            刷新
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {error ? (
                    <Card className="p-card">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-body font-semibold text-text-primary">流水记暂时不可用</div>
                                <div className="mt-1 text-body-sm text-text-secondary">
                                    {error instanceof Error ? error.message : '请稍后再试。'}
                                </div>
                            </div>
                            <Button onClick={() => void refetch()} variant="tinted" size="sm" className="gap-1">
                                <RefreshCw size={15} />
                                重试
                            </Button>
                        </div>
                    </Card>
                ) : isFetching && entries.length === 0 ? (
                    <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                        <div className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-accent" />
                            正在整理流水...
                        </div>
                    </Card>
                ) : (
                    <div className="relative min-h-full space-y-2 py-1">
                        <div
                            aria-hidden="true"
                            className="absolute bottom-0 left-4 top-0 w-px bg-glass-border md:left-1/2 md:-translate-x-1/2"
                        />

                        {dayGroups.map((group) => (
                            <TimelineDaySection
                                key={group.date}
                                ref={group.isToday ? todaySectionRef : undefined}
                                group={group}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

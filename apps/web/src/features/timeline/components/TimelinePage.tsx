'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { Button, Card, DatePicker, PageHero, SegmentedControl } from '@/components/ui';
import { getLocalDateStr } from '@/lib/utils/date';
import { useTimeline } from '../hooks/useTimeline';
import {
    buildTimelineFilters,
    buildTimelineQueryString,
    DEFAULT_TIMELINE_ROUTE_STATE,
    getTimelineDateRangeLabel,
    getTimelineDatesInRange,
    getTimelinePresetRange,
    getTimelineSourceGroup,
    TIMELINE_DATE_PRESET_OPTIONS,
    TIMELINE_SOURCE_GROUPS,
    type TimelineDatePreset,
    type TimelineRouteState,
} from '../lib/timelineRouteState';
import type { TimelineDayGroup, TimelineEntry, TimelineFilters, TimelineSourceGroup } from '../types';
import { TimelineDaySection } from './TimelineDaySection';

type TimelinePageProps = {
    initialState?: TimelineRouteState;
    initialEntries?: TimelineEntry[];
};

export default function TimelinePage({
    initialState = DEFAULT_TIMELINE_ROUTE_STATE,
    initialEntries,
}: TimelinePageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const today = getLocalDateStr();
    const todaySectionRef = useRef<HTMLElement | null>(null);
    const autoScrolledRangeRef = useRef<string | null>(null);
    const [datePreset, setDatePreset] = useState<TimelineDatePreset>(initialState.datePreset);
    const [sourceGroup, setSourceGroup] = useState<TimelineSourceGroup>(initialState.sourceGroup);
    const [customDateFrom, setCustomDateFrom] = useState(initialState.customDateFrom);
    const [customDateTo, setCustomDateTo] = useState(initialState.customDateTo);

    const routeState = useMemo<TimelineRouteState>(
        () => ({
            datePreset,
            sourceGroup,
            customDateFrom,
            customDateTo,
        }),
        [customDateFrom, customDateTo, datePreset, sourceGroup],
    );

    const routeQueryString = useMemo(() => buildTimelineQueryString(routeState), [routeState]);

    useEffect(() => {
        const nextPath = routeQueryString ? `${pathname}?${routeQueryString}` : pathname;
        const currentPath = `${window.location.pathname}${window.location.search}`;

        if (currentPath !== nextPath) {
            router.replace(nextPath, { scroll: false });
        }
    }, [pathname, routeQueryString, router]);

    const selectedSourceGroup = useMemo(
        () => getTimelineSourceGroup(sourceGroup),
        [sourceGroup],
    );

    const dateRange = useMemo(
        () => getTimelinePresetRange(datePreset, today, customDateFrom, customDateTo),
        [customDateFrom, customDateTo, datePreset, today],
    );

    const filters = useMemo<TimelineFilters>(
        () => buildTimelineFilters(routeState, today),
        [routeState, today],
    );

    const isInitialQuery =
        datePreset === initialState.datePreset &&
        sourceGroup === initialState.sourceGroup &&
        customDateFrom === initialState.customDateFrom &&
        customDateTo === initialState.customDateTo;

    const { data: entries = [], error, isFetching, refetch } = useTimeline(
        filters,
        isInitialQuery ? initialEntries : undefined,
    );

    const dayGroups = useMemo<TimelineDayGroup[]>(() => {
        const entriesByDate = new Map<string, typeof entries>();

        for (const entry of entries) {
            const list = entriesByDate.get(entry.occurredDate) ?? [];
            list.push(entry);
            entriesByDate.set(entry.occurredDate, list);
        }

        return getTimelineDatesInRange(dateRange.dateFrom, dateRange.dateTo).map((date) => ({
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
        setDatePreset(value as TimelineDatePreset);
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

    const rangeLabel = getTimelineDateRangeLabel(dateRange.dateFrom, dateRange.dateTo);

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
                            options={TIMELINE_DATE_PRESET_OPTIONS}
                            wrap
                            aria-label="流水记时间范围"
                        />
                    </div>

                    <div className="min-w-0">
                        <SegmentedControl
                            value={sourceGroup}
                            onChange={handleSourceGroupChange}
                            options={TIMELINE_SOURCE_GROUPS.map(({ value, label }) => ({ value, label }))}
                            wrap
                            aria-label="流水记领域"
                        />
                    </div>

                    {datePreset === 'custom' ? (
                        <div className="grid min-w-[17rem] flex-1 gap-2 sm:grid-cols-2">
                            <DatePicker
                                value={customDateFrom}
                                maxDate={today}
                                onChange={setCustomDateFrom}
                                clearable
                                placeholder="开始日期"
                                ariaLabel="开始日期"
                            />
                            <DatePicker
                                value={customDateTo}
                                maxDate={today}
                                onChange={setCustomDateTo}
                                clearable
                                placeholder="结束日期"
                                ariaLabel="结束日期"
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

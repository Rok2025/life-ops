import { getLocalDateStr, offsetDate } from '@/lib/utils/date';
import type { TimelineFilters, TimelineSourceGroup, TimelineSourceType } from '../types';

export type TimelineDatePreset = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

export type TimelineSourceGroupOption = {
    value: TimelineSourceGroup;
    label: string;
    sourceTypes: TimelineSourceType[] | null;
};

export type TimelineRouteState = {
    datePreset: TimelineDatePreset;
    sourceGroup: TimelineSourceGroup;
    customDateFrom: string;
    customDateTo: string;
};

export const TIMELINE_DATE_PRESET_OPTIONS = [
    { value: 'today', label: '今天' },
    { value: 'yesterday', label: '昨天' },
    { value: '7d', label: '近 7 天' },
    { value: '30d', label: '近 30 天' },
    { value: 'custom', label: '自定义' },
] as const;

export const TIMELINE_SOURCE_GROUPS: TimelineSourceGroupOption[] = [
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

export const DEFAULT_TIMELINE_ROUTE_STATE: TimelineRouteState = {
    datePreset: '30d',
    sourceGroup: 'all',
    customDateFrom: '',
    customDateTo: '',
};

const TIMELINE_DATE_PRESET_VALUES = new Set<TimelineDatePreset>(TIMELINE_DATE_PRESET_OPTIONS.map((item) => item.value));
const TIMELINE_SOURCE_GROUP_VALUES = new Set<TimelineSourceGroup>(TIMELINE_SOURCE_GROUPS.map((item) => item.value));
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type TimelineParamsInput = Record<string, string | string[] | undefined>;

function getFirstParam(params: TimelineParamsInput, key: string): string | undefined {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
}

function normalizeDate(value: string | undefined): string {
    return value && DATE_PATTERN.test(value) ? value : '';
}

export function parseTimelineRouteState(params: TimelineParamsInput): TimelineRouteState {
    const rawDatePreset = getFirstParam(params, 'date') as TimelineDatePreset | undefined;
    const rawSourceGroup = getFirstParam(params, 'source') as TimelineSourceGroup | undefined;

    return {
        datePreset: rawDatePreset && TIMELINE_DATE_PRESET_VALUES.has(rawDatePreset) ? rawDatePreset : '30d',
        sourceGroup: rawSourceGroup && TIMELINE_SOURCE_GROUP_VALUES.has(rawSourceGroup) ? rawSourceGroup : 'all',
        customDateFrom: normalizeDate(getFirstParam(params, 'from')),
        customDateTo: normalizeDate(getFirstParam(params, 'to')),
    };
}

export function getTimelineSourceGroup(sourceGroup: TimelineSourceGroup): TimelineSourceGroupOption {
    return TIMELINE_SOURCE_GROUPS.find((item) => item.value === sourceGroup) ?? TIMELINE_SOURCE_GROUPS[0];
}

export function normalizeTimelineRange(start: string, end: string, today: string): { dateFrom: string; dateTo: string } {
    let dateFrom = start > today ? today : start;
    let dateTo = end > today ? today : end;

    if (dateFrom > dateTo) {
        [dateFrom, dateTo] = [dateTo, dateFrom];
    }

    return { dateFrom, dateTo };
}

export function getTimelinePresetRange(
    preset: TimelineDatePreset,
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
        return normalizeTimelineRange(customDateFrom || offsetDate(today, -6), customDateTo || today, today);
    }

    return { dateFrom: offsetDate(today, -6), dateTo: today };
}

export function getTimelineDatesInRange(start: string, end: string): string[] {
    const dates: string[] = [];
    let cursor = start;

    while (cursor <= end && dates.length < 370) {
        dates.push(cursor);
        cursor = offsetDate(cursor, 1);
    }

    return dates;
}

export function getTimelineDateRangeLabel(dateFrom: string, dateTo: string): string {
    if (dateFrom === dateTo) return dateFrom;
    return `${dateFrom} 至 ${dateTo}`;
}

export function buildTimelineFilters(state: TimelineRouteState, today = getLocalDateStr()): TimelineFilters {
    const selectedSourceGroup = getTimelineSourceGroup(state.sourceGroup);
    const dateRange = getTimelinePresetRange(state.datePreset, today, state.customDateFrom, state.customDateTo);

    return {
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        sourceTypes: selectedSourceGroup.sourceTypes ?? undefined,
        limit: state.datePreset === '30d' ? 600 : 360,
    };
}

export function buildTimelineQueryString(state: TimelineRouteState): string {
    const params = new URLSearchParams();

    if (state.datePreset !== '30d') params.set('date', state.datePreset);
    if (state.sourceGroup !== 'all') params.set('source', state.sourceGroup);
    if (state.datePreset === 'custom') {
        if (state.customDateFrom) params.set('from', state.customDateFrom);
        if (state.customDateTo) params.set('to', state.customDateTo);
    }

    return params.toString();
}

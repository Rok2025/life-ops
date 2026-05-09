import { getLocalDateStr, offsetDate } from '@/lib/utils/date';
import type { SearchFilters, SearchSourceGroup, SearchSourceType } from '../types';

export type SearchDatePreset = 'all' | '7d' | '30d' | 'custom';

export type SearchSourceGroupOption = {
    value: SearchSourceGroup;
    label: string;
    sourceTypes: SearchSourceType[] | null;
};

export type SearchRouteState = {
    keyword: string;
    sourceGroup: SearchSourceGroup;
    datePreset: SearchDatePreset;
    customDateFrom: string;
    customDateTo: string;
};

export const SEARCH_SOURCE_GROUPS: SearchSourceGroupOption[] = [
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
];

export const SEARCH_DATE_PRESET_OPTIONS = [
    { value: 'all', label: '全部时间' },
    { value: '7d', label: '近 7 天' },
    { value: '30d', label: '近 30 天' },
    { value: 'custom', label: '自定义' },
] as const;

export const DEFAULT_SEARCH_ROUTE_STATE: SearchRouteState = {
    keyword: '',
    sourceGroup: 'all',
    datePreset: 'all',
    customDateFrom: '',
    customDateTo: '',
};

const SEARCH_SOURCE_GROUP_VALUES = new Set<SearchSourceGroup>(SEARCH_SOURCE_GROUPS.map((item) => item.value));
const SEARCH_DATE_PRESET_VALUES = new Set<SearchDatePreset>(SEARCH_DATE_PRESET_OPTIONS.map((item) => item.value));
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type SearchParamsInput = Record<string, string | string[] | undefined>;

function getFirstParam(params: SearchParamsInput, key: string): string | undefined {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
}

function normalizeDate(value: string | undefined): string {
    return value && DATE_PATTERN.test(value) ? value : '';
}

export function parseSearchRouteState(params: SearchParamsInput): SearchRouteState {
    const rawKeyword = getFirstParam(params, 'q')?.trim() ?? '';
    const rawSourceGroup = getFirstParam(params, 'source') as SearchSourceGroup | undefined;
    const rawDatePreset = getFirstParam(params, 'date') as SearchDatePreset | undefined;

    return {
        keyword: rawKeyword,
        sourceGroup: rawSourceGroup && SEARCH_SOURCE_GROUP_VALUES.has(rawSourceGroup) ? rawSourceGroup : 'all',
        datePreset: rawDatePreset && SEARCH_DATE_PRESET_VALUES.has(rawDatePreset) ? rawDatePreset : 'all',
        customDateFrom: normalizeDate(getFirstParam(params, 'from')),
        customDateTo: normalizeDate(getFirstParam(params, 'to')),
    };
}

export function getSearchSourceGroup(sourceGroup: SearchSourceGroup): SearchSourceGroupOption {
    return SEARCH_SOURCE_GROUPS.find((item) => item.value === sourceGroup) ?? SEARCH_SOURCE_GROUPS[0];
}

export function getSearchDateRange(
    datePreset: SearchDatePreset,
    customDateFrom: string,
    customDateTo: string,
): Pick<SearchFilters, 'dateFrom' | 'dateTo'> {
    if (datePreset === 'all') {
        return { dateFrom: null, dateTo: null };
    }

    if (datePreset === 'custom') {
        return {
            dateFrom: customDateFrom || null,
            dateTo: customDateTo || null,
        };
    }

    const today = getLocalDateStr();
    return {
        dateFrom: offsetDate(today, datePreset === '7d' ? -6 : -29),
        dateTo: today,
    };
}

export function buildSearchFilters(state: SearchRouteState): SearchFilters {
    const selectedGroup = getSearchSourceGroup(state.sourceGroup);
    const dateRange = getSearchDateRange(state.datePreset, state.customDateFrom, state.customDateTo);

    return {
        sourceTypes: selectedGroup.sourceTypes ?? undefined,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        limit: 60,
    };
}

export function buildSearchQueryString(state: SearchRouteState): string {
    const params = new URLSearchParams();
    const keyword = state.keyword.trim();

    if (keyword) params.set('q', keyword);
    if (state.sourceGroup !== 'all') params.set('source', state.sourceGroup);
    if (state.datePreset !== 'all') params.set('date', state.datePreset);
    if (state.datePreset === 'custom') {
        if (state.customDateFrom) params.set('from', state.customDateFrom);
        if (state.customDateTo) params.set('to', state.customDateTo);
    }

    return params.toString();
}

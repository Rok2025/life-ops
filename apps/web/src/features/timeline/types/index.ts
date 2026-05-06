export const TIMELINE_SOURCE_TYPES = [
    'note',
    'todo',
    'til',
    'frog',
    'workout',
    'output',
    'growth_project',
    'project_todo',
    'project_note',
    'youyou_diary',
    'youyou_milestone',
    'youyou_growth',
    'youyou_vaccination',
    'youyou_medical',
    'english_query',
    'english_card',
    'family_task',
] as const;

export type TimelineSourceType = (typeof TIMELINE_SOURCE_TYPES)[number];

export type TimelineDomain = 'capture' | 'growth' | 'youyou' | 'fitness' | 'output' | 'english' | 'family';

export type TimelineSourceGroup = 'all' | TimelineDomain;

export type TimelineMetadataValue =
    | string
    | number
    | boolean
    | null
    | TimelineMetadataValue[]
    | { [key: string]: TimelineMetadataValue };

export type TimelineMetadata = Record<string, TimelineMetadataValue>;

export type TimelineEntry = {
    sourceType: TimelineSourceType;
    sourceId: string;
    domain: TimelineDomain;
    eventType: string;
    title: string;
    snippet: string;
    occurredDate: string;
    occurredAt: string | null;
    href: string;
    metadata: TimelineMetadata;
};

export type TimelineFilters = {
    dateFrom: string;
    dateTo: string;
    sourceTypes?: TimelineSourceType[];
    limit?: number;
};

export type TimelineDayGroup = {
    date: string;
    items: TimelineEntry[];
    isToday: boolean;
};

export const SEARCH_SOURCE_TYPES = [
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
] as const;

export type SearchSourceType = (typeof SEARCH_SOURCE_TYPES)[number];

export type SearchMetadataValue =
    | string
    | number
    | boolean
    | null
    | SearchMetadataValue[]
    | { [key: string]: SearchMetadataValue };

export type SearchMetadata = Record<string, SearchMetadataValue>;

export type SearchResult = {
    source_type: SearchSourceType;
    source_id: string;
    title: string;
    snippet: string;
    occurred_date: string | null;
    href: string;
    metadata: SearchMetadata;
    rank_score: number;
};

export type SearchFilters = {
    sourceTypes?: SearchSourceType[];
    dateFrom?: string | null;
    dateTo?: string | null;
    limit?: number;
};

export type SearchSourceGroup = 'all' | 'capture' | 'growth' | 'youyou' | 'fitness' | 'output' | 'english';

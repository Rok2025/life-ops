import { supabase } from '@/lib/supabase';
import type { SearchFilters, SearchMetadata, SearchResult, SearchSourceType } from '../types';

type SearchResultRow = {
    source_type: string;
    source_id: string;
    title: string | null;
    snippet: string | null;
    occurred_date: string | null;
    href: string | null;
    metadata: SearchMetadata | null;
    rank_score: number | null;
};

type RpcErrorLike = {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizeError(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }

    if (isRecord(error)) {
        const rpcError = error as RpcErrorLike;
        const messageParts = [rpcError.message, rpcError.details, rpcError.hint]
            .filter((part): part is string => typeof part === 'string' && part.trim().length > 0);

        if (messageParts.length > 0) {
            const code = typeof rpcError.code === 'string' ? ` (${rpcError.code})` : '';
            return new Error(`${messageParts.join(' ')}${code}`);
        }
    }

    return new Error('搜索请求失败');
}

function normalizeResult(row: SearchResultRow): SearchResult {
    return {
        source_type: row.source_type as SearchSourceType,
        source_id: row.source_id,
        title: row.title ?? '未命名记录',
        snippet: row.snippet ?? '',
        occurred_date: row.occurred_date,
        href: row.href ?? '/',
        metadata: row.metadata ?? {},
        rank_score: row.rank_score ?? 0,
    };
}

export const searchApi = {
    search: async (keyword: string, filters: SearchFilters = {}): Promise<SearchResult[]> => {
        const trimmedKeyword = keyword.trim();

        if (!trimmedKeyword) {
            return [];
        }

        const { data, error } = await supabase.rpc('search_global', {
            p_keyword: trimmedKeyword,
            p_source_types: filters.sourceTypes && filters.sourceTypes.length > 0 ? filters.sourceTypes : null,
            p_date_from: filters.dateFrom ?? null,
            p_date_to: filters.dateTo ?? null,
            p_result_limit: filters.limit ?? 50,
        });

        if (error) throw normalizeError(error);

        const rows = (data ?? []) as SearchResultRow[];
        return rows.map(normalizeResult);
    },
};

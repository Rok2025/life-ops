import { supabase } from '@/lib/supabase';
import type { TimelineDomain, TimelineEntry, TimelineFilters, TimelineMetadata, TimelineSourceType } from '../types';

type TimelineRow = {
    source_type: string;
    source_id: string;
    domain: string;
    event_type: string | null;
    title: string | null;
    snippet: string | null;
    occurred_date: string | null;
    occurred_at: string | null;
    href: string | null;
    metadata: TimelineMetadata | null;
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

    return new Error('读取流水记失败');
}

function normalizeRow(row: TimelineRow): TimelineEntry {
    return {
        sourceType: row.source_type as TimelineSourceType,
        sourceId: row.source_id,
        domain: row.domain as TimelineDomain,
        eventType: row.event_type ?? 'created',
        title: row.title ?? '未命名记录',
        snippet: row.snippet ?? '',
        occurredDate: row.occurred_date ?? '',
        occurredAt: row.occurred_at,
        href: row.href ?? '/',
        metadata: row.metadata ?? {},
    };
}

export const timelineApi = {
    getTimeline: async (filters: TimelineFilters): Promise<TimelineEntry[]> => {
        const { data, error } = await supabase.rpc('get_global_timeline', {
            p_date_from: filters.dateFrom,
            p_date_to: filters.dateTo,
            p_source_types: filters.sourceTypes && filters.sourceTypes.length > 0 ? filters.sourceTypes : null,
            p_result_limit: filters.limit ?? 300,
        });

        if (error) throw normalizeError(error);

        const rows = (data ?? []) as TimelineRow[];
        return rows
            .map(normalizeRow)
            .filter((entry) => entry.occurredDate.length > 0);
    },
};

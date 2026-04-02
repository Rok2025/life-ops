import type { LongmanLevel, WordBankImportResult } from '../types';

type ParsedWordBankRecord = {
    term: string;
    pos: string;
    levels: LongmanLevel[];
    initial: string;
    source: string;
};

const ENTRY_PATTERN = /^-\s+(.+?)\s+\(([^)]+)\)(?:\s+\[([^\]]+)\])?\s*$/;
const HEADING_PATTERN = /^##\s+(.+?)\s*$/;

function normalizeLevels(raw: string | undefined): LongmanLevel[] {
    if (!raw) return [];

    return raw
        .split(',')
        .map((level) => level.trim())
        .filter((level): level is LongmanLevel =>
            ['S1', 'S2', 'S3', 'W1', 'W2', 'W3'].includes(level),
        );
}

export function parseLongmanMarkdown(markdown: string): ParsedWordBankRecord[] {
    const lines = markdown.split(/\r?\n/);
    const entries: ParsedWordBankRecord[] = [];
    const seen = new Set<string>();
    let currentInitial = 'A';

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const headingMatch = line.match(HEADING_PATTERN);
        if (headingMatch) {
            currentInitial = headingMatch[1]?.trim().toUpperCase() || currentInitial;
            continue;
        }

        const entryMatch = line.match(ENTRY_PATTERN);
        if (!entryMatch) continue;

        const term = entryMatch[1]?.trim();
        const pos = entryMatch[2]?.trim();

        if (!term || !pos) continue;

        const key = `${term.toLowerCase()}::${pos.toLowerCase()}::longman_3000`;
        if (seen.has(key)) continue;
        seen.add(key);

        entries.push({
            term,
            pos,
            levels: normalizeLevels(entryMatch[3]),
            initial: currentInitial || term.charAt(0).toUpperCase(),
            source: 'longman_3000',
        });
    }

    return entries;
}

export function summarizeImport(entries: ParsedWordBankRecord[]): WordBankImportResult {
    return {
        total: entries.length,
        initials: Array.from(new Set(entries.map((entry) => entry.initial))).sort(),
    };
}

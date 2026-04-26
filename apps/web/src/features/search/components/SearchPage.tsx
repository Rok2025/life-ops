'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowUpRight,
    Baby,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Dumbbell,
    FileSearch,
    FileText,
    Languages,
    Lightbulb,
    ListTodo,
    Loader2,
    PenLine,
    RefreshCw,
    Search as SearchIcon,
    Sparkles,
    Sprout,
    StickyNote,
    Target,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Card, Input, PageHero, SectionHeader, SegmentedControl } from '@/components/ui';
import { formatDisplayDate, getLocalDateStr, offsetDate } from '@/lib/utils/date';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import type { SearchFilters, SearchMetadata, SearchResult, SearchSourceGroup, SearchSourceType } from '../types';

type DatePreset = 'all' | '7d' | '30d' | 'custom';

type SourceConfig = {
    label: string;
    icon: LucideIcon;
    toneClass: string;
    badgeClass: string;
};

type SourceGroupOption = {
    value: SearchSourceGroup;
    label: string;
    sourceTypes: SearchSourceType[] | null;
};

const SOURCE_CONFIG: Record<SearchSourceType, SourceConfig> = {
    note: {
        label: '随手记',
        icon: StickyNote,
        toneClass: 'text-tone-blue',
        badgeClass: 'border-tone-blue/30 bg-tone-blue/14',
    },
    todo: {
        label: '待办',
        icon: ListTodo,
        toneClass: 'text-tone-green',
        badgeClass: 'border-tone-green/30 bg-tone-green/14',
    },
    til: {
        label: 'TIL',
        icon: Lightbulb,
        toneClass: 'text-tone-yellow',
        badgeClass: 'border-tone-yellow/30 bg-tone-yellow/14',
    },
    frog: {
        label: '三只青蛙',
        icon: Target,
        toneClass: 'text-accent',
        badgeClass: 'border-accent/30 bg-accent/14',
    },
    workout: {
        label: '健身',
        icon: Dumbbell,
        toneClass: 'text-tone-orange',
        badgeClass: 'border-tone-orange/30 bg-tone-orange/14',
    },
    output: {
        label: '输出',
        icon: PenLine,
        toneClass: 'text-tone-purple',
        badgeClass: 'border-tone-purple/30 bg-tone-purple/14',
    },
    growth_project: {
        label: '成长项目',
        icon: Sprout,
        toneClass: 'text-tone-green',
        badgeClass: 'border-tone-green/30 bg-tone-green/14',
    },
    project_todo: {
        label: '项目待办',
        icon: CheckCircle2,
        toneClass: 'text-success',
        badgeClass: 'border-success/30 bg-success/14',
    },
    project_note: {
        label: '项目笔记',
        icon: BookOpen,
        toneClass: 'text-tone-cyan',
        badgeClass: 'border-tone-cyan/30 bg-tone-cyan/14',
    },
    youyou_diary: {
        label: '又又日记',
        icon: Baby,
        toneClass: 'text-tone-sky',
        badgeClass: 'border-tone-sky/30 bg-tone-sky/14',
    },
    youyou_milestone: {
        label: '又又里程碑',
        icon: Sparkles,
        toneClass: 'text-tone-purple',
        badgeClass: 'border-tone-purple/30 bg-tone-purple/14',
    },
    youyou_growth: {
        label: '发育记录',
        icon: Baby,
        toneClass: 'text-tone-cyan',
        badgeClass: 'border-tone-cyan/30 bg-tone-cyan/14',
    },
    youyou_vaccination: {
        label: '疫苗记录',
        icon: CalendarDays,
        toneClass: 'text-tone-blue',
        badgeClass: 'border-tone-blue/30 bg-tone-blue/14',
    },
    youyou_medical: {
        label: '就医记录',
        icon: FileText,
        toneClass: 'text-danger',
        badgeClass: 'border-danger/30 bg-danger/14',
    },
    english_query: {
        label: '英语查询',
        icon: Languages,
        toneClass: 'text-tone-blue',
        badgeClass: 'border-tone-blue/30 bg-tone-blue/14',
    },
    english_card: {
        label: '英语卡片',
        icon: BookOpen,
        toneClass: 'text-accent',
        badgeClass: 'border-accent/30 bg-accent/14',
    },
};

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
];

const DATE_PRESET_OPTIONS = [
    { value: 'all', label: '全部时间' },
    { value: '7d', label: '近 7 天' },
    { value: '30d', label: '近 30 天' },
    { value: 'custom', label: '自定义' },
] as const;

const PRIORITY_LABELS: Record<string, string> = {
    normal: '普通',
    important: '重要',
    urgent: '紧急',
    critical: '重要且紧急',
};

const STATUS_LABELS: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    archived: '已归档',
    draft: '草稿',
    published: '已发布',
};

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedText({ text, keyword }: { text: string; keyword: string }) {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
        return <>{text}</>;
    }

    const matcher = new RegExp(`(${escapeRegExp(trimmedKeyword)})`, 'gi');
    const parts = text.split(matcher);

    return (
        <>
            {parts.map((part, index) => {
                const isMatch = part.toLowerCase() === trimmedKeyword.toLowerCase();

                return isMatch ? (
                    <mark key={`${part}-${index}`} className="rounded-xs bg-warning/18 px-0.5 text-text-primary">
                        {part}
                    </mark>
                ) : (
                    <span key={`${part}-${index}`}>{part}</span>
                );
            })}
        </>
    );
}

function getStringMeta(metadata: SearchMetadata, key: string): string | null {
    const value = metadata[key];
    return typeof value === 'string' && value.trim() ? value : null;
}

function getNumberMeta(metadata: SearchMetadata, key: string): number | null {
    const value = metadata[key];
    return typeof value === 'number' ? value : null;
}

function getBooleanMeta(metadata: SearchMetadata, key: string): boolean | null {
    const value = metadata[key];
    return typeof value === 'boolean' ? value : null;
}

function getMetadataChips(result: SearchResult): string[] {
    const chips: string[] = [];
    const metadata = result.metadata;

    const completed = getBooleanMeta(metadata, 'is_completed');
    if (completed !== null) {
        chips.push(completed ? '已完成' : '未完成');
    }

    const priority = getStringMeta(metadata, 'priority');
    if (priority) {
        chips.push(PRIORITY_LABELS[priority] ?? priority);
    }

    const status = getStringMeta(metadata, 'status');
    if (status) {
        chips.push(STATUS_LABELS[status] ?? status);
    }

    const area = getStringMeta(metadata, 'area');
    if (area) {
        chips.push(area.toUpperCase());
    }

    const category = getStringMeta(metadata, 'category');
    if (category) {
        chips.push(category);
    }

    const exerciseCount = getNumberMeta(metadata, 'exercise_count');
    if (exerciseCount !== null && exerciseCount > 0) {
        chips.push(`${exerciseCount} 个动作`);
    }

    const doseNumber = getNumberMeta(metadata, 'dose_number');
    if (doseNumber !== null) {
        chips.push(`第 ${doseNumber} 针`);
    }

    const difficulty = getStringMeta(metadata, 'difficulty');
    if (difficulty) {
        chips.push(difficulty);
    }

    return chips.slice(0, 3);
}

function SearchResultItem({ result, keyword }: { result: SearchResult; keyword: string }) {
    const config = SOURCE_CONFIG[result.source_type];
    const Icon = config.icon;
    const chips = getMetadataChips(result);

    return (
        <Link
            href={result.href}
            className="group block rounded-card border border-glass-border bg-card-bg/82 p-card shadow-sm backdrop-blur-xl transition-[background-color,border-color,transform] duration-normal ease-standard hover:-translate-y-0.5 hover:border-accent/24 hover:bg-card-bg"
        >
            <div className="flex items-start gap-3">
                <div className={['mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control border', config.badgeClass].join(' ')}>
                    <Icon size={17} className={config.toneClass} />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="glass-mini-chip text-caption">{config.label}</span>
                                {result.occurred_date ? (
                                    <span className="text-caption text-text-tertiary">{formatDisplayDate(result.occurred_date)}</span>
                                ) : null}
                            </div>
                            <h3 className="mt-2 text-body font-semibold text-text-primary">
                                <HighlightedText text={result.title} keyword={keyword} />
                            </h3>
                        </div>

                        <ArrowUpRight
                            size={16}
                            className="hidden shrink-0 text-text-tertiary transition-colors group-hover:text-accent sm:block"
                        />
                    </div>

                    {result.snippet ? (
                        <p className="line-clamp-2 text-body-sm text-text-secondary">
                            <HighlightedText text={result.snippet} keyword={keyword} />
                        </p>
                    ) : null}

                    {chips.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {chips.map((chip) => (
                                <span key={chip} className="glass-mini-chip text-caption">
                                    {chip}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </Link>
    );
}

export default function SearchPage() {
    const [keywordInput, setKeywordInput] = useState('');
    const [keyword, setKeyword] = useState('');
    const [sourceGroup, setSourceGroup] = useState<SearchSourceGroup>('all');
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');

    useEffect(() => {
        const timer = window.setTimeout(() => setKeyword(keywordInput.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [keywordInput]);

    const selectedGroup = useMemo(
        () => SOURCE_GROUPS.find((item) => item.value === sourceGroup) ?? SOURCE_GROUPS[0],
        [sourceGroup],
    );

    const dateRange = useMemo((): Pick<SearchFilters, 'dateFrom' | 'dateTo'> => {
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
    }, [customDateFrom, customDateTo, datePreset]);

    const filters = useMemo<SearchFilters>(
        () => ({
            sourceTypes: selectedGroup.sourceTypes ?? undefined,
            dateFrom: dateRange.dateFrom,
            dateTo: dateRange.dateTo,
            limit: 60,
        }),
        [dateRange.dateFrom, dateRange.dateTo, selectedGroup.sourceTypes],
    );

    const { data: results = [], error, isFetching, refetch } = useGlobalSearch(keyword, filters);

    const groupedResults = useMemo(() => {
        const groups = new Map<SearchSourceType, SearchResult[]>();

        results.forEach((result) => {
            const existing = groups.get(result.source_type) ?? [];
            existing.push(result);
            groups.set(result.source_type, existing);
        });

        return Array.from(groups.entries()).map(([type, items]) => ({ type, items }));
    }, [results]);

    const sourceCount = groupedResults.length;
    const latestDate = useMemo(() => {
        const dates = results
            .map((result) => result.occurred_date)
            .filter((date): date is string => Boolean(date))
            .sort()
            .reverse();
        return dates[0] ?? null;
    }, [results]);

    const activeDateLabel = useMemo(() => {
        if (datePreset === 'all') return '全部时间';
        if (datePreset === '7d') return '近 7 天';
        if (datePreset === '30d') return '近 30 天';
        if (customDateFrom && customDateTo) return `${customDateFrom} 至 ${customDateTo}`;
        if (customDateFrom) return `${customDateFrom} 之后`;
        if (customDateTo) return `${customDateTo} 之前`;
        return '自定义';
    }, [customDateFrom, customDateTo, datePreset]);

    const handleKeywordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setKeywordInput(event.target.value);
    }, []);

    const handleSourceGroupChange = useCallback((value: string) => {
        setSourceGroup(value as SearchSourceGroup);
    }, []);

    const handleDatePresetChange = useCallback((value: string) => {
        setDatePreset(value as DatePreset);
    }, []);

    const handleClearKeyword = useCallback(() => {
        setKeywordInput('');
        setKeyword('');
    }, []);

    const hasKeyword = keyword.length > 0;

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="全局 / 检索"
                icon={<SearchIcon size={18} className="text-accent" />}
                title="搜索"
                description="把青蛙、TIL、随手记、待办、输出、成长和健身记录收拢到同一处。"
                stats={[
                    {
                        label: '命中结果',
                        value: hasKeyword ? results.length : 0,
                        meta: isFetching ? '检索中' : selectedGroup.label,
                        tone: results.length > 0 ? 'success' : 'accent',
                    },
                    {
                        label: '来源类型',
                        value: hasKeyword ? sourceCount : 0,
                        meta: activeDateLabel,
                        tone: 'blue',
                    },
                    {
                        label: '最近记录',
                        value: latestDate ? formatDisplayDate(latestDate) : '暂无',
                        meta: hasKeyword ? keyword : '待检索',
                        tone: 'warning',
                    },
                ]}
            />

            <Card variant="subtle" className="space-y-4 p-card">
                <SectionHeader title="检索条件" />

                <div className="relative">
                    <SearchIcon
                        size={18}
                        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-text-tertiary"
                    />
                    <Input
                        value={keywordInput}
                        onChange={handleKeywordChange}
                        className="pl-10 pr-11"
                        placeholder="搜索关键词"
                        autoFocus
                    />
                    {keywordInput ? (
                        <button
                            type="button"
                            onClick={handleClearKeyword}
                            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-control text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                            title="清空"
                            aria-label="清空"
                        >
                            <X size={16} />
                        </button>
                    ) : null}
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-2">
                        <span className="text-caption text-text-tertiary">范围</span>
                        <SegmentedControl
                            value={sourceGroup}
                            onChange={handleSourceGroupChange}
                            options={SOURCE_GROUPS.map(({ value, label }) => ({ value, label }))}
                            wrap
                            aria-label="搜索范围"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-caption text-text-tertiary">时间</span>
                        <SegmentedControl
                            value={datePreset}
                            onChange={handleDatePresetChange}
                            options={DATE_PRESET_OPTIONS}
                            wrap
                            aria-label="搜索时间"
                        />
                    </div>
                </div>

                {datePreset === 'custom' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                            type="date"
                            value={customDateFrom}
                            onChange={(event) => setCustomDateFrom(event.target.value)}
                            aria-label="开始日期"
                        />
                        <Input
                            type="date"
                            value={customDateTo}
                            onChange={(event) => setCustomDateTo(event.target.value)}
                            aria-label="结束日期"
                        />
                    </div>
                ) : null}
            </Card>

            {!hasKeyword ? (
                <Card className="p-card-lg text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                        <FileSearch size={28} className="text-text-secondary" />
                    </div>
                    <p className="text-body font-semibold text-text-primary">还没有关键词</p>
                    <p className="mt-1 text-body-sm text-text-secondary">可以从一个任务、动作、项目名或片段开始。</p>
                </Card>
            ) : error ? (
                <Card className="p-card">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-body font-semibold text-text-primary">搜索暂时不可用</div>
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
            ) : isFetching && results.length === 0 ? (
                <Card variant="subtle" className="p-card text-body-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-accent" />
                        正在检索...
                    </div>
                </Card>
            ) : results.length === 0 ? (
                <Card className="p-card-lg text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                        <SearchIcon size={28} className="text-text-secondary" />
                    </div>
                    <p className="text-body font-semibold text-text-primary">没有找到相关记录</p>
                    <p className="mt-1 text-body-sm text-text-secondary">可以换一个关键词，或放宽范围与时间。</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {groupedResults.map(({ type, items }) => {
                        const config = SOURCE_CONFIG[type];
                        const Icon = config.icon;

                        return (
                            <Card key={type} variant="subtle" className="space-y-3 p-card">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-control border', config.badgeClass].join(' ')}>
                                            <Icon size={16} className={config.toneClass} />
                                        </span>
                                        <div className="min-w-0">
                                            <h2 className="truncate text-body font-semibold text-text-primary">{config.label}</h2>
                                            <p className="text-caption text-text-tertiary">{items.length} 条结果</p>
                                        </div>
                                    </div>

                                    {isFetching ? (
                                        <Loader2 size={16} className="shrink-0 animate-spin text-accent" />
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    {items.map((result) => (
                                        <SearchResultItem key={`${result.source_type}-${result.source_id}`} result={result} keyword={keyword} />
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

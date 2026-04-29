import Link from 'next/link';
import {
    ArrowUpRight,
    Baby,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Dumbbell,
    FileText,
    Home,
    Languages,
    Lightbulb,
    ListTodo,
    PenLine,
    Sparkles,
    Sprout,
    StickyNote,
    Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TimelineEntry, TimelineMetadata, TimelineSourceType } from '../types';

type SourceConfig = {
    label: string;
    icon: LucideIcon;
    toneClass: string;
    badgeClass: string;
};

const SOURCE_CONFIG: Record<TimelineSourceType, SourceConfig> = {
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
    family_task: {
        label: '家庭任务',
        icon: Home,
        toneClass: 'text-tone-orange',
        badgeClass: 'border-tone-orange/30 bg-tone-orange/14',
    },
};

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
    todo: '待处理',
    in_progress: '进行中',
    done: '已完成',
};

const EVENT_LABELS: Record<string, string> = {
    achieved: '达成',
    card_created: '新增卡片',
    completed: '完成',
    detailed: '详细查询',
    due: '到期',
    grammar: '语法查询',
    measured: '测量',
    planned: '计划',
    published: '发布',
    scheduled: '计划',
    concise: '查询',
    draft: '草稿',
};

function getStringMeta(metadata: TimelineMetadata, key: string): string | null {
    const value = metadata[key];
    return typeof value === 'string' && value.trim() ? value : null;
}

function getNumberMeta(metadata: TimelineMetadata, key: string): number | null {
    const value = metadata[key];
    return typeof value === 'number' ? value : null;
}

function getBooleanMeta(metadata: TimelineMetadata, key: string): boolean | null {
    const value = metadata[key];
    return typeof value === 'boolean' ? value : null;
}

function formatTime(value: string | null): string | null {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function simplifyTitle(entry: TimelineEntry): string {
    const dateSuffixPattern = new RegExp(`\\s*·\\s*${entry.occurredDate}$`);
    const genericDateSuffixPattern = /\s*·\s*\d{4}-\d{2}-\d{2}$/;
    const notePrefixPattern = /^(备忘|灵感)\s*·\s*/;

    const title = entry.title
        .replace(dateSuffixPattern, '')
        .replace(genericDateSuffixPattern, '')
        .replace(notePrefixPattern, '')
        .trim();

    return title || entry.title;
}

function normalizeText(value: string): string {
    return value
        .replace(/^(备忘|灵感)\s*·\s*/, '')
        .replace(/\s*·\s*\d{4}-\d{2}-\d{2}$/g, '')
        .replace(/[，。,.、\s]/g, '')
        .toLowerCase();
}

function simplifySnippet(entry: TimelineEntry, title: string): string {
    const snippet = entry.snippet.trim();

    if (!snippet) return '';

    const normalizedSnippet = normalizeText(snippet);
    const normalizedTitle = normalizeText(title);

    if (!normalizedSnippet || normalizedSnippet === normalizedTitle) {
        return '';
    }

    return snippet;
}

function getMetadataChips(entry: TimelineEntry): string[] {
    const chips: string[] = [];
    const { metadata } = entry;

    const eventLabel = EVENT_LABELS[entry.eventType];
    if (eventLabel) {
        chips.push(eventLabel);
    }

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

    const totalSets = getNumberMeta(metadata, 'total_sets');
    if (totalSets !== null && totalSets > 0) {
        chips.push(`${totalSets} 组`);
    }

    const doseNumber = getNumberMeta(metadata, 'dose_number');
    if (doseNumber !== null) {
        chips.push(`第 ${doseNumber} 针`);
    }

    const difficulty = getStringMeta(metadata, 'difficulty');
    if (difficulty) {
        chips.push(difficulty);
    }

    const dueDate = getStringMeta(metadata, 'due_date');
    if (dueDate) {
        chips.push(`截止 ${dueDate.slice(5)}`);
    }

    return Array.from(new Set(chips)).slice(0, 3);
}

interface TimelineItemProps {
    entry: TimelineEntry;
}

export function TimelineItem({ entry }: TimelineItemProps) {
    const config = SOURCE_CONFIG[entry.sourceType];
    const Icon = config.icon;
    const chips = getMetadataChips(entry);
    const time = formatTime(entry.occurredAt);
    const title = simplifyTitle(entry);
    const snippet = simplifySnippet(entry, title);

    return (
        <Link
            href={entry.href}
            className="group block rounded-inner-card border border-glass-border/55 bg-card-bg/74 px-2.5 py-2 transition-[background-color,border-color,transform] duration-normal ease-standard hover:-translate-y-0.5 hover:border-accent/24 hover:bg-card-bg"
        >
            <div className="flex items-start gap-2.5">
                <div className={['mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-control border', config.badgeClass].join(' ')}>
                    <Icon size={14} className={config.toneClass} />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="glass-mini-chip text-caption">{config.label}</span>
                                {time ? <span className="text-caption text-text-tertiary">{time}</span> : null}
                            </div>
                            <h3 className="mt-1 line-clamp-1 text-body-sm font-semibold text-text-primary">{title}</h3>
                        </div>

                        <ArrowUpRight
                            size={13}
                            className="mt-0.5 shrink-0 text-text-tertiary/80 transition-colors group-hover:text-accent"
                        />
                    </div>

                    {snippet ? (
                        <p className="line-clamp-1 text-caption text-text-secondary">{snippet}</p>
                    ) : null}

                    {chips.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
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

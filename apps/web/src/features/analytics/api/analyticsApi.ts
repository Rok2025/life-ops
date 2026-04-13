import { supabase } from '@/lib/supabase';
import { getLocalDateStr, getWeekDateRange, offsetDate } from '@/lib/utils/date';
import type {
    AchievementItem,
    AnalyticsPeriod,
    AreaSnapshot,
    GlobalPulseStat,
    InsightAreaKey,
    InsightStatus,
    InsightTone,
    InsightsSnapshot,
    RiskItem,
    RiskSeverity,
    TrendDatum,
    TrendMetric,
    UpcomingItem,
} from '../types';

type QuickNoteRow = {
    id: string;
    type: 'memo' | 'idea' | 'todo';
    note_date: string;
    content: string;
    execute_date: string | null;
    is_completed: boolean | null;
    completed_at: string | null;
    created_at: string;
    priority: string | null;
};

type FrogRow = {
    frog_date: string;
    is_completed: boolean;
    completed_at: string | null;
    title: string;
};

type TilRow = {
    til_date: string;
    category: string | null;
};

type WorkoutSessionRow = {
    id: string;
    workout_date: string;
};

type WorkoutSetRow = {
    weight: number | null;
    reps: number | null;
};

type EnglishQueryRow = {
    query_date: string;
    created_at: string;
};

type EnglishAssignmentRow = {
    assignment_date: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    completed_at: string | null;
};

type EnglishCardRow = {
    familiarity: number;
};

type GrowthProjectRow = {
    id: string;
    area: 'ai' | 'english' | 'reading';
    title: string;
    end_date: string | null;
    status: 'active' | 'completed' | 'paused' | 'archived';
    created_at: string;
};

type ProjectTodoRow = {
    project_id: string;
    is_completed: boolean;
    completed_at: string | null;
    created_at: string;
};

type ProjectNoteRow = {
    id: string;
    project_id: string;
    type: 'idea' | 'achievement' | 'note';
    content: string;
    created_at: string;
};

type OutputJoinedRow = {
    id: string;
    title: string;
    status: 'draft' | 'published';
    created_at: string;
    updated_at: string;
    project_id: string | null;
    growth_projects:
        | {
            title: string;
            area: 'ai' | 'english' | 'reading';
        }
        | Array<{
            title: string;
            area: 'ai' | 'english' | 'reading';
        }>
        | null;
};

type FamilyTaskRow = {
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
};

type AnalyticsTargetPeriodType = 'day' | 'week' | 'rolling_30d' | 'month' | 'quarter';
type AnalyticsTargetMode = 'minimum' | 'maximum';

type AnalyticsTargetRow = {
    area_key: string;
    metric_key: string;
    period_type: AnalyticsTargetPeriodType;
    target_value: number;
    warning_threshold: number | null;
    target_mode: AnalyticsTargetMode;
    label: string;
    description: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: Record<string, any> | null;
};

type AreaMeta = {
    label: string;
    icon: string;
    tone: InsightTone;
};

type ProjectAreaSummary = {
    totalProjects: number;
    activeProjects: number;
    totalTodos: number;
    completedTodos: number;
    dueSoonProjects: Array<{ title: string; end_date: string; completionRate: number }>;
    achievementCount: number;
};

type SnapshotDraft = {
    key: InsightAreaKey;
    progress: number | null;
    summary: string;
    achievement: string;
    achievementTone: InsightTone;
    riskCount: number;
    nextFocus: string;
    score: number | null;
};

const AREA_META: Record<InsightAreaKey, AreaMeta> = {
    rhythm: { label: '日节奏', icon: '⏱️', tone: 'sky' },
    todos: { label: '待办', icon: '🗂️', tone: 'blue' },
    fitness: { label: '健身', icon: '💪', tone: 'success' },
    english: { label: '英语', icon: '🔤', tone: 'accent' },
    reading: { label: '阅读', icon: '📚', tone: 'green' },
    ai: { label: 'AI', icon: '🤖', tone: 'purple' },
    output: { label: '输出', icon: '✍️', tone: 'orange' },
    family: { label: '家庭', icon: '👨‍👩‍👧', tone: 'yellow' },
    finance: { label: '财务', icon: '💰', tone: 'muted' },
};

const DEFAULT_ANALYTICS_TARGETS: AnalyticsTargetRow[] = [
    {
        area_key: 'rhythm',
        metric_key: 'full_frog_days',
        period_type: 'week',
        target_value: 2,
        warning_threshold: 1,
        target_mode: 'minimum',
        label: '完整推进天数',
        description: '本周至少有 2 天把三只青蛙全部完成。',
        config: { scale_to_period: true },
    },
    {
        area_key: 'fitness',
        metric_key: 'workout_days',
        period_type: 'week',
        target_value: 3,
        warning_threshold: 2,
        target_mode: 'minimum',
        label: '每周训练天数',
        description: '健身模块默认以每周 3 次训练作为健康节奏目标。',
        config: { scale_to_period: true },
    },
    {
        area_key: 'output',
        metric_key: 'published_outputs',
        period_type: 'week',
        target_value: 1,
        warning_threshold: 0,
        target_mode: 'minimum',
        label: '每周发布输出',
        description: '每周至少推进 1 条输出进入发布状态。',
        config: null,
    },
    {
        area_key: 'output',
        metric_key: 'published_outputs',
        period_type: 'rolling_30d',
        target_value: 4,
        warning_threshold: 2,
        target_mode: 'minimum',
        label: '近 30 天发布输出',
        description: '近 30 天至少有 4 条输出进入发布状态。',
        config: null,
    },
    {
        area_key: 'english',
        metric_key: 'daily_assignments',
        period_type: 'day',
        target_value: 8,
        warning_threshold: 4,
        target_mode: 'minimum',
        label: '每日英语词单',
        description: '英语学习默认每日词单目标为 8 个词条。',
        config: null,
    },
    {
        area_key: 'english',
        metric_key: 'review_backlog',
        period_type: 'day',
        target_value: 0,
        warning_threshold: 12,
        target_mode: 'maximum',
        label: '英语复习积压',
        description: '当待复习卡片达到 12 张时触发提醒。',
        config: null,
    },
    {
        area_key: 'todos',
        metric_key: 'overdue_count',
        period_type: 'day',
        target_value: 0,
        warning_threshold: 1,
        target_mode: 'maximum',
        label: '待办逾期数',
        description: '待办系统默认不希望出现任何逾期项。',
        config: null,
    },
    {
        area_key: 'family',
        metric_key: 'overdue_count',
        period_type: 'day',
        target_value: 0,
        warning_threshold: 1,
        target_mode: 'maximum',
        label: '家庭事务逾期数',
        description: '家庭事务默认不希望出现任何逾期项。',
        config: null,
    },
];

const PERIOD_TARGET_MAP: Record<AnalyticsPeriod, AnalyticsTargetPeriodType> = {
    week: 'week',
    '30d': 'rolling_30d',
};

function clamp(value: number, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}

function getPeriodConfig(period: AnalyticsPeriod) {
    const today = getLocalDateStr();

    if (period === 'week') {
        const range = getWeekDateRange();
        const elapsedDays = getDaysBetween(range.start, today) + 1;

        return {
            period,
            periodLabel: '本周',
            today,
            start: range.start,
            end: today,
            totalDays: 7,
            elapsedDays,
            trendStart: offsetDate(today, -6),
            upcomingEnd: offsetDate(today, 14),
        };
    }

    const start = offsetDate(today, -29);

    return {
        period,
        periodLabel: '近 30 天',
        today,
        start,
        end: today,
        totalDays: 30,
        elapsedDays: 30,
        trendStart: offsetDate(today, -6),
        upcomingEnd: offsetDate(today, 14),
    };
}

function getDaysBetween(start: string, end: string) {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    return Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
}

function isDateInRange(dateStr: string | null | undefined, start: string, end: string) {
    if (!dateStr) return false;
    return dateStr >= start && dateStr <= end;
}

function toLocalDateFromTimestamp(value: string | null | undefined) {
    if (!value) return null;
    return getLocalDateStr(new Date(value));
}

function formatShortDate(dateStr: string) {
    return new Intl.DateTimeFormat('zh-CN', {
        month: 'numeric',
        day: 'numeric',
    }).format(new Date(`${dateStr}T00:00:00`));
}

function formatTimestampDate(value: string) {
    return formatShortDate(getLocalDateStr(new Date(value)));
}

function formatDaysLeft(daysLeft: number | null) {
    if (daysLeft === null) return '近期';
    if (daysLeft < 0) return `已超期 ${Math.abs(daysLeft)} 天`;
    if (daysLeft === 0) return '今天';
    if (daysLeft === 1) return '明天';
    return `${daysLeft} 天后`;
}

function buildTrendWindow(end: string) {
    return Array.from({ length: 7 }, (_, index) => {
        const date = offsetDate(end, index - 6);
        return {
            date,
            label: formatShortDate(date),
        };
    });
}

function buildTrendValues(window: Array<{ date: string; label: string }>, source: Map<string, number>): TrendDatum[] {
    return window.map((item) => ({
        label: item.label,
        value: source.get(item.date) ?? 0,
    }));
}

function incrementCount(map: Map<string, number>, key: string | null | undefined, amount = 1) {
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + amount);
}

function getUniqueCount(values: string[]) {
    return new Set(values).size;
}

function sliceText(value: string, limit = 28) {
    const trimmed = value.replace(/\s+/g, ' ').trim();
    if (trimmed.length <= limit) return trimmed;
    return `${trimmed.slice(0, limit)}…`;
}

async function loadAnalyticsTargets(): Promise<AnalyticsTargetRow[]> {
    const { data, error } = await supabase
        .from('v_analytics_targets_active')
        .select('area_key, metric_key, period_type, target_value, warning_threshold, target_mode, label, description, config');

    if (error) {
        console.warn('[analytics] analytics_targets not available yet, fallback to defaults:', error.message);
        return DEFAULT_ANALYTICS_TARGETS;
    }

    if (!data || data.length === 0) {
        return DEFAULT_ANALYTICS_TARGETS;
    }

    return (data as Array<Record<string, unknown>>).map((item) => ({
        area_key: String(item.area_key),
        metric_key: String(item.metric_key),
        period_type: item.period_type as AnalyticsTargetPeriodType,
        target_value: Number(item.target_value ?? 0),
        warning_threshold: item.warning_threshold === null || item.warning_threshold === undefined
            ? null
            : Number(item.warning_threshold),
        target_mode: item.target_mode as AnalyticsTargetMode,
        label: String(item.label ?? ''),
        description: item.description ? String(item.description) : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: (item.config as Record<string, any> | null) ?? null,
    }));
}

function getTargetRow(
    targets: AnalyticsTargetRow[],
    areaKey: string,
    metricKey: string,
    periodType: AnalyticsTargetPeriodType,
) {
    return targets.find(
        (target) =>
            target.area_key === areaKey
            && target.metric_key === metricKey
            && target.period_type === periodType,
    );
}

function getTargetValue(
    targets: AnalyticsTargetRow[],
    areaKey: string,
    metricKey: string,
    periodType: AnalyticsTargetPeriodType,
    fallback: number,
) {
    return getTargetRow(targets, areaKey, metricKey, periodType)?.target_value ?? fallback;
}

function getWarningThreshold(
    targets: AnalyticsTargetRow[],
    areaKey: string,
    metricKey: string,
    periodType: AnalyticsTargetPeriodType,
    fallback: number,
) {
    return getTargetRow(targets, areaKey, metricKey, periodType)?.warning_threshold ?? fallback;
}

function getStatusFromScore(score: number | null): { status: InsightStatus; statusLabel: string } {
    if (score === null) {
        return { status: 'untracked', statusLabel: '未接入' };
    }
    if (score >= 80) return { status: 'stable', statusLabel: '稳定' };
    if (score >= 60) return { status: 'progress', statusLabel: '进行中' };
    if (score >= 40) return { status: 'attention', statusLabel: '需关注' };
    return { status: 'offtrack', statusLabel: '偏离' };
}

function toAreaSnapshot(draft: SnapshotDraft): AreaSnapshot {
    const meta = AREA_META[draft.key];
    const status = getStatusFromScore(draft.score);

    return {
        key: draft.key,
        label: meta.label,
        icon: meta.icon,
        tone: meta.tone,
        status: status.status,
        statusLabel: status.statusLabel,
        score: draft.score === null ? null : clamp(Math.round(draft.score)),
        progress: draft.progress === null ? null : clamp(Math.round(draft.progress)),
        progressLabel: draft.progress === null ? '未接入' : `${Math.round(clamp(draft.progress))}%`,
        summary: draft.summary,
        achievement: draft.achievement,
        achievementTone: draft.achievementTone,
        riskCount: draft.riskCount,
        nextFocus: draft.nextFocus,
    };
}

function sortUpcomingItems(items: UpcomingItem[]) {
    return [...items].sort((left, right) => {
        if (left.daysLeft === null && right.daysLeft === null) return 0;
        if (left.daysLeft === null) return 1;
        if (right.daysLeft === null) return -1;
        return left.daysLeft - right.daysLeft;
    });
}

function sortRiskItems(items: RiskItem[]) {
    const severityRank: Record<RiskSeverity, number> = { high: 0, medium: 1, low: 2 };
    return [...items].sort((left, right) => severityRank[left.severity] - severityRank[right.severity]);
}

function buildProjectAreaSummary(
    area: 'english' | 'reading' | 'ai',
    projects: GrowthProjectRow[],
    projectTodos: ProjectTodoRow[],
    projectNotes: ProjectNoteRow[],
    today: string,
    upcomingEnd: string,
): ProjectAreaSummary {
    const areaProjects = projects.filter((project) => project.area === area);
    const projectIds = new Set(areaProjects.map((project) => project.id));
    const areaTodos = projectTodos.filter((todo) => projectIds.has(todo.project_id));
    const areaAchievements = projectNotes.filter(
        (note) => projectIds.has(note.project_id) && note.type === 'achievement',
    );

    const todosByProject = new Map<string, { total: number; completed: number }>();
    for (const todo of areaTodos) {
        const current = todosByProject.get(todo.project_id) ?? { total: 0, completed: 0 };
        current.total += 1;
        if (todo.is_completed) current.completed += 1;
        todosByProject.set(todo.project_id, current);
    }

    const dueSoonProjects = areaProjects
        .filter((project) => project.status === 'active' && isDateInRange(project.end_date, today, upcomingEnd))
        .map((project) => {
            const todoStats = todosByProject.get(project.id) ?? { total: 0, completed: 0 };
            const completionRate = todoStats.total > 0 ? (todoStats.completed / todoStats.total) * 100 : 0;
            return {
                title: project.title,
                end_date: project.end_date ?? today,
                completionRate,
            };
        })
        .filter((project) => project.completionRate < 70)
        .sort((left, right) => left.end_date.localeCompare(right.end_date));

    const totalTodos = areaTodos.length;
    const completedTodos = areaTodos.filter((todo) => todo.is_completed).length;

    return {
        totalProjects: areaProjects.length,
        activeProjects: areaProjects.filter((project) => project.status === 'active').length,
        totalTodos,
        completedTodos,
        dueSoonProjects,
        achievementCount: areaAchievements.length,
    };
}

export const analyticsApi = {
    async getInsights(period: AnalyticsPeriod): Promise<InsightsSnapshot> {
        const config = getPeriodConfig(period);
        const trendWindow = buildTrendWindow(config.end);
        const targetsPromise = loadAnalyticsTargets();

        const [
            analyticsTargets,
            quickNotesResult,
            frogsResult,
            tilResult,
            workoutSessionsResult,
            englishQueriesResult,
            englishAssignmentsResult,
            englishCardsResult,
            englishReviewCountResult,
            growthProjectsResult,
            projectTodosResult,
            projectNotesResult,
            outputsResult,
            familyTasksResult,
        ] = await Promise.all([
            targetsPromise,
            supabase
                .from('quick_notes')
                .select('id, type, note_date, content, execute_date, is_completed, completed_at, created_at, priority')
                .order('created_at', { ascending: false }),
            supabase
                .from('daily_frogs')
                .select('frog_date, is_completed, completed_at, title')
                .gte('frog_date', config.start)
                .order('frog_date', { ascending: false }),
            supabase
                .from('daily_til')
                .select('til_date, category')
                .gte('til_date', config.start)
                .order('til_date', { ascending: false }),
            supabase
                .from('workout_sessions')
                .select('id, workout_date')
                .gte('workout_date', offsetDate(config.today, -89))
                .order('workout_date', { ascending: false }),
            supabase
                .from('english_queries')
                .select('query_date, created_at')
                .gte('query_date', config.start)
                .order('created_at', { ascending: false }),
            supabase
                .from('english_daily_assignments')
                .select('assignment_date, status, completed_at')
                .gte('assignment_date', config.start)
                .order('assignment_date', { ascending: false }),
            supabase
                .from('english_cards')
                .select('familiarity'),
            supabase
                .from('english_cards')
                .select('*', { count: 'exact', head: true })
                .lt('familiarity', 5)
                .lte('next_review_at', new Date().toISOString()),
            supabase
                .from('growth_projects')
                .select('id, area, title, end_date, status, created_at')
                .order('created_at', { ascending: false }),
            supabase
                .from('project_todos')
                .select('project_id, is_completed, completed_at, created_at'),
            supabase
                .from('project_notes')
                .select('id, project_id, type, content, created_at')
                .gte('created_at', new Date(`${config.start}T00:00:00`).toISOString())
                .order('created_at', { ascending: false }),
            supabase
                .from('outputs')
                .select('id, title, status, created_at, updated_at, project_id, growth_projects(title, area)')
                .order('updated_at', { ascending: false }),
            supabase
                .from('family_tasks')
                .select('id, title, status, due_date, completed_at, created_at')
                .order('created_at', { ascending: false }),
        ]);

        if (quickNotesResult.error) throw quickNotesResult.error;
        if (frogsResult.error) throw frogsResult.error;
        if (tilResult.error) throw tilResult.error;
        if (workoutSessionsResult.error) throw workoutSessionsResult.error;
        if (englishQueriesResult.error) throw englishQueriesResult.error;
        if (englishAssignmentsResult.error) throw englishAssignmentsResult.error;
        if (englishCardsResult.error) throw englishCardsResult.error;
        if (englishReviewCountResult.error) throw englishReviewCountResult.error;
        if (growthProjectsResult.error) throw growthProjectsResult.error;
        if (projectTodosResult.error) throw projectTodosResult.error;
        if (projectNotesResult.error) throw projectNotesResult.error;
        if (outputsResult.error) throw outputsResult.error;
        if (familyTasksResult.error) throw familyTasksResult.error;

        const quickNotes = (quickNotesResult.data ?? []) as QuickNoteRow[];
        const frogs = (frogsResult.data ?? []) as FrogRow[];
        const tils = (tilResult.data ?? []) as TilRow[];
        const workoutSessions = (workoutSessionsResult.data ?? []) as WorkoutSessionRow[];
        const englishQueries = (englishQueriesResult.data ?? []) as EnglishQueryRow[];
        const englishAssignments = (englishAssignmentsResult.data ?? []) as EnglishAssignmentRow[];
        const englishCards = (englishCardsResult.data ?? []) as EnglishCardRow[];
        const reviewCount = englishReviewCountResult.count ?? 0;
        const growthProjects = (growthProjectsResult.data ?? []) as GrowthProjectRow[];
        const projectTodos = (projectTodosResult.data ?? []) as ProjectTodoRow[];
        const projectNotes = (projectNotesResult.data ?? []) as ProjectNoteRow[];
        const outputs = (outputsResult.data ?? []) as OutputJoinedRow[];
        const familyTasks = (familyTasksResult.data ?? []) as FamilyTaskRow[];

        const rhythmFullFrogTarget = period === 'week'
            ? getTargetValue(analyticsTargets, 'rhythm', 'full_frog_days', 'week', 2)
            : Math.max(2, Math.round((config.totalDays / 7) * getTargetValue(analyticsTargets, 'rhythm', 'full_frog_days', 'week', 2)));
        const fitnessWeeklyGoal = getTargetValue(analyticsTargets, 'fitness', 'workout_days', 'week', 3);
        const outputPublishTarget = getTargetValue(
            analyticsTargets,
            'output',
            'published_outputs',
            PERIOD_TARGET_MAP[period],
            period === 'week' ? 1 : 4,
        );
        const englishDailyAssignmentTarget = getTargetValue(
            analyticsTargets,
            'english',
            'daily_assignments',
            'day',
            8,
        );
        const englishReviewWarningThreshold = getWarningThreshold(
            analyticsTargets,
            'english',
            'review_backlog',
            'day',
            12,
        );
        const todoOverdueWarningThreshold = Math.max(getWarningThreshold(
            analyticsTargets,
            'todos',
            'overdue_count',
            'day',
            1,
        ), 1);
        const familyOverdueWarningThreshold = Math.max(getWarningThreshold(
            analyticsTargets,
            'family',
            'overdue_count',
            'day',
            1,
        ), 1);

        const todos = quickNotes.filter((note) => note.type === 'todo');
        const noteEntries = quickNotes.filter((note) => note.type !== 'todo' && isDateInRange(note.note_date, config.start, config.end));
        const todosCompletedInPeriod = todos.filter((todo) => isDateInRange(toLocalDateFromTimestamp(todo.completed_at), config.start, config.end));
        const overdueTodos = todos.filter((todo) => !todo.is_completed && Boolean(todo.execute_date && todo.execute_date < config.today));
        const unscheduledTodos = todos.filter((todo) => !todo.is_completed && !todo.execute_date);
        const scheduledTodosInPeriod = todos.filter((todo) => isDateInRange(todo.execute_date, config.start, config.end));
        const scheduledTodoCompletionRate = scheduledTodosInPeriod.length > 0
            ? (scheduledTodosInPeriod.filter((todo) => todo.is_completed).length / scheduledTodosInPeriod.length) * 100
            : todosCompletedInPeriod.length > 0
                ? 100
                : 0;

        const frogsInPeriod = frogs.filter((frog) => isDateInRange(frog.frog_date, config.start, config.end));
        const frogsCompletedInPeriod = frogsInPeriod.filter((frog) => frog.is_completed);
        const frogsByDate = new Map<string, { total: number; completed: number }>();
        for (const frog of frogsInPeriod) {
            const current = frogsByDate.get(frog.frog_date) ?? { total: 0, completed: 0 };
            current.total += 1;
            if (frog.is_completed) current.completed += 1;
            frogsByDate.set(frog.frog_date, current);
        }
        const fullFrogDays = Array.from(frogsByDate.values()).filter(
            (item) => item.total > 0 && item.total === item.completed,
        ).length;

        const tilsInPeriod = tils.filter((item) => isDateInRange(item.til_date, config.start, config.end));
        const rhythmActiveDays = getUniqueCount([
            ...Array.from(frogsByDate.keys()),
            ...tilsInPeriod.map((item) => item.til_date),
            ...noteEntries.map((item) => item.note_date),
        ]);
        const frogCompletionRate = frogsInPeriod.length > 0
            ? (frogsCompletedInPeriod.length / frogsInPeriod.length) * 100
            : 0;
        const rhythmProgress = clamp(
            frogCompletionRate * 0.5
            + (rhythmActiveDays / config.totalDays) * 30
            + Math.min((tilsInPeriod.length + noteEntries.length) / Math.max(1, config.totalDays), 1) * 20,
        );
        const rhythmRiskCount =
            (fullFrogDays < Math.max(1, Math.min(rhythmFullFrogTarget, Math.floor(config.elapsedDays / 2) || 1))
                && rhythmActiveDays < Math.max(2, Math.floor(config.totalDays / 3))
                ? 1
                : 0)
            + (tilsInPeriod.length === 0 ? 1 : 0);

        const workoutDaysInPeriod = Array.from(
            new Set(
                workoutSessions
                    .filter((session) => isDateInRange(session.workout_date, config.start, config.end))
                    .map((session) => session.workout_date),
            ),
        );
        const periodWorkoutTarget = period === 'week'
            ? fitnessWeeklyGoal
            : Math.max(4, Math.round((config.totalDays / 7) * fitnessWeeklyGoal));
        const latestWorkoutDate = workoutSessions[0]?.workout_date ?? null;
        const workoutDaysAgo = latestWorkoutDate ? getDaysBetween(latestWorkoutDate, config.today) : null;
        const workoutProgress = clamp((workoutDaysInPeriod.length / periodWorkoutTarget) * 100);

        let workoutSetsInPeriod = 0;
        let workoutVolumeInPeriod = 0;
        const workoutSessionIdsInPeriod = workoutSessions
            .filter((session) => isDateInRange(session.workout_date, config.start, config.end))
            .map((session) => session.id);

        if (workoutSessionIdsInPeriod.length > 0) {
            const workoutSetsResult = await supabase
                .from('workout_sets')
                .select('weight, reps')
                .in('session_id', workoutSessionIdsInPeriod);

            if (workoutSetsResult.error) throw workoutSetsResult.error;

            const workoutSets = (workoutSetsResult.data ?? []) as WorkoutSetRow[];
            for (const set of workoutSets) {
                workoutSetsInPeriod += 1;
                workoutVolumeInPeriod += (set.weight ?? 0) * (set.reps ?? 0);
            }
        }

        const expectedWorkoutProgress = clamp((config.elapsedDays / config.totalDays) * 100);
        const fitnessRiskCount =
            (workoutDaysAgo !== null && workoutDaysAgo >= 5 ? 1 : 0)
            + (workoutProgress + 15 < expectedWorkoutProgress ? 1 : 0);

        const queriesInPeriod = englishQueries.filter((query) => isDateInRange(query.query_date, config.start, config.end));
        const assignmentsInPeriod = englishAssignments.filter((assignment) => isDateInRange(assignment.assignment_date, config.start, config.end));
        const completedAssignmentsInPeriod = assignmentsInPeriod.filter((assignment) => assignment.status === 'completed');
        const assignmentsToday = englishAssignments.filter((assignment) => assignment.assignment_date === config.today);
        const remainingAssignmentsToday = assignmentsToday.filter(
            (assignment) => !['completed', 'skipped'].includes(assignment.status),
        ).length;
        const masteredCards = englishCards.filter((card) => card.familiarity >= 5).length;
        const englishActiveDays = getUniqueCount([
            ...queriesInPeriod.map((query) => query.query_date),
            ...assignmentsInPeriod.map((assignment) => assignment.assignment_date),
        ]);
        const englishProjectSummary = buildProjectAreaSummary(
            'english',
            growthProjects,
            projectTodos,
            projectNotes,
            config.today,
            config.upcomingEnd,
        );
        const englishAssignmentProgress = assignmentsInPeriod.length > 0
            ? (completedAssignmentsInPeriod.length / assignmentsInPeriod.length) * 100
            : 0;
        const englishProjectProgress = englishProjectSummary.totalTodos > 0
            ? (englishProjectSummary.completedTodos / englishProjectSummary.totalTodos) * 100
            : englishProjectSummary.activeProjects > 0
                ? 45
                : 0;
        const englishProgress = clamp(
            englishAssignmentProgress * 0.45
            + (englishActiveDays / config.totalDays) * 30
            + englishProjectProgress * 0.25,
        );
        const englishRiskCount =
            (reviewCount >= englishReviewWarningThreshold ? 1 : 0)
            + (remainingAssignmentsToday > 0 ? 1 : 0)
            + (englishProjectSummary.dueSoonProjects.length > 0 ? 1 : 0);

        const readingProjectSummary = buildProjectAreaSummary(
            'reading',
            growthProjects,
            projectTodos,
            projectNotes,
            config.today,
            config.upcomingEnd,
        );
        const aiProjectSummary = buildProjectAreaSummary(
            'ai',
            growthProjects,
            projectTodos,
            projectNotes,
            config.today,
            config.upcomingEnd,
        );

        const publishedOutputs = outputs.filter((output) => output.status === 'published');
        const publishedOutputsInPeriod = publishedOutputs.filter((output) =>
            isDateInRange(toLocalDateFromTimestamp(output.updated_at), config.start, config.end),
        );
        const draftOutputs = outputs.filter((output) => output.status === 'draft');
        const recentlyTouchedOutputs = outputs.filter((output) =>
            isDateInRange(toLocalDateFromTimestamp(output.updated_at), config.start, config.end),
        );
        const outputProgress = clamp((publishedOutputsInPeriod.length / outputPublishTarget) * 100);
        const staleOutputRisk = publishedOutputsInPeriod.length === 0 && draftOutputs.length > 0 ? 1 : 0;

        const familyDoneInPeriod = familyTasks.filter(
            (task) => task.status === 'done' && isDateInRange(toLocalDateFromTimestamp(task.completed_at), config.start, config.end),
        );
        const familyOpenTasks = familyTasks.filter((task) => task.status !== 'done');
        const familyOverdue = familyOpenTasks.filter((task) => Boolean(task.due_date && task.due_date < config.today));
        const familyDueSoon = familyOpenTasks
            .filter((task) => isDateInRange(task.due_date, config.today, offsetDate(config.today, 7)))
            .sort((left, right) => (left.due_date ?? '').localeCompare(right.due_date ?? ''));
        const familyProgressBase = familyDoneInPeriod.length + familyOpenTasks.length;
        const familyProgress = familyProgressBase > 0
            ? clamp((familyDoneInPeriod.length / familyProgressBase) * 100 + familyDoneInPeriod.length * 8)
            : 42;
        const familyRiskCount = (familyOverdue.length >= familyOverdueWarningThreshold ? 1 : 0) + (familyDueSoon.length >= 4 ? 1 : 0);

        const achievements: AchievementItem[] = [];
        const risks: RiskItem[] = [];
        const upcoming: UpcomingItem[] = [];

        if (fullFrogDays > 0) {
            achievements.push({
                id: 'rhythm-full-frogs',
                areaKey: 'rhythm',
                areaLabel: AREA_META.rhythm.label,
                icon: AREA_META.rhythm.icon,
                title: `完整推进 ${fullFrogDays}/${rhythmFullFrogTarget} 天`,
                detail: `本周期有 ${fullFrogDays} 天把三只青蛙全部完成，当前目标是 ${rhythmFullFrogTarget} 天。`,
                dateLabel: config.periodLabel,
                tone: 'sky',
            });
        }

        if (workoutDaysInPeriod.length > 0) {
            achievements.push({
                id: 'fitness-period-workouts',
                areaKey: 'fitness',
                areaLabel: AREA_META.fitness.label,
                icon: AREA_META.fitness.icon,
                title: `${workoutDaysInPeriod.length} 天完成训练`,
                detail: workoutSetsInPeriod > 0
                    ? `累计 ${workoutSetsInPeriod} 组，训练量约 ${Math.round(workoutVolumeInPeriod)}kg。`
                    : '本周期已经把训练重新拉起来了。',
                dateLabel: config.periodLabel,
                tone: 'success',
            });
        }

        if (completedAssignmentsInPeriod.length > 0 || masteredCards > 0) {
            achievements.push({
                id: 'english-learning-progress',
                areaKey: 'english',
                areaLabel: AREA_META.english.label,
                icon: AREA_META.english.icon,
                title: `${completedAssignmentsInPeriod.length} 个词条已完成`,
                detail: `当前已掌握 ${masteredCards} 张卡片，今日目标 ${englishDailyAssignmentTarget} 个，待复习 ${reviewCount} 张。`,
                dateLabel: config.periodLabel,
                tone: 'accent',
            });
        }

        for (const note of projectNotes.filter((item) => item.type === 'achievement').slice(0, 3)) {
            const project = growthProjects.find((candidate) => candidate.id === note.project_id);
            const areaKey = (project?.area ?? 'reading') as InsightAreaKey;
            achievements.push({
                id: note.id,
                areaKey,
                areaLabel: AREA_META[areaKey].label,
                icon: AREA_META[areaKey].icon,
                title: sliceText(note.content, 22),
                detail: project ? `${project.title} 里新增了一条成果记录。` : '新增了一条成果记录。',
                dateLabel: formatTimestampDate(note.created_at),
                tone: AREA_META[areaKey].tone,
            });
        }

        for (const output of publishedOutputsInPeriod.slice(0, 3)) {
            const projectInfo = Array.isArray(output.growth_projects)
                ? output.growth_projects[0]
                : output.growth_projects;
            achievements.push({
                id: output.id,
                areaKey: 'output',
                areaLabel: AREA_META.output.label,
                icon: AREA_META.output.icon,
                title: output.title,
                detail: projectInfo?.title
                    ? `已和 ${projectInfo.title} 关联，并进入发布状态。`
                    : '本周期进入发布状态。',
                dateLabel: formatTimestampDate(output.updated_at),
                tone: 'orange',
            });
        }

        if (familyDoneInPeriod.length > 0) {
            achievements.push({
                id: 'family-done-period',
                areaKey: 'family',
                areaLabel: AREA_META.family.label,
                icon: AREA_META.family.icon,
                title: `${familyDoneInPeriod.length} 项家庭事务已完成`,
                detail: familyOverdue.length === 0 ? '当前没有新的家庭逾期任务。' : `仍有 ${familyOverdue.length} 项逾期待处理。`,
                dateLabel: config.periodLabel,
                tone: 'yellow',
            });
        }

        if (overdueTodos.length >= todoOverdueWarningThreshold) {
            risks.push({
                id: 'todos-overdue',
                areaKey: 'todos',
                areaLabel: AREA_META.todos.label,
                title: `${overdueTodos.length} 条待办已逾期`,
                detail: overdueTodos.length > 1
                    ? `最需要先清掉的是 ${sliceText(overdueTodos[0].content)} 等历史事项。`
                    : `当前逾期事项是 ${sliceText(overdueTodos[0].content)}。`,
                severity: 'high',
                action: '优先把逾期待办重新排期或直接完成。',
            });
        }

        if (familyOverdue.length >= familyOverdueWarningThreshold) {
            risks.push({
                id: 'family-overdue',
                areaKey: 'family',
                areaLabel: AREA_META.family.label,
                title: `${familyOverdue.length} 项家庭事务逾期`,
                detail: `最早需要处理的是 ${sliceText(familyOverdue[0].title)}。`,
                severity: 'high',
                action: '先清逾期家庭任务，再安排新事务。',
            });
        }

        if (reviewCount >= englishReviewWarningThreshold) {
            risks.push({
                id: 'english-review-backlog',
                areaKey: 'english',
                areaLabel: AREA_META.english.label,
                title: `英语待复习积压 ${reviewCount} 张`,
                detail: '当前复习池已经明显堆积，继续新增会拉低学习节奏。',
                severity: 'medium',
                action: '优先清一轮复习，再继续加新词。',
            });
        }

        if (workoutDaysAgo !== null && workoutDaysAgo >= 5) {
            risks.push({
                id: 'fitness-stale',
                areaKey: 'fitness',
                areaLabel: AREA_META.fitness.label,
                title: `健身已中断 ${workoutDaysAgo} 天`,
                detail: '当前训练节奏正在往下掉，越拖越难重新起势。',
                severity: 'medium',
                action: '先补一练，把连续性拉回来。',
            });
        }

        if (staleOutputRisk > 0) {
            risks.push({
                id: 'output-stale',
                areaKey: 'output',
                areaLabel: AREA_META.output.label,
                title: '输出还没有从草稿推进到发布',
                detail: `当前仍有 ${draftOutputs.length} 条草稿，最近发布数为 0。`,
                severity: 'low',
                action: '从最接近完成的一条草稿开始发布。',
            });
        }

        for (const dueSoonProject of [
            ...englishProjectSummary.dueSoonProjects.map((item) => ({ ...item, areaKey: 'english' as InsightAreaKey })),
            ...readingProjectSummary.dueSoonProjects.map((item) => ({ ...item, areaKey: 'reading' as InsightAreaKey })),
            ...aiProjectSummary.dueSoonProjects.map((item) => ({ ...item, areaKey: 'ai' as InsightAreaKey })),
        ].slice(0, 3)) {
            risks.push({
                id: `project-${dueSoonProject.areaKey}-${dueSoonProject.title}`,
                areaKey: dueSoonProject.areaKey,
                areaLabel: AREA_META[dueSoonProject.areaKey].label,
                title: `${dueSoonProject.title} 截止临近`,
                detail: `${formatShortDate(dueSoonProject.end_date)} 到期，当前完成率约 ${Math.round(dueSoonProject.completionRate)}%。`,
                severity: 'medium',
                action: '优先把截止最近的项目 Todo 往前推。',
            });
        }

        for (const project of growthProjects
            .filter((item) => item.status === 'active' && isDateInRange(item.end_date, config.today, config.upcomingEnd))
            .sort((left, right) => (left.end_date ?? '').localeCompare(right.end_date ?? ''))
            .slice(0, 3)) {
            const daysLeft = project.end_date ? getDaysBetween(config.today, project.end_date) : null;
            const areaKey = project.area as InsightAreaKey;

            upcoming.push({
                id: `project-${project.id}`,
                areaKey,
                areaLabel: AREA_META[areaKey].label,
                title: project.title,
                detail: '项目截止节点即将到来。',
                dueLabel: project.end_date ? `${formatShortDate(project.end_date)} · ${formatDaysLeft(daysLeft)}` : '近期',
                daysLeft,
                tone: AREA_META[areaKey].tone,
            });
        }

        for (const task of familyDueSoon.slice(0, 2)) {
            const daysLeft = task.due_date ? getDaysBetween(config.today, task.due_date) : null;
            upcoming.push({
                id: `family-${task.id}`,
                areaKey: 'family',
                areaLabel: AREA_META.family.label,
                title: task.title,
                detail: '家庭事务到期提醒。',
                dueLabel: task.due_date ? `${formatShortDate(task.due_date)} · ${formatDaysLeft(daysLeft)}` : '近期',
                daysLeft,
                tone: 'yellow',
            });
        }

        for (const todo of todos
            .filter((item) => !item.is_completed && isDateInRange(item.execute_date, config.today, offsetDate(config.today, 7)))
            .sort((left, right) => (left.execute_date ?? '').localeCompare(right.execute_date ?? ''))
            .slice(0, 2)) {
            const daysLeft = todo.execute_date ? getDaysBetween(config.today, todo.execute_date) : null;
            upcoming.push({
                id: `todo-${todo.id}`,
                areaKey: 'todos',
                areaLabel: AREA_META.todos.label,
                title: sliceText(todo.content, 24),
                detail: '已安排执行日期的待办即将到来。',
                dueLabel: todo.execute_date ? `${formatShortDate(todo.execute_date)} · ${formatDaysLeft(daysLeft)}` : '近期',
                daysLeft,
                tone: 'blue',
            });
        }

        if (period === 'week' && workoutDaysInPeriod.length < fitnessWeeklyGoal) {
            upcoming.push({
                id: 'fitness-goal-gap',
                areaKey: 'fitness',
                areaLabel: AREA_META.fitness.label,
                title: `本周还差 ${fitnessWeeklyGoal - workoutDaysInPeriod.length} 次训练`,
                detail: '只要补上剩余次数，本周目标就能达成。',
                dueLabel: '本周内',
                daysLeft: null,
                tone: 'success',
            });
        }

        if (remainingAssignmentsToday > 0) {
            upcoming.push({
                id: 'english-today-left',
                areaKey: 'english',
                areaLabel: AREA_META.english.label,
                title: `今天还有 ${remainingAssignmentsToday} 个英语词条`,
                detail: '词单还没清空，晚一点也可以补完。',
                dueLabel: '今天',
                daysLeft: 0,
                tone: 'accent',
            });
        }

        const areaSnapshots = [
            toAreaSnapshot({
                key: 'rhythm',
                progress: rhythmProgress,
                score: clamp(rhythmProgress - rhythmRiskCount * 8),
                summary: `青蛙 ${frogsCompletedInPeriod.length}/${frogsInPeriod.length} · TIL ${tilsInPeriod.length} 条`,
                achievement: fullFrogDays > 0 ? `完整推进 ${fullFrogDays}/${rhythmFullFrogTarget} 天` : '先把今天的节奏拉起来',
                achievementTone: fullFrogDays > 0 ? 'sky' : 'warning',
                riskCount: rhythmRiskCount,
                nextFocus: fullFrogDays === 0 ? '先把今天的三只青蛙完成一轮' : tilsInPeriod.length === 0 ? '补一条 TIL' : '保持当前节奏',
            }),
            toAreaSnapshot({
                key: 'todos',
                progress: scheduledTodoCompletionRate || (todos.length === 0 ? 42 : 0),
                score: todos.length === 0
                    ? 42
                    : clamp(scheduledTodoCompletionRate * 0.7 + (overdueTodos.length === 0 ? 18 : 0) + (unscheduledTodos.length === 0 ? 12 : 0) - overdueTodos.length * 10),
                summary: `${todosCompletedInPeriod.length} 条已完成 · ${todos.filter((todo) => !todo.is_completed).length} 条待处理`,
                achievement: overdueTodos.length === 0 && todosCompletedInPeriod.length > 0
                    ? `本周期清掉 ${todosCompletedInPeriod.length} 条待办`
                    : `未安排 ${unscheduledTodos.length} 条`,
                achievementTone: overdueTodos.length === 0 ? 'blue' : 'warning',
                riskCount: (overdueTodos.length > 0 ? 1 : 0) + (unscheduledTodos.length >= 4 ? 1 : 0),
                nextFocus: overdueTodos.length > 0
                    ? `先处理逾期待办：${sliceText(overdueTodos[0].content, 16)}`
                    : unscheduledTodos.length > 0
                        ? '把未安排的待办补上执行日期'
                        : '继续清今天排期内的事项',
            }),
            toAreaSnapshot({
                key: 'fitness',
                progress: workoutDaysInPeriod.length > 0 || workoutSessionIdsInPeriod.length > 0 ? workoutProgress : 42,
                score: workoutDaysInPeriod.length === 0 && workoutSessionIdsInPeriod.length === 0
                    ? 42 - fitnessRiskCount * 8
                    : clamp(workoutProgress * 0.72 + Math.min(workoutSetsInPeriod / 2, 18) + (workoutDaysAgo !== null && workoutDaysAgo <= 2 ? 10 : 0) - fitnessRiskCount * 10),
                summary: `${workoutDaysInPeriod.length}/${periodWorkoutTarget} 天训练 · ${workoutSetsInPeriod} 组`,
                achievement: workoutDaysInPeriod.length > 0
                    ? `累计约 ${Math.round(workoutVolumeInPeriod)}kg · 最近一次 ${latestWorkoutDate ? formatShortDate(latestWorkoutDate) : '今天'}`
                    : '先补一练，重新启动身体节奏',
                achievementTone: workoutDaysInPeriod.length > 0 ? 'success' : 'warning',
                riskCount: fitnessRiskCount,
                nextFocus: workoutDaysInPeriod.length >= periodWorkoutTarget
                    ? '本周期已达标，保持恢复与稳定性'
                    : `还差 ${Math.max(periodWorkoutTarget - workoutDaysInPeriod.length, 1)} 次训练`,
            }),
            toAreaSnapshot({
                key: 'english',
                progress: queriesInPeriod.length > 0 || assignmentsInPeriod.length > 0 || englishProjectSummary.totalProjects > 0 ? englishProgress : 42,
                score: queriesInPeriod.length === 0 && assignmentsInPeriod.length === 0 && englishProjectSummary.totalProjects === 0
                    ? 42
                    : clamp(englishProgress - englishRiskCount * 8 + Math.min(masteredCards / 10, 12)),
                summary: `查询 ${queriesInPeriod.length} 次 · 词单 ${completedAssignmentsInPeriod.length}/${assignmentsInPeriod.length}`,
                achievement: `已掌握 ${masteredCards} 张卡片${englishProjectSummary.activeProjects > 0 ? ` · ${englishProjectSummary.activeProjects} 个项目在推` : ''}`,
                achievementTone: 'accent',
                riskCount: englishRiskCount,
                nextFocus: reviewCount >= englishReviewWarningThreshold
                        ? `先清复习池（${reviewCount} / ${englishReviewWarningThreshold}+）`
                        : remainingAssignmentsToday > 0
                            ? `今天还剩 ${remainingAssignmentsToday} / ${englishDailyAssignmentTarget} 个词条`
                            : englishProjectSummary.dueSoonProjects[0]
                                ? `推进项目：${sliceText(englishProjectSummary.dueSoonProjects[0].title, 14)}`
                                : '保持查询、词单、复习三段节奏',
            }),
            toAreaSnapshot({
                key: 'reading',
                progress: readingProjectSummary.totalProjects === 0
                    ? 42
                    : readingProjectSummary.totalTodos > 0
                        ? (readingProjectSummary.completedTodos / readingProjectSummary.totalTodos) * 100
                        : readingProjectSummary.activeProjects > 0
                            ? 45
                            : 35,
                score: readingProjectSummary.totalProjects === 0
                    ? 42
                    : clamp(
                        (readingProjectSummary.totalTodos > 0
                            ? (readingProjectSummary.completedTodos / readingProjectSummary.totalTodos) * 72
                            : readingProjectSummary.activeProjects * 14)
                        + Math.min(readingProjectSummary.achievementCount * 8, 16)
                        - readingProjectSummary.dueSoonProjects.length * 10,
                    ),
                summary: `${readingProjectSummary.activeProjects}/${readingProjectSummary.totalProjects} 个项目 · Todo ${readingProjectSummary.completedTodos}/${readingProjectSummary.totalTodos}`,
                achievement: readingProjectSummary.achievementCount > 0
                    ? `${readingProjectSummary.achievementCount} 条成果记录`
                    : readingProjectSummary.totalProjects > 0
                        ? '项目骨架已搭起来'
                        : '等你放入第一个阅读项目',
                achievementTone: 'green',
                riskCount: readingProjectSummary.dueSoonProjects.length,
                nextFocus: readingProjectSummary.dueSoonProjects[0]
                    ? `优先推进：${sliceText(readingProjectSummary.dueSoonProjects[0].title, 14)}`
                    : readingProjectSummary.totalProjects === 0
                        ? '先新建一个阅读项目'
                        : '继续推动当前项目 Todo',
            }),
            toAreaSnapshot({
                key: 'ai',
                progress: aiProjectSummary.totalProjects === 0
                    ? 42
                    : aiProjectSummary.totalTodos > 0
                        ? (aiProjectSummary.completedTodos / aiProjectSummary.totalTodos) * 100
                        : aiProjectSummary.activeProjects > 0
                            ? 45
                            : 35,
                score: aiProjectSummary.totalProjects === 0
                    ? 42
                    : clamp(
                        (aiProjectSummary.totalTodos > 0
                            ? (aiProjectSummary.completedTodos / aiProjectSummary.totalTodos) * 72
                            : aiProjectSummary.activeProjects * 14)
                        + Math.min(aiProjectSummary.achievementCount * 8, 16)
                        - aiProjectSummary.dueSoonProjects.length * 10,
                    ),
                summary: `${aiProjectSummary.activeProjects}/${aiProjectSummary.totalProjects} 个项目 · Todo ${aiProjectSummary.completedTodos}/${aiProjectSummary.totalTodos}`,
                achievement: aiProjectSummary.achievementCount > 0
                    ? `${aiProjectSummary.achievementCount} 条成果记录`
                    : aiProjectSummary.totalProjects > 0
                        ? '项目还在持续推进'
                        : '等你放入第一个 AI 项目',
                achievementTone: 'purple',
                riskCount: aiProjectSummary.dueSoonProjects.length,
                nextFocus: aiProjectSummary.dueSoonProjects[0]
                    ? `优先推进：${sliceText(aiProjectSummary.dueSoonProjects[0].title, 14)}`
                    : aiProjectSummary.totalProjects === 0
                        ? '先新建一个 AI 项目'
                        : '继续推动当前项目 Todo',
            }),
            toAreaSnapshot({
                key: 'output',
                progress: outputs.length === 0 ? 42 : outputProgress,
                score: outputs.length === 0
                    ? 42
                    : clamp(outputProgress * 0.65 + Math.min(recentlyTouchedOutputs.length * 12, 24) + Math.min(publishedOutputs.length * 4, 12) - staleOutputRisk * 10),
                summary: `发布 ${publishedOutputsInPeriod.length} 条 · 草稿 ${draftOutputs.length} 条`,
                achievement: publishedOutputs.length > 0
                    ? `累计 ${publishedOutputs.length} 条进入发布状态`
                    : draftOutputs.length > 0
                        ? '草稿已经在积累，只差推进发布'
                        : '输出区还在等第一条内容',
                achievementTone: 'orange',
                riskCount: staleOutputRisk,
                nextFocus: draftOutputs.length > 0
                    ? `优先把一条草稿推进成发布`
                    : outputs.length === 0
                        ? '先沉淀第一条输出'
                        : '保持发布与迭代节奏',
            }),
            toAreaSnapshot({
                key: 'family',
                progress: familyProgress,
                score: clamp(familyProgress - familyRiskCount * 12 + Math.min(familyDoneInPeriod.length * 8, 18)),
                summary: `本周期完成 ${familyDoneInPeriod.length} 项 · 待处理 ${familyOpenTasks.length} 项`,
                achievement: familyTasks.length > 0
                    ? `累计记录 ${familyTasks.length} 项家庭事务`
                    : '还没有接入家庭事务记录',
                achievementTone: 'yellow',
                riskCount: familyRiskCount,
                nextFocus: familyOverdue[0]
                    ? `先处理逾期：${sliceText(familyOverdue[0].title, 14)}`
                    : familyDueSoon[0]
                        ? `提前完成：${sliceText(familyDueSoon[0].title, 14)}`
                        : familyOpenTasks.length > 0
                            ? '把待处理事项继续往前推'
                            : '当前家庭面板比较平稳',
            }),
            toAreaSnapshot({
                key: 'finance',
                progress: null,
                score: null,
                summary: '收支、预算和资产统计尚未接入真实数据。',
                achievement: '第一版保持灰态，避免把“未接入”误读成“0”。',
                achievementTone: 'muted',
                riskCount: 0,
                nextFocus: '等财务模块接入真实数据后再纳入分析。',
            }),
        ];

        const trackedSnapshots = areaSnapshots.filter((item) => item.score !== null);
        const healthScore = trackedSnapshots.length > 0
            ? Math.round(trackedSnapshots.reduce((sum, item) => sum + (item.score ?? 0), 0) / trackedSnapshots.length)
            : 0;
        const focusAreaSnapshot = trackedSnapshots
            .slice()
            .sort((left, right) => (left.score ?? 0) - (right.score ?? 0))[0];
        const focusArea = focusAreaSnapshot?.label ?? '财务';
        const healthyAreaCount = trackedSnapshots.filter((item) => (item.score ?? 0) >= 80).length;
        const activeAreaCount = trackedSnapshots.filter((item) => (item.progress ?? 0) > 0).length;

        const globalStats: GlobalPulseStat[] = [
            {
                label: '整体健康',
                value: `${healthScore}%`,
                meta: `${healthyAreaCount} 个领域稳定`,
                tone: healthScore >= 80 ? 'success' : healthScore >= 60 ? 'accent' : healthScore >= 40 ? 'warning' : 'danger',
            },
            {
                label: '活跃领域',
                value: `${activeAreaCount}/${trackedSnapshots.length}`,
                meta: config.periodLabel,
                tone: 'blue',
            },
            {
                label: '本周期成果',
                value: achievements.length,
                meta: `${publishedOutputsInPeriod.length} 条发布 · ${projectNotes.filter((item) => item.type === 'achievement').length} 条成果`,
                tone: 'success',
            },
            {
                label: '风险提醒',
                value: risks.length,
                meta: focusArea ? `当前最需关注：${focusArea}` : '暂无明显风险',
                tone: risks.length === 0 ? 'success' : risks.length <= 2 ? 'warning' : 'danger',
            },
        ];

        const actionCounts = new Map<string, number>();
        const learningCounts = new Map<string, number>();
        const achievementCounts = new Map<string, number>();

        for (const todo of todos) {
            incrementCount(actionCounts, toLocalDateFromTimestamp(todo.completed_at));
        }
        for (const task of familyTasks) {
            if (task.status === 'done') {
                incrementCount(actionCounts, toLocalDateFromTimestamp(task.completed_at));
            }
        }
        for (const assignment of englishAssignments) {
            if (assignment.status === 'completed') {
                incrementCount(actionCounts, toLocalDateFromTimestamp(assignment.completed_at));
                incrementCount(learningCounts, assignment.assignment_date);
            }
        }
        for (const frog of frogs) {
            if (frog.is_completed) {
                incrementCount(actionCounts, toLocalDateFromTimestamp(frog.completed_at));
            }
        }
        for (const sessionDate of Array.from(new Set(workoutSessions.map((session) => session.workout_date)))) {
            incrementCount(actionCounts, sessionDate);
        }
        for (const til of tils) {
            incrementCount(learningCounts, til.til_date);
        }
        for (const query of englishQueries) {
            incrementCount(learningCounts, query.query_date);
        }
        for (const output of publishedOutputs) {
            incrementCount(achievementCounts, toLocalDateFromTimestamp(output.updated_at));
        }
        for (const note of projectNotes.filter((item) => item.type === 'achievement')) {
            incrementCount(achievementCounts, toLocalDateFromTimestamp(note.created_at));
        }
        for (const [date, data] of frogsByDate.entries()) {
            if (data.total > 0 && data.total === data.completed) {
                incrementCount(achievementCounts, date);
            }
        }

        const periodActionTotal = Array.from(actionCounts.entries())
            .filter(([date]) => isDateInRange(date, config.start, config.end))
            .reduce((sum, [, value]) => sum + value, 0);
        const periodLearningTotal = Array.from(learningCounts.entries())
            .filter(([date]) => isDateInRange(date, config.start, config.end))
            .reduce((sum, [, value]) => sum + value, 0);
        const periodAchievementTotal = Array.from(achievementCounts.entries())
            .filter(([date]) => isDateInRange(date, config.start, config.end))
            .reduce((sum, [, value]) => sum + value, 0);

        const projectedActions = Math.round((periodActionTotal / Math.max(config.elapsedDays, 1)) * config.totalDays);
        const projectedLearning = Math.round((periodLearningTotal / Math.max(config.elapsedDays, 1)) * config.totalDays);
        const projectedAchievements = Math.round((periodAchievementTotal / Math.max(config.elapsedDays, 1)) * config.totalDays);

        const trends: TrendMetric[] = [
            {
                key: 'actions',
                label: '行动趋势',
                unit: '次',
                tone: 'accent',
                total: `${periodActionTotal} 次动作`,
                forecast: config.elapsedDays < config.totalDays
                    ? `按当前节奏，${config.periodLabel}约可到 ${projectedActions} 次`
                    : `这一周期最终停在 ${periodActionTotal} 次`,
                values: buildTrendValues(trendWindow, actionCounts),
            },
            {
                key: 'learning',
                label: '学习节奏',
                unit: '次',
                tone: 'blue',
                total: `${periodLearningTotal} 次学习动作`,
                forecast: config.elapsedDays < config.totalDays
                    ? `延续当前速度，${config.periodLabel}约 ${projectedLearning} 次`
                    : `这一周期完成 ${periodLearningTotal} 次学习动作`,
                values: buildTrendValues(trendWindow, learningCounts),
            },
            {
                key: 'achievements',
                label: '成果沉淀',
                unit: '项',
                tone: 'success',
                total: `${periodAchievementTotal} 项成果`,
                forecast: config.elapsedDays < config.totalDays
                    ? `如果持续推进，${config.periodLabel}约能沉淀 ${projectedAchievements} 项`
                    : `这一周期共沉淀 ${periodAchievementTotal} 项成果`,
                values: buildTrendValues(trendWindow, achievementCounts),
            },
        ];

        return {
            period,
            periodLabel: config.periodLabel,
            generatedAt: new Intl.DateTimeFormat('zh-CN', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date()),
            healthScore,
            focusArea,
            heroSummary: `当前整体健康度约 ${healthScore}% ，最需要补的是 ${focusArea}；${config.periodLabel}已沉淀 ${achievements.length} 项成果，识别到 ${risks.length} 项风险。`,
            globalStats,
            areaSnapshots,
            achievements: achievements.slice(0, 8),
            risks: sortRiskItems(risks).slice(0, 6),
            upcoming: sortUpcomingItems(upcoming).slice(0, 6),
            trends,
        };
    },
};

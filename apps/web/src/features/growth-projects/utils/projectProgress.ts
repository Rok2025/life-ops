import { getLocalDateStr } from '@/lib/utils/date';
import { DISPLAY_STATUS_CONFIG } from '../types';
import type { ProjectDisplayStatus, ProjectStatus, ProjectWithStats } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NEAR_DUE_THRESHOLD_DAYS = 3;

type ProjectProgressMetrics = {
    displayStatus: ProjectDisplayStatus;
    scheduleProgress: number | null;
    todoProgress: number;
    isTrackedByDate: boolean;
    isTodoLagging: boolean;
    statusLabel: string;
    scheduleLabel: string;
    dateRangeLabel: string | null;
    daysUntilStart: number | null;
    daysRemaining: number | null;
    daysOverdue: number | null;
};

function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function diffDays(from: string, to: string): number {
    const fromTime = parseLocalDate(from).getTime();
    const toTime = parseLocalDate(to).getTime();
    return Math.round((toTime - fromTime) / DAY_MS);
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function formatShortDate(dateStr: string | null | undefined): string {
    return dateStr ? dateStr.slice(5) : '?';
}

function getDateRangeLabel(startDate: string | null, endDate: string | null): string | null {
    if (!startDate && !endDate) return null;
    return `${formatShortDate(startDate)} ~ ${formatShortDate(endDate)}`;
}

function getDisplayStatus(
    status: ProjectStatus,
    startDate: string | null,
    endDate: string | null,
    today: string,
    scheduleProgress: number | null,
): ProjectDisplayStatus {
    if (status === 'completed') return 'completed';
    if (status === 'archived') return 'archived';
    if (status === 'paused') return 'paused';

    if (!startDate || !endDate || startDate > endDate) return 'active';
    if (today < startDate) return 'not_started';
    if (today > endDate) return 'overdue';
    if ((diffDays(today, endDate) <= NEAR_DUE_THRESHOLD_DAYS) || ((scheduleProgress ?? 0) >= 85)) return 'near_due';
    return 'active';
}

function getScheduleLabel(
    displayStatus: ProjectDisplayStatus,
    daysUntilStart: number | null,
    daysRemaining: number | null,
    daysOverdue: number | null,
): string {
    if (displayStatus === 'completed' || displayStatus === 'paused' || displayStatus === 'archived') {
        return DISPLAY_STATUS_CONFIG[displayStatus].label;
    }

    if (displayStatus === 'not_started') {
        if (daysUntilStart === null) return '待开始';
        return daysUntilStart <= 1 ? '明天开始' : `${daysUntilStart} 天后开始`;
    }

    if (displayStatus === 'overdue') {
        if (daysOverdue === null) return '已逾期';
        return `已逾期 ${daysOverdue} 天`;
    }

    if (daysRemaining === null) return '进行中';
    if (daysRemaining === 0) return '今天截止';
    return `剩余 ${daysRemaining} 天`;
}

export function getProjectProgressMetrics(
    project: Pick<ProjectWithStats, 'status' | 'start_date' | 'end_date' | 'todo_total' | 'todo_completed'>,
    today: string = getLocalDateStr(),
): ProjectProgressMetrics {
    const todoProgress = project.todo_total > 0
        ? Math.round((project.todo_completed / project.todo_total) * 100)
        : 0;

    const dateRangeLabel = getDateRangeLabel(project.start_date, project.end_date);
    const hasValidSchedule = Boolean(
        project.start_date
        && project.end_date
        && project.start_date <= project.end_date,
    );

    let scheduleProgress: number | null = null;
    let daysUntilStart: number | null = null;
    let daysRemaining: number | null = null;
    let daysOverdue: number | null = null;

    if (hasValidSchedule) {
        const startDate = project.start_date!;
        const endDate = project.end_date!;
        const totalDays = diffDays(startDate, endDate) + 1;

        if (today < startDate) {
            daysUntilStart = diffDays(today, startDate);
            scheduleProgress = 0;
        } else if (today > endDate) {
            daysOverdue = diffDays(endDate, today);
            scheduleProgress = 100;
        } else {
            daysRemaining = diffDays(today, endDate);
            const elapsedDays = diffDays(startDate, today) + 1;
            scheduleProgress = clamp(Math.round((elapsedDays / totalDays) * 100), 0, 100);
        }
    }

    const displayStatus = getDisplayStatus(
        project.status,
        project.start_date,
        project.end_date,
        today,
        scheduleProgress,
    );

    if (displayStatus === 'completed') {
        scheduleProgress = 100;
        daysRemaining = 0;
        daysUntilStart = null;
        daysOverdue = null;
    }

    return {
        displayStatus,
        scheduleProgress,
        todoProgress,
        isTrackedByDate: hasValidSchedule,
        isTodoLagging: project.todo_total > 0 && scheduleProgress !== null && todoProgress + 15 < scheduleProgress,
        statusLabel: DISPLAY_STATUS_CONFIG[displayStatus].label,
        scheduleLabel: getScheduleLabel(displayStatus, daysUntilStart, daysRemaining, daysOverdue),
        dateRangeLabel,
        daysUntilStart,
        daysRemaining,
        daysOverdue,
    };
}

const DISPLAY_STATUS_ORDER: Record<ProjectDisplayStatus, number> = {
    overdue: 0,
    near_due: 1,
    active: 2,
    not_started: 3,
    paused: 4,
    completed: 5,
    archived: 6,
};

export function compareProjectsByDisplayStatus(a: ProjectWithStats, b: ProjectWithStats): number {
    const aMetrics = getProjectProgressMetrics(a);
    const bMetrics = getProjectProgressMetrics(b);

    const statusGap = DISPLAY_STATUS_ORDER[aMetrics.displayStatus] - DISPLAY_STATUS_ORDER[bMetrics.displayStatus];
    if (statusGap !== 0) return statusGap;

    if (aMetrics.displayStatus === 'overdue') {
        return (bMetrics.daysOverdue ?? 0) - (aMetrics.daysOverdue ?? 0);
    }

    if (aMetrics.displayStatus === 'near_due' || aMetrics.displayStatus === 'active') {
        const aDue = a.end_date ?? '9999-12-31';
        const bDue = b.end_date ?? '9999-12-31';
        return aDue.localeCompare(bDue);
    }

    if (aMetrics.displayStatus === 'not_started') {
        const aStart = a.start_date ?? '9999-12-31';
        const bStart = b.start_date ?? '9999-12-31';
        return aStart.localeCompare(bStart);
    }

    return a.sort_order - b.sort_order;
}

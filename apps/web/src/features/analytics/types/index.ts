import type { ToneTokenClasses } from '@/design-system/tokens';

export type AnalyticsPeriod = 'week' | '30d';

export type InsightTone =
    | 'accent'
    | 'success'
    | 'warning'
    | 'danger'
    | 'blue'
    | 'green'
    | 'yellow'
    | 'purple'
    | 'orange'
    | 'cyan'
    | 'sky'
    | 'muted';

export type InsightStatus = 'stable' | 'progress' | 'attention' | 'offtrack' | 'untracked';

export type InsightActionPriority = 'critical' | 'high' | 'normal';

export type InsightAreaKey =
    | 'rhythm'
    | 'todos'
    | 'fitness'
    | 'english'
    | 'reading'
    | 'ai'
    | 'output'
    | 'family'
    | 'finance';

export type AreaConfig = {
    label: string;
    icon: string;
} & ToneTokenClasses;

export type AreaSnapshot = {
    key: InsightAreaKey;
    label: string;
    icon: string;
    tone: InsightTone;
    status: InsightStatus;
    statusLabel: string;
    score: number | null;
    progress: number | null;
    progressLabel: string;
    summary: string;
    achievement: string;
    achievementTone: InsightTone;
    riskCount: number;
    nextFocus: string;
};

export type GlobalPulseStat = {
    label: string;
    value: string | number;
    meta: string;
    tone: InsightTone;
};

export type AchievementItem = {
    id: string;
    areaKey: InsightAreaKey;
    areaLabel: string;
    icon: string;
    title: string;
    detail: string;
    dateLabel: string;
    tone: InsightTone;
};

export type RiskSeverity = 'high' | 'medium' | 'low';

export type RiskItem = {
    id: string;
    areaKey: InsightAreaKey;
    areaLabel: string;
    title: string;
    detail: string;
    severity: RiskSeverity;
    action: string;
};

export type UpcomingItem = {
    id: string;
    areaKey: InsightAreaKey;
    areaLabel: string;
    title: string;
    detail: string;
    dueLabel: string;
    daysLeft: number | null;
    tone: InsightTone;
};

export type TrendDatum = {
    label: string;
    value: number;
};

export type TrendMetric = {
    key: string;
    label: string;
    unit: string;
    tone: InsightTone;
    total: string;
    forecast: string;
    values: TrendDatum[];
};

export type InsightDecisionAction = {
    id: string;
    areaKey: InsightAreaKey;
    areaLabel: string;
    priority: InsightActionPriority;
    title: string;
    reason: string;
    actionLabel: string;
    href: string;
    metric?: string;
};

export type InsightsSnapshot = {
    period: AnalyticsPeriod;
    periodLabel: string;
    generatedAt: string;
    healthScore: number;
    focusArea: string;
    heroSummary: string;
    globalStats: GlobalPulseStat[];
    focusAction: InsightDecisionAction | null;
    actionQueue: InsightDecisionAction[];
    areaSnapshots: AreaSnapshot[];
    achievements: AchievementItem[];
    risks: RiskItem[];
    upcoming: UpcomingItem[];
    trends: TrendMetric[];
};

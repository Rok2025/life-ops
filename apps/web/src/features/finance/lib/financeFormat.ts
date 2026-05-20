export function toNumber(value: number | string | null | undefined): number {
    if (value == null) return 0;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(value: number, options?: { compact?: boolean }): string {
    if (options?.compact) {
        const abs = Math.abs(value);
        if (abs >= 10000) return `${(value / 10000).toFixed(abs >= 100000 ? 1 : 2)}W`;
    }

    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatPct(value: number): string {
    if (!Number.isFinite(value)) return '0%';
    return `${Math.round(value)}%`;
}

export function getTodayISO(): string {
    return formatDateISO(new Date());
}

export function getMonthStartISO(date = new Date()): string {
    return formatDateISO(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function getMonthEndISO(date = new Date()): string {
    return formatDateISO(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function addDaysISO(dateISO: string, days: number): string {
    const date = parseDateISO(dateISO);
    date.setDate(date.getDate() + days);
    return formatDateISO(date);
}

export function diffDays(fromISO: string, toISO: string): number {
    const from = parseDateISO(fromISO).getTime();
    const to = parseDateISO(toISO).getTime();
    return Math.round((to - from) / 86400000);
}

export function formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function parseDateISO(dateISO: string): Date {
    const [year, month, day] = dateISO.split('-').map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        dining: '餐饮',
        transport: '交通',
        family: '家庭',
        childcare: '育儿',
        housing: '住房',
        medical: '医疗',
        shopping: '购物',
        social: '人情',
        subscription: '订阅',
        debt_payment: '债务还款',
        daily_living: '日常预算',
        salary: '工资收入',
        other: '其他',
    };
    return labels[category] ?? category;
}

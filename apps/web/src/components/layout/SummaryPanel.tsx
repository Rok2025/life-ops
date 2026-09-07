'use client';

import { formatHorizons, getMonthProgress } from '@/lib/horizons';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Hourglass } from 'lucide-react';
import { Card, SectionHeader } from '@/components/ui';
import { getAppShellPanelClassName } from './appShellLayout';

type SummaryPanelProps = {
    visible?: boolean;
};

export default function SummaryPanel({ visible = true }: SummaryPanelProps) {
    const horizons = formatHorizons();
    const monthProgress = getMonthProgress();
    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    const { user, loading } = useAuth();
    const pathname = usePathname();
    if (!visible || (!user && !loading && pathname === '/login')) return null;

    return (
        <aside className={getAppShellPanelClassName('right')}>
            {/* Horizons */}
            <section className="mb-5">
                <SectionHeader title="时间节奏" className="mb-3" />
                <div className="space-y-3">
                    {/* Week: Indicators */}
                    <Card className="p-3">
                        <div className="mb-3 flex items-end justify-between">
                            <div className="text-h3 font-bold text-text-primary">{horizons.week}</div>
                            <div className="mb-1 text-caption text-text-secondary">{horizons.weekRemaining}</div>
                        </div>
                        <div className="flex justify-between px-1">
                            {weekDays.map((day, i) => {
                                const isPast = i + 1 < horizons.dayOfWeek;
                                const isToday = i + 1 === horizons.dayOfWeek;
                                return (
                                    <div key={day} className="flex flex-col items-center gap-1.5">
                                        <span className={`text-caption ${isToday ? 'text-accent font-bold' : 'text-text-tertiary'}`}>
                                            {day}
                                        </span>
                                        <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-accent ring-4 ring-accent/20' :
                                            isPast ? 'bg-text-tertiary/40' : 'bg-bg-tertiary'
                                            }`} />
                                        <span className={`text-caption ${isToday ? 'text-accent font-bold' : 'text-text-tertiary/60'}`}>
                                            {horizons.weekDates[i]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Month: Circular Ring */}
                    <Card className="flex items-center gap-3 p-3">
                        <div className="relative h-14 w-14 shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="28"
                                    cy="28"
                                    r="24"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-bg-tertiary"
                                />
                                <circle
                                    cx="28"
                                    cy="28"
                                    r="24"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeDasharray={2 * Math.PI * 24}
                                    strokeDashoffset={2 * Math.PI * 24 * (1 - monthProgress.progress / 100)}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    className="text-success transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-caption font-bold text-text-primary">
                                {monthProgress.progress}%
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-body-sm font-medium text-text-primary">本月剩余</span>
                            <span className="text-caption text-text-secondary mt-1">{horizons.monthRemaining}</span>
                        </div>
                    </Card>

                    {/* Year: Line */}
                    <Card className="p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-body-sm font-medium text-text-primary text-opacity-80">年度剩余</span>
                            <span className="text-body-sm font-bold text-text-primary">{horizons.yearProgress}%</span>
                        </div>
                        <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent rounded-full transition-all duration-1000"
                                style={{ width: `${horizons.yearProgress}%` }}
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 opacity-60">
                                <Hourglass size={12} className="text-accent animate-hourglass" />
                                <span className="text-caption tracking-tight text-text-tertiary">年度剩余比例</span>
                            </div>
                            <div className="text-caption tracking-tight text-text-tertiary">
                                {horizons.yearRemaining}
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

        </aside>
    );
}

'use client';

import { formatHorizons, getMonthProgress } from '@/lib/horizons';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function SummaryPanel() {
    const horizons = formatHorizons();
    const monthProgress = getMonthProgress();
    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    const { user, loading } = useAuth();
    const pathname = usePathname();

    if (!user && !loading && pathname === '/login') return null;

    return (
        <aside className="fixed right-0 top-0 h-screen w-[var(--summary-width)] bg-bg-secondary border-l border-border p-6 overflow-y-auto">
            {/* Horizons */}
            <section className="mb-8">
                <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-4">
                    时间节奏
                </h2>
                <div className="space-y-4">
                    {/* Week: Indicators */}
                    <div className="card p-4">
                        <div className="flex justify-between items-end mb-4">
                            <div className="text-2xl font-bold text-text-primary">{horizons.week}</div>
                            <div className="text-xs text-text-secondary mb-1">{horizons.weekRemaining}</div>
                        </div>
                        <div className="flex justify-between px-1">
                            {weekDays.map((day, i) => {
                                const isPast = i + 1 < horizons.dayOfWeek;
                                const isToday = i + 1 === horizons.dayOfWeek;
                                return (
                                    <div key={day} className="flex flex-col items-center gap-2">
                                        <span className={`text-[10px] ${isToday ? 'text-accent font-bold' : 'text-text-tertiary'}`}>
                                            {day}
                                        </span>
                                        <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-accent ring-4 ring-accent/20' :
                                            isPast ? 'bg-text-tertiary/40' : 'bg-bg-tertiary'
                                            }`} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Month: Circular Ring */}
                    <div className="card p-5 flex items-center gap-6">
                        <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="5"
                                    fill="transparent"
                                    className="text-bg-tertiary"
                                />
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="5"
                                    strokeDasharray={2 * Math.PI * 28}
                                    strokeDashoffset={2 * Math.PI * 28 * (1 - monthProgress.progress / 100)}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    className="text-success transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text-primary">
                                {monthProgress.progress}%
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-text-primary">本月进度</span>
                            <span className="text-xs text-text-secondary mt-1">{horizons.monthRemaining}</span>
                        </div>
                    </div>

                    {/* Year: Line */}
                    <div className="card p-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-text-primary text-opacity-80">年度视野</span>
                            <span className="text-sm font-bold text-text-primary">{horizons.yearProgress}%</span>
                        </div>
                        <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent rounded-full transition-all duration-1000"
                                style={{ width: `${horizons.yearProgress}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-text-tertiary mt-2 uppercase tracking-tight">
                            Remaining {horizons.yearRemaining}
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section>
                <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-4">
                    快捷操作
                </h2>
                <div className="space-y-2">
                    <a
                        href="/fitness/workout/new"
                        className="btn-primary block text-center"
                    >
                        记录一次训练
                    </a>
                </div>
            </section>
        </aside>
    );
}

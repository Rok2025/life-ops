'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getLocalDateStr } from '@/lib/utils/date';
import { fitnessApi } from '../api/fitnessApi';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

function getFirstDayOfMonth(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function toDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface FitnessCalendarProps {
    onSelectDate?: (date: string) => void;
}

export function FitnessCalendar({ onSelectDate }: FitnessCalendarProps) {
    const today = getLocalDateStr();

    const [viewYear, setViewYear] = useState(() => {
        const [y] = today.split('-').map(Number);
        return y;
    });
    const [viewMonth, setViewMonth] = useState(() => {
        const [, m] = today.split('-').map(Number);
        return m - 1;
    });

    const startDate = toDateStr(viewYear, viewMonth, 1);
    const endDate = toDateStr(viewYear, viewMonth, getDaysInMonth(viewYear, viewMonth));

    const { data: workoutDates = [] } = useQuery({
        queryKey: ['fitness-calendar-dates', startDate, endDate],
        queryFn: () => fitnessApi.getWorkoutDatesInRange(startDate, endDate),
    });

    const workoutDateSet = new Set(workoutDates);

    const goToPrevMonth = useCallback(() => {
        setViewMonth(prev => {
            if (prev === 0) {
                setViewYear(y => y - 1);
                return 11;
            }
            return prev - 1;
        });
    }, []);

    const goToNextMonth = useCallback(() => {
        const [todayYear, todayMonth] = today.split('-').map(Number);
        if (viewYear > todayYear || (viewYear === todayYear && viewMonth >= todayMonth - 1)) {
            return;
        }
        setViewMonth(prev => {
            if (prev === 11) {
                setViewYear(y => y + 1);
                return 0;
            }
            return prev + 1;
        });
    }, [viewYear, viewMonth, today]);

    const isNextDisabled = (() => {
        const [todayYear, todayMonth] = today.split('-').map(Number);
        return viewYear > todayYear || (viewYear === todayYear && viewMonth >= todayMonth - 1);
    })();

    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const totalDays = getDaysInMonth(viewYear, viewMonth);

    // 统计本月训练天数
    const monthWorkoutCount = workoutDates.length;

    return (
        <section className="card p-4">
            {/* 月份导航 */}
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={goToPrevMonth}
                    className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                >
                    <ChevronLeft size={16} className="text-text-secondary" />
                </button>
                <div className="text-center">
                    <span className="text-sm font-semibold text-text-primary">
                        {viewYear}年{viewMonth + 1}月
                    </span>
                    {monthWorkoutCount > 0 && (
                        <span className="ml-2 text-xs text-success">
                            {monthWorkoutCount} 天训练
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={goToNextMonth}
                    disabled={isNextDisabled}
                    className="p-1 hover:bg-bg-tertiary rounded transition-colors disabled:opacity-30"
                >
                    <ChevronRight size={16} className="text-text-secondary" />
                </button>
            </div>

            {/* 星期表头 */}
            <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map(w => (
                    <div key={w} className="text-center text-xs text-text-secondary font-medium py-1">
                        {w}
                    </div>
                ))}
            </div>

            {/* 日期网格 */}
            <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-9" />
                ))}

                {Array.from({ length: totalDays }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = toDateStr(viewYear, viewMonth, day);
                    const isToday = dateStr === today;
                    const isFuture = dateStr > today;
                    const hasWorkout = workoutDateSet.has(dateStr);

                    return (
                        <button
                            key={day}
                            type="button"
                            disabled={isFuture || !hasWorkout}
                            onClick={() => hasWorkout && onSelectDate?.(dateStr)}
                            className={`
                                relative h-9 w-full flex flex-col items-center justify-center
                                rounded-lg text-sm transition-colors
                                ${isFuture
                                    ? 'text-text-secondary/30 cursor-default'
                                    : hasWorkout
                                        ? 'cursor-pointer hover:bg-success/10'
                                        : 'cursor-default'
                                }
                                ${hasWorkout
                                    ? 'text-success font-semibold'
                                    : ''
                                }
                                ${isToday && !hasWorkout
                                    ? 'font-bold text-accent ring-1 ring-accent/30'
                                    : ''
                                }
                                ${isToday && hasWorkout
                                    ? 'ring-1 ring-success/30'
                                    : ''
                                }
                                ${!hasWorkout && !isToday && !isFuture
                                    ? 'text-text-primary'
                                    : ''
                                }
                            `}
                        >
                            <span className="leading-none">{day}</span>
                            {hasWorkout && (
                                <Dumbbell size={8} className="absolute bottom-0.5 text-success" />
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

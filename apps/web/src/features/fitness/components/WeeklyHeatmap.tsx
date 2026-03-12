import { Dumbbell } from 'lucide-react';
import { getLocalDateStr, getWeekDateRange, offsetDate } from '@/lib/utils/date';
import type { WorkoutsByDate } from '../types';

const DAYS = ['一', '二', '三', '四', '五', '六', '日'];

interface WeeklyHeatmapProps {
    workoutsByDate: WorkoutsByDate[];
}

export function WeeklyHeatmap({ workoutsByDate }: WeeklyHeatmapProps) {
    const today = getLocalDateStr();
    const { start } = getWeekDateRange();

    // 构建本周7天的日期
    const weekDates = Array.from({ length: 7 }, (_, i) => offsetDate(start, i));

    // 已有训练的日期集合
    const trainedDates = new Set(workoutsByDate.map(g => g.date));

    return (
        <section className="card p-3">
            <h3 className="text-sm font-medium text-text-secondary mb-3">本周训练日</h3>
            <div className="grid grid-cols-7 gap-1.5">
                {weekDates.map((dateStr, i) => {
                    const isTrained = trainedDates.has(dateStr);
                    const isToday = dateStr === today;
                    const isFuture = dateStr > today;

                    return (
                        <div key={dateStr} className="flex flex-col items-center gap-1">
                            <span className="text-xs text-text-secondary">{DAYS[i]}</span>
                            <div
                                className={`
                                    w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                                    ${isTrained
                                        ? 'bg-success/20'
                                        : isFuture
                                            ? 'bg-bg-tertiary/50'
                                            : 'bg-bg-tertiary'
                                    }
                                    ${isToday ? 'ring-1.5 ring-accent/50' : ''}
                                `}
                            >
                                {isTrained ? (
                                    <Dumbbell size={14} className="text-success" />
                                ) : isFuture ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-border/50" />
                                ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-text-secondary/30" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

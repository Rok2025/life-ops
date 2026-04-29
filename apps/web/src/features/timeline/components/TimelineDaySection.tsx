import { forwardRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatDisplayDate, formatFullDate } from '@/lib/utils/date';
import type { TimelineDayGroup } from '../types';
import { TimelineItem } from './TimelineItem';

interface TimelineDaySectionProps {
    group: TimelineDayGroup;
}

export const TimelineDaySection = forwardRef<HTMLElement, TimelineDaySectionProps>(
    function TimelineDaySection({ group }, ref) {
        const displayDate = formatDisplayDate(group.date);
        const relativeLabel = displayDate === '今天' || displayDate === '昨天' ? displayDate : null;
        const title = formatFullDate(group.date);

        return (
            <section ref={ref} className="scroll-mt-4">
                <div className="relative py-1.5 md:py-2">
                    <div className="relative z-10 mb-2 grid grid-cols-[2rem_minmax(0,1fr)] gap-2 md:block">
                        <div className="flex justify-center md:hidden">
                            <div className={[
                                'flex h-8 w-8 items-center justify-center rounded-full border bg-bg-primary shadow-sm',
                                group.isToday
                                    ? 'border-accent/36 text-accent ring-4 ring-accent/10'
                                    : 'border-glass-border text-text-secondary',
                            ].join(' ')}>
                                <CalendarDays size={15} />
                            </div>
                        </div>

                        <div className="min-w-0 md:flex md:justify-center">
                            <div className={[
                                'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 shadow-sm backdrop-blur-xl',
                                group.isToday
                                    ? 'border-accent/28 bg-selection-bg text-accent'
                                    : 'border-glass-border bg-card-bg text-text-secondary',
                            ].join(' ')}>
                                <CalendarDays size={13} className="hidden shrink-0 md:block" />
                                <span className="truncate text-body-sm font-semibold text-text-primary">{title}</span>
                                {relativeLabel ? <span className="shrink-0 text-caption">{relativeLabel}</span> : null}
                                <span className="glass-mini-chip shrink-0 text-caption">{group.items.length} 条</span>
                            </div>
                        </div>
                    </div>

                    {group.items.length === 0 ? (
                        <div className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-2 py-1 md:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] md:gap-3">
                            <div className="relative flex justify-center pt-2.5 md:col-start-2">
                                <span className="absolute right-0 top-4 hidden h-px w-1/2 bg-glass-border md:block" />
                                <span className="relative z-10 h-2.5 w-2.5 rounded-full border border-glass-border bg-bg-primary" />
                            </div>

                            <div className="rounded-inner-card border border-dashed border-glass-border bg-panel-bg/60 px-2.5 py-2 text-caption text-text-tertiary md:col-start-3">
                                这一天还没有记录。
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {group.items.map((entry, index) => {
                                const side = index % 2 === 0 ? 'left' : 'right';

                                return (
                                    <div
                                        key={`${entry.sourceType}-${entry.sourceId}`}
                                        className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-2 md:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] md:gap-3"
                                    >
                                        <div className="relative flex justify-center pt-4 md:col-start-2">
                                            <span
                                                aria-hidden="true"
                                                className={[
                                                    'absolute top-[1.125rem] hidden h-px w-1/2 bg-glass-border md:block',
                                                    side === 'left' ? 'left-0' : 'right-0',
                                                ].join(' ')}
                                            />
                                            <span className={[
                                                'relative z-10 h-2.5 w-2.5 rounded-full border bg-bg-primary shadow-sm',
                                                group.isToday
                                                    ? 'border-accent bg-accent ring-3 ring-accent/12'
                                                    : 'border-glass-border',
                                            ].join(' ')} />
                                        </div>

                                        <div className={[
                                            'min-w-0',
                                            side === 'left'
                                                ? 'md:col-start-1 md:row-start-1'
                                                : 'md:col-start-3 md:row-start-1',
                                        ].join(' ')}>
                                            <TimelineItem entry={entry} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        );
    },
);

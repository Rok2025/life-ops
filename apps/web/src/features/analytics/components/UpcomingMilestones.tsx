import { CalendarClock } from 'lucide-react';
import { SectionHeader, Card } from '@/components/ui';
import type { UpcomingItem, InsightTone } from '../types';

function getToneClass(tone: InsightTone) {
    if (tone === 'success') return 'text-success';
    if (tone === 'warning') return 'text-warning';
    if (tone === 'danger') return 'text-danger';
    if (tone === 'blue') return 'text-tone-blue';
    if (tone === 'green') return 'text-tone-green';
    if (tone === 'yellow') return 'text-tone-yellow';
    if (tone === 'purple') return 'text-tone-purple';
    if (tone === 'orange') return 'text-tone-orange';
    if (tone === 'sky') return 'text-tone-sky';
    return tone === 'muted' ? 'text-text-tertiary' : 'text-accent';
}

export default function UpcomingMilestones({
    items,
}: {
    items: UpcomingItem[];
}) {
    return (
        <section className="space-y-3">
            <SectionHeader
                title="即将到来的节点"
                description="未来 7 到 14 天里最值得提前注意的项目和提醒。"
            />

            {items.length === 0 ? (
                <Card className="p-card text-body-sm text-text-secondary">
                    近期没有明显节点压力，这一块暂时比较平稳。
                </Card>
            ) : (
                <Card className="p-card">
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-start gap-3 rounded-inner-card border border-glass-border/80 bg-panel-bg/80 px-3.5 py-3"
                            >
                                <div className="glass-icon-badge shrink-0">
                                    <CalendarClock size={16} className={getToneClass(item.tone)} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-body-sm font-medium text-text-primary">{item.title}</span>
                                        <span className="text-caption text-text-tertiary">{item.areaLabel}</span>
                                    </div>
                                    <p className="mt-1 text-body-sm text-text-secondary">{item.detail}</p>
                                </div>

                                <div className={`shrink-0 text-right text-caption font-medium ${getToneClass(item.tone)}`}>
                                    {item.dueLabel}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </section>
    );
}

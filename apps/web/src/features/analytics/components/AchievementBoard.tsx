import { SectionHeader, Card } from '@/components/ui';
import type { AchievementItem, InsightTone } from '../types';

function getToneChipClass(tone: InsightTone) {
    if (tone === 'success') return 'bg-success/10 text-success';
    if (tone === 'warning') return 'bg-warning/10 text-warning';
    if (tone === 'danger') return 'bg-danger/10 text-danger';
    if (tone === 'blue') return 'bg-tone-blue/10 text-tone-blue';
    if (tone === 'green') return 'bg-tone-green/10 text-tone-green';
    if (tone === 'yellow') return 'bg-tone-yellow/10 text-tone-yellow';
    if (tone === 'purple') return 'bg-tone-purple/10 text-tone-purple';
    if (tone === 'orange') return 'bg-tone-orange/10 text-tone-orange';
    if (tone === 'sky') return 'bg-tone-sky/10 text-tone-sky';
    return tone === 'muted' ? 'bg-panel-bg text-text-tertiary' : 'bg-accent/10 text-accent';
}

export default function AchievementBoard({
    items,
}: {
    items: AchievementItem[];
}) {
    return (
        <section className="space-y-3">
            <SectionHeader
                title="成果看板"
                description="这里专门看已经做成了什么，避免整个分析页只剩下风险提醒。"
            />

            {items.length === 0 ? (
                <Card className="p-card text-body-sm text-text-secondary">
                    当前周期还没有明显的成果沉淀，等第一条发布、第一条成果记录或一次完整推进出现后，这里就会亮起来。
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {items.map((item) => (
                        <Card key={item.id} variant="subtle" className="p-card">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-h3">{item.icon}</span>
                                        <span className="text-body font-semibold text-text-primary">{item.title}</span>
                                    </div>
                                    <p className="mt-2 text-body-sm text-text-secondary">{item.detail}</p>
                                </div>

                                <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-caption font-medium ${getToneChipClass(item.tone)}`}>
                                    {item.dateLabel}
                                </span>
                            </div>

                            <div className="mt-3 text-caption text-text-tertiary">{item.areaLabel}</div>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    );
}

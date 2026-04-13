import { SectionHeader, Card } from '@/components/ui';
import type { TrendMetric, InsightTone } from '../types';

function getBarClass(tone: InsightTone) {
    if (tone === 'success') return 'bg-success/75';
    if (tone === 'warning') return 'bg-warning/75';
    if (tone === 'danger') return 'bg-danger/75';
    if (tone === 'blue') return 'bg-tone-blue/75';
    if (tone === 'green') return 'bg-tone-green/75';
    if (tone === 'yellow') return 'bg-tone-yellow/75';
    if (tone === 'purple') return 'bg-tone-purple/75';
    if (tone === 'orange') return 'bg-tone-orange/75';
    if (tone === 'sky') return 'bg-tone-sky/75';
    return tone === 'muted' ? 'bg-text-tertiary/50' : 'bg-accent/75';
}

function getTextClass(tone: InsightTone) {
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

export default function TrendForecastPanel({
    metrics,
}: {
    metrics: TrendMetric[];
}) {
    return (
        <section className="space-y-3">
            <SectionHeader
                title="趋势与预测"
                description="先看最近 7 天走势，再用当前节奏推一眼本周期大概会落在哪里。"
            />

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                {metrics.map((metric) => {
                    const maxValue = Math.max(...metric.values.map((item) => item.value), 1);

                    return (
                        <Card key={metric.key} className="p-card">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-body font-semibold text-text-primary">{metric.label}</div>
                                    <div className="mt-1 text-caption text-text-secondary">{metric.total}</div>
                                </div>
                                <div className={`text-body-sm font-medium ${getTextClass(metric.tone)}`}>{metric.unit}</div>
                            </div>

                            <div className="mt-4 grid grid-cols-7 items-end gap-2">
                                {metric.values.map((item) => (
                                    <div key={`${metric.key}-${item.label}`} className="flex flex-col items-center gap-2">
                                        <div className="flex h-28 w-full items-end">
                                            <div
                                                className={`w-full rounded-t-full transition-all duration-normal ease-standard ${getBarClass(metric.tone)}`}
                                                style={{ height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 10 : 4)}%` }}
                                                title={`${item.label} · ${item.value}${metric.unit}`}
                                            />
                                        </div>
                                        <div className="text-caption text-text-tertiary">{item.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 rounded-inner-card border border-glass-border/80 bg-panel-bg/78 px-3 py-2.5 text-body-sm text-text-secondary">
                                {metric.forecast}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}

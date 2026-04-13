import { SectionHeader, Card } from '@/components/ui';
import type { GlobalPulseStat } from '../types';

export default function GlobalPulse({
    stats,
    summary,
    generatedAt,
}: {
    stats: GlobalPulseStat[];
    summary: string;
    generatedAt: string;
}) {
    return (
        <section className="space-y-3">
            <SectionHeader
                title="全局脉搏"
                description={summary}
                right={<span className="text-caption text-text-tertiary">更新于 {generatedAt}</span>}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="p-card">
                        <div className="text-caption text-text-secondary">{stat.label}</div>
                        <div className="mt-2 flex items-end justify-between gap-3">
                            <div className="text-h2 font-semibold text-text-primary">{stat.value}</div>
                            <div className={`text-body-sm ${stat.tone === 'danger'
                                ? 'text-danger'
                                : stat.tone === 'warning'
                                    ? 'text-warning'
                                    : stat.tone === 'success'
                                        ? 'text-success'
                                        : stat.tone === 'blue'
                                            ? 'text-tone-blue'
                                            : 'text-accent'
                                }`}
                            >
                                {stat.meta}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </section>
    );
}

import { AlertTriangle } from 'lucide-react';
import { SectionHeader, Card } from '@/components/ui';
import type { RiskItem, RiskSeverity } from '../types';

function getSeverityClass(severity: RiskSeverity) {
    if (severity === 'high') return 'border-danger/30 bg-danger/10 text-danger';
    if (severity === 'medium') return 'border-warning/30 bg-warning/10 text-warning';
    return 'border-tone-blue/30 bg-tone-blue/10 text-tone-blue';
}

export default function RiskPanel({
    items,
}: {
    items: RiskItem[];
}) {
    return (
        <section className="space-y-3">
            <SectionHeader
                title="偏离与风险"
                description="只列真正值得打断你注意力的项目，数量保持在少量但足够明确。"
            />

            {items.length === 0 ? (
                <Card className="p-card text-body-sm text-text-secondary">
                    当前没有明显风险，说明主要领域都还在轨道上。
                </Card>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <Card key={item.id} variant="subtle" className="p-card">
                            <div className="flex items-start gap-3">
                                <div className="glass-icon-badge mt-0.5 shrink-0">
                                    <AlertTriangle size={16} className={item.severity === 'high' ? 'text-danger' : item.severity === 'medium' ? 'text-warning' : 'text-tone-blue'} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-body font-semibold text-text-primary">{item.title}</div>
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-caption font-medium ${getSeverityClass(item.severity)}`}>
                                            {item.areaLabel}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-body-sm text-text-secondary">{item.detail}</p>
                                    <p className="mt-2 text-caption text-text-tertiary">建议动作：{item.action}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    );
}

import Link from 'next/link';
import { ArrowRight, CheckCircle2, CircleDot, Siren } from 'lucide-react';
import { Card, SectionHeader, getButtonClassName } from '@/components/ui';
import type { InsightActionPriority, InsightDecisionAction } from '../types';

function getPriorityClass(priority: InsightActionPriority) {
    if (priority === 'critical') return 'border-danger/30 bg-danger/10 text-danger';
    if (priority === 'high') return 'border-warning/30 bg-warning/10 text-warning';
    return 'border-tone-blue/30 bg-tone-blue/10 text-tone-blue';
}

function getPriorityLabel(priority: InsightActionPriority) {
    if (priority === 'critical') return '马上处理';
    if (priority === 'high') return '优先推进';
    return '顺手处理';
}

function getPriorityIcon(priority: InsightActionPriority) {
    if (priority === 'critical') return <Siren size={15} className="text-danger" />;
    if (priority === 'high') return <CircleDot size={15} className="text-warning" />;
    return <CheckCircle2 size={15} className="text-tone-blue" />;
}

export default function ActionQueue({
    actions,
}: {
    actions: InsightDecisionAction[];
}) {
    if (actions.length === 0) return null;

    return (
        <section className="space-y-3">
            <SectionHeader
                title="下一步行动"
                description="只保留能直接跳去处理的建议，让洞察页从结论进入动作。"
            />

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                {actions.map((action) => (
                    <Card key={action.id} variant="subtle" className="p-card">
                        <div className="flex h-full flex-col gap-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="glass-icon-badge mt-0.5 shrink-0">
                                    {getPriorityIcon(action.priority)}
                                </div>
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-caption font-medium ${getPriorityClass(action.priority)}`}>
                                    {getPriorityLabel(action.priority)}
                                </span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-body font-semibold text-text-primary">{action.title}</h3>
                                    <span className="text-caption text-text-tertiary">{action.areaLabel}</span>
                                </div>
                                <p className="mt-2 text-body-sm text-text-secondary">{action.reason}</p>
                                {action.metric ? (
                                    <div className="mt-3 text-caption font-medium text-text-primary">{action.metric}</div>
                                ) : null}
                            </div>

                            <Link
                                href={action.href}
                                className={getButtonClassName({
                                    variant: action.priority === 'critical' ? 'danger' : 'secondary',
                                    size: 'sm',
                                    className: 'w-full justify-between',
                                })}
                            >
                                {action.actionLabel}
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </section>
    );
}

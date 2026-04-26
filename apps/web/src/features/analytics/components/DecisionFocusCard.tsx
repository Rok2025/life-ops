import Link from 'next/link';
import { ArrowRight, CheckCircle2, Target } from 'lucide-react';
import { Card, getButtonClassName } from '@/components/ui';
import type { InsightActionPriority, InsightDecisionAction } from '../types';

function getPriorityLabel(priority: InsightActionPriority) {
    if (priority === 'critical') return '优先处理';
    if (priority === 'high') return '今天推进';
    return '顺手补上';
}

function getPriorityClass(priority: InsightActionPriority) {
    if (priority === 'critical') return 'border-danger/30 bg-danger/10 text-danger';
    if (priority === 'high') return 'border-warning/30 bg-warning/10 text-warning';
    return 'border-accent/25 bg-accent/10 text-accent';
}

export default function DecisionFocusCard({
    action,
}: {
    action: InsightDecisionAction | null;
}) {
    if (!action) {
        return (
            <section>
                <Card className="p-card-lg">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="glass-icon-badge mt-0.5 shrink-0">
                                <CheckCircle2 size={18} className="text-success" />
                            </div>
                            <div>
                                <div className="text-caption font-medium text-success">本周决策焦点</div>
                                <h2 className="mt-1 text-h2 font-semibold text-text-primary">暂时没有需要立刻打断的风险</h2>
                                <p className="mt-2 max-w-2xl text-body-sm text-text-secondary">
                                    当前主要领域都比较平稳，可以继续按首页和各模块里的日常节奏推进。
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </section>
        );
    }

    return (
        <section>
            <Card className="p-card-lg">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-caption font-medium text-accent">
                                <Target size={13} />
                                本周决策焦点
                            </span>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-caption font-medium ${getPriorityClass(action.priority)}`}>
                                {getPriorityLabel(action.priority)}
                            </span>
                            <span className="text-caption text-text-tertiary">{action.areaLabel}</span>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div className="min-w-0">
                                <h2 className="text-h2 font-semibold text-text-primary">{action.title}</h2>
                                <p className="mt-2 max-w-3xl text-body text-text-secondary">{action.reason}</p>
                            </div>

                            {action.metric ? (
                                <div className="shrink-0 rounded-inner-card border border-glass-border bg-panel-bg px-3 py-2 text-right">
                                    <div className="text-caption text-text-tertiary">关键指标</div>
                                    <div className="mt-1 text-h3 font-semibold text-text-primary">{action.metric}</div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <Link
                        href={action.href}
                        className={getButtonClassName({
                            variant: action.priority === 'critical' ? 'danger' : 'tinted',
                            size: 'md',
                            className: 'w-full whitespace-nowrap xl:w-auto',
                        })}
                    >
                        {action.actionLabel}
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </Card>
        </section>
    );
}

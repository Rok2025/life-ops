import { SectionHeader, Card } from '@/components/ui';
import type { AreaSnapshot, InsightStatus, InsightTone } from '../types';

function getStatusClass(status: InsightStatus) {
    if (status === 'stable') return 'border-success/30 bg-success/10 text-success';
    if (status === 'progress') return 'border-accent/30 bg-accent/10 text-accent';
    if (status === 'attention') return 'border-warning/30 bg-warning/10 text-warning';
    if (status === 'offtrack') return 'border-danger/30 bg-danger/10 text-danger';
    return 'border-glass-border bg-panel-bg text-text-tertiary';
}

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
    if (tone === 'cyan') return 'text-tone-cyan';
    return tone === 'muted' ? 'text-text-tertiary' : 'text-accent';
}

function getProgressBarClass(status: InsightStatus) {
    if (status === 'stable') return 'bg-success/75';
    if (status === 'progress') return 'bg-accent/75';
    if (status === 'attention') return 'bg-warning/75';
    if (status === 'offtrack') return 'bg-danger/75';
    return 'bg-text-tertiary/45';
}

function getStatusRank(status: InsightStatus) {
    if (status === 'offtrack') return 0;
    if (status === 'attention') return 1;
    if (status === 'progress') return 2;
    if (status === 'stable') return 3;
    return 4;
}

export default function AreaHealthGrid({
    areas,
    compact = false,
}: {
    areas: AreaSnapshot[];
    compact?: boolean;
}) {
    const displayAreas = compact
        ? [...areas]
            .sort((left, right) => {
                const statusDelta = getStatusRank(left.status) - getStatusRank(right.status);
                if (statusDelta !== 0) return statusDelta;
                return (left.score ?? 101) - (right.score ?? 101);
            })
            .slice(0, 6)
        : areas;
    const hiddenCount = areas.length - displayAreas.length;

    return (
        <section className="space-y-3">
            <SectionHeader
                title="领域健康矩阵"
                description={compact
                    ? '优先展示偏离、需关注和正在推进的领域，稳定或未接入的内容先退到次级。'
                    : '把所有模块拉到同一张图里看，先判断哪里稳定，哪里需要你补一把。'}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {displayAreas.map((area) => (
                    <Card key={area.key} className="p-card">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-h3">{area.icon}</span>
                                    <div>
                                        <div className="text-body font-semibold text-text-primary">{area.label}</div>
                                        <div className="text-caption text-text-secondary">{area.summary}</div>
                                    </div>
                                </div>
                            </div>

                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-caption font-medium ${getStatusClass(area.status)}`}>
                                {area.statusLabel}
                            </span>
                        </div>

                        <div className="mt-4">
                            <div className="flex items-center justify-between text-caption text-text-secondary">
                                <span>本周期进度</span>
                                <span className="text-text-primary">{area.progressLabel}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-tertiary/90">
                                <div
                                    className={`h-full rounded-full transition-all duration-normal ease-standard ${getProgressBarClass(area.status)}`}
                                    style={{ width: `${area.progress ?? 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                            <div className="rounded-inner-card border border-glass-border/80 bg-panel-bg/78 px-3 py-2.5">
                                <div className="text-caption text-text-tertiary">最近成果</div>
                                <div className={`mt-1 text-body-sm font-medium ${getToneClass(area.achievementTone)}`}>
                                    {area.achievement}
                                </div>
                            </div>

                            <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-2 text-body-sm">
                                <span className="text-text-tertiary">风险</span>
                                <span className={area.riskCount > 0 ? 'text-warning' : 'text-text-secondary'}>
                                    {area.riskCount > 0 ? `${area.riskCount} 项需要看一下` : '当前没有明显偏离'}
                                </span>

                                <span className="text-text-tertiary">下一步</span>
                                <span className="text-text-primary">{area.nextFocus}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {hiddenCount > 0 ? (
                <div className="text-caption text-text-tertiary">
                    其余 {hiddenCount} 个领域当前没有排在主要关注位。
                </div>
            ) : null}
        </section>
    );
}

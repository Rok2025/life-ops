'use client';

import { useMemo } from 'react';
import { Clock, BookHeart, Trophy, Ruler, Syringe, Stethoscope } from 'lucide-react';
import { useDiaryEntries } from '../hooks/useDiary';
import { useMilestones } from '../hooks/useMilestones';
import { useGrowthRecords } from '../hooks/useGrowthRecords';
import { useVaccinations } from '../hooks/useHealth';
import { useMedicalRecords } from '../hooks/useHealth';
import { MOOD_CONFIG, MILESTONE_CATEGORY_CONFIG, MEDICAL_RECORD_TYPE_CONFIG } from '../types';
import { Card, PageHero } from '@/components/ui';

type TimelineEvent = {
    id: string;
    date: string;
    type: 'diary' | 'milestone' | 'growth' | 'vaccination' | 'medical';
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    meta?: string;
};

export function YouyouTimeline() {
    const { data: diaryEntries = [] } = useDiaryEntries(100);
    const { data: milestones = [] } = useMilestones();
    const { data: growthRecords = [] } = useGrowthRecords(100);
    const { data: vaccinations = [] } = useVaccinations();
    const { data: medicalRecords = [] } = useMedicalRecords();

    const events = useMemo<TimelineEvent[]>(() => {
        const all: TimelineEvent[] = [];

        // 日记
        for (const d of diaryEntries) {
            const moodEmoji = d.mood ? MOOD_CONFIG[d.mood].emoji : '📝';
            all.push({
                id: `diary-${d.id}`,
                date: d.date,
                type: 'diary',
                icon: <BookHeart size={14} className="text-accent" />,
                title: d.highlight || d.content?.slice(0, 40) || '成长日记',
                subtitle: d.funny_quote ? `💬 "${d.funny_quote}"` : undefined,
                meta: moodEmoji,
            });
        }

        // 已达成里程碑
        for (const m of milestones.filter(m => m.achieved_at)) {
            const cfg = MILESTONE_CATEGORY_CONFIG[m.category];
            all.push({
                id: `milestone-${m.id}`,
                date: m.achieved_at!,
                type: 'milestone',
                icon: <Trophy size={14} className="text-success" />,
                title: `🎉 ${m.title}`,
                subtitle: `${cfg.emoji} ${cfg.label}`,
                meta: '里程碑',
            });
        }

        // 发育记录
        for (const g of growthRecords) {
            const parts: string[] = [];
            if (g.height_cm != null) parts.push(`身高 ${g.height_cm}cm`);
            if (g.weight_kg != null) parts.push(`体重 ${g.weight_kg}kg`);
            if (g.head_cm != null) parts.push(`头围 ${g.head_cm}cm`);
            all.push({
                id: `growth-${g.id}`,
                date: g.date,
                type: 'growth',
                icon: <Ruler size={14} className="text-tone-blue" />,
                title: parts.join(' · ') || '发育测量',
                subtitle: g.notes || undefined,
                meta: '📏',
            });
        }

        // 已接种疫苗
        for (const v of vaccinations.filter(v => v.actual_date)) {
            all.push({
                id: `vac-${v.id}`,
                date: v.actual_date!,
                type: 'vaccination',
                icon: <Syringe size={14} className="text-tone-green" />,
                title: `${v.vaccine_name} 第${v.dose_number}剂`,
                subtitle: v.location || undefined,
                meta: '💉',
            });
        }

        // 就医记录
        for (const r of medicalRecords) {
            const cfg = MEDICAL_RECORD_TYPE_CONFIG[r.type];
            all.push({
                id: `med-${r.id}`,
                date: r.date,
                type: 'medical',
                icon: <Stethoscope size={14} className="text-tone-orange" />,
                title: r.title,
                subtitle: r.diagnosis || r.symptoms || undefined,
                meta: cfg.emoji,
            });
        }

        // 按日期倒序
        all.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
        return all;
    }, [diaryEntries, milestones, growthRecords, vaccinations, medicalRecords]);

    // 按月份分组
    const grouped = useMemo(() => {
        const map = new Map<string, TimelineEvent[]>();
        for (const ev of events) {
            const month = ev.date.slice(0, 7); // YYYY-MM
            if (!map.has(month)) map.set(month, []);
            map.get(month)!.push(ev);
        }
        return Array.from(map.entries());
    }, [events]);

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="又又 / 成长时间线"
                icon={<Clock size={18} />}
                title="成长时间线"
                description="又又所有成长记录的时间轴视图"
                stats={[
                    { label: '总事件', value: events.length, tone: 'accent' },
                ]}
            />

            {events.length === 0 ? (
                <Card className="p-card text-center">
                    <p className="text-body-sm text-text-tertiary">还没有任何记录，开始记录又又的成长吧！</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {grouped.map(([month, monthEvents]) => (
                        <div key={month}>
                            {/* 月份标题 */}
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-body font-semibold text-text-primary">{month}</span>
                                <div className="flex-1 h-px bg-glass-border" />
                                <span className="text-caption text-text-tertiary">{monthEvents.length} 条记录</span>
                            </div>

                            {/* 时间线 */}
                            <div className="relative pl-6">
                                {/* 竖线 */}
                                <div className="absolute left-2 top-2 bottom-2 w-px bg-glass-border" />

                                <div className="space-y-2">
                                    {monthEvents.map(ev => (
                                        <div key={ev.id} className="relative flex items-start gap-3">
                                            {/* 圆点 */}
                                            <div className="absolute -left-6 top-2.5 flex h-4 w-4 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                                                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                                            </div>

                                            <Card className="flex-1 px-3 py-2.5">
                                                <div className="flex items-start gap-2">
                                                    <span className="shrink-0 mt-0.5">{ev.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-body-sm text-text-primary truncate">
                                                                {ev.title}
                                                            </span>
                                                            {ev.meta && (
                                                                <span className="shrink-0 text-xs">{ev.meta}</span>
                                                            )}
                                                        </div>
                                                        {ev.subtitle && (
                                                            <p className="text-caption text-text-secondary mt-0.5 truncate">
                                                                {ev.subtitle}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="shrink-0 text-caption text-text-tertiary">
                                                        {ev.date.slice(5)}
                                                    </span>
                                                </div>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

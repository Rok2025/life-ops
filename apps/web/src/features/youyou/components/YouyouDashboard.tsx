'use client';

import { Baby, BookHeart, Trophy, Calendar, Sparkles, Ruler, Syringe, Stethoscope } from 'lucide-react';
import { useDiaryStats } from '../hooks/useDiary';
import { useMilestoneStats } from '../hooks/useMilestones';
import { useDiaryEntries } from '../hooks/useDiary';
import { useMilestones } from '../hooks/useMilestones';
import { useGrowthLatest } from '../hooks/useGrowthRecords';
import { useVaccinationStats, useMedicalStats } from '../hooks/useHealth';
import { useYouyouPhoto, usePhotoTransform } from '../hooks/usePhoto';
import { YOUYOU_BIRTHDAY, MOOD_CONFIG, MILESTONE_CATEGORY_CONFIG } from '../types';
import type { MilestoneCategory } from '../types';
import { Card, PageHero } from '@/components/ui';

/** 计算又又的年龄 */
function calcAge(birthday: string): string {
    const born = new Date(birthday);
    const now = new Date();
    let years = now.getFullYear() - born.getFullYear();
    let months = now.getMonth() - born.getMonth();
    let days = now.getDate() - born.getDate();
    if (days < 0) {
        months--;
        const prev = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prev.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} 岁`);
    if (months > 0) parts.push(`${months} 个月`);
    parts.push(`${days} 天`);
    return parts.join(' ');
}

export default function YouyouDashboard() {
    const { data: diaryStats } = useDiaryStats();
    const { data: milestoneStats } = useMilestoneStats();
    const { data: recentDiary = [] } = useDiaryEntries(5);
    const { data: allMilestones = [] } = useMilestones();
    const { data: latestGrowth } = useGrowthLatest();
    const { data: vacStats } = useVaccinationStats();
    const { data: medStats } = useMedicalStats();
    const { data: photoUrl } = useYouyouPhoto();
    const { data: photoTransform } = usePhotoTransform();
    const px = photoTransform?.x ?? 50;
    const py = photoTransform?.y ?? 50;
    const pz = photoTransform?.zoom ?? 100;

    const recentAchieved = allMilestones
        .filter(m => m.achieved_at)
        .sort((a, b) => (b.achieved_at! > a.achieved_at! ? 1 : -1))
        .slice(0, 5);

    const pendingMilestones = allMilestones.filter(m => !m.achieved_at);
    const achievedCount = milestoneStats?.achieved ?? 0;
    const totalMilestones = milestoneStats?.total ?? 0;

    return (
        <div className="space-y-4 xl:space-y-5">
            {/* Hero */}
            <div className={`relative overflow-hidden rounded-card ${photoUrl ? 'youyou-hero-photo' : ''}`}>
                {photoUrl && (
                    <>
                        <img
                            src={photoUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            style={{
                                objectPosition: `${px}% ${py}%`,
                                transform: `scale(${pz / 100})`,
                            }}
                        />
                        {/* 渐变模糊：左侧模糊渐变到中间清晰 */}
                        <div
                            className="absolute inset-0 backdrop-blur-lg"
                            style={{ maskImage: 'linear-gradient(to right, black 15%, transparent 45%, transparent 65%, black 90%)' }}
                        />
                        {/* 渐变底色：左侧较深保证文字可读，右侧轻微 */}
                        <div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(to right, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 60%, transparent) 20%, transparent 45%, transparent 65%, color-mix(in srgb, var(--bg-primary) 40%, transparent) 85%, color-mix(in srgb, var(--bg-primary) 50%, transparent) 100%)' }}
                        />
                    </>
                )}
                <PageHero
                    eyebrow="成长 / 又又"
                    icon={<Baby size={18} />}
                    title="又又"
                    description={`${calcAge(YOUYOU_BIRTHDAY)}，记录又又成长的每一个精彩瞬间。`}
                    className={photoUrl ? 'bg-transparent! shadow-none! border-0! backdrop-blur-none!' : undefined}
                    stats={[
                        {
                            label: '成长日记',
                            value: diaryStats?.total ?? 0,
                            meta: `本月 ${diaryStats?.thisMonth ?? 0} 篇`,
                            tone: 'accent',
                        },
                        {
                            label: '里程碑',
                            value: `${achievedCount}/${totalMilestones}`,
                            meta: totalMilestones > 0 ? `${Math.round((achievedCount / totalMilestones) * 100)}% 达成` : '暂无',
                            tone: 'success',
                        },
                        {
                            label: '疫苗接种',
                            value: `${vacStats?.completed ?? 0}/${vacStats?.total ?? 0}`,
                            meta: (vacStats?.total ?? 0) > 0 ? `${Math.round(((vacStats?.completed ?? 0) / (vacStats?.total ?? 1)) * 100)}%` : '',
                            tone: 'warning',
                        },
                    ]}
                />
            </div>

            <div className="grid gap-4 xl:gap-5 md:grid-cols-2">
                {/* 近期日记 */}
                <Card className="p-card">
                    <div className="flex items-center gap-2 mb-widget-header">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                            <BookHeart size={16} className="text-accent" />
                        </div>
                        <h3 className="text-body font-semibold text-text-primary">近期日记</h3>
                    </div>

                    {recentDiary.length === 0 ? (
                        <p className="text-body-sm text-text-tertiary">还没有日记，去记录又又的今天吧！</p>
                    ) : (
                        <div className="space-y-2">
                            {recentDiary.map(entry => (
                                <div
                                    key={entry.id}
                                    className="flex items-start gap-3 rounded-inner-card border border-glass-border/60 bg-panel-bg/60 px-3 py-2.5"
                                >
                                    <div className="shrink-0 text-center">
                                        <div className="text-caption text-text-tertiary">
                                            {entry.date.slice(5, 7)}/{entry.date.slice(8, 10)}
                                        </div>
                                        {entry.mood && (
                                            <span className="text-base" title={MOOD_CONFIG[entry.mood].label}>
                                                {MOOD_CONFIG[entry.mood].emoji}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {entry.highlight && (
                                            <p className="text-body-sm text-text-primary truncate">{entry.highlight}</p>
                                        )}
                                        {entry.funny_quote && (
                                            <p className="text-caption text-text-secondary mt-0.5 truncate">
                                                💬 &ldquo;{entry.funny_quote}&rdquo;
                                            </p>
                                        )}
                                        {!entry.highlight && !entry.funny_quote && entry.content && (
                                            <p className="text-body-sm text-text-secondary truncate">{entry.content}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* 里程碑概览 */}
                <Card className="p-card">
                    <div className="flex items-center gap-2 mb-widget-header">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                            <Trophy size={16} className="text-success" />
                        </div>
                        <h3 className="text-body font-semibold text-text-primary">里程碑进度</h3>
                    </div>

                    {/* 分类进度 */}
                    <div className="space-y-2.5">
                        {(Object.keys(MILESTONE_CATEGORY_CONFIG) as MilestoneCategory[])
                            .filter(cat => cat !== 'other')
                            .map(cat => {
                                const cfg = MILESTONE_CATEGORY_CONFIG[cat];
                                const catMilestones = allMilestones.filter(m => m.category === cat);
                                const catAchieved = catMilestones.filter(m => m.achieved_at).length;
                                const catTotal = catMilestones.length;
                                const pct = catTotal > 0 ? Math.round((catAchieved / catTotal) * 100) : 0;

                                return (
                                    <div key={cat}>
                                        <div className="flex justify-between text-body-sm mb-1">
                                            <span className="text-text-secondary flex items-center gap-1.5">
                                                <span>{cfg.emoji}</span>
                                                <span>{cfg.label}</span>
                                            </span>
                                            <span className="font-medium text-text-primary">
                                                {catAchieved}/{catTotal}
                                            </span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary/90">
                                            <div
                                                className={`h-full rounded-full transition-all duration-normal ease-standard ${cfg.bg.replace('/14', '/60')}`}
                                                style={{ width: `${Math.min(pct, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </Card>
            </div>

            {/* 最近达成的里程碑 & 等待达成 */}
            <div className="grid gap-4 xl:gap-5 md:grid-cols-2">
                {/* 最近达成 */}
                <Card className="p-card">
                    <div className="flex items-center gap-2 mb-widget-header">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                            <Sparkles size={16} className="text-tone-yellow" />
                        </div>
                        <h3 className="text-body font-semibold text-text-primary">最近达成</h3>
                    </div>
                    {recentAchieved.length === 0 ? (
                        <p className="text-body-sm text-text-tertiary">还没有达成的里程碑</p>
                    ) : (
                        <div className="space-y-1.5">
                            {recentAchieved.map(m => {
                                const cfg = MILESTONE_CATEGORY_CONFIG[m.category];
                                return (
                                    <div
                                        key={m.id}
                                        className="flex items-center gap-2.5 rounded-inner-card border border-glass-border/60 bg-panel-bg/60 px-3 py-2"
                                    >
                                        <span>{cfg.emoji}</span>
                                        <span className="flex-1 min-w-0 text-body-sm text-text-primary truncate">{m.title}</span>
                                        <span className="shrink-0 text-caption text-text-tertiary flex items-center gap-1">
                                            <Calendar size={10} />
                                            {m.achieved_at?.slice(5)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* 即将到来 */}
                <Card className="p-card">
                    <div className="flex items-center gap-2 mb-widget-header">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                            <Calendar size={16} className="text-tone-blue" />
                        </div>
                        <h3 className="text-body font-semibold text-text-primary">待解锁</h3>
                    </div>
                    {pendingMilestones.length === 0 ? (
                        <p className="text-body-sm text-text-tertiary">所有里程碑都已达成！🎉</p>
                    ) : (
                        <div className="space-y-1.5">
                            {pendingMilestones.slice(0, 5).map(m => {
                                const cfg = MILESTONE_CATEGORY_CONFIG[m.category];
                                return (
                                    <div
                                        key={m.id}
                                        className="flex items-center gap-2.5 rounded-inner-card border border-glass-border/60 bg-panel-bg/60 px-3 py-2"
                                    >
                                        <span className="opacity-40">{cfg.emoji}</span>
                                        <span className="flex-1 min-w-0 text-body-sm text-text-secondary truncate">{m.title}</span>
                                        {m.expected_age_months && (
                                            <span className="shrink-0 text-caption text-text-tertiary">
                                                ~{m.expected_age_months}月龄
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            {pendingMilestones.length > 5 && (
                                <p className="text-caption text-text-tertiary text-center pt-1">
                                    还有 {pendingMilestones.length - 5} 个待解锁
                                </p>
                            )}
                        </div>
                    )}
                </Card>
            </div>

            {/* 身体发育 & 健康概况 */}
            <div className="grid gap-4 xl:gap-5 md:grid-cols-2">
                {/* 最近发育数据 */}
                <Card className="p-card">
                    <div className="flex items-center gap-2 mb-widget-header">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                            <Ruler size={16} className="text-tone-blue" />
                        </div>
                        <h3 className="text-body font-semibold text-text-primary">最近发育数据</h3>
                    </div>
                    {latestGrowth ? (
                        <div className="space-y-2">
                            <p className="text-caption text-text-tertiary">测量日期: {latestGrowth.date}</p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-inner-card border border-glass-border/60 bg-panel-bg/60 p-2.5 text-center">
                                    <p className="text-caption text-text-tertiary">身高</p>
                                    <p className="text-h3 text-text-primary">
                                        {latestGrowth.height_cm ?? '-'}
                                        <span className="text-caption text-text-tertiary ml-0.5">cm</span>
                                    </p>
                                </div>
                                <div className="rounded-inner-card border border-glass-border/60 bg-panel-bg/60 p-2.5 text-center">
                                    <p className="text-caption text-text-tertiary">体重</p>
                                    <p className="text-h3 text-text-primary">
                                        {latestGrowth.weight_kg ?? '-'}
                                        <span className="text-caption text-text-tertiary ml-0.5">kg</span>
                                    </p>
                                </div>
                                <div className="rounded-inner-card border border-glass-border/60 bg-panel-bg/60 p-2.5 text-center">
                                    <p className="text-caption text-text-tertiary">头围</p>
                                    <p className="text-h3 text-text-primary">
                                        {latestGrowth.head_cm ?? '-'}
                                        <span className="text-caption text-text-tertiary ml-0.5">cm</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-body-sm text-text-tertiary">还没有发育记录，去添加第一条吧！</p>
                    )}
                </Card>

                {/* 健康概况 */}
                <Card className="p-card">
                    <div className="flex items-center gap-2 mb-widget-header">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-panel-bg">
                            <Stethoscope size={16} className="text-tone-orange" />
                        </div>
                        <h3 className="text-body font-semibold text-text-primary">健康概况</h3>
                    </div>
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between rounded-inner-card border border-glass-border/60 bg-panel-bg/60 px-3 py-2.5">
                            <span className="flex items-center gap-2 text-body-sm text-text-secondary">
                                <Syringe size={14} />
                                疫苗接种
                            </span>
                            <span className="text-body-sm font-medium text-text-primary">
                                {vacStats?.completed ?? 0}/{vacStats?.total ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-inner-card border border-glass-border/60 bg-panel-bg/60 px-3 py-2.5">
                            <span className="flex items-center gap-2 text-body-sm text-text-secondary">
                                <Stethoscope size={14} />
                                就医记录
                            </span>
                            <span className="text-body-sm font-medium text-text-primary">
                                {medStats?.total ?? 0} 次
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

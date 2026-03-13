'use client';

import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Dumbbell, NotebookPen, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';

interface WelcomeHeaderProps {
    userName: string;
    frogsCompleted: number;
    frogsTotal: number;
    tilCount: number;
    notesCount: number;
    workoutDays: number;
    workoutTarget: number;
}

// 根据小时获取问候语
function getGreeting(hour: number): string {
    if (hour >= 5 && hour < 12) return '早上好';
    if (hour >= 12 && hour < 18) return '下午好';
    return '晚上好';
}

// 获取星期几
function getWeekday(day: number): string {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[day];
}

export default function WelcomeHeader({
    userName,
    frogsCompleted,
    frogsTotal,
    tilCount,
    notesCount,
    workoutDays,
    workoutTarget,
}: WelcomeHeaderProps) {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        queueMicrotask(() => setTime(new Date()));
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) {
        return (
            <header>
                <Card className="border-glass-border/90 bg-panel-bg/92 p-card">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_344px]">
                        <div className="space-y-3 animate-pulse">
                            <div className="h-5 w-28 rounded-full bg-white/8" />
                            <div className="h-8 w-44 rounded-full bg-white/10" />
                            <div className="h-4 w-64 rounded-full bg-white/7" />
                            <div className="h-10 w-full max-w-xl rounded-[1rem] bg-white/6" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 animate-pulse">
                            {[0, 1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="h-24 rounded-[1.125rem] border border-glass-border bg-card-bg/75"
                                />
                            ))}
                        </div>
                    </div>
                </Card>
            </header>
        );
    }

    const hour = time.getHours();
    const greeting = getGreeting(hour);
    const weekday = getWeekday(time.getDay());

    // 格式化时间 HH:MM
    const timeStr = time.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    // 格式化日期 X月X日
    const dateStr = `${time.getMonth() + 1}月${time.getDate()}日`;
    const remainingFrogs = Math.max(frogsTotal - frogsCompleted, 0);
    const trainingGap = Math.max(workoutTarget - workoutDays, 0);

    const summaryCards = [
        {
            label: '青蛙',
            value: `${frogsCompleted}/${frogsTotal}`,
            hint: remainingFrogs > 0 ? `待推进 ${remainingFrogs}` : '全部完成',
            icon: CheckCircle2,
            accent: remainingFrogs > 0 ? 'text-warning/85' : 'text-success/85',
            progress: frogsTotal > 0 ? Math.round((frogsCompleted / frogsTotal) * 100) : 0,
            barClassName: remainingFrogs > 0 ? 'bg-warning/70' : 'bg-success/70',
        },
        {
            label: '学习',
            value: `${tilCount}`,
            hint: tilCount > 0 ? '已经在推进' : '等待记录',
            icon: BookOpen,
            accent: tilCount > 0 ? 'text-accent/85' : 'text-text-tertiary',
            progress: Math.min(tilCount * 55, 100),
            barClassName: tilCount > 0 ? 'bg-accent/70' : 'bg-white/8',
        },
        {
            label: '随记',
            value: `${notesCount}`,
            hint: notesCount > 0 ? '有新的想法' : '保持捕捉',
            icon: NotebookPen,
            accent: notesCount > 0 ? 'text-tone-orange/85' : 'text-text-tertiary',
            progress: Math.min(notesCount * 38, 100),
            barClassName: notesCount > 0 ? 'bg-tone-orange/70' : 'bg-white/8',
        },
        {
            label: '训练',
            value: `${workoutDays}/${workoutTarget}`,
            hint: workoutDays >= workoutTarget ? '本周达标' : `还差 ${trainingGap} 天`,
            icon: Dumbbell,
            accent: workoutDays >= workoutTarget ? 'text-success/85' : 'text-accent/85',
            progress: workoutTarget > 0 ? Math.round((workoutDays / workoutTarget) * 100) : 0,
            barClassName: workoutDays >= workoutTarget ? 'bg-success/70' : 'bg-accent/65',
        },
    ];

    return (
        <header>
            <Card className="border-glass-border/90 bg-panel-bg/92 p-card shadow-[0_22px_48px_rgba(0,0,0,0.12)]">
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/7 to-transparent" />
                <div className="absolute -left-10 top-4 h-20 w-36 rounded-full bg-white/7 blur-3xl dark:bg-white/4" />
                <div className="absolute -right-12 top-6 h-28 w-28 rounded-full bg-accent/7 blur-3xl dark:bg-accent/6" />
                <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_344px] xl:items-center">
                    <div className="min-w-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                            <span className="inline-flex items-center gap-1 rounded-full border border-glass-border bg-card-bg/75 px-3 py-1.5 backdrop-blur-xl">
                                <Sparkles size={12} className="text-accent" />
                                今日概览
                            </span>
                            <span className="hidden h-px w-8 bg-glass-border xl:block" />
                            <span className="tracking-wide uppercase">Life OPS</span>
                        </div>

                        <div className="mb-0.5 flex items-baseline gap-2 text-caption text-text-secondary">
                            <span className="text-h3 font-semibold tracking-tight tabular-nums text-text-primary">{timeStr}</span>
                            <span className="text-text-tertiary">·</span>
                            <span>{dateStr} {weekday}</span>
                        </div>

                        <h1 className="text-h1 leading-none text-text-primary">
                            {greeting}，{userName}
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {summaryCards.map(({ label, value, hint, icon: Icon, accent, progress, barClassName }) => (
                            <div
                                key={label}
                                className="rounded-[1.125rem] border border-glass-border bg-card-bg/74 px-3 py-2 backdrop-blur-xl"
                            >
                                <div className="flex items-center gap-2 text-caption text-text-tertiary">
                                    <Icon size={14} className={accent} />
                                    <span>{label}</span>
                                </div>
                                <div className="mt-2 flex items-end justify-between gap-3">
                                    <span className="text-h3 font-medium text-text-primary">{value}</span>
                                    <span className={`text-caption ${accent}`}>{hint}</span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                                    <div
                                        className={['h-full rounded-full transition-[width] duration-slow ease-standard', barClassName].join(' ')}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </header>
    );
}

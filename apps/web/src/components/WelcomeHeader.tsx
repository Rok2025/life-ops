'use client';

import { useState, useEffect } from 'react';

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
        // 初始化时间
        setTime(new Date());

        // 每秒更新
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // SSR 时显示占位符
    if (!time) {
        return (
            <header className="mb-header-bottom">
                <div className="h-16" />
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

    return (
        <header className="mb-header-bottom">
            {/* 时间 + 日期行 */}
            <div className="flex items-baseline gap-2 text-text-secondary text-sm mb-0.5">
                <span className="font-mono tabular-nums text-lg">{timeStr}</span>
                <span>·</span>
                <span>{dateStr} {weekday}</span>
            </div>

            {/* 问候语 */}
            <h1 className="text-2xl font-bold text-text-primary mb-2">
                {greeting}，{userName}
            </h1>

            {/* 分隔线 */}
            <div className="h-px bg-border mb-2" />

            {/* 数据汇总 */}
            <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1.5">
                    <span>🐸</span>
                    <span className="text-text-primary font-medium">{frogsCompleted}/{frogsTotal}</span>
                    <span>完成</span>
                </span>
                <span className="text-text-tertiary">·</span>
                <span className="flex items-center gap-1.5">
                    <span>💡</span>
                    <span className="text-text-primary font-medium">{tilCount}</span>
                    <span>条学习</span>
                </span>
                <span className="text-text-tertiary">·</span>
                <span className="flex items-center gap-1.5">
                    <span>�</span>
                    <span className="text-text-primary font-medium">{notesCount}</span>
                    <span>条随手记</span>
                </span>
                <span className="text-text-tertiary">·</span>
                <span className="flex items-center gap-1.5">
                    <span>�💪</span>
                    <span className="text-text-primary font-medium">{workoutDays}/{workoutTarget}</span>
                    <span>天训练</span>
                </span>
            </div>
        </header>
    );
}

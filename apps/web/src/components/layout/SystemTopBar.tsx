'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    Settings,
} from 'lucide-react';
import type { AppShellPanelVisibility } from './appShellLayout';
import type { AppShellRouteMeta } from './appShellRoutes';
import ThemeToggle from './ThemeToggle';

type SystemTopBarProps = {
    routeMeta: AppShellRouteMeta;
    panelVisibility: AppShellPanelVisibility;
    onToggleSidebar: () => void;
    onToggleSummary: () => void;
};

function formatTopBarTime(): string {
    return new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date());
}

function formatTopBarDate(): string {
    const now = new Date();
    const monthDay = new Intl.DateTimeFormat('zh-CN', {
        month: 'long',
        day: 'numeric',
    }).format(now);
    const weekday = new Intl.DateTimeFormat('zh-CN', {
        weekday: 'short',
    }).format(now);

    return `${monthDay} ${weekday}`;
}

export default function SystemTopBar({
    routeMeta,
    panelVisibility,
    onToggleSidebar,
    onToggleSummary,
}: SystemTopBarProps) {
    const [timeLabel, setTimeLabel] = useState(formatTopBarTime);
    const LeftIcon = panelVisibility.sidebarVisible ? PanelLeftClose : PanelLeftOpen;
    const RightIcon = panelVisibility.summaryVisible ? PanelRightClose : PanelRightOpen;

    useEffect(() => {
        const intervalId = window.setInterval(() => setTimeLabel(formatTopBarTime()), 30000);
        return () => window.clearInterval(intervalId);
    }, []);

    return (
        <header className="fixed inset-x-0 top-0 z-50 flex h-(--app-topbar-height) items-center border-b border-glass-border bg-sidebar-bg/92 px-3 backdrop-blur-2xl">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <Link
                    href="/"
                    className="hidden shrink-0 text-body-sm font-semibold text-text-primary transition-colors duration-normal ease-standard hover:text-accent sm:block"
                >
                    Life OPS
                </Link>
                <div className="hidden h-5 w-px bg-glass-border sm:block" />
                <div className="min-w-0">
                    <div className="truncate text-body-sm font-semibold text-text-primary">{routeMeta.title}</div>
                    <div className="truncate text-caption text-text-tertiary">{routeMeta.section}</div>
                </div>
            </div>

            <div className="hidden min-w-0 flex-1 justify-center md:flex">
                <div className="flex items-center gap-2 rounded-full border border-glass-border bg-panel-bg/68 px-3 py-1 text-caption text-text-secondary">
                    <span className="font-semibold text-text-primary">{timeLabel}</span>
                    <span className="h-1 w-1 rounded-full bg-text-tertiary/40" aria-hidden="true" />
                    <span>{formatTopBarDate()}</span>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
                <ThemeToggle variant="icon" />
                <Link
                    href="/settings"
                    className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary transition-colors duration-normal ease-standard hover:bg-panel-bg hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                    aria-label="系统配置"
                    title="系统配置"
                >
                    <Settings size={17} />
                </Link>
                <div
                    className="inline-flex items-center gap-1 rounded-control border border-glass-border bg-panel-bg/78 p-1 shadow-sm backdrop-blur-xl"
                    aria-label="布局面板控制"
                >
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="flex h-8 w-8 items-center justify-center rounded-control text-text-secondary transition-colors duration-normal ease-standard hover:bg-card-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                        aria-label={panelVisibility.sidebarVisible ? '隐藏左侧导航' : '显示左侧导航'}
                        aria-pressed={!panelVisibility.sidebarVisible}
                        title={panelVisibility.sidebarVisible ? '隐藏左侧导航' : '显示左侧导航'}
                    >
                        <LeftIcon size={17} />
                    </button>
                    <button
                        type="button"
                        onClick={onToggleSummary}
                        className="flex h-8 w-8 items-center justify-center rounded-control text-text-secondary transition-colors duration-normal ease-standard hover:bg-card-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                        aria-label={panelVisibility.summaryVisible ? '隐藏右侧摘要' : '显示右侧摘要'}
                        aria-pressed={!panelVisibility.summaryVisible}
                        title={panelVisibility.summaryVisible ? '隐藏右侧摘要' : '显示右侧摘要'}
                    >
                        <RightIcon size={17} />
                    </button>
                </div>
            </div>
        </header>
    );
}

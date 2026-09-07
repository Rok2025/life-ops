'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import QueryProvider from '@/providers/QueryProvider';
import Sidebar from './Sidebar';
import SummaryPanel from './SummaryPanel';
import SystemTopBar from './SystemTopBar';
import {
    getAppShellContentClassName,
    getAppShellMainClassName,
    type AppShellPanelVisibility,
} from './appShellLayout';
import { getAppShellRouteMeta } from './appShellRoutes';

const PANEL_VISIBILITY_STORAGE_KEY = 'life-ops:app-shell-panel-visibility';

type AppShellProps = {
    children: ReactNode;
    initialUser: User;
};

const defaultPanelVisibility: AppShellPanelVisibility = {
    sidebarVisible: true,
    summaryVisible: true,
};

function readPanelVisibilityPreference(): AppShellPanelVisibility {
    if (typeof window === 'undefined') return defaultPanelVisibility;

    try {
        const rawValue = window.localStorage.getItem(PANEL_VISIBILITY_STORAGE_KEY);
        if (!rawValue) return defaultPanelVisibility;

        const parsed = JSON.parse(rawValue) as Partial<AppShellPanelVisibility>;
        return {
            sidebarVisible:
                typeof parsed.sidebarVisible === 'boolean'
                    ? parsed.sidebarVisible
                    : defaultPanelVisibility.sidebarVisible,
            summaryVisible:
                typeof parsed.summaryVisible === 'boolean'
                    ? parsed.summaryVisible
                    : defaultPanelVisibility.summaryVisible,
        };
    } catch {
        return defaultPanelVisibility;
    }
}

function persistPanelVisibilityPreference(panelVisibility: AppShellPanelVisibility): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PANEL_VISIBILITY_STORAGE_KEY, JSON.stringify(panelVisibility));
}

export default function AppShell({ children, initialUser }: AppShellProps) {
    const pathname = usePathname();
    const [panelVisibility, setPanelVisibility] = useState<AppShellPanelVisibility>(defaultPanelVisibility);
    const [preferenceLoaded, setPreferenceLoaded] = useState(false);

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            setPanelVisibility(readPanelVisibilityPreference());
            setPreferenceLoaded(true);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    useEffect(() => {
        if (!preferenceLoaded) return;
        persistPanelVisibilityPreference(panelVisibility);
    }, [panelVisibility, preferenceLoaded]);

    const mainClassName = useMemo(
        () => getAppShellMainClassName(panelVisibility),
        [panelVisibility],
    );
    const contentClassName = useMemo(
        () => getAppShellContentClassName(panelVisibility),
        [panelVisibility],
    );
    const routeMeta = useMemo(() => getAppShellRouteMeta(pathname), [pathname]);

    const toggleSidebar = () => {
        setPanelVisibility((current) => ({
            ...current,
            sidebarVisible: !current.sidebarVisible,
        }));
    };

    const toggleSummary = () => {
        setPanelVisibility((current) => ({
            ...current,
            summaryVisible: !current.summaryVisible,
        }));
    };

    return (
        <QueryProvider>
            <AuthProvider initialUser={initialUser}>
                <div className="min-h-screen">
                    <SystemTopBar
                        routeMeta={routeMeta}
                        panelVisibility={panelVisibility}
                        onToggleSidebar={toggleSidebar}
                        onToggleSummary={toggleSummary}
                    />
                    <Sidebar visible={panelVisibility.sidebarVisible} />
                    <main className={mainClassName}>
                        <div className={contentClassName}>
                            <nav aria-label="移动端业务导航" className="mb-4 flex gap-2 lg:hidden">
                                {[
                                    { href: '/fitness', label: '健身' },
                                    { href: '/finance', label: '财务' },
                                ].map(({ href, label }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        aria-current={pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined}
                                        className="rounded-control border border-glass-border px-4 py-2 text-body-sm text-text-secondary aria-[current=page]:bg-accent/10 aria-[current=page]:text-accent"
                                    >
                                        {label}
                                    </Link>
                                ))}
                            </nav>
                            {children}
                        </div>
                    </main>
                    <SummaryPanel visible={panelVisibility.summaryVisible} />
                </div>
            </AuthProvider>
        </QueryProvider>
    );
}

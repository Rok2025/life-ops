'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';
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
import { getAppShellRouteMeta, getAppShellWarmupRoutes } from './appShellRoutes';

const PANEL_VISIBILITY_STORAGE_KEY = 'life-ops:app-shell-panel-visibility';
const prefetchedWarmupRoutes = new Set<string>();

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

function scheduleIdleTask(callback: () => void): () => void {
    const idleWindow = window as Window & {
        requestIdleCallback?: (callback: () => void) => number;
        cancelIdleCallback?: (handle: number) => void;
    };

    if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
        const handle = idleWindow.requestIdleCallback(callback);
        return () => idleWindow.cancelIdleCallback?.(handle);
    }

    const handle = window.setTimeout(callback, 500);
    return () => window.clearTimeout(handle);
}

export default function AppShell({ children, initialUser }: AppShellProps) {
    const pathname = usePathname();
    const router = useRouter();
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
        return scheduleIdleTask(() => {
            for (const route of getAppShellWarmupRoutes(pathname)) {
                if (prefetchedWarmupRoutes.has(route)) continue;

                prefetchedWarmupRoutes.add(route);
                router.prefetch(route);
            }
        });
    }, [pathname, router]);

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
                            {children}
                        </div>
                    </main>
                    <SummaryPanel visible={panelVisibility.summaryVisible} />
                </div>
            </AuthProvider>
        </QueryProvider>
    );
}

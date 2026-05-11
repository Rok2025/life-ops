export type AppShellPanelVisibility = {
    sidebarVisible: boolean;
    summaryVisible: boolean;
};

export type AppShellPanelSide = 'left' | 'right';

const mainBaseClassName =
    'min-h-screen flex-1 pt-(--app-topbar-height) transition-[margin] duration-normal ease-standard';
const contentBaseClassName = 'mx-auto w-full py-page-y px-page-x transition-[max-width] duration-normal ease-standard';
const panelBaseClassName =
    'fixed top-(--app-topbar-height) h-[calc(100vh_-_var(--app-topbar-height))] bg-sidebar-bg backdrop-blur-2xl';

export function getAppShellMainClassName({
    sidebarVisible,
    summaryVisible,
}: AppShellPanelVisibility): string {
    return [
        mainBaseClassName,
        sidebarVisible ? 'lg:ml-(--sidebar-width)' : 'lg:ml-0',
        summaryVisible ? 'xl:mr-(--summary-width)' : 'xl:mr-0',
    ].join(' ');
}

export function getAppShellContentClassName({
    sidebarVisible,
    summaryVisible,
}: AppShellPanelVisibility): string {
    if (!sidebarVisible && !summaryVisible) {
        return `${contentBaseClassName} max-w-[96rem]`;
    }

    if (!sidebarVisible || !summaryVisible) {
        return `${contentBaseClassName} max-w-7xl`;
    }

    return `${contentBaseClassName} max-w-6xl`;
}

export function getAppShellPanelClassName(side: AppShellPanelSide): string {
    if (side === 'left') {
        return [
            panelBaseClassName,
            'left-0 hidden w-(--sidebar-width) flex-col border-r border-glass-border lg:flex',
        ].join(' ');
    }

    return [
        panelBaseClassName,
        'right-0 hidden w-(--summary-width) overflow-y-auto border-l border-glass-border p-3 xl:block',
    ].join(' ');
}

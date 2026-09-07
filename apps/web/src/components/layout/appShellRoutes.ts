export type AppShellRouteMeta = {
    title: string;
    section: string;
};

const ROUTE_META: Array<{ path: string; meta: AppShellRouteMeta }> = [
    { path: '/fitness/history', meta: { title: '训练历史', section: '健身' } },
    { path: '/fitness/exercises', meta: { title: '动作库', section: '健身' } },
    { path: '/fitness/workout', meta: { title: '训练记录', section: '健身' } },
    { path: '/fitness', meta: { title: '健身', section: '训练与统计' } },
    { path: '/finance', meta: { title: '财务', section: '收支与账户' } },
    { path: '/settings', meta: { title: '系统配置', section: '系统' } },
    { path: '/developer', meta: { title: '开发者访问', section: '系统' } },
    { path: '/', meta: { title: '健身', section: '训练与统计' } },
];

const fallbackRouteMeta: AppShellRouteMeta = {
    title: 'Life OPS',
    section: '系统',
};

function normalizePathname(pathname: string | null | undefined): string {
    if (!pathname) return '';
    return pathname === '' ? '/' : pathname;
}

export function getAppShellRouteMeta(pathname: string | null | undefined): AppShellRouteMeta {
    const normalizedPathname = normalizePathname(pathname);
    if (!normalizedPathname) return fallbackRouteMeta;
    const routeMeta = ROUTE_META.find(({ path }) => {
        if (path === '/') return normalizedPathname === '/';
        return normalizedPathname === path || normalizedPathname.startsWith(`${path}/`);
    });

    return routeMeta?.meta ?? fallbackRouteMeta;
}

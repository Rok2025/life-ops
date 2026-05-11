export type AppShellRouteMeta = {
    title: string;
    section: string;
};

const ROUTE_META: Array<{ path: string; meta: AppShellRouteMeta }> = [
    { path: '/growth/prompts', meta: { title: '提示词库', section: '成长' } },
    { path: '/growth/english', meta: { title: '英语学习', section: '成长' } },
    { path: '/growth/reading', meta: { title: '阅读', section: '成长' } },
    { path: '/growth/ai', meta: { title: 'AI', section: '成长' } },
    { path: '/growth/youyou', meta: { title: '又又', section: '成长' } },
    { path: '/fitness/history', meta: { title: '训练历史', section: '健身' } },
    { path: '/fitness/exercises', meta: { title: '动作库', section: '健身' } },
    { path: '/fitness/workout', meta: { title: '训练记录', section: '健身' } },
    { path: '/timeline', meta: { title: '流水记', section: '全局' } },
    { path: '/search', meta: { title: '搜索', section: '全局' } },
    { path: '/commands', meta: { title: '命令', section: '系统' } },
    { path: '/todos', meta: { title: '待办', section: '生活' } },
    { path: '/fitness', meta: { title: '健身', section: '人生领域' } },
    { path: '/output', meta: { title: '输出', section: '创作' } },
    { path: '/family', meta: { title: '家庭事务', section: '生活' } },
    { path: '/finance', meta: { title: '财务', section: '生活' } },
    { path: '/settings', meta: { title: '系统配置', section: '系统' } },
    { path: '/', meta: { title: '今日概览', section: '工作台' } },
];

const APP_SHELL_WARMUP_ROUTES = ['/', '/todos', '/timeline', '/search'];

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

export function getAppShellWarmupRoutes(pathname: string | null | undefined): string[] {
    const normalizedPathname = normalizePathname(pathname);
    return APP_SHELL_WARMUP_ROUTES.filter((route) => route !== normalizedPathname);
}

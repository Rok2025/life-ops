import { describe, expect, it } from 'vitest';

import {
    getAppShellMainClassName,
    getAppShellPanelClassName,
} from './appShellLayout';
import { getAppShellRouteMeta, getAppShellWarmupRoutes } from './appShellRoutes';

describe('getAppShellMainClassName', () => {
    it('reserves both side panel widths when both panels are visible', () => {
        const className = getAppShellMainClassName({ sidebarVisible: true, summaryVisible: true });

        expect(className).toContain('pt-(--app-topbar-height)');
        expect(className).toContain('lg:ml-(--sidebar-width)');
        expect(className).toContain('xl:mr-(--summary-width)');
    });

    it('removes the side margins when both panels are hidden', () => {
        const className = getAppShellMainClassName({ sidebarVisible: false, summaryVisible: false });

        expect(className).not.toContain('lg:ml-(--sidebar-width)');
        expect(className).not.toContain('xl:mr-(--summary-width)');
    });
});

describe('getAppShellPanelClassName', () => {
    it('offsets fixed panels below the system top bar', () => {
        expect(getAppShellPanelClassName('left')).toContain('top-(--app-topbar-height)');
        expect(getAppShellPanelClassName('left')).toContain('h-[calc(100vh_-_var(--app-topbar-height))]');
        expect(getAppShellPanelClassName('right')).toContain('top-(--app-topbar-height)');
    });
});

describe('getAppShellRouteMeta', () => {
    it('maps known routes to module titles', () => {
        expect(getAppShellRouteMeta('/').title).toBe('今日概览');
        expect(getAppShellRouteMeta('/finance').title).toBe('财务');
        expect(getAppShellRouteMeta('/growth/prompts').title).toBe('提示词库');
    });

    it('falls back to Life OPS for unknown routes', () => {
        expect(getAppShellRouteMeta('/unknown').title).toBe('Life OPS');
    });
});

describe('getAppShellWarmupRoutes', () => {
    it('prefetches high-frequency routes except the active route', () => {
        expect(getAppShellWarmupRoutes('/')).not.toContain('/');
        expect(getAppShellWarmupRoutes('/')).toContain('/todos');
    });

    it('includes the home route when the user is away from home', () => {
        expect(getAppShellWarmupRoutes('/fitness')).toContain('/');
    });
});

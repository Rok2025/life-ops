import { describe, expect, it } from 'vitest';

import {
    getAppShellMainClassName,
    getAppShellPanelClassName,
} from './appShellLayout';
import { getAppShellRouteMeta } from './appShellRoutes';

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
        expect(getAppShellRouteMeta('/').title).toBe('健身');
        expect(getAppShellRouteMeta('/finance').title).toBe('财务');
        expect(getAppShellRouteMeta('/fitness/history').title).toBe('训练历史');
    });

    it('falls back to Life OPS for unknown routes', () => {
        expect(getAppShellRouteMeta('/unknown').title).toBe('Life OPS');
    });
});

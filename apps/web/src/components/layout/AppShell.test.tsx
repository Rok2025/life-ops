import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { User } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppShell from './AppShell';
import SummaryPanel from './SummaryPanel';
import HomePage from '@/app/(app)/page';

vi.mock('next/navigation', () => ({
    usePathname: () => '/fitness',
    useRouter: () => ({ prefetch: vi.fn() }),
    redirect: vi.fn(() => { throw new Error('redirect'); }),
}));

vi.mock('@/contexts/AuthContext', () => ({
    AuthProvider: ({ children }: { children: ReactNode }) => children,
    useAuth: () => ({ user: { id: 'fixture-user', email: 'viewer@example.invalid' }, loading: false, signOut: vi.fn() }),
}));

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-07T12:00:00+08:00'));
});
afterEach(() => vi.useRealTimers());

describe('focused application shell', () => {
    it('renders retained navigation, settings and time panels around the current content', () => {
        const html = renderToStaticMarkup(
            <AppShell initialUser={{ id: 'fixture-user' } as User}>
                <h1>训练查看</h1>
            </AppShell>,
        );
        for (const label of ['训练查看', '健身', '财务', '时间节奏', '本月剩余', '年度剩余']) {
            expect(html).toContain(label);
        }
        for (const href of ['/fitness', '/finance', '/settings']) expect(html).toContain(`href="${href}"`);
        expect(html).toContain('aria-label="移动端业务导航"');
        for (const href of ['/todos', '/commands', '/growth', '/family', '/output', '/search', '/timeline']) {
            expect(html).not.toContain(`href="${href}`);
        }
    });

    it('renders time information without a query provider or obsolete business data', () => {
        const html = renderToStaticMarkup(<SummaryPanel />);
        expect(html).toContain('本月还剩 23 天');
        expect(html).toContain('年度剩余比例');
        expect(html).not.toContain('未完成');
        expect(renderToStaticMarkup(<SummaryPanel visible={false} />)).toBe('');
    });

    it('redirects the root page to the retained fitness route', async () => {
        const { redirect } = await import('next/navigation');
        expect(() => HomePage()).toThrow('redirect');
        expect(redirect).toHaveBeenCalledWith('/fitness');
    });
});

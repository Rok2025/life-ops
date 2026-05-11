import { describe, expect, it } from 'vitest';

import { getPageHeroClassName } from './pageHeroLayout';

describe('getPageHeroClassName', () => {
    it('keeps page heroes sticky below the system top bar by default', () => {
        const className = getPageHeroClassName({});

        expect(className).toContain('sticky');
        expect(className).toContain('top-(--app-topbar-height)');
        expect(className).toContain('z-30');
    });

    it('allows sticky behavior to be disabled for special pages', () => {
        const className = getPageHeroClassName({ sticky: false });

        expect(className).not.toContain('sticky');
        expect(className).not.toContain('top-(--app-topbar-height)');
    });
});

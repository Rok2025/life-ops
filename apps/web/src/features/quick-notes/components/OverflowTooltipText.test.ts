import { describe, expect, it } from 'vitest';
import {
    getOverflowTooltipPopoverClassName,
    getOverflowTooltipPosition,
} from './OverflowTooltipText';

describe('OverflowTooltipText positioning', () => {
    it('uses a fixed high-layer popover so list group overflow cannot clip it', () => {
        const className = getOverflowTooltipPopoverClassName();

        expect(className).toContain('fixed');
        expect(className).toContain('z-[1000]');
        expect(className).not.toContain('absolute');
        expect(className).not.toContain('top-full');
    });

    it('clamps the popover left edge inside the viewport', () => {
        const position = getOverflowTooltipPosition(
            {
                left: 380,
                right: 680,
                top: 80,
                bottom: 108,
                width: 300,
                height: 28,
            },
            {
                viewportWidth: 420,
                viewportHeight: 640,
                maxWidth: 512,
                margin: 16,
                gap: 6,
            },
        );

        expect(position).toEqual({
            left: 16,
            top: 114,
            maxWidth: 388,
        });
    });
});

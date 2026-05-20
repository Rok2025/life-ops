import { describe, expect, it } from 'vitest';
import { formatCurrency } from './financeFormat';

describe('financeFormat', () => {
    it('preserves decimal expense amounts without rounding to whole yuan', () => {
        expect(formatCurrency(9.5)).toBe('¥9.5');
        expect(formatCurrency(9.55)).toBe('¥9.55');
        expect(formatCurrency(42)).toBe('¥42');
    });
});

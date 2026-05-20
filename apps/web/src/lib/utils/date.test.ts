import { describe, expect, it } from 'vitest';

import {
    MONDAY_FIRST_WEEKDAYS,
    formatCalendarDate,
    getDaysInMonth,
    getMondayFirstCalendarOffset,
} from './date';

describe('calendar date utilities', () => {
    it('uses Monday as the first weekday label', () => {
        expect(MONDAY_FIRST_WEEKDAYS).toEqual(['一', '二', '三', '四', '五', '六', '日']);
    });

    it('positions month starts in a Monday-first calendar grid', () => {
        expect(getMondayFirstCalendarOffset(2024, 0)).toBe(0);
        expect(getMondayFirstCalendarOffset(2024, 8)).toBe(6);
    });

    it('formats calendar date parts as a local date string', () => {
        expect(getDaysInMonth(2024, 1)).toBe(29);
        expect(formatCalendarDate(2024, 0, 5)).toBe('2024-01-05');
    });
});

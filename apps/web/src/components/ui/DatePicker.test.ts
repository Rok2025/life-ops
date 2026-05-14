import { describe, expect, it } from 'vitest';

import { getDatePickerDayClassName } from './datePickerDay';

describe('getDatePickerDayClassName', () => {
  it('marks today when it is not selected', () => {
    const className = getDatePickerDayClassName({
      isDisabled: false,
      isSelected: false,
      isToday: true,
    });

    expect(className).toContain('ring-accent');
    expect(className).toContain('text-accent');
  });

  it('keeps selected day styling stronger than today styling', () => {
    const className = getDatePickerDayClassName({
      isDisabled: false,
      isSelected: true,
      isToday: true,
    });

    expect(className).toContain('bg-selection-bg');
    expect(className).toContain('text-selection-text');
  });
});

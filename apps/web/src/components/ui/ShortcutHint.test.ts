import { describe, expect, it } from 'vitest';
import { getShortcutHintClassName } from './ShortcutHint';

describe('getShortcutHintClassName', () => {
  it('uses a compact high-contrast pill style for primary buttons', () => {
    const className = getShortcutHintClassName();

    expect(className).toContain('text-[11px]');
    expect(className).toContain('bg-white/22');
    expect(className).toContain('text-white');
    expect(className).toContain('shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]');
    expect(className).not.toContain('opacity-65');
  });
});

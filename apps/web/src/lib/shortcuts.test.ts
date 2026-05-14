import { describe, expect, it } from 'vitest';
import {
  SUBMIT_SHORTCUT_LABEL,
  handleCommandEnterFormSubmit,
  isCommandEnterEvent,
} from './shortcuts';

function keyboardEvent(
  overrides: Partial<{
    key: string;
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    isComposing: boolean;
    repeat: boolean;
  }> = {},
) {
  return {
    key: 'Enter',
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    isComposing: false,
    repeat: false,
    ...overrides,
  };
}

describe('shortcut helpers', () => {
  it('recognizes Command+Enter and Ctrl+Enter', () => {
    expect(isCommandEnterEvent(keyboardEvent({ metaKey: true }))).toBe(true);
    expect(isCommandEnterEvent(keyboardEvent({ ctrlKey: true }))).toBe(true);
  });

  it('ignores plain Enter, shifted shortcuts, repeats, and IME composition', () => {
    expect(isCommandEnterEvent(keyboardEvent())).toBe(false);
    expect(isCommandEnterEvent(keyboardEvent({ metaKey: true, shiftKey: true }))).toBe(false);
    expect(isCommandEnterEvent(keyboardEvent({ metaKey: true, repeat: true }))).toBe(false);
    expect(isCommandEnterEvent(keyboardEvent({ metaKey: true, isComposing: true }))).toBe(false);
  });

  it('submits the current form once for Command+Enter', () => {
    let submitted = 0;
    let prevented = 0;
    const event = {
      ...keyboardEvent({ metaKey: true }),
      preventDefault: () => {
        prevented += 1;
      },
      currentTarget: {
        requestSubmit: () => {
          submitted += 1;
        },
      },
    };

    handleCommandEnterFormSubmit(event);

    expect(prevented).toBe(1);
    expect(submitted).toBe(1);
  });

  it('uses the visible submit shortcut label', () => {
    expect(SUBMIT_SHORTCUT_LABEL).toBe('⌘ Enter');
  });
});

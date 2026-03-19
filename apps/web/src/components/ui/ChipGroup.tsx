'use client';

import { useCallback, useId } from 'react';

export interface ChipOption<T extends string = string> {
  value: T;
  label: string;
}

export interface ChipGroupProps<T extends string = string> {
  /** Accessible label for the group */
  label: string;
  /** Currently selected value */
  value: T;
  /** Available choices */
  options: ChipOption<T>[];
  /** Fired when selection changes */
  onChange: (value: T) => void;
  /** Hidden name for radio semantics */
  name?: string;
}

const baseChip =
  'inline-flex items-center px-3 py-1.5 rounded-control border cursor-pointer transition-colors duration-normal ease-standard text-body-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30';

const activeChip = 'border-accent bg-accent/10 text-accent';
const inactiveChip = 'border-border text-text-secondary hover:bg-bg-tertiary';

export function ChipGroup<T extends string = string>({
  label,
  value,
  options,
  onChange,
  name,
}: ChipGroupProps<T>) {
  const groupId = useId();
  const radioName = name ?? groupId;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const idx = options.findIndex((o) => o.value === value);
      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        next = (idx + 1) % options.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        next = (idx - 1 + options.length) % options.length;
      }
      if (next >= 0) {
        e.preventDefault();
        onChange(options[next].value);
        // Move focus to the newly selected chip
        const container = e.currentTarget;
        const chips = container.querySelectorAll<HTMLElement>('[role="radio"]');
        chips[next]?.focus();
      }
    },
    [options, value, onChange],
  );

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap gap-2"
      onKeyDown={handleKeyDown}
    >
      {options.map((opt) => {
        const checked = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={`${baseChip} ${checked ? activeChip : inactiveChip}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

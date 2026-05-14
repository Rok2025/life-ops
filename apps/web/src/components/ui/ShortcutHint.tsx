import type { HTMLAttributes } from 'react';
import { SUBMIT_SHORTCUT_LABEL } from '../../lib/shortcuts';

interface ShortcutHintProps extends HTMLAttributes<HTMLElement> {
  label?: string;
}

export function getShortcutHintClassName(className?: string): string {
  return [
    'inline-flex shrink-0 translate-y-px items-center whitespace-nowrap rounded-control bg-white/22 px-1.5 py-0.5 text-[11px] font-semibold leading-none tracking-normal text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]',
    className,
  ].filter(Boolean).join(' ');
}

export function ShortcutHint({
  label = SUBMIT_SHORTCUT_LABEL,
  className,
  ...props
}: ShortcutHintProps) {
  return (
    <kbd
      className={getShortcutHintClassName(className)}
      aria-label={`快捷键 ${label}`}
      {...props}
    >
      {label}
    </kbd>
  );
}

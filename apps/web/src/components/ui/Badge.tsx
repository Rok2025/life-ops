import type { PropsWithChildren } from 'react';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends PropsWithChildren {
  tone?: BadgeTone;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  default: '',
  success: 'bg-(--badge-success-bg) border-(--badge-success-border) text-success',
  warning: 'bg-(--badge-warning-bg) border-(--badge-warning-border) text-warning',
  danger: 'bg-(--badge-danger-bg) border-(--badge-danger-border) text-danger',
};

export function Badge({ tone = 'default', className, children }: BadgeProps) {
  const base =
    'ui-badge inline-flex items-center rounded-full border border-glass-border bg-panel-bg px-2.5 py-1 text-caption font-medium shadow-glass-inset backdrop-blur-xl';

  return (
    <span className={[base, toneStyles[tone], className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

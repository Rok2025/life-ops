import type { PropsWithChildren } from 'react';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends PropsWithChildren {
  tone?: BadgeTone;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  default: '',
  success:
    'bg-[color-mix(in_srgb,var(--success)_9%,var(--panel-bg))] border-[color-mix(in_srgb,var(--success)_18%,var(--glass-border))] text-success',
  warning:
    'bg-[color-mix(in_srgb,var(--warning)_9%,var(--panel-bg))] border-[color-mix(in_srgb,var(--warning)_18%,var(--glass-border))] text-warning',
  danger:
    'bg-[color-mix(in_srgb,var(--danger)_9%,var(--panel-bg))] border-[color-mix(in_srgb,var(--danger)_18%,var(--glass-border))] text-danger',
};

export function Badge({ tone = 'default', className, children }: BadgeProps) {
  const base =
    'ui-badge inline-flex items-center rounded-full border border-glass-border bg-panel-bg px-2.5 py-1 text-caption font-medium backdrop-blur-xl [box-shadow:inset_0_1px_0_rgb(255_255_255/6%)]';

  return (
    <span className={[base, toneStyles[tone], className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

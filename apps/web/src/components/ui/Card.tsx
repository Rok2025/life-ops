import type { PropsWithChildren } from 'react';

type CardVariant = 'default' | 'subtle';

export interface CardProps extends PropsWithChildren {
  className?: string;
  variant?: CardVariant;
}

export function Card({ className, variant = 'default', children }: CardProps) {
  const base =
    'ui-card relative overflow-hidden rounded-card border border-glass-border bg-card-bg shadow-card backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/12 before:to-transparent';
  const subtle = 'bg-panel-bg shadow-none';

  return (
    <div className={[base, variant === 'subtle' ? subtle : '', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

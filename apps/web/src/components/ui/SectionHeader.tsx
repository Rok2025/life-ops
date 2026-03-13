import type { PropsWithChildren } from 'react';

export interface SectionHeaderProps extends PropsWithChildren {
  title: string;
  description?: string;
  right?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, right, className, children }: SectionHeaderProps) {
  return (
    <div className={['flex items-start justify-between gap-4', className].filter(Boolean).join(' ')}>
      <div className="min-w-0">
        <div className="text-body-sm font-semibold tracking-tight text-text-primary">
          {title}
        </div>
        {description ? (
          <div className="mt-1 text-caption text-text-secondary">
            {description}
          </div>
        ) : null}
        {children}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

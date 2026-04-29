import type { PropsWithChildren, ReactNode } from 'react';
import { DEFAULT_TONE, TONES } from '@/design-system/tokens';
import { Card } from './Card';

type PageHeroTone = keyof typeof TONES;

export interface PageHeroStat {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  tone?: PageHeroTone;
}

export interface PageHeroProps extends PropsWithChildren {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  action?: ReactNode;
  stats?: PageHeroStat[];
  className?: string;
  compact?: boolean;
}

export function PageHero({
  title,
  description,
  eyebrow,
  icon,
  action,
  stats = [],
  className,
  compact = false,
  children,
}: PageHeroProps) {
  const hasStats = stats.length > 0;

  return (
    <Card className={['overflow-hidden', compact ? 'p-3 sm:p-4' : 'p-card', className].filter(Boolean).join(' ')}>
      <div className={['pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-r from-white/18 via-white/8 to-transparent dark:from-white/[0.06] dark:via-white/[0.03]', compact ? 'h-16' : 'h-24'].join(' ')} />
      <div className={['pointer-events-none absolute left-[-3rem] top-[-4rem] rounded-full bg-accent/8 blur-3xl dark:bg-white/[0.035]', compact ? 'h-24 w-24' : 'h-32 w-32'].join(' ')} />
      <div className={['relative grid xl:items-start', hasStats ? 'xl:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]' : '', compact ? 'gap-3' : 'gap-4'].join(' ')}>
        <div className={['min-w-0', compact ? 'space-y-2.5' : 'space-y-4'].join(' ')}>
          {(eyebrow || icon) && (
            <div className={['flex items-center text-caption text-text-tertiary', compact ? 'gap-2' : 'gap-3'].join(' ')}>
              {icon ? <div className="glass-icon-badge shrink-0">{icon}</div> : null}
              {eyebrow ? <span className="tracking-[0.02em]">{eyebrow}</span> : null}
            </div>
          )}

          <div className={['flex flex-col lg:flex-row lg:items-start lg:justify-between', compact ? 'gap-2' : 'gap-3'].join(' ')}>
            <div className="min-w-0">
              <h1 className={[compact ? 'text-h2' : 'text-h1', 'text-text-primary'].join(' ')}>{title}</h1>
              {description ? (
                <p className={[compact ? 'mt-1 text-body-sm' : 'mt-2 text-body', 'max-w-3xl text-text-secondary'].join(' ')}>{description}</p>
              ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>

          {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>

        {hasStats ? (
          <div className={['grid sm:grid-cols-2 xl:grid-cols-2', compact ? 'gap-1.5' : 'gap-2'].join(' ')}>
            {stats.map((stat) => {
              const tone = stat.tone ? TONES[stat.tone] : DEFAULT_TONE;

              return (
                <div
                  key={stat.label}
                  className={['rounded-inner-card border border-glass-border/90 bg-panel-bg/88 shadow-sm backdrop-blur-xl', compact ? 'px-2.5 py-2' : 'px-3 py-3'].join(' ')}
                >
                  <div className="text-caption text-text-secondary">{stat.label}</div>
                  <div className={[compact ? 'mt-1 gap-2' : 'mt-2 gap-3', 'flex items-end justify-between'].join(' ')}>
                    <div className={['min-w-0 font-semibold text-text-primary', compact ? 'text-body' : 'text-h3'].join(' ')}>{stat.value}</div>
                    {stat.meta ? (
                      <div className={['shrink-0', compact ? 'text-caption' : 'text-body-sm', tone.color].join(' ')}>
                        {stat.meta}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

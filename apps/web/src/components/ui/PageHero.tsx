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
}

export function PageHero({
  title,
  description,
  eyebrow,
  icon,
  action,
  stats = [],
  className,
  children,
}: PageHeroProps) {
  const hasStats = stats.length > 0;

  return (
    <Card className={['overflow-hidden p-card', className].filter(Boolean).join(' ')}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-white/18 via-white/8 to-transparent dark:from-white/[0.06] dark:via-white/[0.03]" />
      <div className="pointer-events-none absolute left-[-3rem] top-[-4rem] h-32 w-32 rounded-full bg-accent/8 blur-3xl dark:bg-white/[0.035]" />
      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] xl:items-start">
        <div className="min-w-0 space-y-4">
          {(eyebrow || icon) && (
            <div className="flex items-center gap-3 text-caption text-text-tertiary">
              {icon ? <div className="glass-icon-badge shrink-0">{icon}</div> : null}
              {eyebrow ? <span className="tracking-[0.02em]">{eyebrow}</span> : null}
            </div>
          )}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-h1 text-text-primary">{title}</h1>
              {description ? (
                <p className="mt-2 max-w-3xl text-body text-text-secondary">{description}</p>
              ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>

          {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>

        {hasStats ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
            {stats.map((stat) => {
              const tone = stat.tone ? TONES[stat.tone] : DEFAULT_TONE;

              return (
                <div
                  key={stat.label}
                  className="rounded-inner-card border border-glass-border/90 bg-panel-bg/88 px-3 py-3 shadow-sm backdrop-blur-xl"
                >
                  <div className="text-caption text-text-secondary">{stat.label}</div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div className="min-w-0 text-h3 font-semibold text-text-primary">{stat.value}</div>
                    {stat.meta ? (
                      <div className={['shrink-0 text-body-sm', tone.color].join(' ')}>
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

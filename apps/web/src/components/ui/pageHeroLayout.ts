export type PageHeroClassNameOptions = {
  compact?: boolean;
  sticky?: boolean;
  className?: string;
};

export function getPageHeroClassName({
  compact = false,
  sticky = true,
  className,
}: PageHeroClassNameOptions): string {
  return [
    'overflow-hidden',
    sticky && 'sticky top-(--app-topbar-height) z-30',
    compact ? 'p-3 sm:p-4' : 'p-card',
    className,
  ].filter(Boolean).join(' ');
}

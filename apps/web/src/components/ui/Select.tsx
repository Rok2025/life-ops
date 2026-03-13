import type { SelectHTMLAttributes } from 'react';

type SelectSize = 'sm' | 'md';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: SelectSize;
  error?: boolean;
}

const base =
  'w-full rounded-control border border-glass-border bg-panel-bg text-text-primary shadow-sm outline-none backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-normal ease-standard disabled:pointer-events-none disabled:opacity-50 focus:border-accent focus:ring-2 focus:ring-accent/15';

const sizes: Record<SelectSize, string> = {
  sm: 'px-2 py-1.5 text-caption',
  md: 'px-control-x py-control-y text-body-sm',
};

export function Select({
  size = 'md',
  error = false,
  className,
  children,
  ...props
}: SelectProps) {
  const borderClass = error
    ? 'border-danger focus:border-danger focus:ring-danger/15'
    : '';

  return (
    <select
      className={[base, sizes[size], borderClass, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </select>
  );
}

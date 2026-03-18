import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tinted' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

interface ButtonClassNameOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function getButtonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonClassNameOptions = {}) {
  const base =
    'ui-button inline-flex items-center justify-center gap-2 rounded-control transition-[background-color,border-color,box-shadow,transform,color] duration-normal ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985]';

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-body-sm',
    md: 'px-control-x py-control-y text-body',
  };

  const variants: Record<ButtonVariant, string> = {
    primary:
      'ui-button--primary border border-white/10 bg-accent text-white shadow-sm shadow-accent/20 hover:bg-accent-hover dark:border-white/8 dark:shadow-accent/12',
    secondary:
      'ui-button--secondary border border-glass-border bg-panel-bg text-text-primary backdrop-blur-xl hover:bg-card-bg',
    tinted:
      'ui-button--tinted border border-selection-border bg-selection-bg/90 text-accent shadow-sm shadow-accent/8 backdrop-blur-xl hover:border-accent/18 hover:bg-selection-bg dark:shadow-accent/10',
    ghost: 'ui-button--ghost bg-transparent text-text-secondary hover:bg-panel-bg hover:text-text-primary',
    danger: 'ui-button--danger bg-danger text-white shadow-sm shadow-black/10 hover:bg-danger/90',
  };

  return [base, sizes[size], variants[variant], className].filter(Boolean).join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={getButtonClassName({ variant, size, className })}
      {...props}
    />
  );
}

import type { ReactNode } from 'react';

export interface SegmentedControlOption {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  title?: string;
  disabled?: boolean;
}

type SegmentedControlSize = 'sm' | 'md';

export interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SegmentedControlOption[];
  size?: SegmentedControlSize;
  className?: string;
  optionClassName?: string;
  fullWidth?: boolean;
  wrap?: boolean;
  'aria-label'?: string;
}

const sizeClasses: Record<SegmentedControlSize, string> = {
  sm: 'px-2 py-1 text-caption',
  md: 'px-3 py-1.5 text-body-sm',
};

export function SegmentedControl({
  value,
  onChange,
  options,
  size = 'sm',
  className,
  optionClassName,
  fullWidth = false,
  wrap = false,
  'aria-label': ariaLabel,
}: SegmentedControlProps) {
  return (
    <div
      className={[
        'inline-flex items-center gap-1 rounded-control border border-glass-border bg-bg-tertiary/88 p-0.5 shadow-sm backdrop-blur-xl',
        fullWidth ? 'w-full' : '',
        wrap ? 'flex-wrap' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            title={option.title}
            disabled={option.disabled}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={[
              'inline-flex items-center justify-center gap-1.5 rounded-control font-medium transition-colors duration-normal ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-50',
              sizeClasses[size],
              fullWidth ? 'flex-1' : '',
              isActive
                ? 'bg-bg-primary text-text-primary shadow-sm'
                : 'text-text-tertiary hover:bg-card-bg/72 hover:text-text-secondary',
              optionClassName,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {option.icon ? <span className="shrink-0">{option.icon}</span> : null}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

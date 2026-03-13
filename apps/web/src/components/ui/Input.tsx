import { forwardRef } from 'react';

type InputSize = 'sm' | 'md';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 'sm' for caption-sized (e.g. table cells), 'md' for form fields */
  size?: InputSize;
  /** Red border and danger tint when true */
  error?: boolean;
  /** Render as textarea */
  multiline?: boolean;
  /** Only when multiline: rows */
  rows?: number;
}

const base =
  'w-full rounded-control border border-glass-border bg-panel-bg text-text-primary shadow-sm outline-none backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-normal ease-standard placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/15';

const sizes: Record<InputSize, string> = {
  sm: 'px-2 py-1.5 text-caption',
  md: 'px-control-x py-control-y text-body-sm',
};

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    {
      size = 'md',
      error = false,
      multiline = false,
      rows = 3,
      className,
      ...props
    },
    ref
  ) => {
    const sizeClass = sizes[size];
    const borderClass = error
      ? 'border-danger focus:border-danger focus:ring-danger/15'
      : '';

    if (multiline) {
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          rows={rows}
          className={[base, sizeClass, borderClass, 'resize-y', className]
            .filter(Boolean)
            .join(' ')}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      );
    }

    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        className={[base, sizeClass, borderClass, className]
          .filter(Boolean)
          .join(' ')}
        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    );
  }
);

Input.displayName = 'Input';

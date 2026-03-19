import { forwardRef, useCallback } from 'react';

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
  /** Cmd/Ctrl+Enter callback (useful for textarea submit) */
  onCmdEnter?: () => void;
}

const PICKER_TYPES = new Set(['date', 'datetime-local', 'month', 'week', 'time']);

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
      onClick,
      type,
      onCmdEnter,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const sizeClass = sizes[size];
    const borderClass = error
      ? 'border-danger focus:border-danger focus:ring-danger/15'
      : '';
    const isPicker = typeof type === 'string' && PICKER_TYPES.has(type);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (onCmdEnter && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onCmdEnter();
        }
        onKeyDown?.(e as React.KeyboardEvent<HTMLInputElement>);
      },
      [onCmdEnter, onKeyDown],
    );

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLInputElement>) => {
        if (isPicker) {
          (e.currentTarget as HTMLInputElement).showPicker?.();
        }
        onClick?.(e);
      },
      [isPicker, onClick],
    );

    if (multiline) {
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          rows={rows}
          onKeyDown={handleKeyDown as React.KeyboardEventHandler<HTMLTextAreaElement>}
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
        type={type}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={[base, sizeClass, borderClass, isPicker && 'cursor-pointer', className]
          .filter(Boolean)
          .join(' ')}
        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    );
  }
);

Input.displayName = 'Input';

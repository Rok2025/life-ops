import type { InputHTMLAttributes, ReactNode } from 'react';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
}

const inputBase =
  'mt-0.5 h-4 w-4 shrink-0 rounded-xs border border-glass-border bg-panel-bg text-accent accent-accent shadow-sm transition-[border-color,box-shadow] duration-normal ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20';

export function Checkbox({
  label,
  description,
  containerClassName,
  labelClassName,
  className,
  ...props
}: CheckboxProps) {
  const input = (
    <input
      type="checkbox"
      className={[inputBase, className].filter(Boolean).join(' ')}
      {...props}
    />
  );

  if (label == null && description == null) {
    return input;
  }

  return (
    <label
      className={[
        'flex items-start gap-2 cursor-pointer text-body-sm text-text-primary',
        containerClassName,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {input}
      <span className={['min-w-0', labelClassName].filter(Boolean).join(' ')}>
        {label != null ? <span className="block text-body-sm font-medium">{label}</span> : null}
        {description != null ? (
          <span className="mt-0.5 block text-caption text-text-tertiary">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

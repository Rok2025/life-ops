import { Button } from './Button';

export interface FormActionsProps {
  onCancel: () => void;
  /** Disable submit button */
  disabled?: boolean;
  /** Show saving spinner text */
  saving?: boolean;
  /** Submit label, defaults to '确定' */
  submitLabel?: string;
}

export function FormActions({
  onCancel,
  disabled = false,
  saving = false,
  submitLabel = '确定',
}: FormActionsProps) {
  return (
    <div className="flex gap-2 border-t border-border bg-bg-primary px-5 py-3">
      <Button type="button" onClick={onCancel} variant="ghost" className="flex-1">
        取消
      </Button>
      <Button type="submit" disabled={disabled || saving} className="flex-1">
        {saving ? '保存中...' : submitLabel}
      </Button>
    </div>
  );
}

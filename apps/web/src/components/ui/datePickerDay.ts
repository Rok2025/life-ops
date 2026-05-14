export type DatePickerDayClassNameInput = {
  isDisabled: boolean;
  isSelected: boolean;
  isToday: boolean;
};

export function getDatePickerDayClassName({
  isDisabled,
  isSelected,
  isToday,
}: DatePickerDayClassNameInput): string {
  return [
    'relative flex h-9 w-full items-center justify-center rounded-control text-body-sm transition-colors duration-normal ease-standard',
    isDisabled ? 'cursor-not-allowed text-text-secondary/30' : 'cursor-pointer text-text-primary hover:bg-panel-bg',
    isToday && !isSelected && !isDisabled ? 'font-semibold text-accent ring-1 ring-accent/35 bg-accent/8' : '',
    isSelected ? 'border border-selection-border bg-selection-bg font-semibold text-selection-text' : '',
  ].filter(Boolean).join(' ');
}

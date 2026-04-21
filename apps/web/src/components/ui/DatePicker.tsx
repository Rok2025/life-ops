'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatFullDate } from '@/lib/utils/date';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  clearable?: boolean;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDateValue(value: string | undefined): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    if (month >= 0 && month <= 11 && day >= 1 && day <= getDaysInMonth(year, month)) {
      return { year, month, day };
    }
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  };
}

function getMonthIndex(year: number, month: number) {
  return year * 12 + month;
}

function isDateOutsideRange(date: string, minDate?: string, maxDate?: string) {
  return Boolean((minDate && date < minDate) || (maxDate && date > maxDate));
}

function getDateLabel(value: string, placeholder: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatFullDate(value) : placeholder;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  clearable = false,
  placeholder = '选择日期',
  className,
  ariaLabel = '选择日期',
}: DatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedParts = useMemo(() => parseDateValue(value), [value]);
  const minParts = useMemo(() => parseDateValue(minDate), [minDate]);
  const maxParts = useMemo(() => parseDateValue(maxDate), [maxDate]);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedParts.year);
  const [viewMonth, setViewMonth] = useState(selectedParts.month);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const updatePosition = useCallback(() => {
    const anchor = triggerRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const popoverWidth = 300;
    const popoverHeight = 332;
    let left = rect.left;
    let top = rect.bottom + 8;
    if (left + popoverWidth > window.innerWidth - 8) {
      left = window.innerWidth - 8 - popoverWidth;
    }
    if (left < 8) left = 8;
    if (top + popoverHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - popoverHeight - 8);
    }

    setPopoverStyle({
      position: 'fixed',
      top,
      left,
      zIndex: 1000,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const monthIndex = getMonthIndex(viewYear, viewMonth);
  const isPrevDisabled = Boolean(minDate && monthIndex <= getMonthIndex(minParts.year, minParts.month));
  const isNextDisabled = Boolean(maxDate && monthIndex >= getMonthIndex(maxParts.year, maxParts.month));
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalDays = getDaysInMonth(viewYear, viewMonth);

  const goToPrevMonth = useCallback(() => {
    if (isPrevDisabled) return;
    setViewMonth((current) => {
      if (current === 0) {
        setViewYear((year) => year - 1);
        return 11;
      }
      return current - 1;
    });
  }, [isPrevDisabled]);

  const goToNextMonth = useCallback(() => {
    if (isNextDisabled) return;
    setViewMonth((current) => {
      if (current === 11) {
        setViewYear((year) => year + 1);
        return 0;
      }
      return current + 1;
    });
  }, [isNextDisabled]);

  const handleSelectDate = useCallback((day: number) => {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    if (isDateOutsideRange(dateStr, minDate, maxDate)) return;

    onChange(dateStr);
    setOpen(false);
    triggerRef.current?.focus();
  }, [maxDate, minDate, onChange, viewMonth, viewYear]);

  const handleToggleOpen = useCallback(() => {
    if (!open) {
      setViewYear(selectedParts.year);
      setViewMonth(selectedParts.month);
      updatePosition();
    }
    setOpen((current) => !current);
  }, [open, selectedParts.month, selectedParts.year, updatePosition]);

  const handleClear = useCallback(() => {
    onChange('');
    setOpen(false);
    triggerRef.current?.focus();
  }, [onChange]);

  const showClear = clearable && Boolean(value) && !disabled;

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        aria-label={ariaLabel}
        className={[
          'flex w-full items-center justify-between gap-2 rounded-control border border-glass-border bg-panel-bg px-control-x py-control-y text-left text-body-sm text-text-primary shadow-sm outline-none backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-normal ease-standard',
          'hover:bg-card-bg focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-55',
          showClear ? 'pr-16' : '',
        ].join(' ')}
      >
        <span className={['min-w-0 truncate', value ? '' : 'text-text-tertiary'].filter(Boolean).join(' ')}>
          {getDateLabel(value, placeholder)}
        </span>
        <Calendar size={16} className="shrink-0 text-text-secondary" />
      </button>

      {showClear ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-9 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-control text-text-tertiary transition-colors duration-normal ease-standard hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="清空日期"
        >
          <X size={14} />
        </button>
      ) : null}

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="glass-popover z-[1000] w-[300px] select-none rounded-card p-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPrevMonth}
              disabled={isPrevDisabled}
              className="glass-segment-button h-7 w-7 p-0 disabled:opacity-30"
              aria-label="上一个月"
            >
              <ChevronLeft size={16} className="text-text-secondary" />
            </button>
            <span className="text-body-sm font-semibold text-text-primary">
              {viewYear}年{viewMonth + 1}月
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={isNextDisabled}
              className="glass-segment-button h-7 w-7 p-0 disabled:opacity-30"
              aria-label="下一个月"
            >
              <ChevronRight size={16} className="text-text-secondary" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} className="py-1 text-center text-caption font-medium text-text-secondary">
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="h-9" />
            ))}
            {Array.from({ length: totalDays }).map((_, index) => {
              const day = index + 1;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isSelected = dateStr === value;
              const isDisabled = isDateOutsideRange(dateStr, minDate, maxDate);

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(day)}
                  className={[
                    'relative flex h-9 w-full items-center justify-center rounded-control text-body-sm transition-colors duration-normal ease-standard',
                    isDisabled ? 'cursor-not-allowed text-text-secondary/30' : 'cursor-pointer text-text-primary hover:bg-panel-bg',
                    isSelected ? 'border border-selection-border bg-selection-bg font-semibold text-selection-text' : '',
                  ].join(' ')}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

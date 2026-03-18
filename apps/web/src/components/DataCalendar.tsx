'use client';

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getLocalDateStr } from '@/lib/utils/date';
import { frogsApi } from '@/features/daily-frogs/api/frogsApi';
import { tilApi } from '@/features/daily-til/api/tilApi';
import { notesApi } from '@/features/quick-notes/api/notesApi';

export type CalendarScope = 'frogs' | 'til' | 'notes';

export interface DataCalendarHandle {
    open: () => void;
}

interface DataCalendarProps {
    /** 数据类型 */
    scope: CalendarScope;
    /** 当前选中日期 YYYY-MM-DD */
    selectedDate: string;
    /** 日期选中回调 */
    onSelectDate: (date: string) => void;
    /** 隐藏默认的日历图标触发按钮 */
    hideTrigger?: boolean;
    /** 外部触发元素的 ref，用于点击外部关闭时排除该元素 */
    externalTriggerRef?: React.RefObject<HTMLElement | null>;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

/** 获取某月第一天是周几 (0=周一, 6=周日) */
function getFirstDayOfMonth(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // 转为周一=0
}

/** 获取某月天数 */
function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/** 格式化为 YYYY-MM-DD */
function toDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 根据 scope 获取日期范围内有数据的日期列表 */
async function fetchDatesWithData(
    scope: CalendarScope,
    start: string,
    end: string,
): Promise<string[]> {
    switch (scope) {
        case 'frogs':
            return frogsApi.getDatesInRange(start, end);
        case 'til':
            return tilApi.getDatesInRange(start, end);
        case 'notes':
            return notesApi.getDatesInRange(start, end);
    }
}

export default forwardRef<DataCalendarHandle, DataCalendarProps>(function DataCalendar(
    { scope, selectedDate, onSelectDate, hideTrigger = false, externalTriggerRef },
    ref,
) {
    const today = getLocalDateStr();
    const popoverRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // 日历是否展开
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
        open: () => setOpen(true),
    }));

    // 日历当前浏览的年月
    const [viewYear, setViewYear] = useState(() => {
        const [y] = selectedDate.split('-').map(Number);
        return y;
    });
    const [viewMonth, setViewMonth] = useState(() => {
        const [, m] = selectedDate.split('-').map(Number);
        return m - 1; // 0-indexed
    });

    // 有数据的日期集合
    const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    // 当选中日期改变时，同步日历视图到对应月份
    useEffect(() => {
        const [y, m] = selectedDate.split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
    }, [selectedDate]);

    // 加载当月有数据的日期
    const loadMonthData = useCallback(async (year: number, month: number) => {
        setLoading(true);
        const start = toDateStr(year, month, 1);
        const end = toDateStr(year, month, getDaysInMonth(year, month));
        try {
            const dates = await fetchDatesWithData(scope, start, end);
            setDatesWithData(new Set(dates));
        } catch (err) {
            console.error('加载日历数据失败:', err);
        } finally {
            setLoading(false);
        }
    }, [scope]);

    // 展开时、或切换月份时加载数据
    useEffect(() => {
        if (open) {
            loadMonthData(viewYear, viewMonth);
        }
    }, [open, viewYear, viewMonth, loadMonthData]);

    // 点击外部关闭
    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (
                popoverRef.current &&
                !popoverRef.current.contains(target) &&
                (!triggerRef.current || !triggerRef.current.contains(target)) &&
                (!externalTriggerRef?.current || !externalTriggerRef.current.contains(target))
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, externalTriggerRef]);

    // 月份导航
    const goToPrevMonth = useCallback(() => {
        setViewMonth(prev => {
            if (prev === 0) {
                setViewYear(y => y - 1);
                return 11;
            }
            return prev - 1;
        });
    }, []);

    const goToNextMonth = useCallback(() => {
        const [todayYear, todayMonth] = today.split('-').map(Number);
        // 不允许导航到未来月份
        if (viewYear > todayYear || (viewYear === todayYear && viewMonth >= todayMonth - 1)) {
            return;
        }
        setViewMonth(prev => {
            if (prev === 11) {
                setViewYear(y => y + 1);
                return 0;
            }
            return prev + 1;
        });
    }, [viewYear, viewMonth, today]);

    const isNextDisabled = (() => {
        const [todayYear, todayMonth] = today.split('-').map(Number);
        return viewYear > todayYear || (viewYear === todayYear && viewMonth >= todayMonth - 1);
    })();

    // 构建日历网格
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const totalDays = getDaysInMonth(viewYear, viewMonth);

    const handleDayClick = useCallback((day: number) => {
        const dateStr = toDateStr(viewYear, viewMonth, day);
        // 不允许选择未来的日期
        if (dateStr > today) return;
        onSelectDate(dateStr);
        setOpen(false);
    }, [viewYear, viewMonth, today, onSelectDate]);

    // ── Compute fixed position for the popover ──
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (!open) return;
        const anchor = externalTriggerRef?.current ?? triggerRef.current;
        if (!anchor) return;

        function reposition() {
            const rect = anchor!.getBoundingClientRect();
            const popW = 280; // w-70 = 17.5rem = 280px
            let left = rect.left + rect.width / 2 - popW / 2;
            // clamp to viewport
            if (left < 8) left = 8;
            if (left + popW > window.innerWidth - 8) left = window.innerWidth - 8 - popW;
            setPopoverStyle({ position: 'fixed', top: rect.bottom + 8, left });
        }

        reposition();
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [open, externalTriggerRef]);

    return (
        <div className="relative inline-flex">
            {/* 触发按钮 */}
            {!hideTrigger && (
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="glass-segment-button h-8 w-8 p-0 hover:text-accent"
                    title="打开日历"
                >
                    <Calendar size={16} />
                </button>
            )}

            {/* 日历弹窗 — portal 到 body，避免被 overflow-hidden 裁剪 */}
            {open && createPortal(
                <div
                    ref={popoverRef}
                    style={popoverStyle}
                    className="glass-popover z-[80] w-70 select-none rounded-card p-3"
                >
                    {/* 月份导航 */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={goToPrevMonth}
                            className="glass-segment-button h-7 w-7 p-0"
                        >
                            <ChevronLeft size={16} className="text-text-secondary" />
                        </button>
                        <span className="text-body-sm font-semibold text-text-primary">
                            {viewYear}年{viewMonth + 1}月
                            {loading && (
                                <span className="ml-1 inline-block w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin align-middle" />
                            )}
                        </span>
                        <button
                            onClick={goToNextMonth}
                            disabled={isNextDisabled}
                            className="glass-segment-button h-7 w-7 p-0 disabled:opacity-30"
                        >
                            <ChevronRight size={16} className="text-text-secondary" />
                        </button>
                    </div>

                    {/* 星期表头 */}
                    <div className="grid grid-cols-7 mb-1">
                        {WEEKDAYS.map(w => (
                            <div key={w} className="text-center text-caption text-text-secondary font-medium py-1">
                                {w}
                            </div>
                        ))}
                    </div>

                    {/* 日期网格 */}
                    <div className="grid grid-cols-7">
                        {/* 月初空白 */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-9" />
                        ))}

                        {/* 日期单元格 */}
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = toDateStr(viewYear, viewMonth, day);
                            const isSelected = dateStr === selectedDate;
                            const isToday = dateStr === today;
                            const isFuture = dateStr > today;
                            const hasData = datesWithData.has(dateStr);

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    disabled={isFuture}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        relative h-9 w-full flex flex-col items-center justify-center
                                        rounded-control text-body-sm transition-colors
                                        ${isFuture
                                            ? 'text-text-secondary/30 cursor-not-allowed'
                                            : 'hover:bg-panel-bg cursor-pointer'
                                        }
                                        ${isSelected
                                            ? 'bg-selection-bg text-selection-text border border-selection-border font-semibold'
                                            : ''
                                        }
                                        ${isToday && !isSelected
                                            ? 'font-bold text-accent ring-1 ring-selection-border'
                                            : ''
                                        }
                                        ${!isSelected && !isToday && !isFuture
                                            ? 'text-text-primary'
                                            : ''
                                        }
                                    `}
                                >
                                    <span className="leading-none">{day}</span>
                                    {/* 数据标记点 */}
                                    {hasData && (
                                        <span
                                            className={`
                                                absolute bottom-0.5 w-1 h-1 rounded-full
                                                ${isSelected ? 'bg-white' : 'bg-accent'}
                                            `}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                </div>
            , document.body)}
        </div>
    );
});

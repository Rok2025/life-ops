/**
 * 日期工具函数 - 统一管理，消灭重复代码
 */

/** 获取本地日期字符串 (YYYY-MM-DD)，避免 toISOString 的 UTC 时区问题 */
export function getLocalDateStr(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** 日期偏移：返回偏移 days 天后的日期字符串 */
export function offsetDate(dateStr: string, days: number): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return getLocalDateStr(date);
}

/** 格式化日期为中文显示（今天/昨天/M月D日） */
export function formatDisplayDate(dateStr: string): string {
    const todayStr = getLocalDateStr();
    const yesterdayStr = offsetDate(todayStr, -1);

    if (dateStr === todayStr) return '今天';
    if (dateStr === yesterdayStr) return '昨天';

    const date = new Date(dateStr + 'T00:00:00');
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
}

/** 获取本周的起止日期（周一到周日） */
export function getWeekDateRange(date: Date = new Date()): { start: string; end: string } {
    const d = new Date(date);
    const dayOfWeek = d.getDay() || 7; // 周日为 7
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
        start: getLocalDateStr(monday),
        end: getLocalDateStr(sunday),
    };
}

/** 格式化日期为完整中文格式（M月D日 星期X） */
export function formatFullDate(dateStr: string): string {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const date = new Date(dateStr + 'T00:00:00');
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = weekDays[date.getDay()];
    return `${month}月${day}日 星期${weekDay}`;
}

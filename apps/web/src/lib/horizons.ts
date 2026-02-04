/**
 * Horizons - 时间语义层工具
 * 提供时间定位感，不用于决策
 */

/**
 * 获取当前 ISO 周信息
 */
export function getCurrentWeek(date: Date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    // 计算本周剩余天数（周一到周日）
    const currentDay = date.getDay() || 7; // 1-7
    const remainingDays = 7 - currentDay;

    return {
        weekNumber,
        year: d.getUTCFullYear(),
        currentDay,
        remainingDays,
    };
}

/**
 * 获取本月剩余天数
 */
export function getMonthProgress(date: Date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const currentDay = date.getDate();
    const remainingDays = totalDays - currentDay;

    return {
        currentDay,
        totalDays,
        remainingDays,
        progress: Math.round((currentDay / totalDays) * 100),
    };
}

/**
 * 获取本年剩余天数
 */
export function getYearProgress(date: Date = new Date()) {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const totalDays = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / 86400000) + 1;
    const dayOfYear = Math.ceil((date.getTime() - startOfYear.getTime()) / 86400000) + 1;
    const remainingDays = totalDays - dayOfYear;

    return {
        dayOfYear,
        totalDays,
        remainingDays,
        progress: Math.round((dayOfYear / totalDays) * 100),
    };
}

/**
 * 判断是否为闰年
 */
function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * 格式化时间信息为展示文本
 */
export function formatHorizons() {
    const now = new Date();
    const weekInfo = getCurrentWeek(now);
    const weekNum = weekInfo.weekNumber;
    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
    // 转换为 1 (Mon) 到 7 (Sun)
    const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    const daysInYear = isLeapYear(now.getFullYear()) ? 366 : 365;
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    const yearProgress = (dayOfYear / daysInYear) * 100;

    const daysLeftInWeek = 7 - adjustedDayOfWeek;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeftInMonth = daysInMonth - now.getDate();
    const daysLeftInYear = daysInYear - dayOfYear;

    return {
        week: `第 ${weekNum} 周`,
        dayOfWeek: adjustedDayOfWeek,
        weekRemaining: daysLeftInWeek === 0 ? '本周最后一天' : `本周还剩 ${daysLeftInWeek} 天`,
        monthRemaining: `本月还剩 ${daysLeftInMonth} 天`,
        yearRemaining: `今年还剩 ${daysLeftInYear} 天`,
        yearProgress: yearProgress.toFixed(0),
        yearProgressRaw: yearProgress
    };
}

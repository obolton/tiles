const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function formatRelativeDate(
  date: Date,
  locale: Intl.LocalesArgument = "en",
) {
  const formatter = new Intl.RelativeTimeFormat(locale, {
    style: "long",
    numeric: "auto",
  });

  const now = new Date();
  const delta = date.getTime() - now.getTime();
  const absDelta = Math.abs(delta);

  if (absDelta < MINUTE) {
    return formatter.format(Math.round(delta / SECOND), "second");
  } else if (absDelta < HOUR) {
    return formatter.format(Math.round(delta / MINUTE), "minute");
  } else if (absDelta < DAY) {
    return formatter.format(Math.round(delta / HOUR), "hour");
  } else if (absDelta < WEEK) {
    return formatter.format(Math.round(delta / DAY), "day");
  } else if (absDelta < MONTH) {
    return formatter.format(Math.round(delta / WEEK), "week");
  } else if (absDelta < YEAR) {
    return formatter.format(Math.round(delta / MONTH), "month");
  } else {
    return formatter.format(Math.round(delta / YEAR), "year");
  }
}

type WeekInfo = {
  firstDay: number;
  weekend: number[];
  minimalDays: number;
};

export function getFirstDayOfWeek(locale = navigator.language) {
  const resolved = new Intl.Locale(locale);
  if ("getWeekInfo" in resolved && typeof resolved.getWeekInfo === "function") {
    const weekInfo = resolved.getWeekInfo() as WeekInfo;
    return weekInfo.firstDay % 7;
  } else if ("weekInfo" in resolved) {
    const weekInfo = resolved.weekInfo as WeekInfo;
    return weekInfo.firstDay % 7;
  } else {
    return 0;
  }
}

/**
 * Get localized weekday names in calendar order.
 */
export function getWeekdays(
  format: Intl.DateTimeFormatOptions["weekday"],
  locale = navigator.language,
): string[] {
  const firstDayOfWeek = getFirstDayOfWeek(locale);
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format });
  const date = new Date(2024, 0, 7 + firstDayOfWeek); // Jan 7 2024 is a Sunday
  const names: string[] = [];
  for (let i = 0; i < 7; i++) {
    names.push(formatter.format(date));
    date.setDate(date.getDate() + 1);
  }
  return names;
}

export function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Format a Date as an ISO date string (YYYY-MM-DD).
 */
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

/**
 * Determines the most relevant month to display for a set of dates.
 * Prefers the current month if it contains any dates, then the nearest
 * future month, then the most recent past month. Falls back to the
 * current month if the array is empty.
 */
export function getNearestMonth(dates: Date[]): {
  year: number;
  month: number;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let nearestFuture: Date | null = null;
  let nearestPast: Date | null = null;

  for (const date of dates) {
    if (
      date.getFullYear() === currentYear &&
      date.getMonth() === currentMonth
    ) {
      return { year: currentYear, month: currentMonth };
    }

    if (date > now && (!nearestFuture || date < nearestFuture)) {
      nearestFuture = date;
    }

    if (date < now && (!nearestPast || date > nearestPast)) {
      nearestPast = date;
    }
  }

  const best = nearestFuture ?? nearestPast;
  if (best) {
    return { year: best.getFullYear(), month: best.getMonth() };
  }

  return { year: currentYear, month: currentMonth };
}

/**
 * Computes the calendar grid for a given month, including leading and
 * trailing days from adjacent months. Returns 4–6 weeks of 7 days each.
 *
 * @param year Full year (e.g. 2026)
 * @param month 0-indexed month (0 = January)
 * @param firstDayOfWeek 0 = Sunday, 1 = Monday, etc.
 */
export function getCalendarWeeks(
  year: number,
  month: number,
  firstDayOfWeek: number,
): Date[][] {
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  const firstWeekday = new Date(year, month, 1).getDay();
  const leadingDays = (firstWeekday - firstDayOfWeek + 7) % 7;
  const weekCount = Math.ceil((leadingDays + daysInMonth) / 7);

  const weeks: Date[][] = [];
  let day = 1 - leadingDays;

  for (let w = 0; w < weekCount; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(year, month, day++));
    }
    weeks.push(week);
  }

  return weeks;
}

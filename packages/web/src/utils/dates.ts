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

export function getFirstDayOfWeek() {
  const locale = new Intl.Locale(navigator.language);
  if ("getWeekInfo" in locale && typeof locale.getWeekInfo === "function") {
    const weekInfo = locale.getWeekInfo() as WeekInfo;
    return weekInfo.firstDay % 7;
  } else if ("weekInfo" in locale) {
    const weekInfo = locale.weekInfo as WeekInfo;
    return weekInfo.firstDay % 7;
  } else {
    return 0;
  }
}

export function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import {
  formatRelativeDate,
  isSameDay,
  addDays,
  daysBetween,
  getWeekdays,
  getCalendarWeeks,
  getNearestMonth,
} from "../dates";

describe("formatRelativeDate", () => {
  let now: Date;

  beforeAll(() => {
    vi.useFakeTimers();
    now = new Date();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test("formats a date less than a minute ago", () => {
    const date = new Date(now.getTime() - 30 * 1000);
    expect(formatRelativeDate(date)).toEqual("30 seconds ago");
  });

  test("formats a date less than an hour ago", () => {
    const date = new Date(now.getTime() - 30 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("30 minutes ago");
  });

  test("formats a date less than a day ago", () => {
    const date = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("12 hours ago");
  });

  test("formats a date less than a week ago", () => {
    const date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("3 days ago");
  });

  test("formats a date less than a month ago", () => {
    const date = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("2 weeks ago");
  });

  test("formats a date less than a year ago", () => {
    const date = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("6 months ago");
  });

  test("formats a date more than a year ago", () => {
    const date = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("2 years ago");
  });
});

describe("isSameDay", () => {
  test("returns true for the same date", () => {
    const a = new Date(2026, 1, 15);
    const b = new Date(2026, 1, 15);
    expect(isSameDay(a, b)).toBe(true);
  });

  test("returns true regardless of time", () => {
    const a = new Date(2026, 1, 15, 0, 0, 0);
    const b = new Date(2026, 1, 15, 23, 59, 59);
    expect(isSameDay(a, b)).toBe(true);
  });

  test("returns false for different days", () => {
    expect(isSameDay(new Date(2026, 1, 15), new Date(2026, 1, 16))).toBe(false);
  });

  test("returns false for different months", () => {
    expect(isSameDay(new Date(2026, 0, 15), new Date(2026, 1, 15))).toBe(false);
  });

  test("returns false for different years", () => {
    expect(isSameDay(new Date(2025, 1, 15), new Date(2026, 1, 15))).toBe(false);
  });
});

describe("addDays", () => {
  test("adds days within the same month", () => {
    const result = addDays(new Date(2026, 2, 5), 3);
    expect(result.getDate()).toBe(8);
    expect(result.getMonth()).toBe(2);
  });

  test("handles month overflow", () => {
    const result = addDays(new Date(2026, 0, 30), 5);
    expect(result.getDate()).toBe(4);
    expect(result.getMonth()).toBe(1);
  });

  test("handles negative days", () => {
    const result = addDays(new Date(2026, 2, 3), -5);
    expect(result.getDate()).toBe(26);
    expect(result.getMonth()).toBe(1);
  });

  test("does not mutate the original date", () => {
    const original = new Date(2026, 2, 5);
    addDays(original, 10);
    expect(original.getDate()).toBe(5);
  });
});

describe("daysBetween", () => {
  test("returns positive for b after a", () => {
    expect(daysBetween(new Date(2026, 2, 1), new Date(2026, 2, 5))).toBe(4);
  });

  test("returns negative for b before a", () => {
    expect(daysBetween(new Date(2026, 2, 5), new Date(2026, 2, 1))).toBe(-4);
  });

  test("returns 0 for the same date", () => {
    expect(daysBetween(new Date(2026, 2, 5), new Date(2026, 2, 5))).toBe(0);
  });

  test("works across months", () => {
    expect(daysBetween(new Date(2026, 0, 28), new Date(2026, 1, 2))).toBe(5);
  });
});

describe("getWeekdays", () => {
  test("returns narrow weekday names starting from Sunday for en-US", () => {
    expect(getWeekdays("narrow", "en-US")).toEqual([
      "S",
      "M",
      "T",
      "W",
      "T",
      "F",
      "S",
    ]);
  });

  test("returns short weekday names", () => {
    expect(getWeekdays("short", "en-US")).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ]);
  });

  test("returns long weekday names", () => {
    expect(getWeekdays("long", "en-US")).toEqual([
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]);
  });
});

describe("getCalendarWeeks", () => {
  // February 2026 starts on Sunday, 28 days
  describe("February 2026 (Sunday start, firstDayOfWeek=0)", () => {
    const weeks = getCalendarWeeks(2026, 1, 0);

    test("produces exactly 4 weeks", () => {
      expect(weeks).toHaveLength(4);
    });

    test("each week has 7 days", () => {
      for (const week of weeks) {
        expect(week).toHaveLength(7);
      }
    });

    test("first day is Feb 1", () => {
      expect(weeks[0]![0]!.getDate()).toBe(1);
      expect(weeks[0]![0]!.getMonth()).toBe(1);
    });

    test("last day is Feb 28", () => {
      expect(weeks[3]![6]!.getDate()).toBe(28);
      expect(weeks[3]![6]!.getMonth()).toBe(1);
    });

    test("has no outside days", () => {
      for (const week of weeks) {
        for (const day of week) {
          expect(day.getMonth()).toBe(1);
        }
      }
    });
  });

  describe("February 2026 (Sunday start, firstDayOfWeek=1/Monday)", () => {
    const weeks = getCalendarWeeks(2026, 1, 1);

    test("produces 5 weeks", () => {
      expect(weeks).toHaveLength(5);
    });

    test("first day is Monday Jan 26", () => {
      const first = weeks[0]![0]!;
      expect(first.getMonth()).toBe(0);
      expect(first.getDate()).toBe(26);
      expect(first.getDay()).toBe(1); // Monday
    });

    test("last day is Sunday Mar 1", () => {
      const last = weeks[4]![6]!;
      expect(last.getMonth()).toBe(2);
      expect(last.getDate()).toBe(1);
      expect(last.getDay()).toBe(0); // Sunday
    });
  });

  // August 2026 starts on Saturday, 31 days — needs 6 weeks with Sunday start
  describe("August 2026 (Saturday start, firstDayOfWeek=0)", () => {
    const weeks = getCalendarWeeks(2026, 7, 0);

    test("produces 6 weeks", () => {
      expect(weeks).toHaveLength(6);
    });

    test("first day is Sunday Jul 26", () => {
      const first = weeks[0]![0]!;
      expect(first.getMonth()).toBe(6);
      expect(first.getDate()).toBe(26);
    });

    test("Aug 1 is at position [0][6]", () => {
      const aug1 = weeks[0]![6]!;
      expect(aug1.getMonth()).toBe(7);
      expect(aug1.getDate()).toBe(1);
    });
  });

  // December wraps into next year
  describe("December 2026 (firstDayOfWeek=0)", () => {
    const weeks = getCalendarWeeks(2026, 11, 0);

    test("trailing days are in January 2027", () => {
      const lastWeek = weeks[weeks.length - 1]!;
      const lastDay = lastWeek[6]!;
      if (lastDay.getMonth() !== 11) {
        expect(lastDay.getFullYear()).toBe(2027);
        expect(lastDay.getMonth()).toBe(0);
      }
    });
  });

  test("all weeks start on the correct day of week", () => {
    for (const firstDayOfWeek of [0, 1, 6]) {
      const weeks = getCalendarWeeks(2026, 5, firstDayOfWeek);
      for (const week of weeks) {
        expect(week[0]!.getDay()).toBe(firstDayOfWeek);
      }
    }
  });
});

describe("getNearestMonth", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15)); // March 15, 2026
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test("returns current month when dates is empty", () => {
    expect(getNearestMonth([])).toEqual({ year: 2026, month: 2 });
  });

  test("returns current month when it contains a date", () => {
    const dates = [new Date(2026, 5, 10), new Date(2026, 2, 20)];
    expect(getNearestMonth(dates)).toEqual({ year: 2026, month: 2 });
  });

  test("returns nearest future month when current month has no dates", () => {
    const dates = [new Date(2026, 6, 1), new Date(2026, 4, 10)];
    expect(getNearestMonth(dates)).toEqual({ year: 2026, month: 4 });
  });

  test("returns most recent past month when no future dates exist", () => {
    const dates = [new Date(2025, 10, 5), new Date(2026, 0, 20)];
    expect(getNearestMonth(dates)).toEqual({ year: 2026, month: 0 });
  });

  test("prefers nearest future over nearest past", () => {
    const dates = [new Date(2026, 1, 28), new Date(2026, 3, 1)];
    expect(getNearestMonth(dates)).toEqual({ year: 2026, month: 3 });
  });

  test("handles dates across year boundaries", () => {
    const dates = [new Date(2027, 0, 15)];
    expect(getNearestMonth(dates)).toEqual({ year: 2027, month: 0 });
  });
});
